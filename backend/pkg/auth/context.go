package auth

import "context"

type contextKey string

const userIDContextKey contextKey = "auth_user_id"

func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDContextKey, userID)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(userIDContextKey).(string)
	if !ok || v == "" {
		return "", false
	}
	return v, true
}
