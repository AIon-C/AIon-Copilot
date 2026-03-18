package handler

import (
	"errors"

	"connectrpc.com/connect"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

func toConnectError(err error) *connect.Error {
	if err == nil {
		return nil
	}

	var ve *domain.ValidationError
	if errors.As(err, &ve) {
		return connect.NewError(connect.CodeInvalidArgument, err)
	}

	switch {
	case errors.Is(err, domain.ErrNotFound):
		return connect.NewError(connect.CodeNotFound, err)
	case errors.Is(err, domain.ErrAlreadyExists):
		return connect.NewError(connect.CodeAlreadyExists, err)
	case errors.Is(err, domain.ErrUnauthorized):
		return connect.NewError(connect.CodeUnauthenticated, err)
	case errors.Is(err, domain.ErrForbidden):
		return connect.NewError(connect.CodePermissionDenied, err)
	case errors.Is(err, domain.ErrInvalidInput):
		return connect.NewError(connect.CodeInvalidArgument, err)
	case errors.Is(err, domain.ErrConflict):
		return connect.NewError(connect.CodeAlreadyExists, err)
	default:
		return connect.NewError(connect.CodeInternal, err)
	}
}
