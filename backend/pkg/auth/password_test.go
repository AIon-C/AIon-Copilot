package auth

import "testing"

func TestHashVerifyPassword(t *testing.T) {
	hash, err := HashPassword("passw0rd")
	if err != nil {
		t.Fatalf("HashPassword error: %v", err)
	}

	if err := VerifyPassword(hash, "passw0rd"); err != nil {
		t.Fatalf("VerifyPassword error = %v", err)
	}

	if err := VerifyPassword(hash, "not-passw0rd"); err == nil {
		t.Fatal("expected error, got nil")
	}
}
