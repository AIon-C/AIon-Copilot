package handler

import (
	"context"

	"connectrpc.com/connect"

	reactionv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/reaction/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type reactionHandler struct {
	uc usecase.ReactionUsecase
}

func NewReactionHandler(uc usecase.ReactionUsecase) *reactionHandler {
	return &reactionHandler{uc: uc}
}

func (h *reactionHandler) AddReaction(ctx context.Context, req *reactionv1.AddReactionRequest) (*reactionv1.AddReactionResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	r, err := h.uc.AddReaction(ctx, userID, req.GetMessageId(), req.GetEmojiCode())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &reactionv1.AddReactionResponse{Reaction: reactionToProto(r)}, nil
}

func (h *reactionHandler) RemoveReaction(ctx context.Context, req *reactionv1.RemoveReactionRequest) (*reactionv1.RemoveReactionResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.RemoveReaction(ctx, userID, req.GetMessageId(), req.GetEmojiCode()); err != nil {
		return nil, toConnectError(err)
	}
	return &reactionv1.RemoveReactionResponse{MessageId: req.GetMessageId()}, nil
}

func (h *reactionHandler) ListReactions(ctx context.Context, req *reactionv1.ListReactionsRequest) (*reactionv1.ListReactionsResponse, error) {
	reactions, err := h.uc.ListReactions(ctx, req.GetMessageId())
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &reactionv1.ListReactionsResponse{}
	for _, r := range reactions {
		resp.Reactions = append(resp.Reactions, reactionToProto(r))
	}
	return resp, nil
}
