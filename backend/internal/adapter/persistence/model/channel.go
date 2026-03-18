package model

import (
	"time"

	"gorm.io/gorm"
)

type Channel struct {
	ID          string         `gorm:"type:uuid;primaryKey"`
	WorkspaceID string         `gorm:"type:uuid;not null;index"`
	Name        string         `gorm:"type:varchar(100);not null"`
	Description string         `gorm:"type:text;not null;default:''"`
	CreatedBy   string         `gorm:"type:uuid;not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   gorm.DeletedAt `gorm:"index"`
}

type ChannelMember struct {
	ID         string     `gorm:"type:uuid;primaryKey"`
	ChannelID  string     `gorm:"type:uuid;not null;index"`
	UserID     string     `gorm:"type:uuid;not null;index"`
	LastReadAt *time.Time
	JoinedAt   time.Time
}
