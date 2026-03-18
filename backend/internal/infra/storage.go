package infra

import (
	"context"
	"fmt"
	"net/http"

	"cloud.google.com/go/storage"
	"google.golang.org/api/option"
)

func NewStorageClient(ctx context.Context, endpoint string) (*storage.Client, error) {
	var opts []option.ClientOption

	if endpoint != "" {
		// Local fake-gcs-server: disable auth, use custom endpoint
		opts = append(opts,
			option.WithEndpoint(endpoint),
			option.WithoutAuthentication(),
			option.WithHTTPClient(&http.Client{}),
		)
	}

	client, err := storage.NewClient(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("create storage client: %w", err)
	}
	return client, nil
}
