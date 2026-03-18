package handler

import (
	"context"

	"connectrpc.com/connect"

	userv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/user/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type userHandler struct {
	uc usecase.UserUsecase
}

func NewUserHandler(uc usecase.UserUsecase) *userHandler {
	return &userHandler{uc: uc}
}

func (h *userHandler) GetMe(ctx context.Context, _ *userv1.GetMeRequest) (*userv1.GetMeResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	user, err := h.uc.GetMe(ctx, userID)
	if err != nil {
		return nil, toConnectError(err)
	}
	return &userv1.GetMeResponse{User: userToProto(user)}, nil
}

func (h *userHandler) UpdateProfile(ctx context.Context, req *userv1.UpdateProfileRequest) (*userv1.UpdateProfileResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	fields := make(map[string]string)
	if req.GetUpdateMask() != nil {
		for _, path := range req.GetUpdateMask().GetPaths() {
			switch path {
			case "display_name":
				fields["display_name"] = req.GetUser().GetDisplayName()
			case "avatar_url":
				fields["avatar_url"] = req.GetUser().GetAvatarUrl()
			}
		}
	}

	user, err := h.uc.UpdateProfile(ctx, userID, fields)
	if err != nil {
		return nil, toConnectError(err)
	}
	return &userv1.UpdateProfileResponse{User: userToProto(user)}, nil
}

func (h *userHandler) ChangePassword(ctx context.Context, req *userv1.ChangePasswordRequest) (*userv1.ChangePasswordResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.ChangePassword(ctx, userID, req.GetCurrentPassword(), req.GetNewPassword()); err != nil {
		return nil, toConnectError(err)
	}
	return &userv1.ChangePasswordResponse{}, nil
}
