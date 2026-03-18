package domain

import (
	"context"
	"time"
	"unicode/utf8"
)

type Workspace struct {
	ID        string
	Name      string
	Slug      string
	IconURL   string
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

type WorkspaceMember struct {
	ID          string
	WorkspaceID string
	UserID      string
	Role        string // "owner", "admin", "member"
	JoinedAt    time.Time
}

type WorkspaceInvite struct {
	ID          string
	WorkspaceID string
	Email       string
	Token       string
	ExpiresAt   time.Time
	CreatedAt   time.Time
}

func (w *Workspace) Validate() error {
	nameLen := utf8.RuneCountInString(w.Name)
	if nameLen == 0 || nameLen > 100 {
		return &ValidationError{Field: "name", Message: "must be 1-100 characters"}
	}
	return nil
}

func (wm *WorkspaceMember) CanInvite() bool {
	return wm.Role == "owner" || wm.Role == "admin"
}

func (wm *WorkspaceMember) CanRemove() bool {
	return wm.Role == "owner" || wm.Role == "admin"
}

type WorkspaceRepository interface {
	Create(ctx context.Context, ws *Workspace) error
	FindByID(ctx context.Context, id string) (*Workspace, error)
	ListByUserID(ctx context.Context, userID string, page, pageSize int) ([]*Workspace, int64, error)
	Update(ctx context.Context, ws *Workspace) error
}

type WorkspaceMemberRepository interface {
	Create(ctx context.Context, m *WorkspaceMember) error
	FindByWorkspaceAndUser(ctx context.Context, wsID, userID string) (*WorkspaceMember, error)
	ListByWorkspace(ctx context.Context, wsID string, page, pageSize int) ([]*WorkspaceMember, int64, error)
	DeleteByWorkspaceAndUser(ctx context.Context, wsID, userID string) error
}

type WorkspaceInviteRepository interface {
	Create(ctx context.Context, inv *WorkspaceInvite) error
	FindByToken(ctx context.Context, token string) (*WorkspaceInvite, error)
	DeleteByToken(ctx context.Context, token string) error
}
