package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/external"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

const (
	uploadURLExpiry   = 15 * time.Minute
	downloadURLExpiry = 1 * time.Hour
)

type FileUsecase interface {
	CreateUploadSession(ctx context.Context, userID, workspaceID, fileName, contentType string, fileSize int64) (*domain.File, string, time.Time, error)
	CompleteUpload(ctx context.Context, userID, fileID string) (*domain.File, error)
	AbortUpload(ctx context.Context, userID, fileID string) error
	GetDownloadURL(ctx context.Context, fileID string) (string, time.Time, error)
}

type fileUsecase struct {
	fileRepo domain.FileRepository
	storage  external.ObjectStorage
	bucket   string
}

func NewFileUsecase(fileRepo domain.FileRepository, storage external.ObjectStorage, bucket string) FileUsecase {
	return &fileUsecase{
		fileRepo: fileRepo,
		storage:  storage,
		bucket:   bucket,
	}
}

func (uc *fileUsecase) CreateUploadSession(ctx context.Context, userID, workspaceID, fileName, contentType string, fileSize int64) (*domain.File, string, time.Time, error) {
	fileID := ulid.NewID()
	fileKey := fmt.Sprintf("workspaces/%s/files/%s/%s", workspaceID, fileID, fileName)

	file := &domain.File{
		ID:          fileID,
		WorkspaceID: workspaceID,
		UploadedBy:  userID,
		FileName:    fileName,
		FileKey:     fileKey,
		ContentType: contentType,
		FileSize:    fileSize,
	}
	if err := file.Validate(); err != nil {
		return nil, "", time.Time{}, err
	}

	if err := uc.fileRepo.Create(ctx, file); err != nil {
		return nil, "", time.Time{}, err
	}

	uploadURL, err := uc.storage.GenerateUploadURL(ctx, uc.bucket, fileKey, contentType, uploadURLExpiry)
	if err != nil {
		return nil, "", time.Time{}, fmt.Errorf("generate upload URL: %w", err)
	}

	expiresAt := time.Now().Add(uploadURLExpiry)
	return file, uploadURL, expiresAt, nil
}

func (uc *fileUsecase) CompleteUpload(ctx context.Context, userID, fileID string) (*domain.File, error) {
	file, err := uc.fileRepo.FindByID(ctx, fileID)
	if err != nil {
		return nil, err
	}
	if file.UploadedBy != userID {
		return nil, domain.ErrForbidden
	}
	return file, nil
}

func (uc *fileUsecase) AbortUpload(ctx context.Context, userID, fileID string) error {
	file, err := uc.fileRepo.FindByID(ctx, fileID)
	if err != nil {
		return err
	}
	if file.UploadedBy != userID {
		return domain.ErrForbidden
	}
	_ = uc.storage.DeleteObject(ctx, uc.bucket, file.FileKey)
	return nil
}

func (uc *fileUsecase) GetDownloadURL(ctx context.Context, fileID string) (string, time.Time, error) {
	file, err := uc.fileRepo.FindByID(ctx, fileID)
	if err != nil {
		return "", time.Time{}, err
	}

	downloadURL, err := uc.storage.GenerateDownloadURL(ctx, uc.bucket, file.FileKey, downloadURLExpiry)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("generate download URL: %w", err)
	}

	expiresAt := time.Now().Add(downloadURLExpiry)
	return downloadURL, expiresAt, nil
}
