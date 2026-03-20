package domain

import (
	"context"
	"fmt"
	"time"
)

type Message struct {
	ID           string
	ChannelID    string
	UserID       string
	ThreadRootID *string
	Content      string
	IsEdited     bool
	EditedAt     *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
	Attachments  []*File
}

type MessageAttachment struct {
	ID        string
	MessageID string
	FileID    string
}

const MaxMessageContentLength = 10000

func (m *Message) Validate() error {
	if m.Content == "" {
		return &ValidationError{Field: "content", Message: "must not be empty"}
	}
	if len(m.Content) > MaxMessageContentLength {
		return &ValidationError{Field: "content", Message: fmt.Sprintf("must be at most %d bytes", MaxMessageContentLength)}
	}
	return nil
}

func (m *Message) IsThreadReply() bool {
	return m.ThreadRootID != nil
}

type MessageRepository interface {
	Create(ctx context.Context, msg *Message) error
	FindByID(ctx context.Context, id string) (*Message, error)
	ListByChannel(ctx context.Context, chID string, cursor string, limit int) ([]*Message, string, string, bool, bool, error)
	Update(ctx context.Context, msg *Message) error
	SoftDelete(ctx context.Context, id string) error
	GetThreadReplies(ctx context.Context, rootID string) ([]*Message, error)
}

type MessageAttachmentRepository interface {
	CreateBatch(ctx context.Context, attachments []*MessageAttachment) error
	ListByMessage(ctx context.Context, messageID string) ([]*MessageAttachment, error)
	ListByMessages(ctx context.Context, messageIDs []string) ([]*MessageAttachment, error)
}
