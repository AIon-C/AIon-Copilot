package domain

import (
	"context"
	"time"
)

type EventType string

const (
	EventMessageCreated EventType = "message.created"
	EventMessageUpdated EventType = "message.updated"
	EventMessageDeleted EventType = "message.deleted"
	EventTypingStarted  EventType = "typing.started"
	EventTypingStopped  EventType = "typing.stopped"
	EventPresenceOnline EventType = "presence.online"
	EventPresenceOffline EventType = "presence.offline"
)

// Event represents a real-time event to broadcast via WebSocket.
type Event struct {
	Type      EventType   `json:"type"`
	ChannelID string      `json:"channelId,omitempty"`
	UserID    string      `json:"userId,omitempty"`
	Payload   interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// EventBus abstracts publish/subscribe for real-time events.
type EventBus interface {
	// Publish sends an event to all subscribers of the given channel.
	Publish(ctx context.Context, channelID string, event *Event) error
	// Subscribe returns a channel that receives events for the given channel ID.
	// The returned function must be called to unsubscribe.
	Subscribe(ctx context.Context, channelID string) (<-chan *Event, func(), error)
}
