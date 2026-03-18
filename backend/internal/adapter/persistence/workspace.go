package persistence

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- WorkspaceRepository ---

type workspaceRepository struct{ db *gorm.DB }

func NewWorkspaceRepository(db *gorm.DB) domain.WorkspaceRepository {
	return &workspaceRepository{db: db}
}

func (r *workspaceRepository) Create(ctx context.Context, ws *domain.Workspace) error {
	m := workspaceDomainToModel(ws)
	now := nowUTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	ws.CreatedAt = m.CreatedAt
	ws.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *workspaceRepository) FindByID(ctx context.Context, id string) (*domain.Workspace, error) {
	var m model.Workspace
	if err := r.db.WithContext(ctx).First(&m, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return workspaceModelToDomain(&m), nil
}

func (r *workspaceRepository) ListByUserID(ctx context.Context, userID string, page, pageSize int) ([]*domain.Workspace, int64, error) {
	var total int64
	sub := r.db.WithContext(ctx).Model(&model.WorkspaceMember{}).Where("user_id = ?", userID).Select("workspace_id")

	q := r.db.WithContext(ctx).Model(&model.Workspace{}).Where("id IN (?)", sub)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var models []model.Workspace
	offset := (page - 1) * pageSize
	if err := q.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*domain.Workspace, len(models))
	for i := range models {
		result[i] = workspaceModelToDomain(&models[i])
	}
	return result, total, nil
}

func (r *workspaceRepository) Update(ctx context.Context, ws *domain.Workspace) error {
	m := workspaceDomainToModel(ws)
	m.UpdatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	ws.UpdatedAt = m.UpdatedAt
	return nil
}

// --- WorkspaceMemberRepository ---

type workspaceMemberRepository struct{ db *gorm.DB }

func NewWorkspaceMemberRepository(db *gorm.DB) domain.WorkspaceMemberRepository {
	return &workspaceMemberRepository{db: db}
}

func (r *workspaceMemberRepository) Create(ctx context.Context, m *domain.WorkspaceMember) error {
	model := workspaceMemberDomainToModel(m)
	model.JoinedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		if isUniqueViolation(err) {
			return domain.ErrAlreadyExists
		}
		return err
	}
	m.JoinedAt = model.JoinedAt
	return nil
}

func (r *workspaceMemberRepository) FindByWorkspaceAndUser(ctx context.Context, wsID, userID string) (*domain.WorkspaceMember, error) {
	var m model.WorkspaceMember
	if err := r.db.WithContext(ctx).Where("workspace_id = ? AND user_id = ?", wsID, userID).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return workspaceMemberModelToDomain(&m), nil
}

func (r *workspaceMemberRepository) ListByWorkspace(ctx context.Context, wsID string, page, pageSize int) ([]*domain.WorkspaceMember, int64, error) {
	var total int64
	q := r.db.WithContext(ctx).Model(&model.WorkspaceMember{}).Where("workspace_id = ?", wsID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var models []model.WorkspaceMember
	offset := (page - 1) * pageSize
	if err := q.Offset(offset).Limit(pageSize).Order("joined_at ASC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	result := make([]*domain.WorkspaceMember, len(models))
	for i := range models {
		result[i] = workspaceMemberModelToDomain(&models[i])
	}
	return result, total, nil
}

func (r *workspaceMemberRepository) DeleteByWorkspaceAndUser(ctx context.Context, wsID, userID string) error {
	result := r.db.WithContext(ctx).Where("workspace_id = ? AND user_id = ?", wsID, userID).Delete(&model.WorkspaceMember{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// --- WorkspaceInviteRepository ---

type workspaceInviteRepository struct{ db *gorm.DB }

func NewWorkspaceInviteRepository(db *gorm.DB) domain.WorkspaceInviteRepository {
	return &workspaceInviteRepository{db: db}
}

func (r *workspaceInviteRepository) Create(ctx context.Context, inv *domain.WorkspaceInvite) error {
	m := workspaceInviteDomainToModel(inv)
	m.CreatedAt = nowUTC()
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	inv.CreatedAt = m.CreatedAt
	return nil
}

func (r *workspaceInviteRepository) FindByToken(ctx context.Context, token string) (*domain.WorkspaceInvite, error) {
	var m model.WorkspaceInvite
	if err := r.db.WithContext(ctx).Where("token = ?", token).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return workspaceInviteModelToDomain(&m), nil
}

func (r *workspaceInviteRepository) DeleteByToken(ctx context.Context, token string) error {
	return r.db.WithContext(ctx).Where("token = ?", token).Delete(&model.WorkspaceInvite{}).Error
}
