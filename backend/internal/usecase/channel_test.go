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
	members map[string]*domain.ChannelMember // key: chID+userID
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

// --- tests ---

func TestChannelUsecase_CreateChannel(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	uc := NewChannelUsecase(chRepo, memberRepo)

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
	// Creator should auto-join
	if _, err := memberRepo.FindByChannelAndUser(context.Background(), ch.ID, "user-1"); err != nil {
		t.Error("creator should auto-join the channel")
	}
}

func TestChannelUsecase_CreateChannel_InvalidName(t *testing.T) {
	uc := NewChannelUsecase(newMockChannelRepo(), newMockChMemberRepo())
	_, err := uc.CreateChannel(context.Background(), "user-1", "ws-1", "", "desc")
	if err == nil {
		t.Error("expected validation error for empty name")
	}
}

func TestChannelUsecase_UpdateChannel(t *testing.T) {
	chRepo := newMockChannelRepo()
	uc := NewChannelUsecase(chRepo, newMockChMemberRepo())

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "old-name", "")
	updated, err := uc.UpdateChannel(context.Background(), "user-1", ch.ID, map[string]string{
		"name":        "new-name",
		"description": "new desc",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "new-name" {
		t.Errorf("expected 'new-name', got %s", updated.Name)
	}
	if updated.Description != "new desc" {
		t.Errorf("expected 'new desc', got %s", updated.Description)
	}
}

func TestChannelUsecase_JoinAndLeave(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	uc := NewChannelUsecase(chRepo, memberRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")

	// user-2 joins
	member, err := uc.JoinChannel(context.Background(), "user-2", ch.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if member.UserID != "user-2" {
		t.Errorf("expected user-2, got %s", member.UserID)
	}

	// user-2 leaves
	err = uc.LeaveChannel(context.Background(), "user-2", ch.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// user-2 should no longer be a member
	_, err = memberRepo.FindByChannelAndUser(context.Background(), ch.ID, "user-2")
	if err != domain.ErrNotFound {
		t.Error("expected user-2 to be removed")
	}
}

func TestChannelUsecase_JoinChannel_AlreadyMember(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	uc := NewChannelUsecase(chRepo, memberRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")

	// user-1 already joined via create, try again
	_, err := uc.JoinChannel(context.Background(), "user-1", ch.ID)
	if err != domain.ErrAlreadyExists {
		t.Errorf("expected ErrAlreadyExists, got %v", err)
	}
}

func TestChannelUsecase_GetChannel_NotFound(t *testing.T) {
	uc := NewChannelUsecase(newMockChannelRepo(), newMockChMemberRepo())
	_, err := uc.GetChannel(context.Background(), "nonexistent")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestChannelUsecase_MarkChannelRead(t *testing.T) {
	chRepo := newMockChannelRepo()
	memberRepo := newMockChMemberRepo()
	uc := NewChannelUsecase(chRepo, memberRepo)

	ch, _ := uc.CreateChannel(context.Background(), "user-1", "ws-1", "general", "")
	err := uc.MarkChannelRead(context.Background(), "user-1", ch.ID, "msg-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}
