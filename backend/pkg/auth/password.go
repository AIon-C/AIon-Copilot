package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const DefaultBcryptCost = bcrypt.DefaultCost

func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password is required")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), DefaultBcryptCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}

func VerifyPassword(hashedPassword, password string) error {
	if hashedPassword == "" {
		return errors.New("hashedPassword is required")
	}
	if password == "" {
		return errors.New("password is required")
	}
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}
