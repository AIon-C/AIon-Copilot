package handler

import (
	"context"
	"errors"

	"connectrpc.com/connect"

	commonv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/common/v1"
	messagev1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/message/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type messageHandler struct {
	uc usecase.MessageUsecase
}

func NewMessageHandler(uc usecase.MessageUsecase) *messageHandler {
	return &messageHandler{uc: uc}
}

func (h *messageHandler) SendMessage(ctx context.Context, req *messagev1.SendMessageRequest) (*messagev1.SendMessageResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	var threadRootID *string
	if req.GetThreadRootId() != "" {
		s := req.GetThreadRootId()
		threadRootID = &s
	}

	msg, err := h.uc.SendMessage(ctx, userID, req.GetChannelId(), req.GetContent(), threadRootID, req.GetFileIds())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &messagev1.SendMessageResponse{Message: messageToProto(msg)}, nil
}

func (h *messageHandler) ListMessages(ctx context.Context, req *messagev1.ListMessagesRequest) (*messagev1.ListMessagesResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}

	cursor := req.GetPage().GetCursor()
	limit := int(req.GetPage().GetLimit())
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	msgs, nextCursor, prevCursor, hasMoreBefore, hasMoreAfter, err := h.uc.ListMessages(ctx, userID, req.GetChannelId(), cursor, limit)
	if err != nil {
		return nil, toConnectError(err)
	}

	resp := &messagev1.ListMessagesResponse{
		Page: &commonv1.CursorResponse{
			NextCursor:    nextCursor,
			PrevCursor:    prevCursor,
			HasMoreBefore: hasMoreBefore,
			HasMoreAfter:  hasMoreAfter,
		},
	}
	for _, msg := range msgs {
		resp.Messages = append(resp.Messages, messageToProto(msg))
	}
	return resp, nil
}

func (h *messageHandler) GetMessage(ctx context.Context, req *messagev1.GetMessageRequest) (*messagev1.GetMessageResponse, error) {
	msg, err := h.uc.GetMessage(ctx, req.GetMessageId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &messagev1.GetMessageResponse{Message: messageToProto(msg)}, nil
}

func (h *messageHandler) UpdateMessage(ctx context.Context, req *messagev1.UpdateMessageRequest) (*messagev1.UpdateMessageResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	msg, err := h.uc.UpdateMessage(ctx, userID, req.GetMessage().GetId(), req.GetMessage().GetContent())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &messagev1.UpdateMessageResponse{Message: messageToProto(msg)}, nil
}

func (h *messageHandler) DeleteMessage(ctx context.Context, req *messagev1.DeleteMessageRequest) (*messagev1.DeleteMessageResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	msg, err := h.uc.DeleteMessage(ctx, userID, req.GetMessageId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &messagev1.DeleteMessageResponse{Message: messageToProto(msg)}, nil
}

func (h *messageHandler) SendTypingIndicator(_ context.Context, _ *messagev1.SendTypingIndicatorRequest) (*messagev1.SendTypingIndicatorResponse, error) {
	// Typing indicators will be implemented via WebSocket
	return nil, connect.NewError(connect.CodeUnimplemented, errors.New("not implemented"))
}
