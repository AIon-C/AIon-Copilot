package auth

import (
	"context"
	"testing"
)

func TestContextUserID(t *testing.T) {
	ctx := WithUserID(context.Background(), "user-1234")

	got, ok := UserIDFromContext(ctx)
	if !ok {
		t.Fatal("expected user id in context")
	}
	if got != "user-1234" {
		t.Fatalf("unexpected user id: got %s", got)
	}
}
