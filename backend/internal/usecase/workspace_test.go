package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- mock repos ---

type mockWorkspaceRepo struct {
	workspaces map[string]*domain.Workspace
}

func newMockWorkspaceRepo() *mockWorkspaceRepo {
	return &mockWorkspaceRepo{workspaces: make(map[string]*domain.Workspace)}
}

func (m *mockWorkspaceRepo) Create(_ context.Context, ws *domain.Workspace) error {
	now := time.Now()
	ws.CreatedAt = now
	ws.UpdatedAt = now
	m.workspaces[ws.ID] = ws
	return nil
}

func (m *mockWorkspaceRepo) FindByID(_ context.Context, id string) (*domain.Workspace, error) {
	ws, ok := m.workspaces[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return ws, nil
}

func (m *mockWorkspaceRepo) ListByUserID(_ context.Context, userID string, page, pageSize int) ([]*domain.Workspace, int64, error) {
	var result []*domain.Workspace
	for _, ws := range m.workspaces {
		result = append(result, ws)
	}
	return result, int64(len(result)), nil
}

func (m *mockWorkspaceRepo) Update(_ context.Context, ws *domain.Workspace) error {
	ws.UpdatedAt = time.Now()
	m.workspaces[ws.ID] = ws
	return nil
}

type mockWsMemberRepo struct {
	members map[string]*domain.WorkspaceMember // key: wsID+userID
}

func newMockWsMemberRepo() *mockWsMemberRepo {
	return &mockWsMemberRepo{members: make(map[string]*domain.WorkspaceMember)}
}

func (m *mockWsMemberRepo) Create(_ context.Context, wm *domain.WorkspaceMember) error {
	key := wm.WorkspaceID + ":" + wm.UserID
	if _, exists := m.members[key]; exists {
		return domain.ErrAlreadyExists
	}
	wm.JoinedAt = time.Now()
	m.members[key] = wm
	return nil
}

func (m *mockWsMemberRepo) FindByWorkspaceAndUser(_ context.Context, wsID, userID string) (*domain.WorkspaceMember, error) {
	key := wsID + ":" + userID
	wm, ok := m.members[key]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return wm, nil
}

func (m *mockWsMemberRepo) ListByWorkspace(_ context.Context, wsID string, page, pageSize int) ([]*domain.WorkspaceMember, int64, error) {
	var result []*domain.WorkspaceMember
	for _, wm := range m.members {
		if wm.WorkspaceID == wsID {
			result = append(result, wm)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockWsMemberRepo) DeleteByWorkspaceAndUser(_ context.Context, wsID, userID string) error {
	key := wsID + ":" + userID
	if _, exists := m.members[key]; !exists {
		return domain.ErrNotFound
	}
	delete(m.members, key)
	return nil
}

type mockWsInviteRepo struct {
	invites map[string]*domain.WorkspaceInvite
}

func newMockWsInviteRepo() *mockWsInviteRepo {
	return &mockWsInviteRepo{invites: make(map[string]*domain.WorkspaceInvite)}
}

func (m *mockWsInviteRepo) Create(_ context.Context, inv *domain.WorkspaceInvite) error {
	inv.CreatedAt = time.Now()
	m.invites[inv.Token] = inv
	return nil
}

func (m *mockWsInviteRepo) FindByToken(_ context.Context, token string) (*domain.WorkspaceInvite, error) {
	inv, ok := m.invites[token]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return inv, nil
}

func (m *mockWsInviteRepo) DeleteByToken(_ context.Context, token string) error {
	delete(m.invites, token)
	return nil
}

// --- tests ---

func TestWorkspaceUsecase_CreateWorkspace(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	inviteRepo := newMockWsInviteRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, inviteRepo)

	ws, err := uc.CreateWorkspace(context.Background(), "user-1", "My Workspace", "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ws.Name != "My Workspace" {
		t.Errorf("expected 'My Workspace', got %s", ws.Name)
	}
	// Creator should be owner
	member, err := memberRepo.FindByWorkspaceAndUser(context.Background(), ws.ID, "user-1")
	if err != nil {
		t.Fatal("creator should be a member")
	}
	if member.Role != "owner" {
		t.Errorf("expected role 'owner', got %s", member.Role)
	}
}

func TestWorkspaceUsecase_CreateWorkspace_InvalidName(t *testing.T) {
	uc := NewWorkspaceUsecase(newMockWorkspaceRepo(), newMockWsMemberRepo(), newMockWsInviteRepo())
	_, err := uc.CreateWorkspace(context.Background(), "user-1", "", "")
	if err == nil {
		t.Error("expected validation error")
	}
}

func TestWorkspaceUsecase_UpdateWorkspace(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, newMockWsInviteRepo())

	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "Old Name", "")

	updated, err := uc.UpdateWorkspace(context.Background(), "user-1", ws.ID, map[string]string{"name": "New Name"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "New Name" {
		t.Errorf("expected 'New Name', got %s", updated.Name)
	}
}

func TestWorkspaceUsecase_UpdateWorkspace_Forbidden(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, newMockWsInviteRepo())

	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "WS", "")

	// user-2 is not a member
	_, err := uc.UpdateWorkspace(context.Background(), "user-2", ws.ID, map[string]string{"name": "Hacked"})
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestWorkspaceUsecase_InviteAndJoin(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	inviteRepo := newMockWsInviteRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, inviteRepo)

	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "WS", "")

	token, err := uc.InviteMember(context.Background(), "user-1", ws.ID, "new@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty invite token")
	}

	member, err := uc.JoinByInvite(context.Background(), "user-2", token)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if member.Role != "member" {
		t.Errorf("expected role 'member', got %s", member.Role)
	}

	// Token should be consumed
	_, err = uc.JoinByInvite(context.Background(), "user-3", token)
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound for consumed token, got %v", err)
	}
}

func TestWorkspaceUsecase_JoinByInvite_AlreadyMember(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	inviteRepo := newMockWsInviteRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, inviteRepo)

	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "WS", "")
	token, _ := uc.InviteMember(context.Background(), "user-1", ws.ID, "test@example.com")

	// user-1 is already owner
	_, err := uc.JoinByInvite(context.Background(), "user-1", token)
	if err != domain.ErrAlreadyExists {
		t.Errorf("expected ErrAlreadyExists, got %v", err)
	}
}

func TestWorkspaceUsecase_RemoveMember(t *testing.T) {
	wsRepo := newMockWorkspaceRepo()
	memberRepo := newMockWsMemberRepo()
	inviteRepo := newMockWsInviteRepo()
	uc := NewWorkspaceUsecase(wsRepo, memberRepo, inviteRepo)

	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "WS", "")
	token, _ := uc.InviteMember(context.Background(), "user-1", ws.ID, "test@example.com")
	_, _ = uc.JoinByInvite(context.Background(), "user-2", token)

	err := uc.RemoveMember(context.Background(), "user-1", ws.ID, "user-2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// user-2 should no longer be a member
	_, err = memberRepo.FindByWorkspaceAndUser(context.Background(), ws.ID, "user-2")
	if err != domain.ErrNotFound {
		t.Error("expected user-2 to be removed")
	}
}

func TestWorkspaceUsecase_RemoveMember_CannotRemoveSelf(t *testing.T) {
	uc := NewWorkspaceUsecase(newMockWorkspaceRepo(), newMockWsMemberRepo(), newMockWsInviteRepo())
	ws, _ := uc.CreateWorkspace(context.Background(), "user-1", "WS", "")

	err := uc.RemoveMember(context.Background(), "user-1", ws.ID, "user-1")
	if err == nil {
		t.Error("expected error when removing self")
	}
}
