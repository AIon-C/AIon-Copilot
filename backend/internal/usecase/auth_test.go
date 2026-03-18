package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

// --- mock repositories ---

type mockUserRepo struct {
	users   map[string]*domain.User
	byEmail map[string]*domain.User
	createErr error
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		users:   make(map[string]*domain.User),
		byEmail: make(map[string]*domain.User),
	}
}

func (m *mockUserRepo) FindByID(_ context.Context, id string) (*domain.User, error) {
	u, ok := m.users[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return u, nil
}

func (m *mockUserRepo) FindByEmail(_ context.Context, email string) (*domain.User, error) {
	u, ok := m.byEmail[email]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return u, nil
}

func (m *mockUserRepo) Create(_ context.Context, user *domain.User) error {
	if m.createErr != nil {
		return m.createErr
	}
	if _, exists := m.byEmail[user.Email]; exists {
		return domain.ErrAlreadyExists
	}
	now := time.Now()
	user.CreatedAt = now
	user.UpdatedAt = now
	m.users[user.ID] = user
	m.byEmail[user.Email] = user
	return nil
}

func (m *mockUserRepo) Update(_ context.Context, user *domain.User) error {
	user.UpdatedAt = time.Now()
	m.users[user.ID] = user
	m.byEmail[user.Email] = user
	return nil
}

type mockRefreshTokenRepo struct {
	tokens    map[string]*domain.RefreshToken // keyed by token string
	byUserID  map[string][]*domain.RefreshToken
}

func newMockRefreshTokenRepo() *mockRefreshTokenRepo {
	return &mockRefreshTokenRepo{
		tokens:   make(map[string]*domain.RefreshToken),
		byUserID: make(map[string][]*domain.RefreshToken),
	}
}

func (m *mockRefreshTokenRepo) Create(_ context.Context, token *domain.RefreshToken) error {
	token.CreatedAt = time.Now()
	m.tokens[token.Token] = token
	m.byUserID[token.UserID] = append(m.byUserID[token.UserID], token)
	return nil
}

func (m *mockRefreshTokenRepo) FindByToken(_ context.Context, token string) (*domain.RefreshToken, error) {
	rt, ok := m.tokens[token]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return rt, nil
}

func (m *mockRefreshTokenRepo) DeleteByUserID(_ context.Context, userID string) error {
	for _, rt := range m.byUserID[userID] {
		delete(m.tokens, rt.Token)
	}
	delete(m.byUserID, userID)
	return nil
}

func (m *mockRefreshTokenRepo) DeleteByToken(_ context.Context, token string) error {
	rt, ok := m.tokens[token]
	if ok {
		tokens := m.byUserID[rt.UserID]
		for i, t := range tokens {
			if t.Token == token {
				m.byUserID[rt.UserID] = append(tokens[:i], tokens[i+1:]...)
				break
			}
		}
		delete(m.tokens, token)
	}
	return nil
}

// --- helpers ---

func newTestJWT(t *testing.T) *auth.JWTManager {
	t.Helper()
	jwt, err := auth.NewJWTManager("test-secret-key-32chars-long!!", "chatapp")
	if err != nil {
		t.Fatal(err)
	}
	return jwt
}

func seedUser(t *testing.T, repo *mockUserRepo, email, password string) *domain.User {
	t.Helper()
	hashed, err := auth.HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	u := &domain.User{
		ID:           "user-123",
		Email:        email,
		DisplayName:  "Test User",
		PasswordHash: hashed,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	repo.users[u.ID] = u
	repo.byEmail[u.Email] = u
	return u
}

// --- tests ---

func TestAuthUsecase_SignUp_Success(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	uc := NewAuthUsecase(userRepo, rtRepo, newTestJWT(t))

	user, tp, err := uc.SignUp(context.Background(), "test@example.com", "password123", "Test User")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
	if tp.AccessToken == "" || tp.RefreshToken == "" {
		t.Error("expected token pair to be populated")
	}
}

func TestAuthUsecase_SignUp_DuplicateEmail(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	uc := NewAuthUsecase(userRepo, rtRepo, newTestJWT(t))

	_, _, err := uc.SignUp(context.Background(), "test@example.com", "password123", "Test User")
	if err != nil {
		t.Fatalf("first signup failed: %v", err)
	}

	_, _, err = uc.SignUp(context.Background(), "test@example.com", "password456", "Other User")
	if err != domain.ErrAlreadyExists {
		t.Errorf("expected ErrAlreadyExists, got %v", err)
	}
}

func TestAuthUsecase_SignUp_InvalidPassword(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	uc := NewAuthUsecase(userRepo, rtRepo, newTestJWT(t))

	_, _, err := uc.SignUp(context.Background(), "test@example.com", "short", "Test User")
	if err == nil {
		t.Error("expected error for short password")
	}
}

func TestAuthUsecase_LogIn_Success(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	jwt := newTestJWT(t)
	uc := NewAuthUsecase(userRepo, rtRepo, jwt)

	seedUser(t, userRepo, "test@example.com", "password123")

	user, tp, err := uc.LogIn(context.Background(), "test@example.com", "password123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
	if tp.AccessToken == "" {
		t.Error("expected access token")
	}
}

func TestAuthUsecase_LogIn_WrongPassword(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	uc := NewAuthUsecase(userRepo, rtRepo, newTestJWT(t))

	seedUser(t, userRepo, "test@example.com", "password123")

	_, _, err := uc.LogIn(context.Background(), "test@example.com", "wrongpassword")
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestAuthUsecase_LogIn_NonExistentEmail(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	uc := NewAuthUsecase(userRepo, rtRepo, newTestJWT(t))

	_, _, err := uc.LogIn(context.Background(), "nobody@example.com", "password123")
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}

func TestAuthUsecase_Logout(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	jwt := newTestJWT(t)
	uc := NewAuthUsecase(userRepo, rtRepo, jwt)

	seedUser(t, userRepo, "test@example.com", "password123")
	_, _, _ = uc.LogIn(context.Background(), "test@example.com", "password123")

	err := uc.Logout(context.Background(), "user-123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(rtRepo.byUserID["user-123"]) != 0 {
		t.Error("expected all refresh tokens to be deleted")
	}
}

func TestAuthUsecase_RefreshToken_Success(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	jwt := newTestJWT(t)
	uc := NewAuthUsecase(userRepo, rtRepo, jwt)

	seedUser(t, userRepo, "test@example.com", "password123")
	_, tp, _ := uc.LogIn(context.Background(), "test@example.com", "password123")

	newTP, err := uc.RefreshToken(context.Background(), tp.RefreshToken)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if newTP.AccessToken == "" || newTP.RefreshToken == "" {
		t.Error("expected new token pair")
	}
	// Verify old token was deleted from store
	if _, err := rtRepo.FindByToken(context.Background(), tp.RefreshToken); err != domain.ErrNotFound {
		t.Error("expected old refresh token to be deleted after rotation")
	}
}

func TestAuthUsecase_RefreshToken_Expired(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	jwt := newTestJWT(t)
	uc := NewAuthUsecase(userRepo, rtRepo, jwt)

	// Manually create an expired refresh token
	refreshJWT, _ := jwt.GenerateRefreshToken("user-123")
	rt := &domain.RefreshToken{
		ID:        "rt-1",
		UserID:    "user-123",
		Token:     refreshJWT,
		ExpiresAt: time.Now().Add(-1 * time.Hour), // expired
	}
	_ = rtRepo.Create(context.Background(), rt)

	_, err := uc.RefreshToken(context.Background(), refreshJWT)
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized for expired token, got %v", err)
	}
}

func TestAuthUsecase_RefreshToken_NotFound(t *testing.T) {
	userRepo := newMockUserRepo()
	rtRepo := newMockRefreshTokenRepo()
	jwt := newTestJWT(t)
	uc := NewAuthUsecase(userRepo, rtRepo, jwt)

	_, err := uc.RefreshToken(context.Background(), "nonexistent-token")
	if err != domain.ErrUnauthorized {
		t.Errorf("expected ErrUnauthorized, got %v", err)
	}
}
