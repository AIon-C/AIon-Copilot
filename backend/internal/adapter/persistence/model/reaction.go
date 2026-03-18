package model

import "time"

type Reaction struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	MessageID string    `gorm:"type:uuid;not null;index"`
	UserID    string    `gorm:"type:uuid;not null"`
	EmojiCode string    `gorm:"type:varchar(50);not null"`
	CreatedAt time.Time
}
