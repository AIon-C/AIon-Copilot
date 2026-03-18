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

func toTimestamppb(t time.Time) *timestamppb.Timestamp {
	if t.IsZero() {
		return nil
	}
	return timestamppb.New(t)
}
