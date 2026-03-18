package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

type WorkspaceUsecase interface {
	CreateWorkspace(ctx context.Context, userID, name, iconURL string) (*domain.Workspace, error)
	ListWorkspaces(ctx context.Context, userID string, page, pageSize int) ([]*domain.Workspace, int64, error)
	GetWorkspace(ctx context.Context, id string) (*domain.Workspace, error)
	UpdateWorkspace(ctx context.Context, userID, wsID string, fields map[string]string) (*domain.Workspace, error)
	InviteMember(ctx context.Context, userID, wsID, email string) (string, error)
	JoinByInvite(ctx context.Context, userID, inviteToken string) (*domain.WorkspaceMember, error)
	ListMembers(ctx context.Context, wsID string, page, pageSize int) ([]*domain.WorkspaceMember, int64, error)
	GetInviteInfo(ctx context.Context, inviteCode string) (*domain.Workspace, error)
	RemoveMember(ctx context.Context, userID, wsID, targetUserID string) error
}

type workspaceUsecase struct {
	wsRepo     domain.WorkspaceRepository
	memberRepo domain.WorkspaceMemberRepository
	inviteRepo domain.WorkspaceInviteRepository
}

func NewWorkspaceUsecase(
	wsRepo domain.WorkspaceRepository,
	memberRepo domain.WorkspaceMemberRepository,
	inviteRepo domain.WorkspaceInviteRepository,
) WorkspaceUsecase {
	return &workspaceUsecase{
		wsRepo:     wsRepo,
		memberRepo: memberRepo,
		inviteRepo: inviteRepo,
	}
}

func (uc *workspaceUsecase) CreateWorkspace(ctx context.Context, userID, name, iconURL string) (*domain.Workspace, error) {
	ws := &domain.Workspace{
		ID:      ulid.NewID(),
		Name:    name,
		Slug:    generateSlug(name),
		IconURL: iconURL,
	}
	if err := ws.Validate(); err != nil {
		return nil, err
	}

	if err := uc.wsRepo.Create(ctx, ws); err != nil {
		return nil, err
	}

	// Creator becomes owner
	member := &domain.WorkspaceMember{
		ID:          ulid.NewID(),
		WorkspaceID: ws.ID,
		UserID:      userID,
		Role:        "owner",
	}
	if err := uc.memberRepo.Create(ctx, member); err != nil {
		return nil, err
	}

	return ws, nil
}

func (uc *workspaceUsecase) ListWorkspaces(ctx context.Context, userID string, page, pageSize int) ([]*domain.Workspace, int64, error) {
	return uc.wsRepo.ListByUserID(ctx, userID, page, pageSize)
}

func (uc *workspaceUsecase) GetWorkspace(ctx context.Context, id string) (*domain.Workspace, error) {
	return uc.wsRepo.FindByID(ctx, id)
}

func (uc *workspaceUsecase) UpdateWorkspace(ctx context.Context, userID, wsID string, fields map[string]string) (*domain.Workspace, error) {
	member, err := uc.memberRepo.FindByWorkspaceAndUser(ctx, wsID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrForbidden
		}
		return nil, err
	}
	if !member.CanInvite() {
		return nil, domain.ErrForbidden
	}

	ws, err := uc.wsRepo.FindByID(ctx, wsID)
	if err != nil {
		return nil, err
	}

	for k, v := range fields {
		switch k {
		case "name":
			ws.Name = v
		case "icon_url":
			ws.IconURL = v
		}
	}

	if err := ws.Validate(); err != nil {
		return nil, err
	}

	if err := uc.wsRepo.Update(ctx, ws); err != nil {
		return nil, err
	}
	return ws, nil
}

func (uc *workspaceUsecase) InviteMember(ctx context.Context, userID, wsID, email string) (string, error) {
	member, err := uc.memberRepo.FindByWorkspaceAndUser(ctx, wsID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return "", domain.ErrForbidden
		}
		return "", err
	}
	if !member.CanInvite() {
		return "", domain.ErrForbidden
	}

	token := generateInviteToken()
	inv := &domain.WorkspaceInvite{
		ID:          ulid.NewID(),
		WorkspaceID: wsID,
		Email:       email,
		Token:       token,
		ExpiresAt:   time.Now().Add(7 * 24 * time.Hour),
	}
	if err := uc.inviteRepo.Create(ctx, inv); err != nil {
		return "", err
	}
	return token, nil
}

func (uc *workspaceUsecase) JoinByInvite(ctx context.Context, userID, inviteToken string) (*domain.WorkspaceMember, error) {
	inv, err := uc.inviteRepo.FindByToken(ctx, inviteToken)
	if err != nil {
		return nil, err
	}

	if time.Now().After(inv.ExpiresAt) {
		_ = uc.inviteRepo.DeleteByToken(ctx, inviteToken)
		return nil, domain.ErrUnauthorized
	}

	if _, err := uc.memberRepo.FindByWorkspaceAndUser(ctx, inv.WorkspaceID, userID); err == nil {
		return nil, domain.ErrAlreadyExists
	}

	member := &domain.WorkspaceMember{
		ID:          ulid.NewID(),
		WorkspaceID: inv.WorkspaceID,
		UserID:      userID,
		Role:        "member",
	}
	if err := uc.memberRepo.Create(ctx, member); err != nil {
		return nil, err
	}

	_ = uc.inviteRepo.DeleteByToken(ctx, inviteToken)
	return member, nil
}

func (uc *workspaceUsecase) ListMembers(ctx context.Context, wsID string, page, pageSize int) ([]*domain.WorkspaceMember, int64, error) {
	return uc.memberRepo.ListByWorkspace(ctx, wsID, page, pageSize)
}

func (uc *workspaceUsecase) GetInviteInfo(ctx context.Context, inviteCode string) (*domain.Workspace, error) {
	inv, err := uc.inviteRepo.FindByToken(ctx, inviteCode)
	if err != nil {
		return nil, err
	}
	return uc.wsRepo.FindByID(ctx, inv.WorkspaceID)
}

func (uc *workspaceUsecase) RemoveMember(ctx context.Context, userID, wsID, targetUserID string) error {
	member, err := uc.memberRepo.FindByWorkspaceAndUser(ctx, wsID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return domain.ErrForbidden
		}
		return err
	}
	if !member.CanRemove() {
		return domain.ErrForbidden
	}
	if targetUserID == userID {
		return &domain.ValidationError{Field: "user_id", Message: "cannot remove yourself"}
	}
	return uc.memberRepo.DeleteByWorkspaceAndUser(ctx, wsID, targetUserID)
}

func generateSlug(name string) string {
	slug := strings.ToLower(strings.TrimSpace(name))
	slug = strings.ReplaceAll(slug, " ", "-")
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return slug + "-" + hex.EncodeToString(b)
}

func generateInviteToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
