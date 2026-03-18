package handler

import (
	"context"

	modelv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/model/v1"
	threadv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/thread/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
)

type threadHandler struct {
	msgUC usecase.MessageUsecase
}

func NewThreadHandler(msgUC usecase.MessageUsecase) *threadHandler {
	return &threadHandler{msgUC: msgUC}
}

func (h *threadHandler) GetThread(ctx context.Context, req *threadv1.GetThreadRequest) (*threadv1.GetThreadResponse, error) {
	root, replies, err := h.msgUC.GetThread(ctx, req.GetThreadRootId())
	if err != nil {
		return nil, toConnectError(err)
	}

	protoReplies := make([]*modelv1.Message, len(replies))
	for i, r := range replies {
		protoReplies[i] = messageToProto(r)
	}

	return &threadv1.GetThreadResponse{
		RootMessage: messageToProto(root),
		Replies:     protoReplies,
	}, nil
}
