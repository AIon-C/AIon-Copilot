package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

func seedTestUser(t *testing.T, repo *mockUserRepo) *domain.User {
	t.Helper()
	hashed, _ := auth.HashPassword("password123")
	u := &domain.User{
		ID:           "user-456",
		Email:        "test@example.com",
		DisplayName:  "Test User",
		AvatarURL:    "",
		PasswordHash: hashed,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	repo.users[u.ID] = u
	repo.byEmail[u.Email] = u
	return u
}

func TestUserUsecase_GetMe_Success(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	user, err := uc.GetMe(context.Background(), "user-456")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected test@example.com, got %s", user.Email)
	}
}

func TestUserUsecase_GetMe_NotFound(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)

	_, err := uc.GetMe(context.Background(), "nonexistent")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestUserUsecase_UpdateProfile_DisplayName(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	user, err := uc.UpdateProfile(context.Background(), "user-456", map[string]string{
		"display_name": "New Name",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.DisplayName != "New Name" {
		t.Errorf("expected 'New Name', got %s", user.DisplayName)
	}
}

func TestUserUsecase_UpdateProfile_AvatarURL(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	user, err := uc.UpdateProfile(context.Background(), "user-456", map[string]string{
		"avatar_url": "https://example.com/avatar.png",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.AvatarURL != "https://example.com/avatar.png" {
		t.Errorf("expected avatar URL to be updated")
	}
}

func TestUserUsecase_UpdateProfile_InvalidDisplayName(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	_, err := uc.UpdateProfile(context.Background(), "user-456", map[string]string{
		"display_name": "",
	})
	if err == nil {
		t.Error("expected validation error for empty display name")
	}
}

func TestUserUsecase_ChangePassword_Success(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	err := uc.ChangePassword(context.Background(), "user-456", "password123", "newpassword456")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Verify new password works
	user := repo.users["user-456"]
	if err := auth.VerifyPassword(user.PasswordHash, "newpassword456"); err != nil {
		t.Error("new password should verify successfully")
	}
}

func TestUserUsecase_ChangePassword_WrongCurrent(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	err := uc.ChangePassword(context.Background(), "user-456", "wrongpassword", "newpassword456")
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestUserUsecase_ChangePassword_InvalidNew(t *testing.T) {
	repo := newMockUserRepo()
	uc := NewUserUsecase(repo)
	seedTestUser(t, repo)

	err := uc.ChangePassword(context.Background(), "user-456", "password123", "short")
	if err == nil {
		t.Error("expected validation error for short new password")
	}
}
