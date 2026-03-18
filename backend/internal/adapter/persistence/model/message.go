package model

import (
	"time"

	"gorm.io/gorm"
)

type Message struct {
	ID           string         `gorm:"type:uuid;primaryKey"`
	ChannelID    string         `gorm:"type:uuid;not null;index:idx_messages_channel_created,priority:1"`
	UserID       string         `gorm:"type:uuid;not null"`
	ThreadRootID *string        `gorm:"type:uuid"`
	Content      string         `gorm:"type:text;not null"`
	IsEdited     bool           `gorm:"not null;default:false"`
	EditedAt     *time.Time
	CreatedAt    time.Time      `gorm:"index:idx_messages_channel_created,priority:2,sort:desc"`
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

type MessageAttachment struct {
	ID        string `gorm:"type:uuid;primaryKey"`
	MessageID string `gorm:"type:uuid;not null;index"`
	FileID    string `gorm:"type:uuid;not null"`
}
