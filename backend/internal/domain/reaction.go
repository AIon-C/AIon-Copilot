package domain

import (
	"context"
	"time"
)

type Reaction struct {
	ID        string
	MessageID string
	UserID    string
	EmojiCode string
	CreatedAt time.Time
}

type ReactionRepository interface {
	Create(ctx context.Context, r *Reaction) error
	DeleteByMessageAndUserAndEmoji(ctx context.Context, messageID, userID, emojiCode string) error
	ListByMessage(ctx context.Context, messageID string) ([]*Reaction, error)
}
