package usecase

import (
	"context"
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

// --- mock repos ---

type mockFileRepo struct {
	files map[string]*domain.File
}

func newMockFileRepo() *mockFileRepo {
	return &mockFileRepo{files: make(map[string]*domain.File)}
}

func (m *mockFileRepo) Create(_ context.Context, f *domain.File) error {
	f.CreatedAt = time.Now()
	m.files[f.ID] = f
	return nil
}

func (m *mockFileRepo) FindByID(_ context.Context, id string) (*domain.File, error) {
	f, ok := m.files[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return f, nil
}

func (m *mockFileRepo) FindByIDs(_ context.Context, ids []string) ([]*domain.File, error) {
	var result []*domain.File
	for _, id := range ids {
		if f, ok := m.files[id]; ok {
			result = append(result, f)
		}
	}
	return result, nil
}

// --- mock storage ---

type mockObjectStorage struct {
	uploadURL   string
	downloadURL string
}

func (m *mockObjectStorage) GenerateUploadURL(_ context.Context, bucket, key, contentType string, expiry time.Duration) (string, error) {
	return m.uploadURL, nil
}

func (m *mockObjectStorage) GenerateDownloadURL(_ context.Context, bucket, key string, expiry time.Duration) (string, error) {
	return m.downloadURL, nil
}

func (m *mockObjectStorage) DeleteObject(_ context.Context, bucket, key string) error {
	return nil
}

func newFileUC() FileUsecase {
	return NewFileUsecase(newMockFileRepo(), &mockObjectStorage{
		uploadURL:   "http://storage/upload",
		downloadURL: "http://storage/download",
	}, "test-bucket")
}

// --- tests ---

func TestFileUsecase_CreateUploadSession(t *testing.T) {
	uc := newFileUC()
	file, uploadURL, expiresAt, err := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 1024,
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if file.FileName != "test.txt" {
		t.Errorf("expected 'test.txt', got %s", file.FileName)
	}
	if uploadURL != "http://storage/upload" {
		t.Errorf("expected upload URL, got %s", uploadURL)
	}
	if expiresAt.IsZero() {
		t.Error("expected non-zero expiresAt")
	}
}

func TestFileUsecase_CreateUploadSession_EmptyName(t *testing.T) {
	uc := newFileUC()
	_, _, _, err := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "", "text/plain", 1024,
	)
	if err == nil {
		t.Error("expected validation error for empty file name")
	}
}

func TestFileUsecase_CreateUploadSession_TooLarge(t *testing.T) {
	uc := newFileUC()
	_, _, _, err := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "huge.bin", "application/octet-stream", domain.MaxFileSize+1,
	)
	if err == nil {
		t.Error("expected validation error for file too large")
	}
}

func TestFileUsecase_CompleteUpload(t *testing.T) {
	uc := newFileUC()
	file, _, _, _ := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 100,
	)
	completed, err := uc.CompleteUpload(context.Background(), "user-1", file.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if completed.ID != file.ID {
		t.Errorf("expected file ID %s, got %s", file.ID, completed.ID)
	}
}

func TestFileUsecase_CompleteUpload_Forbidden(t *testing.T) {
	uc := newFileUC()
	file, _, _, _ := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 100,
	)
	_, err := uc.CompleteUpload(context.Background(), "user-2", file.ID)
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestFileUsecase_AbortUpload(t *testing.T) {
	uc := newFileUC()
	file, _, _, _ := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 100,
	)
	err := uc.AbortUpload(context.Background(), "user-1", file.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestFileUsecase_AbortUpload_Forbidden(t *testing.T) {
	uc := newFileUC()
	file, _, _, _ := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 100,
	)
	err := uc.AbortUpload(context.Background(), "user-2", file.ID)
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestFileUsecase_GetDownloadURL(t *testing.T) {
	uc := newFileUC()
	file, _, _, _ := uc.CreateUploadSession(
		context.Background(), "user-1", "ws-1", "test.txt", "text/plain", 100,
	)
	downloadURL, expiresAt, err := uc.GetDownloadURL(context.Background(), file.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if downloadURL != "http://storage/download" {
		t.Errorf("expected download URL, got %s", downloadURL)
	}
	if expiresAt.IsZero() {
		t.Error("expected non-zero expiresAt")
	}
}

func TestFileUsecase_GetDownloadURL_NotFound(t *testing.T) {
	uc := newFileUC()
	_, _, err := uc.GetDownloadURL(context.Background(), "nonexistent")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
