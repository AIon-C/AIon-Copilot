package domain

import (
	"context"
	"time"
)

type File struct {
	ID          string
	WorkspaceID string
	UploadedBy  string
	FileName    string
	FileKey     string
	ContentType string
	FileSize    int64
	CreatedAt   time.Time
}

const MaxFileSize = 100 * 1024 * 1024 // 100MB

func (f *File) Validate() error {
	if f.FileName == "" {
		return &ValidationError{Field: "file_name", Message: "must not be empty"}
	}
	if f.FileSize <= 0 {
		return &ValidationError{Field: "file_size", Message: "must be positive"}
	}
	if f.FileSize > MaxFileSize {
		return &ValidationError{Field: "file_size", Message: "must be at most 100MB"}
	}
	return nil
}

type FileRepository interface {
	Create(ctx context.Context, file *File) error
	FindByID(ctx context.Context, id string) (*File, error)
}
