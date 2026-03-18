package usecase

import (
	"context"
	"errors"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

type ChannelUsecase interface {
	CreateChannel(ctx context.Context, userID, wsID, name, description string) (*domain.Channel, error)
	ListChannels(ctx context.Context, wsID string, page, pageSize int, sortField, sortOrder string) ([]*domain.Channel, int64, error)
	SearchChannels(ctx context.Context, wsID, query string, page, pageSize int) ([]*domain.Channel, int64, error)
	GetChannel(ctx context.Context, id string) (*domain.Channel, error)
	UpdateChannel(ctx context.Context, userID, chID string, fields map[string]string) (*domain.Channel, error)
	JoinChannel(ctx context.Context, userID, chID string) (*domain.ChannelMember, error)
	LeaveChannel(ctx context.Context, userID, chID string) error
	MarkChannelRead(ctx context.Context, userID, chID, messageID string) error
	GetUnreadCounts(ctx context.Context, userID, wsID string) ([]domain.UnreadCount, error)
}

type channelUsecase struct {
	chRepo       domain.ChannelRepository
	memberRepo   domain.ChannelMemberRepository
	wsMemberRepo domain.WorkspaceMemberRepository
}

func NewChannelUsecase(
	chRepo domain.ChannelRepository,
	memberRepo domain.ChannelMemberRepository,
	wsMemberRepo domain.WorkspaceMemberRepository,
) ChannelUsecase {
	return &channelUsecase{
		chRepo:       chRepo,
		memberRepo:   memberRepo,
		wsMemberRepo: wsMemberRepo,
	}
}

func (uc *channelUsecase) CreateChannel(ctx context.Context, userID, wsID, name, description string) (*domain.Channel, error) {
	// Verify workspace membership
	if _, err := uc.wsMemberRepo.FindByWorkspaceAndUser(ctx, wsID, userID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrForbidden
		}
		return nil, err
	}

	ch := &domain.Channel{
		ID:          ulid.NewID(),
		WorkspaceID: wsID,
		Name:        name,
		Description: description,
		CreatedBy:   userID,
	}
	if err := ch.Validate(); err != nil {
		return nil, err
	}

	if err := uc.chRepo.Create(ctx, ch); err != nil {
		return nil, err
	}

	// Creator auto-joins
	member := &domain.ChannelMember{
		ID:        ulid.NewID(),
		ChannelID: ch.ID,
		UserID:    userID,
	}
	_ = uc.memberRepo.Create(ctx, member)

	return ch, nil
}

func (uc *channelUsecase) ListChannels(ctx context.Context, wsID string, page, pageSize int, sortField, sortOrder string) ([]*domain.Channel, int64, error) {
	return uc.chRepo.ListByWorkspace(ctx, wsID, page, pageSize, sortField, sortOrder)
}

func (uc *channelUsecase) SearchChannels(ctx context.Context, wsID, query string, page, pageSize int) ([]*domain.Channel, int64, error) {
	return uc.chRepo.SearchByName(ctx, wsID, query, page, pageSize)
}

func (uc *channelUsecase) GetChannel(ctx context.Context, id string) (*domain.Channel, error) {
	return uc.chRepo.FindByID(ctx, id)
}

func (uc *channelUsecase) UpdateChannel(ctx context.Context, userID, chID string, fields map[string]string) (*domain.Channel, error) {
	ch, err := uc.chRepo.FindByID(ctx, chID)
	if err != nil {
		return nil, err
	}

	// Verify: must be channel member or workspace admin/owner
	if _, err := uc.memberRepo.FindByChannelAndUser(ctx, chID, userID); err != nil {
		if !errors.Is(err, domain.ErrNotFound) {
			return nil, err
		}
		// Not a channel member — check workspace admin/owner
		wsMember, wsErr := uc.wsMemberRepo.FindByWorkspaceAndUser(ctx, ch.WorkspaceID, userID)
		if wsErr != nil {
			if errors.Is(wsErr, domain.ErrNotFound) {
				return nil, domain.ErrForbidden
			}
			return nil, wsErr
		}
		if !wsMember.CanInvite() {
			return nil, domain.ErrForbidden
		}
	}

	for k, v := range fields {
		switch k {
		case "name":
			ch.Name = v
		case "description":
			ch.Description = v
		}
	}

	if err := ch.Validate(); err != nil {
		return nil, err
	}

	if err := uc.chRepo.Update(ctx, ch); err != nil {
		return nil, err
	}
	return ch, nil
}

func (uc *channelUsecase) JoinChannel(ctx context.Context, userID, chID string) (*domain.ChannelMember, error) {
	// Verify workspace membership via channel
	ch, err := uc.chRepo.FindByID(ctx, chID)
	if err != nil {
		return nil, err
	}
	if _, err := uc.wsMemberRepo.FindByWorkspaceAndUser(ctx, ch.WorkspaceID, userID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrForbidden
		}
		return nil, err
	}

	member := &domain.ChannelMember{
		ID:        ulid.NewID(),
		ChannelID: chID,
		UserID:    userID,
	}
	if err := uc.memberRepo.Create(ctx, member); err != nil {
		return nil, err
	}
	return member, nil
}

func (uc *channelUsecase) LeaveChannel(ctx context.Context, userID, chID string) error {
	return uc.memberRepo.DeleteByChannelAndUser(ctx, chID, userID)
}

func (uc *channelUsecase) MarkChannelRead(ctx context.Context, userID, chID, messageID string) error {
	return uc.memberRepo.UpdateLastRead(ctx, chID, userID, messageID)
}

func (uc *channelUsecase) GetUnreadCounts(ctx context.Context, userID, wsID string) ([]domain.UnreadCount, error) {
	return uc.memberRepo.GetUnreadCounts(ctx, userID, wsID)
}
