package handler

import (
	"time"

	commonv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/common/v1"
	modelv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/model/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func userToProto(u *domain.User) *modelv1.User {
	if u == nil {
		return nil
	}
	pb := &modelv1.User{
		Id:          u.ID,
		Email:       u.Email,
		DisplayName: u.DisplayName,
		AvatarUrl:   u.AvatarURL,
		Metadata: &commonv1.AuditMetadata{
			CreatedAt: timestamppb.New(u.CreatedAt),
			UpdatedAt: timestamppb.New(u.UpdatedAt),
		},
	}
	if u.DeletedAt != nil {
		pb.Metadata.DeletedAt = timestamppb.New(*u.DeletedAt)
	}
	return pb
}

func workspaceToProto(ws *domain.Workspace) *modelv1.Workspace {
	if ws == nil {
		return nil
	}
	pb := &modelv1.Workspace{
		Id:      ws.ID,
		Name:    ws.Name,
		Slug:    ws.Slug,
		IconUrl: ws.IconURL,
		Metadata: &commonv1.AuditMetadata{
			CreatedAt: timestamppb.New(ws.CreatedAt),
			UpdatedAt: timestamppb.New(ws.UpdatedAt),
		},
	}
	if ws.DeletedAt != nil {
		pb.Metadata.DeletedAt = timestamppb.New(*ws.DeletedAt)
	}
	return pb
}

func workspaceMemberToProto(wm *domain.WorkspaceMember) *modelv1.WorkspaceMember {
	if wm == nil {
		return nil
	}
	return &modelv1.WorkspaceMember{
		Id:          wm.ID,
		WorkspaceId: wm.WorkspaceID,
		UserId:      wm.UserID,
		Role:        wm.Role,
		JoinedAt:    timestamppb.New(wm.JoinedAt),
	}
}

func channelToProto(ch *domain.Channel) *modelv1.Channel {
	if ch == nil {
		return nil
	}
	pb := &modelv1.Channel{
		Id:          ch.ID,
		WorkspaceId: ch.WorkspaceID,
		Name:        ch.Name,
		Description: ch.Description,
		CreatedBy:   ch.CreatedBy,
		Metadata: &commonv1.AuditMetadata{
			CreatedAt: timestamppb.New(ch.CreatedAt),
			UpdatedAt: timestamppb.New(ch.UpdatedAt),
		},
	}
	if ch.DeletedAt != nil {
		pb.Metadata.DeletedAt = timestamppb.New(*ch.DeletedAt)
	}
	return pb
}

func channelMemberToProto(cm *domain.ChannelMember) *modelv1.ChannelMember {
	if cm == nil {
		return nil
	}
	pb := &modelv1.ChannelMember{
		Id:        cm.ID,
		ChannelId: cm.ChannelID,
		UserId:    cm.UserID,
		JoinedAt:  timestamppb.New(cm.JoinedAt),
	}
	if cm.LastReadAt != nil {
		pb.LastReadAt = timestamppb.New(*cm.LastReadAt)
	}
	return pb
}

func toTimestamppb(t time.Time) *timestamppb.Timestamp {
	if t.IsZero() {
		return nil
	}
	return timestamppb.New(t)
}

func pageParams(page, pageSize int32) (int, int) {
	p := int(page)
	ps := int(pageSize)
	if p < 1 {
		p = 1
	}
	if ps < 1 || ps > 100 {
		ps = 20
	}
	return p, ps
}

func pageResponse(page, pageSize int, total int64) *commonv1.PageResponse {
	return &commonv1.PageResponse{
		Page:       int32(page),
		PageSize:   int32(pageSize),
		TotalCount: total,
		HasNext:    int64(page*pageSize) < total,
		HasPrev:    page > 1,
	}
}
