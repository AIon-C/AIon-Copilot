package handler

import (
	"context"

	"connectrpc.com/connect"

	channelv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/channel/v1"
	commonv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/common/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type channelHandler struct {
	uc usecase.ChannelUsecase
}

func NewChannelHandler(uc usecase.ChannelUsecase) *channelHandler {
	return &channelHandler{uc: uc}
}

func (h *channelHandler) CreateChannel(ctx context.Context, req *channelv1.CreateChannelRequest) (*channelv1.CreateChannelResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	ch, err := h.uc.CreateChannel(ctx, userID, req.GetWorkspaceId(), req.GetName(), req.GetDescription())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.CreateChannelResponse{Channel: channelToProto(ch)}, nil
}

func (h *channelHandler) ListChannels(ctx context.Context, req *channelv1.ListChannelsRequest) (*channelv1.ListChannelsResponse, error) {
	page, pageSize := pageParams(req.GetPage().GetPage(), req.GetPage().GetPageSize())
	sortField := req.GetSort().GetField()
	sortOrder := "ASC"
	if req.GetSort().GetOrder() == commonv1.SortOrder_SORT_ORDER_DESC {
		sortOrder = "DESC"
	}
	list, total, err := h.uc.ListChannels(ctx, req.GetWorkspaceId(), page, pageSize, sortField, sortOrder)
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &channelv1.ListChannelsResponse{
		Page: pageResponse(page, pageSize, total),
	}
	for _, ch := range list {
		resp.Channels = append(resp.Channels, channelToProto(ch))
	}
	return resp, nil
}

func (h *channelHandler) SearchChannels(ctx context.Context, req *channelv1.SearchChannelsRequest) (*channelv1.SearchChannelsResponse, error) {
	page, pageSize := pageParams(req.GetPage().GetPage(), req.GetPage().GetPageSize())
	list, total, err := h.uc.SearchChannels(ctx, req.GetWorkspaceId(), req.GetQuery(), page, pageSize)
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &channelv1.SearchChannelsResponse{
		Page: pageResponse(page, pageSize, total),
	}
	for _, ch := range list {
		resp.Channels = append(resp.Channels, channelToProto(ch))
	}
	return resp, nil
}

func (h *channelHandler) GetChannel(ctx context.Context, req *channelv1.GetChannelRequest) (*channelv1.GetChannelResponse, error) {
	ch, err := h.uc.GetChannel(ctx, req.GetChannelId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.GetChannelResponse{Channel: channelToProto(ch)}, nil
}

func (h *channelHandler) UpdateChannel(ctx context.Context, req *channelv1.UpdateChannelRequest) (*channelv1.UpdateChannelResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	fields := make(map[string]string)
	if req.GetUpdateMask() != nil {
		for _, path := range req.GetUpdateMask().GetPaths() {
			switch path {
			case "name":
				fields["name"] = req.GetChannel().GetName()
			case "description":
				fields["description"] = req.GetChannel().GetDescription()
			}
		}
	}
	ch, err := h.uc.UpdateChannel(ctx, userID, req.GetChannel().GetId(), fields)
	if err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.UpdateChannelResponse{Channel: channelToProto(ch)}, nil
}

func (h *channelHandler) JoinChannel(ctx context.Context, req *channelv1.JoinChannelRequest) (*channelv1.JoinChannelResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	member, err := h.uc.JoinChannel(ctx, userID, req.GetChannelId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.JoinChannelResponse{Membership: channelMemberToProto(member)}, nil
}

func (h *channelHandler) LeaveChannel(ctx context.Context, req *channelv1.LeaveChannelRequest) (*channelv1.LeaveChannelResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.LeaveChannel(ctx, userID, req.GetChannelId()); err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.LeaveChannelResponse{}, nil
}

func (h *channelHandler) MarkChannelRead(ctx context.Context, req *channelv1.MarkChannelReadRequest) (*channelv1.MarkChannelReadResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.MarkChannelRead(ctx, userID, req.GetChannelId(), req.GetLastReadMessageId()); err != nil {
		return nil, toConnectError(err)
	}
	return &channelv1.MarkChannelReadResponse{}, nil
}

func (h *channelHandler) GetUnreadCounts(ctx context.Context, req *channelv1.GetUnreadCountsRequest) (*channelv1.GetUnreadCountsResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	counts, err := h.uc.GetUnreadCounts(ctx, userID, req.GetWorkspaceId())
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &channelv1.GetUnreadCountsResponse{}
	for _, c := range counts {
		resp.UnreadCounts = append(resp.UnreadCounts, &channelv1.UnreadCount{
			ChannelId: c.ChannelID,
			Count:     c.Count,
		})
	}
	return resp, nil
}
