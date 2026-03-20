package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

// Client represents a single WebSocket connection.
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	userID string
	send   chan []byte

	mu                 sync.Mutex
	subscribedChannels map[string]bool
}

// Hub manages WebSocket clients and routes events from Redis Pub/Sub.
type Hub struct {
	eventBus domain.EventBus

	mu      sync.RWMutex
	// channelID -> set of clients
	channels map[string]map[*Client]bool
	// channelID -> unsubscribe function for Redis
	channelSubs map[string]func()

	register   chan *Client
	unregister chan *Client
}

func NewHub(eventBus domain.EventBus) *Hub {
	return &Hub{
		eventBus:    eventBus,
		channels:    make(map[string]map[*Client]bool),
		channelSubs: make(map[string]func()),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Nothing to do on register; subscriptions happen via subscribe command
			_ = client
		case client := <-h.unregister:
			h.removeClient(client)
			close(client.send)
		}
	}
}

func (h *Hub) subscribeChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.channels[channelID]; !ok {
		h.channels[channelID] = make(map[*Client]bool)
	}
	h.channels[channelID][client] = true

	client.mu.Lock()
	client.subscribedChannels[channelID] = true
	client.mu.Unlock()

	// If this is the first client for this channel, subscribe to Redis
	if len(h.channels[channelID]) == 1 {
		h.startRedisSubscription(channelID)
	}
}

func (h *Hub) unsubscribeChannel(client *Client, channelID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, ok := h.channels[channelID]; ok {
		delete(clients, client)
		if len(clients) == 0 {
			delete(h.channels, channelID)
			if unsub, ok := h.channelSubs[channelID]; ok {
				unsub()
				delete(h.channelSubs, channelID)
			}
		}
	}

	client.mu.Lock()
	delete(client.subscribedChannels, channelID)
	client.mu.Unlock()
}

func (h *Hub) removeClient(client *Client) {
	client.mu.Lock()
	channels := make([]string, 0, len(client.subscribedChannels))
	for ch := range client.subscribedChannels {
		channels = append(channels, ch)
	}
	client.mu.Unlock()

	h.mu.Lock()
	defer h.mu.Unlock()

	for _, chID := range channels {
		if clients, ok := h.channels[chID]; ok {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.channels, chID)
				if unsub, ok := h.channelSubs[chID]; ok {
					unsub()
					delete(h.channelSubs, chID)
				}
			}
		}
	}
}

func (h *Hub) startRedisSubscription(channelID string) {
	eventCh, unsub, err := h.eventBus.Subscribe(context.Background(), channelID)
	if err != nil {
		fmt.Printf("Failed to subscribe to Redis channel %s: %v\n", channelID, err)
		return
	}
	h.channelSubs[channelID] = unsub

	go func() {
		for event := range eventCh {
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			h.broadcastToChannel(channelID, data, event.UserID)
		}
	}()
}

// broadcastToChannel sends data to all clients in the channel except the sender.
func (h *Hub) broadcastToChannel(channelID string, data []byte, senderUserID string) {
	h.mu.RLock()
	clients := h.channels[channelID]
	h.mu.RUnlock()

	for client := range clients {
		if client.userID == senderUserID {
			continue
		}
		select {
		case client.send <- data:
		default:
			// Client send buffer is full, skip
		}
	}
}

// BroadcastToChannelAll sends data to ALL clients in the channel including sender.
func (h *Hub) BroadcastToChannelAll(channelID string, data []byte) {
	h.mu.RLock()
	clients := h.channels[channelID]
	h.mu.RUnlock()

	for client := range clients {
		select {
		case client.send <- data:
		default:
		}
	}
}

// --- Client read/write pumps ---

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			break
		}
		c.handleMessage(message)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// wsMessage represents a client-to-server WebSocket message.
type wsMessage struct {
	Type      string `json:"type"`
	ChannelID string `json:"channelId,omitempty"`
}

func (c *Client) handleMessage(raw []byte) {
	var msg wsMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}

	switch msg.Type {
	case "subscribe_channel":
		if msg.ChannelID != "" {
			c.hub.subscribeChannel(c, msg.ChannelID)
		}
	case "unsubscribe_channel":
		if msg.ChannelID != "" {
			c.hub.unsubscribeChannel(c, msg.ChannelID)
		}
	case "typing_start":
		if msg.ChannelID != "" {
			c.publishTypingEvent(msg.ChannelID, domain.EventTypingStarted)
		}
	case "typing_stop":
		if msg.ChannelID != "" {
			c.publishTypingEvent(msg.ChannelID, domain.EventTypingStopped)
		}
	case "ping":
		resp, _ := json.Marshal(map[string]string{"type": "pong"})
		select {
		case c.send <- resp:
		default:
		}
	}
}

func (c *Client) publishTypingEvent(channelID string, eventType domain.EventType) {
	event := &domain.Event{
		Type:      eventType,
		ChannelID: channelID,
		UserID:    c.userID,
		Timestamp: time.Now(),
	}
	_ = c.hub.eventBus.Publish(context.Background(), channelID, event)
}
