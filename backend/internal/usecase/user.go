package usecase

import (
	"context"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type UserUsecase interface {
	GetMe(ctx context.Context, userID string) (*domain.User, error)
	UpdateProfile(ctx context.Context, userID string, fields map[string]string) (*domain.User, error)
	ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error
}

type userUsecase struct {
	userRepo domain.UserRepository
}

func NewUserUsecase(userRepo domain.UserRepository) UserUsecase {
	return &userUsecase{userRepo: userRepo}
}

func (uc *userUsecase) GetMe(ctx context.Context, userID string) (*domain.User, error) {
	return uc.userRepo.FindByID(ctx, userID)
}

func (uc *userUsecase) UpdateProfile(ctx context.Context, userID string, fields map[string]string) (*domain.User, error) {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	for k, v := range fields {
		switch k {
		case "display_name":
			user.DisplayName = v
		case "avatar_url":
			user.AvatarURL = v
		}
	}

	if err := user.Validate(); err != nil {
		return nil, err
	}

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *userUsecase) ChangePassword(ctx context.Context, userID, currentPassword, newPassword string) error {
	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return err
	}

	if err := auth.VerifyPassword(user.PasswordHash, currentPassword); err != nil {
		return domain.ErrUnauthorized
	}

	if err := domain.ValidatePassword(newPassword); err != nil {
		return err
	}

	hashed, err := auth.HashPassword(newPassword)
	if err != nil {
		return err
	}

	user.PasswordHash = hashed
	return uc.userRepo.Update(ctx, user)
}
