package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- mock repos ---

type mockMessageRepo struct {
	messages map[string]*domain.Message
}

func newMockMessageRepo() *mockMessageRepo {
	return &mockMessageRepo{messages: make(map[string]*domain.Message)}
}

func (m *mockMessageRepo) Create(_ context.Context, msg *domain.Message) error {
	now := time.Now()
	msg.CreatedAt = now
	msg.UpdatedAt = now
	m.messages[msg.ID] = msg
	return nil
}

func (m *mockMessageRepo) FindByID(_ context.Context, id string) (*domain.Message, error) {
	msg, ok := m.messages[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return msg, nil
}

func (m *mockMessageRepo) ListByChannel(_ context.Context, chID, cursor string, limit int) ([]*domain.Message, string, string, bool, bool, error) {
	var result []*domain.Message
	for _, msg := range m.messages {
		if msg.ChannelID == chID && msg.ThreadRootID == nil && msg.DeletedAt == nil {
			result = append(result, msg)
		}
	}
	var next, prev string
	if len(result) > 0 {
		next = result[len(result)-1].ID
		prev = result[0].ID
	}
	return result, next, prev, cursor != "", false, nil
}

func (m *mockMessageRepo) Update(_ context.Context, msg *domain.Message) error {
	msg.UpdatedAt = time.Now()
	m.messages[msg.ID] = msg
	return nil
}

func (m *mockMessageRepo) SoftDelete(_ context.Context, id string) error {
	msg, ok := m.messages[id]
	if !ok {
		return domain.ErrNotFound
	}
	now := time.Now()
	msg.DeletedAt = &now
	return nil
}

func (m *mockMessageRepo) GetThreadReplies(_ context.Context, rootID string) ([]*domain.Message, error) {
	var result []*domain.Message
	for _, msg := range m.messages {
		if msg.ThreadRootID != nil && *msg.ThreadRootID == rootID {
			result = append(result, msg)
		}
	}
	return result, nil
}

type mockAttachmentRepo struct{}

func (m *mockAttachmentRepo) CreateBatch(_ context.Context, _ []*domain.MessageAttachment) error {
	return nil
}

func (m *mockAttachmentRepo) ListByMessage(_ context.Context, _ string) ([]*domain.MessageAttachment, error) {
	return nil, nil
}

type mockReactionRepo struct {
	reactions map[string]*domain.Reaction // key: msgID:userID:emoji
}

func newMockReactionRepo() *mockReactionRepo {
	return &mockReactionRepo{reactions: make(map[string]*domain.Reaction)}
}

func (m *mockReactionRepo) Create(_ context.Context, r *domain.Reaction) error {
	key := r.MessageID + ":" + r.UserID + ":" + r.EmojiCode
	if _, exists := m.reactions[key]; exists {
		return domain.ErrAlreadyExists
	}
	r.CreatedAt = time.Now()
	m.reactions[key] = r
	return nil
}

func (m *mockReactionRepo) DeleteByMessageAndUserAndEmoji(_ context.Context, messageID, userID, emojiCode string) error {
	key := messageID + ":" + userID + ":" + emojiCode
	if _, exists := m.reactions[key]; !exists {
		return domain.ErrNotFound
	}
	delete(m.reactions, key)
	return nil
}

func (m *mockReactionRepo) ListByMessage(_ context.Context, messageID string) ([]*domain.Reaction, error) {
	var result []*domain.Reaction
	for _, r := range m.reactions {
		if r.MessageID == messageID {
			result = append(result, r)
		}
	}
	return result, nil
}

// --- Message tests ---

func TestMessageUsecase_SendMessage(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	msg, err := uc.SendMessage(context.Background(), "user-1", "ch-1", "Hello!", nil, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if msg.Content != "Hello!" {
		t.Errorf("expected 'Hello!', got %s", msg.Content)
	}
	if msg.UserID != "user-1" {
		t.Errorf("expected user-1, got %s", msg.UserID)
	}
}

func TestMessageUsecase_SendMessage_EmptyContent(t *testing.T) {
	uc := NewMessageUsecase(newMockMessageRepo(), &mockAttachmentRepo{})
	_, err := uc.SendMessage(context.Background(), "user-1", "ch-1", "", nil, nil)
	if err == nil {
		t.Error("expected validation error for empty content")
	}
}

func TestMessageUsecase_SendMessage_ThreadReply(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	root, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "Root message", nil, nil)
	reply, err := uc.SendMessage(context.Background(), "user-2", "ch-1", "Reply", &root.ID, nil)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !reply.IsThreadReply() {
		t.Error("expected reply to be a thread reply")
	}
}

func TestMessageUsecase_UpdateMessage(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	msg, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "Original", nil, nil)
	updated, err := uc.UpdateMessage(context.Background(), "user-1", msg.ID, "Edited")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Content != "Edited" {
		t.Errorf("expected 'Edited', got %s", updated.Content)
	}
	if !updated.IsEdited {
		t.Error("expected IsEdited to be true")
	}
}

func TestMessageUsecase_UpdateMessage_Forbidden(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	msg, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "Original", nil, nil)
	_, err := uc.UpdateMessage(context.Background(), "user-2", msg.ID, "Hacked")
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestMessageUsecase_DeleteMessage(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	msg, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "To delete", nil, nil)
	_, err := uc.DeleteMessage(context.Background(), "user-1", msg.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if msgRepo.messages[msg.ID].DeletedAt == nil {
		t.Error("expected message to be soft-deleted")
	}
}

func TestMessageUsecase_DeleteMessage_Forbidden(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	msg, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "Mine", nil, nil)
	_, err := uc.DeleteMessage(context.Background(), "user-2", msg.ID)
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestMessageUsecase_GetThread(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	root, _ := uc.SendMessage(context.Background(), "user-1", "ch-1", "Root", nil, nil)
	_, _ = uc.SendMessage(context.Background(), "user-2", "ch-1", "Reply 1", &root.ID, nil)
	_, _ = uc.SendMessage(context.Background(), "user-3", "ch-1", "Reply 2", &root.ID, nil)

	gotRoot, replies, err := uc.GetThread(context.Background(), root.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if gotRoot.ID != root.ID {
		t.Errorf("expected root ID %s, got %s", root.ID, gotRoot.ID)
	}
	if len(replies) != 2 {
		t.Errorf("expected 2 replies, got %d", len(replies))
	}
}

func TestMessageUsecase_ListMessages(t *testing.T) {
	msgRepo := newMockMessageRepo()
	uc := NewMessageUsecase(msgRepo, &mockAttachmentRepo{})

	_, _ = uc.SendMessage(context.Background(), "user-1", "ch-1", "Msg 1", nil, nil)
	_, _ = uc.SendMessage(context.Background(), "user-1", "ch-1", "Msg 2", nil, nil)

	msgs, _, _, _, _, err := uc.ListMessages(context.Background(), "ch-1", "", 50)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(msgs) != 2 {
		t.Errorf("expected 2 messages, got %d", len(msgs))
	}
}

func TestMessageUsecase_GetMessage_NotFound(t *testing.T) {
	uc := NewMessageUsecase(newMockMessageRepo(), &mockAttachmentRepo{})
	_, err := uc.GetMessage(context.Background(), "nonexistent")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

// --- Reaction tests ---

func TestReactionUsecase_AddReaction(t *testing.T) {
	repo := newMockReactionRepo()
	uc := NewReactionUsecase(repo)

	r, err := uc.AddReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if r.EmojiCode != "thumbsup" {
		t.Errorf("expected 'thumbsup', got %s", r.EmojiCode)
	}
}

func TestReactionUsecase_AddReaction_Duplicate(t *testing.T) {
	repo := newMockReactionRepo()
	uc := NewReactionUsecase(repo)

	_, _ = uc.AddReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	_, err := uc.AddReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	if err != domain.ErrAlreadyExists {
		t.Errorf("expected ErrAlreadyExists, got %v", err)
	}
}

func TestReactionUsecase_RemoveReaction(t *testing.T) {
	repo := newMockReactionRepo()
	uc := NewReactionUsecase(repo)

	_, _ = uc.AddReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	err := uc.RemoveReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestReactionUsecase_RemoveReaction_NotFound(t *testing.T) {
	repo := newMockReactionRepo()
	uc := NewReactionUsecase(repo)

	err := uc.RemoveReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestReactionUsecase_ListReactions(t *testing.T) {
	repo := newMockReactionRepo()
	uc := NewReactionUsecase(repo)

	_, _ = uc.AddReaction(context.Background(), "user-1", "msg-1", "thumbsup")
	_, _ = uc.AddReaction(context.Background(), "user-2", "msg-1", "heart")

	reactions, err := uc.ListReactions(context.Background(), "msg-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(reactions) != 2 {
		t.Errorf("expected 2 reactions, got %d", len(reactions))
	}
}
