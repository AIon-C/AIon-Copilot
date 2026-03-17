package auth

import "testing"

func TestJWT_GenerateAndVerifyAccessToken(t *testing.T) {
	m, err := NewJWTManager("test-secret", "chatapp")
	if err != nil {
		t.Fatalf("NewJWTManager error = %v", err)
	}
	token, err := m.GenerateAccessToken("user-1234")
	if err != nil {
		t.Fatalf("GenerateAccessToken error = %v", err)
	}

	claims, err := m.VerifyAccessToken(token)
	if err != nil {
		t.Fatalf("VerifyAccessToken error = %v", err)
	}

	if claims.UserID != "user-1234" {
		t.Fatalf("unexpected user id: got %s", claims.UserID)
	}

	if claims.TokenType != TokenTypeAccess {
		t.Fatalf("unexpected token type: got %s", claims.TokenType)
	}
}

func TestJWT_RefreshTokenCannotBeVerifiedAsAccess(t *testing.T) {
	m, err := NewJWTManager("test-secret", "chatapp")
	if err != nil {
		t.Fatalf("NewJWTManager error = %v", err)
	}

	token, err := m.GenerateRefreshToken("user-1234")
	if err != nil {
		t.Fatalf("GenerateRefreshToken error = %v", err)
	}

	if _, err := m.VerifyAccessToken(token); err == nil {
		t.Fatal("expected error: got nil")
	}
}

func TestJWT_RefreshTokenCanBeVerifiedAsRefresh(t *testing.T) {
	m, err := NewJWTManager("test-secret", "chatapp")
	if err != nil {
		t.Fatalf("NewJWTManager error = %v", err)
	}

	token, err := m.GenerateRefreshToken("user-1234")
	if err != nil {
		t.Fatalf("GenerateRefreshToken error = %v", err)
	}

	claims, err := m.VerifyRefreshToken(token)
	if err != nil {
		t.Fatalf("VerifyRefreshToken error = %v", err)
	}

	if claims.TokenType != TokenTypeRefresh {
		t.Fatalf("unexpected token type: got %s", claims.TokenType)
	}
}
