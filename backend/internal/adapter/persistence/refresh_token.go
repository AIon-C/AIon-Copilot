package persistence

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) domain.RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(ctx context.Context, token *domain.RefreshToken) error {
	m := refreshTokenDomainToModel(token)
	m.CreatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	token.CreatedAt = m.CreatedAt
	return nil
}

func (r *refreshTokenRepository) FindByToken(ctx context.Context, token string) (*domain.RefreshToken, error) {
	var m model.RefreshToken
	if err := r.db.WithContext(ctx).Where("token = ?", token).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return refreshTokenModelToDomain(&m), nil
}

func (r *refreshTokenRepository) DeleteByUserID(ctx context.Context, userID string) error {
	return r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&model.RefreshToken{}).Error
}

func (r *refreshTokenRepository) DeleteByToken(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Where("token = ?", token).Delete(&model.RefreshToken{}).Error
}
