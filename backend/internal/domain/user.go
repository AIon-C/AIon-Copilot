package domain

import (
	"context"
	"net/mail"
	"time"
	"unicode/utf8"
)

type User struct {
	ID           string
	Email        string
	DisplayName  string
	AvatarURL    string
	PasswordHash string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}

func (u *User) Validate() error {
	if _, err := mail.ParseAddress(u.Email); err != nil {
		return &ValidationError{Field: "email", Message: "invalid email format"}
	}
	nameLen := utf8.RuneCountInString(u.DisplayName)
	if nameLen == 0 || nameLen > 100 {
		return &ValidationError{Field: "display_name", Message: "must be 1-100 characters"}
	}
	return nil
}

func ValidatePassword(password string) error {
	if len(password) < 8 {
		return &ValidationError{Field: "password", Message: "must be at least 8 characters"}
	}
	if len(password) > 128 {
		return &ValidationError{Field: "password", Message: "must be at most 128 characters"}
	}
	return nil
}

type UserRepository interface {
	FindByID(ctx context.Context, id string) (*User, error)
	FindByEmail(ctx context.Context, email string) (*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
}
