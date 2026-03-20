package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

type MessageUsecase interface {
	SendMessage(ctx context.Context, userID, channelID, content string, threadRootID *string, fileIDs []string) (*domain.Message, error)
	ListMessages(ctx context.Context, userID, channelID, cursor string, limit int) ([]*domain.Message, string, string, bool, bool, error)
	GetMessage(ctx context.Context, id string) (*domain.Message, error)
	UpdateMessage(ctx context.Context, userID, msgID, content string) (*domain.Message, error)
	DeleteMessage(ctx context.Context, userID, msgID string) (*domain.Message, error)
	GetThread(ctx context.Context, rootID string) (*domain.Message, []*domain.Message, error)
}

type ReactionUsecase interface {
	AddReaction(ctx context.Context, userID, messageID, emojiCode string) (*domain.Reaction, error)
	RemoveReaction(ctx context.Context, userID, messageID, emojiCode string) error
	ListReactions(ctx context.Context, messageID string) ([]*domain.Reaction, error)
}

type messageUsecase struct {
	msgRepo        domain.MessageRepository
	attachmentRepo domain.MessageAttachmentRepository
	chMemberRepo   domain.ChannelMemberRepository
	eventBus       domain.EventBus
}

func NewMessageUsecase(
	msgRepo domain.MessageRepository,
	attachmentRepo domain.MessageAttachmentRepository,
	chMemberRepo domain.ChannelMemberRepository,
	eventBus domain.EventBus,
) MessageUsecase {
	return &messageUsecase{
		msgRepo:        msgRepo,
		attachmentRepo: attachmentRepo,
		chMemberRepo:   chMemberRepo,
		eventBus:       eventBus,
	}
}

func (uc *messageUsecase) SendMessage(ctx context.Context, userID, channelID, content string, threadRootID *string, fileIDs []string) (*domain.Message, error) {
	// Verify channel membership
	if _, err := uc.chMemberRepo.FindByChannelAndUser(ctx, channelID, userID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrForbidden
		}
		return nil, err
	}

	msg := &domain.Message{
		ID:           ulid.NewID(),
		ChannelID:    channelID,
		UserID:       userID,
		ThreadRootID: threadRootID,
		Content:      content,
	}
	if err := msg.Validate(); err != nil {
		return nil, err
	}

	if err := uc.msgRepo.Create(ctx, msg); err != nil {
		return nil, err
	}

	if len(fileIDs) > 0 {
		attachments := make([]*domain.MessageAttachment, len(fileIDs))
		for i, fid := range fileIDs {
			attachments[i] = &domain.MessageAttachment{
				ID:        ulid.NewID(),
				MessageID: msg.ID,
				FileID:    fid,
			}
		}
		if err := uc.attachmentRepo.CreateBatch(ctx, attachments); err != nil {
			// Compensate: remove the orphaned message
			_ = uc.msgRepo.SoftDelete(ctx, msg.ID)
			return nil, err
		}
	}

	// Broadcast real-time event (fire-and-forget)
	if uc.eventBus != nil {
		_ = uc.eventBus.Publish(ctx, channelID, &domain.Event{
			Type:      domain.EventMessageCreated,
			ChannelID: channelID,
			UserID:    userID,
			Payload:   msg,
			Timestamp: time.Now(),
		})
	}

	return msg, nil
}

func (uc *messageUsecase) ListMessages(ctx context.Context, userID, channelID, cursor string, limit int) ([]*domain.Message, string, string, bool, bool, error) {
	// Verify channel membership
	if _, err := uc.chMemberRepo.FindByChannelAndUser(ctx, channelID, userID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, "", "", false, false, domain.ErrForbidden
		}
		return nil, "", "", false, false, err
	}

	return uc.msgRepo.ListByChannel(ctx, channelID, cursor, limit)
}

func (uc *messageUsecase) GetMessage(ctx context.Context, id string) (*domain.Message, error) {
	return uc.msgRepo.FindByID(ctx, id)
}

func (uc *messageUsecase) UpdateMessage(ctx context.Context, userID, msgID, content string) (*domain.Message, error) {
	msg, err := uc.msgRepo.FindByID(ctx, msgID)
	if err != nil {
		return nil, err
	}

	if msg.UserID != userID {
		return nil, domain.ErrForbidden
	}

	msg.Content = content
	msg.IsEdited = true
	now := time.Now()
	msg.EditedAt = &now

	if err := msg.Validate(); err != nil {
		return nil, err
	}

	if err := uc.msgRepo.Update(ctx, msg); err != nil {
		return nil, err
	}

	if uc.eventBus != nil {
		_ = uc.eventBus.Publish(ctx, msg.ChannelID, &domain.Event{
			Type:      domain.EventMessageUpdated,
			ChannelID: msg.ChannelID,
			UserID:    userID,
			Payload:   msg,
			Timestamp: time.Now(),
		})
	}

	return msg, nil
}

func (uc *messageUsecase) DeleteMessage(ctx context.Context, userID, msgID string) (*domain.Message, error) {
	msg, err := uc.msgRepo.FindByID(ctx, msgID)
	if err != nil {
		return nil, err
	}

	if msg.UserID != userID {
		return nil, domain.ErrForbidden
	}

	if err := uc.msgRepo.SoftDelete(ctx, msgID); err != nil {
		return nil, err
	}

	if uc.eventBus != nil {
		_ = uc.eventBus.Publish(ctx, msg.ChannelID, &domain.Event{
			Type:      domain.EventMessageDeleted,
			ChannelID: msg.ChannelID,
			UserID:    userID,
			Payload:   map[string]string{"messageId": msgID},
			Timestamp: time.Now(),
		})
	}

	return msg, nil
}

func (uc *messageUsecase) GetThread(ctx context.Context, rootID string) (*domain.Message, []*domain.Message, error) {
	root, err := uc.msgRepo.FindByID(ctx, rootID)
	if err != nil {
		return nil, nil, err
	}

	replies, err := uc.msgRepo.GetThreadReplies(ctx, rootID)
	if err != nil {
		return nil, nil, err
	}

	return root, replies, nil
}

// --- ReactionUsecase ---

type reactionUsecase struct {
	reactionRepo domain.ReactionRepository
}

func NewReactionUsecase(reactionRepo domain.ReactionRepository) ReactionUsecase {
	return &reactionUsecase{reactionRepo: reactionRepo}
}

func (uc *reactionUsecase) AddReaction(ctx context.Context, userID, messageID, emojiCode string) (*domain.Reaction, error) {
	r := &domain.Reaction{
		ID:        ulid.NewID(),
		MessageID: messageID,
		UserID:    userID,
		EmojiCode: emojiCode,
	}
	if err := uc.reactionRepo.Create(ctx, r); err != nil {
		return nil, err
	}
	return r, nil
}

func (uc *reactionUsecase) RemoveReaction(ctx context.Context, userID, messageID, emojiCode string) error {
	return uc.reactionRepo.DeleteByMessageAndUserAndEmoji(ctx, messageID, userID, emojiCode)
}

func (uc *reactionUsecase) ListReactions(ctx context.Context, messageID string) ([]*domain.Reaction, error) {
	return uc.reactionRepo.ListByMessage(ctx, messageID)
}
