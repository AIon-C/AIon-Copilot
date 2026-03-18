package handler

import (
	"context"

	"connectrpc.com/connect"

	filev1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/file/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type fileHandler struct {
	uc usecase.FileUsecase
}

func NewFileHandler(uc usecase.FileUsecase) *fileHandler {
	return &fileHandler{uc: uc}
}

func (h *fileHandler) CreateUploadSession(ctx context.Context, req *filev1.CreateUploadSessionRequest) (*filev1.CreateUploadSessionResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	file, uploadURL, expiresAt, err := h.uc.CreateUploadSession(
		ctx, userID, req.GetWorkspaceId(),
		req.GetFileName(), req.GetContentType(), req.GetFileSize(),
	)
	if err != nil {
		return nil, toConnectError(err)
	}
	return &filev1.CreateUploadSessionResponse{
		FileId:    file.ID,
		UploadUrl: uploadURL,
		ExpiresAt: toTimestamppb(expiresAt),
	}, nil
}

func (h *fileHandler) CompleteUpload(ctx context.Context, req *filev1.CompleteUploadRequest) (*filev1.CompleteUploadResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	file, err := h.uc.CompleteUpload(ctx, userID, req.GetFileId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &filev1.CompleteUploadResponse{File: fileToProto(file)}, nil
}

func (h *fileHandler) AbortUpload(ctx context.Context, req *filev1.AbortUploadRequest) (*filev1.AbortUploadResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.AbortUpload(ctx, userID, req.GetFileId()); err != nil {
		return nil, toConnectError(err)
	}
	return &filev1.AbortUploadResponse{}, nil
}

func (h *fileHandler) GetDownloadUrl(ctx context.Context, req *filev1.GetDownloadUrlRequest) (*filev1.GetDownloadUrlResponse, error) {
	if _, ok := auth.UserIDFromContext(ctx); !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	downloadURL, expiresAt, err := h.uc.GetDownloadURL(ctx, req.GetFileId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &filev1.GetDownloadUrlResponse{
		DownloadUrl: downloadURL,
		ExpiresAt:   toTimestamppb(expiresAt),
	}, nil
}
