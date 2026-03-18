package handler

import (
	"context"
	"errors"

	"connectrpc.com/connect"

	authv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/auth/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type authHandler struct {
	uc usecase.AuthUsecase
}

func NewAuthHandler(uc usecase.AuthUsecase) *authHandler {
	return &authHandler{uc: uc}
}

func (h *authHandler) SignUp(ctx context.Context, req *authv1.SignUpRequest) (*authv1.SignUpResponse, error) {
	user, tp, err := h.uc.SignUp(ctx, req.GetEmail(), req.GetPassword(), req.GetDisplayName())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &authv1.SignUpResponse{
		User:         userToProto(user),
		AccessToken:  tp.AccessToken,
		RefreshToken: tp.RefreshToken,
		ExpiresAt:    toTimestamppb(tp.ExpiresAt),
	}, nil
}

func (h *authHandler) LogIn(ctx context.Context, req *authv1.LogInRequest) (*authv1.LogInResponse, error) {
	user, tp, err := h.uc.LogIn(ctx, req.GetEmail(), req.GetPassword())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &authv1.LogInResponse{
		User:         userToProto(user),
		AccessToken:  tp.AccessToken,
		RefreshToken: tp.RefreshToken,
		ExpiresAt:    toTimestamppb(tp.ExpiresAt),
	}, nil
}

func (h *authHandler) Logout(ctx context.Context, _ *authv1.LogoutRequest) (*authv1.LogoutResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.Logout(ctx, userID); err != nil {
		return nil, toConnectError(err)
	}
	return &authv1.LogoutResponse{}, nil
}

func (h *authHandler) RefreshToken(ctx context.Context, req *authv1.RefreshTokenRequest) (*authv1.RefreshTokenResponse, error) {
	tp, err := h.uc.RefreshToken(ctx, req.GetRefreshToken())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &authv1.RefreshTokenResponse{
		AccessToken:  tp.AccessToken,
		RefreshToken: tp.RefreshToken,
		ExpiresAt:    toTimestamppb(tp.ExpiresAt),
	}, nil
}

func (h *authHandler) SendPasswordResetEmail(_ context.Context, _ *authv1.SendPasswordResetEmailRequest) (*authv1.SendPasswordResetEmailResponse, error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}

func (h *authHandler) ResetPassword(_ context.Context, _ *authv1.ResetPasswordRequest) (*authv1.ResetPasswordResponse, error) {
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}
