package persistence

import (
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

func userModelToDomain(m *model.User) *domain.User {
	if m == nil {
		return nil
	}
	u := &domain.User{
		ID:           m.ID,
		Email:        m.Email,
		DisplayName:  m.DisplayName,
		AvatarURL:    m.AvatarURL,
		PasswordHash: m.PasswordHash,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		u.DeletedAt = &t
	}
	return u
}

func userDomainToModel(u *domain.User) *model.User {
	if u == nil {
		return nil
	}
	return &model.User{
		ID:           u.ID,
		Email:        u.Email,
		DisplayName:  u.DisplayName,
		AvatarURL:    u.AvatarURL,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func refreshTokenModelToDomain(m *model.RefreshToken) *domain.RefreshToken {
	if m == nil {
		return nil
	}
	return &domain.RefreshToken{
		ID:        m.ID,
		UserID:    m.UserID,
		Token:     m.Token,
		ExpiresAt: m.ExpiresAt,
		CreatedAt: m.CreatedAt,
	}
}

func refreshTokenDomainToModel(rt *domain.RefreshToken) *model.RefreshToken {
	if rt == nil {
		return nil
	}
	return &model.RefreshToken{
		ID:        rt.ID,
		UserID:    rt.UserID,
		Token:     rt.Token,
		ExpiresAt: rt.ExpiresAt,
		CreatedAt: rt.CreatedAt,
	}
}

func nowUTC() time.Time {
	return time.Now().UTC()
}
