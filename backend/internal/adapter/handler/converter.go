package handler

import (
	"time"

	commonv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/common/v1"
	modelv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/model/v1"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// --- Timestamp helpers ---

func toTimestamppb(t time.Time) *timestamppb.Timestamp {
	return timestamppb.New(t)
}

func toTimestamppbPtr(t *time.Time) *timestamppb.Timestamp {
	if t == nil {
		return nil
	}
	return timestamppb.New(*t)
}

func toAuditMetadata(createdAt, updatedAt time.Time, deletedAt *time.Time) *commonv1.AuditMetadata {
	return &commonv1.AuditMetadata{
		CreatedAt: toTimestamppb(createdAt),
		UpdatedAt: toTimestamppb(updatedAt),
		DeletedAt: toTimestamppbPtr(deletedAt),
	}
}

// --- Entity converters (domain -> proto) ---

func userToProto(u *domain.User) *modelv1.User {
	return &modelv1.User{
		Id:          u.ID,
		Email:       u.Email,
		DisplayName: u.DisplayName,
		AvatarUrl:   u.AvatarURL,
		Metadata:    toAuditMetadata(u.CreatedAt, u.UpdatedAt, u.DeletedAt),
	}
}

func workspaceToProto(w *domain.Workspace) *modelv1.Workspace {
	return &modelv1.Workspace{
		Id:       w.ID,
		Name:     w.Name,
		Slug:     w.Slug,
		IconUrl:  w.IconURL,
		Metadata: toAuditMetadata(w.CreatedAt, w.UpdatedAt, w.DeletedAt),
	}
}

func workspaceMemberToProto(m *domain.WorkspaceMember) *modelv1.WorkspaceMember {
	return &modelv1.WorkspaceMember{
		Id:          m.ID,
		WorkspaceId: m.WorkspaceID,
		UserId:      m.UserID,
		Role:        m.Role,
		JoinedAt:    toTimestamppb(m.JoinedAt),
	}
}

func channelToProto(c *domain.Channel) *modelv1.Channel {
	return &modelv1.Channel{
		Id:          c.ID,
		WorkspaceId: c.WorkspaceID,
		Name:        c.Name,
		Description: c.Description,
		CreatedBy:   c.CreatedBy,
		Metadata:    toAuditMetadata(c.CreatedAt, c.UpdatedAt, c.DeletedAt),
	}
}

func channelMemberToProto(m *domain.ChannelMember) *modelv1.ChannelMember {
	return &modelv1.ChannelMember{
		Id:         m.ID,
		ChannelId:  m.ChannelID,
		UserId:     m.UserID,
		LastReadAt: toTimestamppbPtr(m.LastReadAt),
		JoinedAt:   toTimestamppb(m.JoinedAt),
	}
}

func messageToProto(m *domain.Message) *modelv1.Message {
	msg := &modelv1.Message{
		Id:           m.ID,
		ChannelId:    m.ChannelID,
		UserId:       m.UserID,
		ThreadRootId: m.ThreadRootID,
		Content:      m.Content,
		IsEdited:     m.IsEdited,
		Metadata:     toAuditMetadata(m.CreatedAt, m.UpdatedAt, m.DeletedAt),
		EditedAt:     toTimestamppbPtr(m.EditedAt),
	}
	return msg
}

func messageAttachmentToProto(a *domain.MessageAttachment) *modelv1.MessageAttachment {
	return &modelv1.MessageAttachment{
		Id:        a.ID,
		MessageId: a.MessageID,
		FileId:    a.FileID,
	}
}

func fileToProto(f *domain.File) *modelv1.File {
	return &modelv1.File{
		Id:          f.ID,
		WorkspaceId: f.WorkspaceID,
		UploadedBy:  f.UploadedBy,
		FileName:    f.FileName,
		FileKey:     f.FileKey,
		ContentType: f.ContentType,
		FileSize:    f.FileSize,
		CreatedAt:   toTimestamppb(f.CreatedAt),
	}
}

func reactionToProto(r *domain.Reaction) *modelv1.Reaction {
	return &modelv1.Reaction{
		Id:        r.ID,
		MessageId: r.MessageID,
		UserId:    r.UserID,
		EmojiCode: r.EmojiCode,
		CreatedAt: toTimestamppb(r.CreatedAt),
	}
}

// --- Pagination converters ---

func toPageResponse(page, pageSize int, totalCount int64) *commonv1.PageResponse {
	hasNext := int64(page*pageSize) < totalCount
	hasPrev := page > 1
	return &commonv1.PageResponse{
		Page:       int32(page),
		PageSize:   int32(pageSize),
		TotalCount: totalCount,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}
}

func toCursorResponse(next, prev string, hasMore, hasPrev bool) *commonv1.CursorResponse {
	return &commonv1.CursorResponse{
		NextCursor:    next,
		PrevCursor:    prev,
		HasMoreAfter:  hasMore,
		HasMoreBefore: hasPrev,
	}
}
