package model

import "time"

type File struct {
	ID          string `gorm:"type:uuid;primaryKey"`
	WorkspaceID string `gorm:"type:uuid;not null"`
	UploadedBy  string `gorm:"type:uuid;not null"`
	FileName    string `gorm:"type:varchar(255);not null"`
	FileKey     string `gorm:"type:text;not null"`
	ContentType string `gorm:"type:varchar(100);not null"`
	FileSize    int64  `gorm:"not null"`
	CreatedAt   time.Time
}
