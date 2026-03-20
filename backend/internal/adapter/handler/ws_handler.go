package handler

import (
	"net/http"

	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins; CORS is handled at the HTTP layer
		return true
	},
}

// WSHandler handles WebSocket upgrade requests.
type WSHandler struct {
	hub *Hub
	jwt *auth.JWTManager
}

func NewWSHandler(hub *Hub, jwt *auth.JWTManager) *WSHandler {
	return &WSHandler{hub: hub, jwt: jwt}
}

func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Authenticate via query parameter (WebSocket API doesn't support custom headers)
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	claims, err := h.jwt.VerifyAccessToken(token)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &Client{
		hub:                h.hub,
		conn:               conn,
		userID:             claims.UserID,
		send:               make(chan []byte, 256),
		subscribedChannels: make(map[string]bool),
	}

	h.hub.register <- client

	go client.writePump()
	go client.readPump()
}
