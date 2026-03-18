package handler

import (
	"errors"
	"fmt"
	"testing"

	"connectrpc.com/connect"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

func TestToConnectError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantCode connect.Code
	}{
		{"nil error", nil, 0},
		{"ErrNotFound", domain.ErrNotFound, connect.CodeNotFound},
		{"ErrAlreadyExists", domain.ErrAlreadyExists, connect.CodeAlreadyExists},
		{"ErrUnauthorized", domain.ErrUnauthorized, connect.CodeUnauthenticated},
		{"ErrForbidden", domain.ErrForbidden, connect.CodePermissionDenied},
		{"ErrInvalidInput", domain.ErrInvalidInput, connect.CodeInvalidArgument},
		{"ErrConflict", domain.ErrConflict, connect.CodeAlreadyExists},
		{"ValidationError", &domain.ValidationError{Field: "name", Message: "required"}, connect.CodeInvalidArgument},
		{"unknown error", errors.New("something went wrong"), connect.CodeInternal},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := toConnectError(tt.err)
			if tt.err == nil {
				if got != nil {
					t.Errorf("toConnectError(nil) = %v, want nil", got)
				}
				return
			}
			if got == nil {
				t.Fatal("toConnectError() returned nil for non-nil error")
			}
			if got.Code() != tt.wantCode {
				t.Errorf("toConnectError(%v).Code() = %v, want %v", tt.err, got.Code(), tt.wantCode)
			}
		})
	}
}

func TestToConnectError_WrappedErrors(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		wantCode connect.Code
	}{
		{"wrapped ErrNotFound", fmt.Errorf("user lookup: %w", domain.ErrNotFound), connect.CodeNotFound},
		{"wrapped ErrAlreadyExists", fmt.Errorf("create: %w", domain.ErrAlreadyExists), connect.CodeAlreadyExists},
		{"wrapped ErrUnauthorized", fmt.Errorf("auth: %w", domain.ErrUnauthorized), connect.CodeUnauthenticated},
		{"wrapped ErrForbidden", fmt.Errorf("perm: %w", domain.ErrForbidden), connect.CodePermissionDenied},
		{"wrapped ErrInvalidInput", fmt.Errorf("validate: %w", domain.ErrInvalidInput), connect.CodeInvalidArgument},
		{"wrapped ErrConflict", fmt.Errorf("update: %w", domain.ErrConflict), connect.CodeAlreadyExists},
		{"wrapped ValidationError", fmt.Errorf("validate: %w", &domain.ValidationError{Field: "email", Message: "invalid"}), connect.CodeInvalidArgument},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := toConnectError(tt.err)
			if got == nil {
				t.Fatal("toConnectError() returned nil")
			}
			if got.Code() != tt.wantCode {
				t.Errorf("toConnectError(%v).Code() = %v, want %v", tt.err, got.Code(), tt.wantCode)
			}
		})
	}
}
