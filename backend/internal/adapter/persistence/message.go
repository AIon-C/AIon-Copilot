package persistence

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- MessageRepository ---

type messageRepository struct{ db *gorm.DB }

func NewMessageRepository(db *gorm.DB) domain.MessageRepository {
	return &messageRepository{db: db}
}

func (r *messageRepository) Create(ctx context.Context, msg *domain.Message) error {
	m := messageDomainToModel(msg)
	now := nowUTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	msg.CreatedAt = m.CreatedAt
	msg.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *messageRepository) FindByID(ctx context.Context, id string) (*domain.Message, error) {
	var m model.Message
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return messageModelToDomain(&m), nil
}

func (r *messageRepository) ListByChannel(ctx context.Context, chID string, cursor string, limit int) ([]*domain.Message, string, string, bool, bool, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	q := r.db.WithContext(ctx).Model(&model.Message{}).Where("channel_id = ? AND thread_root_id IS NULL", chID)

	if cursor != "" {
		q = q.Where("created_at < (SELECT created_at FROM messages WHERE id = ?)", cursor)
	}

	var models []model.Message
	// Fetch limit+1 to determine hasMoreAfter
	if err := q.Order("created_at DESC").Limit(limit + 1).Find(&models).Error; err != nil {
		return nil, "", "", false, false, err
	}

	hasMoreAfter := len(models) > limit
	if hasMoreAfter {
		models = models[:limit]
	}

	result := make([]*domain.Message, len(models))
	for i := range models {
		result[i] = messageModelToDomain(&models[i])
	}

	var nextCursor, prevCursor string
	if len(result) > 0 {
		nextCursor = result[len(result)-1].ID
		prevCursor = result[0].ID
	}

	hasMoreBefore := cursor != ""

	return result, nextCursor, prevCursor, hasMoreBefore, hasMoreAfter, nil
}

func (r *messageRepository) Update(ctx context.Context, msg *domain.Message) error {
	m := messageDomainToModel(msg)
	m.UpdatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	msg.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *messageRepository) SoftDelete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.Message{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *messageRepository) GetThreadReplies(ctx context.Context, rootID string) ([]*domain.Message, error) {
	var models []model.Message
	if err := r.db.WithContext(ctx).Where("thread_root_id = ?", rootID).Order("created_at ASC").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Message, len(models))
	for i := range models {
		result[i] = messageModelToDomain(&models[i])
	}
	return result, nil
}

// --- MessageAttachmentRepository ---

type messageAttachmentRepository struct{ db *gorm.DB }

func NewMessageAttachmentRepository(db *gorm.DB) domain.MessageAttachmentRepository {
	return &messageAttachmentRepository{db: db}
}

func (r *messageAttachmentRepository) CreateBatch(ctx context.Context, attachments []*domain.MessageAttachment) error {
	if len(attachments) == 0 {
		return nil
	}
	models := make([]model.MessageAttachment, len(attachments))
	for i, a := range attachments {
		models[i] = *messageAttachmentDomainToModel(a)
	}
	return r.db.WithContext(ctx).Create(&models).Error
}

func (r *messageAttachmentRepository) ListByMessage(ctx context.Context, messageID string) ([]*domain.MessageAttachment, error) {
	var models []model.MessageAttachment
	if err := r.db.WithContext(ctx).Where("message_id = ?", messageID).Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.MessageAttachment, len(models))
	for i := range models {
		result[i] = messageAttachmentModelToDomain(&models[i])
	}
	return result, nil
}

// --- ReactionRepository ---

type reactionRepository struct{ db *gorm.DB }

func NewReactionRepository(db *gorm.DB) domain.ReactionRepository {
	return &reactionRepository{db: db}
}

func (r *reactionRepository) Create(ctx context.Context, reaction *domain.Reaction) error {
	m := reactionDomainToModel(reaction)
	m.CreatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	reaction.CreatedAt = m.CreatedAt
	return nil
}

func (r *reactionRepository) DeleteByMessageAndUserAndEmoji(ctx context.Context, messageID, userID, emojiCode string) error {
	result := r.db.WithContext(ctx).Where("message_id = ? AND user_id = ? AND emoji_code = ?", messageID, userID, emojiCode).Delete(&model.Reaction{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *reactionRepository) ListByMessage(ctx context.Context, messageID string) ([]*domain.Reaction, error) {
	var models []model.Reaction
	if err := r.db.WithContext(ctx).Where("message_id = ?", messageID).Order("created_at ASC").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.Reaction, len(models))
	for i := range models {
		result[i] = reactionModelToDomain(&models[i])
	}
	return result, nil
}
