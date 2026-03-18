package usecase

import (
	"context"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

type AuthUsecase interface {
	SignUp(ctx context.Context, email, password, displayName string) (*domain.User, *domain.TokenPair, error)
	LogIn(ctx context.Context, email, password string) (*domain.User, *domain.TokenPair, error)
	Logout(ctx context.Context, userID string) error
	RefreshToken(ctx context.Context, refreshToken string) (*domain.TokenPair, error)
}

type authUsecase struct {
	userRepo         domain.UserRepository
	refreshTokenRepo domain.RefreshTokenRepository
	jwt              *auth.JWTManager
}

func NewAuthUsecase(
	userRepo domain.UserRepository,
	refreshTokenRepo domain.RefreshTokenRepository,
	jwt *auth.JWTManager,
) AuthUsecase {
	return &authUsecase{
		userRepo:         userRepo,
		refreshTokenRepo: refreshTokenRepo,
		jwt:              jwt,
	}
}

func (uc *authUsecase) SignUp(ctx context.Context, email, password, displayName string) (*domain.User, *domain.TokenPair, error) {
	if err := domain.ValidatePassword(password); err != nil {
		return nil, nil, err
	}

	hashed, err := auth.HashPassword(password)
	if err != nil {
		return nil, nil, err
	}

	user := &domain.User{
		ID:           ulid.NewID(),
		Email:        email,
		DisplayName:  displayName,
		PasswordHash: hashed,
	}
	if err := user.Validate(); err != nil {
		return nil, nil, err
	}

	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, nil, err
	}

	tp, err := uc.generateTokenPair(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	return user, tp, nil
}

func (uc *authUsecase) LogIn(ctx context.Context, email, password string) (*domain.User, *domain.TokenPair, error) {
	user, err := uc.userRepo.FindByEmail(ctx, email)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, nil, domain.ErrUnauthorized
		}
		return nil, nil, err
	}

	if err := auth.VerifyPassword(user.PasswordHash, password); err != nil {
		return nil, nil, domain.ErrUnauthorized
	}

	// Delete existing refresh tokens for this user
	_ = uc.refreshTokenRepo.DeleteByUserID(ctx, user.ID)

	tp, err := uc.generateTokenPair(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}

	return user, tp, nil
}

func (uc *authUsecase) Logout(ctx context.Context, userID string) error {
	return uc.refreshTokenRepo.DeleteByUserID(ctx, userID)
}

func (uc *authUsecase) RefreshToken(ctx context.Context, refreshToken string) (*domain.TokenPair, error) {
	rt, err := uc.refreshTokenRepo.FindByToken(ctx, refreshToken)
	if err != nil {
		if err == domain.ErrNotFound {
			return nil, domain.ErrUnauthorized
		}
		return nil, err
	}

	if time.Now().After(rt.ExpiresAt) {
		_ = uc.refreshTokenRepo.DeleteByToken(ctx, refreshToken)
		return nil, domain.ErrUnauthorized
	}

	// Verify the JWT refresh token
	claims, err := uc.jwt.VerifyRefreshToken(refreshToken)
	if err != nil {
		_ = uc.refreshTokenRepo.DeleteByToken(ctx, refreshToken)
		return nil, domain.ErrUnauthorized
	}

	// Token rotation: delete old, create new
	_ = uc.refreshTokenRepo.DeleteByToken(ctx, refreshToken)

	tp, err := uc.generateTokenPair(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}

	return tp, nil
}

func (uc *authUsecase) generateTokenPair(ctx context.Context, userID string) (*domain.TokenPair, error) {
	accessToken, err := uc.jwt.GenerateAccessToken(userID)
	if err != nil {
		return nil, err
	}

	refreshJWT, err := uc.jwt.GenerateRefreshToken(userID)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(auth.DefaultRefreshTTL)

	rt := &domain.RefreshToken{
		ID:        ulid.NewID(),
		UserID:    userID,
		Token:     refreshJWT,
		ExpiresAt: expiresAt,
	}
	if err := uc.refreshTokenRepo.Create(ctx, rt); err != nil {
		return nil, err
	}

	return &domain.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshJWT,
		ExpiresAt:    expiresAt,
	}, nil
}
