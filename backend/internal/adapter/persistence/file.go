package persistence

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

type fileRepository struct{ db *gorm.DB }

func NewFileRepository(db *gorm.DB) domain.FileRepository {
	return &fileRepository{db: db}
}

func (r *fileRepository) Create(ctx context.Context, file *domain.File) error {
	m := fileDomainToModel(file)
	m.CreatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	file.CreatedAt = m.CreatedAt
	return nil
}

func (r *fileRepository) FindByID(ctx context.Context, id string) (*domain.File, error) {
	var m model.File
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return fileModelToDomain(&m), nil
}

func (r *fileRepository) FindByIDs(ctx context.Context, ids []string) ([]*domain.File, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var models []model.File
	if err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.File, len(models))
	for i := range models {
		result[i] = fileModelToDomain(&models[i])
	}
	return result, nil
}
