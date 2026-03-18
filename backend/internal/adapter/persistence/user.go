package persistence

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, id string) (*domain.User, error) {
	var m model.User
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return userModelToDomain(&m), nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var m model.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return userModelToDomain(&m), nil
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	m := userDomainToModel(user)
	now := nowUTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	user.CreatedAt = m.CreatedAt
	user.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	m := userDomainToModel(user)
	m.UpdatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	user.UpdatedAt = m.UpdatedAt
	return nil
}

func isUniqueViolation(err error) bool {
	// PostgreSQL unique violation error code: 23505
	return strings.Contains(err.Error(), "23505") ||
		strings.Contains(err.Error(), "duplicate key")
}
