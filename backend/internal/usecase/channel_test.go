package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- mock repos ---

type mockChannelRepo struct {
	channels map[string]*domain.Channel
}

func newMockChannelRepo() *mockChannelRepo {
	return &mockChannelRepo{channels: make(map[string]*domain.Channel)}
}

func (m *mockChannelRepo) Create(_ context.Context, ch *domain.Channel) error {
	now := time.Now()
	ch.CreatedAt = now
	ch.UpdatedAt = now
	m.channels[ch.ID] = ch
	return nil
}

func (m *mockChannelRepo) FindByID(_ context.Context, id string) (*domain.Channel, error) {
	ch, ok := m.channels[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return ch, nil
}

func (m *mockChannelRepo) ListByWorkspace(_ context.Context, wsID string, page, pageSize int, sortField, sortOrder string) ([]*domain.Channel, int64, error) {
	var result []*domain.Channel
	for _, ch := range m.channels {
		if ch.WorkspaceID == wsID {
			result = append(result, ch)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockChannelRepo) SearchByName(_ context.Context, wsID, query string, page, pageSize int) ([]*domain.Channel, int64, error) {
	var result []*domain.Channel
	for _, ch := range m.channels {
		if ch.WorkspaceID == wsID {
			result = append(result, ch)
		}
	}
	return result, int64(len(result)), nil
}

func (m *mockChannelRepo) Update(_ context.Context, ch *domain.Channel) error {
	ch.UpdatedAt = time.Now()
	m.channels[ch.ID] = ch
	return nil
}

type mockChMemberRepo struct {
	members map[string]*domain.ChannelMember
}

func newMockChMemberRepo() *mockChMemberRepo {
	return &mockChMemberRepo{members: make(map[string]*domain.ChannelMember)}
}

func (m *mockChMemberRepo) Create(_ context.Context, cm *domain.ChannelMember) error {
	key := cm.ChannelID + ":" + cm.UserID
	if _, exists := m.members[key]; exists {
		return domain.ErrAlreadyExists
	}
	cm.JoinedAt = time.Now()
	m.members[key] = cm
	return nil
}

func (m *mockChMemberRepo) FindByChannelAndUser(_ context.Context, chID, userID string) (*domain.ChannelMember, error) {
	key := chID + ":" + userID
	cm, ok := m.members[key]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return cm, nil
}

func (m *mockChMemberRepo) DeleteByChannelAndUser(_ context.Context, chID, userID string) error {
	key := chID + ":" + userID
	if _, exists := m.members[key]; !exists {
		return domain.ErrNotFound
	}
	delete(m.members, key)
	return nil
}

func (m *mockChMemberRepo) UpdateLastRead(_ context.Context, chID, userID string, messageID string) error {
	key := chID + ":" + userID
	cm, ok := m.members[key]
	if !ok {
		return domain.ErrNotFound
	}
	now := time.Now()
	cm.LastReadAt = &now
	return nil
}

func (m *mockChMemberRepo) GetUnreadCounts(_ context.Context, userID, wsID string) ([]domain.UnreadCount, error) {
	return nil, nil
}

// --- ws member mock for channel tests ---

type mockChWsMemberRepo struct {
	members map[string]*domain.WorkspaceMember
}

func newMockChWsMemberRepo() *mockChWsMemberRepo {
	return &mockChWsMemberRepo{members: make(map[string]*domain.WorkspaceMember)}
}

func (m *mockChWsMemberRepo) Create(_ context.Context, wm *domain.WorkspaceMember) error {
	key := wm.WorkspaceID + ":" + wm.UserID
	wm.JoinedAt = time.Now()
	m.members[key] = wm
	return nil
}

func (m *mockChWsMemberRepo) FindByWorkspaceAndUser(_ context.Context, wsID, userID string) (*domain.WorkspaceMember, error) {
	key := wsID + ":" + userID
	wm, ok := m.members[key]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return wm, nil
}

func (m *mockChWsMemberRepo) ListByWorkspace(_ context.Context, wsID string, page, pageSize int) ([]*domain.WorkspaceMember, int64, error) {
	return nil, 0, nil
}

func (m *mockChWsMemberRepo) DeleteByWorkspaceAndUser(_ context.Context, wsID, userID string) error {
	return nil
}

func seedWsMember(repo *mockChWsMemberRepo, wsID, userID, role string) {
	key := wsID + ":" + userID
	repo.members[key] = &domain.WorkspaceMember{
		ID: "wm-" + userID, WorkspaceID: wsID, UserID: userID, Role: role, JoinedAt: time.Now(),
	}
}

// --- tests ---

func TestChannelUsecase_CreateChannel(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, err := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "General chat")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ch.Name != "general" {
		t.Errorf("expected 'general', got %s", ch.Name)
	}
	if ch.CreatedBy != "user-1" {
		t.Errorf("expected creator user-1, got %s", ch.CreatedBy)
	}
	if _, err := memberRepo.FindByChannelAndUser(context.Background(), ch.ID, "user-1"); err != nil {
		t.Error("creator should auto-join the channel")
	}
}

func TestChannelUsecase_CreateChannel_NotWsMember(t *testing.T) {
	wsRepo := newMockChWsMemberRepo()
	uc := NewChannelUsecase(newMockChannelRepo(), newMockChMemberRepo(), wsRepo)

	_, err := uc.CreateChannel(context.Background(), "outsider", "ws-1", "general", "")
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden for non-workspace member, got %v", err)
	}
}

func TestChannelUsecase_CreateChannel_InvalidName(t *testing.T) {
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "member")
	uc := NewChannelUsecase(newMockChannelRepo(), newMockChMemberRepo(), wsRepo)
	_, err := uc.CreateChannel(context.Background(), "user-1", "ws-1", "", "desc")
	if err == nil {
		t.Error("expected validation error for empty name")
	}
}

func TestChannelUsecase_UpdateChannel_ByMember(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "old-name", "")
	updated, err := uc.UpdateChannel(context.Background(), "user-1", ch.ID, map[string]string{
		"name": "new-name", "description": "new desc",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "new-name" {
		t.Errorf("expected 'new-name', got %s", updated.Name)
	}
}

func TestChannelUsecase_UpdateChannel_Forbidden(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "ch", "")

	// user-2 is not a member of channel or workspace
	_, err := uc.UpdateChannel(context.Background(), "user-2", ch.ID, map[string]string{"name": "hacked"})
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestChannelUsecase_UpdateChannel_ByWsAdmin(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	seedWsMember(wsRepo, "ws-1", "user-admin", "admin")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	// user-1 creates channel (and auto-joins)
	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")

	// user-admin is a workspace admin but NOT a channel member — should succeed
	updated, err := uc.UpdateChannel(context.Background(), "user-admin", ch.ID, map[string]string{
		"name": "renamed",
	})
	if err != nil {
		t.Fatalf("workspace admin should be allowed to update channel: %v", err)
	}
	if updated.Name != "renamed" {
		t.Errorf("expected 'renamed', got %s", updated.Name)
	}
}

func TestChannelUsecase_UpdateChannel_WsMemberOnly(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	seedWsMember(wsRepo, "ws-1", "user-regular", "member")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")

	// user-regular is a workspace member (not admin) and NOT a channel member — should fail
	_, err := uc.UpdateChannel(context.Background(), "user-regular", ch.ID, map[string]string{"name": "hacked"})
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden for regular ws member not in channel, got %v", err)
	}
}

func TestChannelUsecase_JoinChannel_WsMemberRequired(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	seedWsMember(wsRepo, "ws-1", "user-2", "member")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")

	// user-2 is ws member — should succeed
	member, err := uc.JoinChannel(context.Background(), "user-2", ch.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if member.UserID != "user-2" {
		t.Errorf("expected user-2, got %s", member.UserID)
	}

	// outsider — should fail
	_, err = uc.JoinChannel(context.Background(), "outsider", ch.ID)
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden for non-ws member, got %v", err)
	}
}

func TestChannelUsecase_LeaveChannel(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	seedWsMember(wsRepo, "ws-1", "user-2", "member")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")
	_, _ = uc.JoinChannel(context.Background(), "user-2", ch.ID)

	err := uc.LeaveChannel(context.Background(), "user-2", ch.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	_, err = memberRepo.FindByChannelAndUser(context.Background(), ch.ID, "user-2")
	if err != domain.ErrNotFound {
		t.Error("expected user-2 to be removed")
	}
}

func TestChannelUsecase_GetChannel_NotFound(t *testing.T) {
	uc := NewChannelUsecase(newMockChannelRepo(), newMockChMemberRepo(), newMockChWsMemberRepo())
	_, err := uc.GetChannel(context.Background(), "nonexistent")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestChannelUsecase_MarkChannelRead(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	wsRepo := newMockChWsMemberRepo()
	seedWsMember(wsRepo, "ws-1", "user-1", "owner")
	uc := NewChannelUsecase(chRepo, memberRepo, wsRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")
	err := uc.MarkChannelRead(context.Background(), "user-1", ch.ID, "msg-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
