package model

import (
	"time"

	"gorm.io/gorm"
)

type Workspace struct {
	ID        string         `gorm:"type:uuid;primaryKey"`
	Name      string         `gorm:"type:varchar(100);not null"`
	Slug      string         `gorm:"type:varchar(100);not null"`
	IconURL   string         `gorm:"type:text;not null;default:''"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

type WorkspaceMember struct {
	ID          string    `gorm:"type:uuid;primaryKey"`
	WorkspaceID string    `gorm:"type:uuid;not null;index"`
	UserID      string    `gorm:"type:uuid;not null;index"`
	Role        string    `gorm:"type:varchar(20);not null;default:'member'"`
	JoinedAt    time.Time
}

type WorkspaceInvite struct {
	ID          string    `gorm:"type:uuid;primaryKey"`
	WorkspaceID string    `gorm:"type:uuid;not null"`
	Email       string    `gorm:"type:varchar(255);not null"`
	Token       string    `gorm:"type:text;not null;uniqueIndex"`
	ExpiresAt   time.Time
	CreatedAt   time.Time
}
