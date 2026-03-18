package handler

import (
	"context"
	"strings"

	"connectrpc.com/connect"

	authv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/auth/v1/authv1connect"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

var publicProcedures = map[string]bool{
	authv1connect.AuthServiceSignUpProcedure:                 true,
	authv1connect.AuthServiceLogInProcedure:                  true,
	authv1connect.AuthServiceRefreshTokenProcedure:           true,
	authv1connect.AuthServiceSendPasswordResetEmailProcedure: true,
	authv1connect.AuthServiceResetPasswordProcedure:          true,
}

type authInterceptor struct {
	jwt *auth.JWTManager
}

func NewAuthInterceptor(jwt *auth.JWTManager) connect.Interceptor {
	return &authInterceptor{jwt: jwt}
}

func (i *authInterceptor) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		if publicProcedures[req.Spec().Procedure] {
			return next(ctx, req)
		}

		token := extractBearerToken(req.Header().Get("Authorization"))
		if token == "" {
			return nil, connect.NewError(connect.CodeUnauthenticated, nil)
		}

		claims, err := i.jwt.VerifyAccessToken(token)
		if err != nil {
			return nil, connect.NewError(connect.CodeUnauthenticated, nil)
		}

		ctx = auth.WithUserID(ctx, claims.UserID)
		return next(ctx, req)
	}
}

func (i *authInterceptor) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (i *authInterceptor) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}

func extractBearerToken(header string) string {
	if !strings.HasPrefix(header, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(header, "Bearer ")
}
