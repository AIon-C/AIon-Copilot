package handler

import (
	"context"

	"connectrpc.com/connect"

	workspacev1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/workspace/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

type workspaceHandler struct {
	uc usecase.WorkspaceUsecase
}

func NewWorkspaceHandler(uc usecase.WorkspaceUsecase) *workspaceHandler {
	return &workspaceHandler{uc: uc}
}

func (h *workspaceHandler) CreateWorkspace(ctx context.Context, req *workspacev1.CreateWorkspaceRequest) (*workspacev1.CreateWorkspaceResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	ws, err := h.uc.CreateWorkspace(ctx, userID, req.GetName(), req.GetIconUrl())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.CreateWorkspaceResponse{Workspace: workspaceToProto(ws)}, nil
}

func (h *workspaceHandler) ListWorkspaces(ctx context.Context, req *workspacev1.ListWorkspacesRequest) (*workspacev1.ListWorkspacesResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	page, pageSize := pageParams(req.GetPage().GetPage(), req.GetPage().GetPageSize())
	list, total, err := h.uc.ListWorkspaces(ctx, userID, page, pageSize)
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &workspacev1.ListWorkspacesResponse{
		Page: pageResponse(page, pageSize, total),
	}
	for _, ws := range list {
		resp.Workspace = append(resp.Workspace, workspaceToProto(ws))
	}
	return resp, nil
}

func (h *workspaceHandler) GetWorkspace(ctx context.Context, req *workspacev1.GetWorkspaceRequest) (*workspacev1.GetWorkspaceResponse, error) {
	ws, err := h.uc.GetWorkspace(ctx, req.GetWorkspaceId())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.GetWorkspaceResponse{Workspace: workspaceToProto(ws)}, nil
}

func (h *workspaceHandler) UpdateWorkspace(ctx context.Context, req *workspacev1.UpdateWorkspaceRequest) (*workspacev1.UpdateWorkspaceResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	fields := make(map[string]string)
	if req.GetUpdateMask() != nil {
		for _, path := range req.GetUpdateMask().GetPaths() {
			switch path {
			case "name":
				fields["name"] = req.GetWorkspace().GetName()
			case "icon_url":
				fields["icon_url"] = req.GetWorkspace().GetIconUrl()
			}
		}
	}
	ws, err := h.uc.UpdateWorkspace(ctx, userID, req.GetWorkspace().GetId(), fields)
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.UpdateWorkspaceResponse{Workspace: workspaceToProto(ws)}, nil
}

func (h *workspaceHandler) InviteWorkspaceMember(ctx context.Context, req *workspacev1.InviteWorkspaceMemberRequest) (*workspacev1.InviteWorkspaceMemberResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	token, err := h.uc.InviteMember(ctx, userID, req.GetWorkspaceId(), req.GetEmail())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.InviteWorkspaceMemberResponse{InviteToken: token}, nil
}

func (h *workspaceHandler) JoinWorkspaceByInvite(ctx context.Context, req *workspacev1.JoinWorkspaceByInviteRequest) (*workspacev1.JoinWorkspaceByInviteResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	member, err := h.uc.JoinByInvite(ctx, userID, req.GetInviteToken())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.JoinWorkspaceByInviteResponse{Member: workspaceMemberToProto(member)}, nil
}

func (h *workspaceHandler) ListWorkspaceMembers(ctx context.Context, req *workspacev1.ListWorkspaceMembersRequest) (*workspacev1.ListWorkspaceMembersResponse, error) {
	page, pageSize := pageParams(req.GetPage().GetPage(), req.GetPage().GetPageSize())
	members, total, err := h.uc.ListMembers(ctx, req.GetWorkspaceId(), page, pageSize)
	if err != nil {
		return nil, toConnectError(err)
	}
	resp := &workspacev1.ListWorkspaceMembersResponse{
		Page: pageResponse(page, pageSize, total),
	}
	for _, m := range members {
		resp.Members = append(resp.Members, workspaceMemberToProto(m))
	}
	return resp, nil
}

func (h *workspaceHandler) GetInviteInfo(ctx context.Context, req *workspacev1.GetInviteInfoRequest) (*workspacev1.GetInviteInfoResponse, error) {
	ws, err := h.uc.GetInviteInfo(ctx, req.GetInviteCode())
	if err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.GetInviteInfoResponse{Workspace: workspaceToProto(ws)}, nil
}

func (h *workspaceHandler) RemoveMember(ctx context.Context, req *workspacev1.RemoveMemberRequest) (*workspacev1.RemoveMemberResponse, error) {
	userID, ok := auth.UserIDFromContext(ctx)
	if !ok {
		return nil, connect.NewError(connect.CodeUnauthenticated, nil)
	}
	if err := h.uc.RemoveMember(ctx, userID, req.GetWorkspaceId(), req.GetUserId()); err != nil {
		return nil, toConnectError(err)
	}
	return &workspacev1.RemoveMemberResponse{}, nil
}
