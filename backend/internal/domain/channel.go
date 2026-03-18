package domain

import (
	"context"
	"time"
	"unicode/utf8"
)

type Channel struct {
	ID          string
	WorkspaceID string
	Name        string
	Description string
	CreatedBy   string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	DeletedAt   *time.Time
}

type ChannelMember struct {
	ID         string
	ChannelID  string
	UserID     string
	LastReadAt *time.Time
	JoinedAt   time.Time
}

type UnreadCount struct {
	ChannelID string
	Count     int32
}

func (c *Channel) Validate() error {
	nameLen := utf8.RuneCountInString(c.Name)
	if nameLen == 0 || nameLen > 100 {
		return &ValidationError{Field: "name", Message: "must be 1-100 characters"}
	}
	return nil
}

type ChannelRepository interface {
	Create(ctx context.Context, ch *Channel) error
	FindByID(ctx context.Context, id string) (*Channel, error)
	ListByWorkspace(ctx context.Context, wsID string, page, pageSize int, sortField, sortOrder string) ([]*Channel, int64, error)
	SearchByName(ctx context.Context, wsID, query string, page, pageSize int) ([]*Channel, int64, error)
	Update(ctx context.Context, ch *Channel) error
}

type ChannelMemberRepository interface {
	Create(ctx context.Context, m *ChannelMember) error
	FindByChannelAndUser(ctx context.Context, chID, userID string) (*ChannelMember, error)
	DeleteByChannelAndUser(ctx context.Context, chID, userID string) error
	UpdateLastRead(ctx context.Context, chID, userID string, messageID string) error
	GetUnreadCounts(ctx context.Context, userID, wsID string) ([]UnreadCount, error)
}
