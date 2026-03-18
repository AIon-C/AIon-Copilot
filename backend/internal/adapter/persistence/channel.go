package persistence

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- ChannelRepository ---

type channelRepository struct{ db *gorm.DB }

func NewChannelRepository(db *gorm.DB) domain.ChannelRepository {
	return &channelRepository{db: db}
}

func (r *channelRepository) Create(ctx context.Context, ch *domain.Channel) error {
	m := channelDomainToModel(ch)
	now := nowUTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	ch.CreatedAt = m.CreatedAt
	ch.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *channelRepository) FindByID(ctx context.Context, id string) (*domain.Channel, error) {
	var m model.Channel
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return channelModelToDomain(&m), nil
}

func (r *channelRepository) ListByWorkspace(ctx context.Context, wsID string, page, pageSize int, sortField, sortOrder string) ([]*domain.Channel, int64, error) {
	var total int64
	q := r.db.WithContext(ctx).Model(&model.Channel{}).Where("workspace_id = ?", wsID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderClause := sanitizeSort(sortField, sortOrder)
	var models []model.Channel
	offset := (page - 1) * pageSize
	if err := q.Offset(offset).Limit(pageSize).Order(orderClause).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*domain.Channel, len(models))
	for i := range models {
		result[i] = channelModelToDomain(&models[i])
	}
	return result, total, nil
}

func (r *channelRepository) SearchByName(ctx context.Context, wsID, query string, page, pageSize int) ([]*domain.Channel, int64, error) {
	var total int64
	q := r.db.WithContext(ctx).Model(&model.Channel{}).
		Where("workspace_id = ? AND name ILIKE ?", wsID, "%"+query+"%")
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var models []model.Channel
	offset := (page - 1) * pageSize
	if err := q.Offset(offset).Limit(pageSize).Order("name ASC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*domain.Channel, len(models))
	for i := range models {
		result[i] = channelModelToDomain(&models[i])
	}
	return result, total, nil
}

func (r *channelRepository) Update(ctx context.Context, ch *domain.Channel) error {
	m := channelDomainToModel(ch)
	m.UpdatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	ch.UpdatedAt = m.UpdatedAt
	return nil
}

// --- ChannelMemberRepository ---

type channelMemberRepository struct{ db *gorm.DB }

func NewChannelMemberRepository(db *gorm.DB) domain.ChannelMemberRepository {
	return &channelMemberRepository{db: db}
}

func (r *channelMemberRepository) Create(ctx context.Context, m *domain.ChannelMember) error {
	cm := channelMemberDomainToModel(m)
	cm.JoinedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(cm).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	m.JoinedAt = cm.JoinedAt
	return nil
}

func (r *channelMemberRepository) FindByChannelAndUser(ctx context.Context, chID, userID string) (*domain.ChannelMember, error) {
	var m model.ChannelMember
	if err := r.db.WithContext(ctx).Where("channel_id = ? AND user_id = ?", chID, userID).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return channelMemberModelToDomain(&m), nil
}

func (r *channelMemberRepository) DeleteByChannelAndUser(ctx context.Context, chID, userID string) error {
	result := r.db.WithContext(ctx).Where("channel_id = ? AND user_id = ?", chID, userID).Delete(&model.ChannelMember{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *channelMemberRepository) UpdateLastRead(ctx context.Context, chID, userID string, messageID string) error {
	now := nowUTC()
	result := r.db.WithContext(ctx).Model(&model.ChannelMember{}).
		Where("channel_id = ? AND user_id = ?", chID, userID).
		Update("last_read_at", now)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *channelMemberRepository) GetUnreadCounts(ctx context.Context, userID, wsID string) ([]domain.UnreadCount, error) {
	type row struct {
		ChannelID string
		Count     int32
	}
	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT cm.channel_id, COUNT(m.id)::int AS count
		FROM channel_members cm
		JOIN channels ch ON ch.id = cm.channel_id AND ch.deleted_at IS NULL
		LEFT JOIN messages m ON m.channel_id = cm.channel_id
			AND m.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
			AND m.deleted_at IS NULL
			AND m.thread_root_id IS NULL
		WHERE cm.user_id = ? AND ch.workspace_id = ?
		GROUP BY cm.channel_id
		HAVING COUNT(m.id) > 0
	`, userID, wsID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	result := make([]domain.UnreadCount, len(rows))
	for i, r := range rows {
		result[i] = domain.UnreadCount{ChannelID: r.ChannelID, Count: r.Count}
	}
	return result, nil
}

// sanitizeSort returns a safe ORDER BY clause.
var allowedSortFields = map[string]bool{
	"name":       true,
	"created_at": true,
	"updated_at": true,
}

func sanitizeSort(field, order string) string {
	if !allowedSortFields[field] {
		field = "created_at"
	}
	if order != "ASC" && order != "DESC" {
		order = "ASC"
	}
	return fmt.Sprintf("%s %s", field, order)
}
