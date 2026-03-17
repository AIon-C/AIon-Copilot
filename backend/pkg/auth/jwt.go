package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	DefaultAccessTTL  = 15 * time.Minute
	DefaultRefreshTTL = 7 * 24 * time.Hour
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type Claims struct {
	UserID    string    `json:"uid"`
	TokenType TokenType `json:"typ"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret     []byte
	issuer     string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewJWTManager(secret, issuer string) (*JWTManager, error) {
	if secret == "" {
		return nil, errors.New("secret is required")
	}
	if issuer == "" {
		return nil, errors.New("issuer is required")
	}

	return &JWTManager{
		secret:     []byte(secret),
		issuer:     issuer,
		accessTTL:  DefaultAccessTTL,
		refreshTTL: DefaultRefreshTTL,
	}, nil
}

func (m *JWTManager) GenerateAccessToken(userID string) (string, error) {
	return m.generateToken(userID, TokenTypeAccess, m.accessTTL)
}

func (m *JWTManager) GenerateRefreshToken(userID string) (string, error) {
	return m.generateToken(userID, TokenTypeRefresh, m.refreshTTL)
}

func (m *JWTManager) VerifyAccessToken(token string) (*Claims, error) {
	return m.verifyToken(token, TokenTypeAccess)
}

func (m *JWTManager) VerifyRefreshToken(token string) (*Claims, error) {
	return m.verifyToken(token, TokenTypeRefresh)
}

func (m *JWTManager) generateToken(userID string, tokenType TokenType, ttl time.Duration) (string, error) {
	if userID == "" {
		return "", errors.New("userID is required")
	}

	now := time.Now()
	claims := &Claims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    m.issuer,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *JWTManager) verifyToken(tokenString string, expectedType TokenType) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
		}
		return m.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Issuer != m.issuer {
		return nil, errors.New("invalid issuer")
	}
	if claims.UserID == "" {
		return nil, errors.New("missing user id")
	}
	if claims.TokenType != expectedType {
		return nil, fmt.Errorf("unexpected token type: %s", claims.TokenType)
	}

	return claims, nil
}
