package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           string         `gorm:"type:uuid;primaryKey"`
	Email        string         `gorm:"type:varchar(255);not null"`
	DisplayName  string         `gorm:"type:varchar(100);not null"`
	AvatarURL    string         `gorm:"type:text;not null;default:''"`
	PasswordHash string         `gorm:"type:text;not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    gorm.DeletedAt `gorm:"index"`
}

type RefreshToken struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"type:uuid;not null;index"`
	Token     string    `gorm:"type:text;not null;uniqueIndex"`
	ExpiresAt time.Time
	CreatedAt time.Time
}
