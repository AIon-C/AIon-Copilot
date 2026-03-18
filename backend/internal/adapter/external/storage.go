package external

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/storage"
)

// ObjectStorage abstracts cloud storage operations.
type ObjectStorage interface {
	GenerateUploadURL(ctx context.Context, bucket, key, contentType string, expiry time.Duration) (string, error)
	GenerateDownloadURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error)
	DeleteObject(ctx context.Context, bucket, key string) error
}

type gcsStorage struct {
	client    *storage.Client
	endpoint  string // internal endpoint (container-to-container)
	publicURL string // public endpoint (client-facing, e.g. localhost:4443)
}

func NewGCSStorage(client *storage.Client, endpoint, publicURL string) ObjectStorage {
	return &gcsStorage{client: client, endpoint: endpoint, publicURL: publicURL}
}

func (s *gcsStorage) GenerateUploadURL(ctx context.Context, bucket, key, contentType string, expiry time.Duration) (string, error) {
	if s.publicURL != "" {
		return fmt.Sprintf("%s/upload/storage/v1/b/%s/o?uploadType=media&name=%s", s.publicURL, bucket, key), nil
	}
	opts := &storage.SignedURLOptions{
		Method:      "PUT",
		ContentType: contentType,
		Expires:     time.Now().Add(expiry),
	}
	return s.client.Bucket(bucket).SignedURL(key, opts)
}

func (s *gcsStorage) GenerateDownloadURL(ctx context.Context, bucket, key string, expiry time.Duration) (string, error) {
	if s.publicURL != "" {
		return fmt.Sprintf("%s/storage/v1/b/%s/o/%s?alt=media", s.publicURL, bucket, key), nil
	}
	opts := &storage.SignedURLOptions{
		Method:  "GET",
		Expires: time.Now().Add(expiry),
	}
	return s.client.Bucket(bucket).SignedURL(key, opts)
}

func (s *gcsStorage) DeleteObject(ctx context.Context, bucket, key string) error {
	return s.client.Bucket(bucket).Object(key).Delete(ctx)
}
