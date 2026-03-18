package persistence

import (
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence/model"
	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
)

func userModelToDomain(m *model.User) *domain.User {
	if m == nil {
		return nil
	}
	u := &domain.User{
		ID:           m.ID,
		Email:        m.Email,
		DisplayName:  m.DisplayName,
		AvatarURL:    m.AvatarURL,
		PasswordHash: m.PasswordHash,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		u.DeletedAt = &t
	}
	return u
}

func userDomainToModel(u *domain.User) *model.User {
	if u == nil {
		return nil
	}
	return &model.User{
		ID:           u.ID,
		Email:        u.Email,
		DisplayName:  u.DisplayName,
		AvatarURL:    u.AvatarURL,
		PasswordHash: u.PasswordHash,
		CreatedAt:    u.CreatedAt,
		UpdatedAt:    u.UpdatedAt,
	}
}

func refreshTokenModelToDomain(m *model.RefreshToken) *domain.RefreshToken {
	if m == nil {
		return nil
	}
	return &domain.RefreshToken{
		ID:        m.ID,
		UserID:    m.UserID,
		Token:     m.Token,
		ExpiresAt: m.ExpiresAt,
		CreatedAt: m.CreatedAt,
	}
}

func refreshTokenDomainToModel(rt *domain.RefreshToken) *model.RefreshToken {
	if rt == nil {
		return nil
	}
	return &model.RefreshToken{
		ID:        rt.ID,
		UserID:    rt.UserID,
		Token:     rt.Token,
		ExpiresAt: rt.ExpiresAt,
		CreatedAt: rt.CreatedAt,
	}
}

func workspaceModelToDomain(m *model.Workspace) *domain.Workspace {
	if m == nil {
		return nil
	}
	ws := &domain.Workspace{
		ID:        m.ID,
		Name:      m.Name,
		Slug:      m.Slug,
		IconURL:   m.IconURL,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		ws.DeletedAt = &t
	}
	return ws
}

func workspaceDomainToModel(ws *domain.Workspace) *model.Workspace {
	if ws == nil {
		return nil
	}
	return &model.Workspace{
		ID:        ws.ID,
		Name:      ws.Name,
		Slug:      ws.Slug,
		IconURL:   ws.IconURL,
		CreatedAt: ws.CreatedAt,
		UpdatedAt: ws.UpdatedAt,
	}
}

func workspaceMemberModelToDomain(m *model.WorkspaceMember) *domain.WorkspaceMember {
	if m == nil {
		return nil
	}
	return &domain.WorkspaceMember{
		ID:          m.ID,
		WorkspaceID: m.WorkspaceID,
		UserID:      m.UserID,
		Role:        m.Role,
		JoinedAt:    m.JoinedAt,
	}
}

func workspaceMemberDomainToModel(wm *domain.WorkspaceMember) *model.WorkspaceMember {
	if wm == nil {
		return nil
	}
	return &model.WorkspaceMember{
		ID:          wm.ID,
		WorkspaceID: wm.WorkspaceID,
		UserID:      wm.UserID,
		Role:        wm.Role,
		JoinedAt:    wm.JoinedAt,
	}
}

func workspaceInviteModelToDomain(m *model.WorkspaceInvite) *domain.WorkspaceInvite {
	if m == nil {
		return nil
	}
	return &domain.WorkspaceInvite{
		ID:          m.ID,
		WorkspaceID: m.WorkspaceID,
		Email:       m.Email,
		Token:       m.Token,
		ExpiresAt:   m.ExpiresAt,
		CreatedAt:   m.CreatedAt,
	}
}

func workspaceInviteDomainToModel(inv *domain.WorkspaceInvite) *model.WorkspaceInvite {
	if inv == nil {
		return nil
	}
	return &model.WorkspaceInvite{
		ID:          inv.ID,
		WorkspaceID: inv.WorkspaceID,
		Email:       inv.Email,
		Token:       inv.Token,
		ExpiresAt:   inv.ExpiresAt,
		CreatedAt:   inv.CreatedAt,
	}
}

func channelModelToDomain(m *model.Channel) *domain.Channel {
	if m == nil {
		return nil
	}
	ch := &domain.Channel{
		ID:          m.ID,
		WorkspaceID: m.WorkspaceID,
		Name:        m.Name,
		Description: m.Description,
		CreatedBy:   m.CreatedBy,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		ch.DeletedAt = &t
	}
	return ch
}

func channelDomainToModel(ch *domain.Channel) *model.Channel {
	if ch == nil {
		return nil
	}
	return &model.Channel{
		ID:          ch.ID,
		WorkspaceID: ch.WorkspaceID,
		Name:        ch.Name,
		Description: ch.Description,
		CreatedBy:   ch.CreatedBy,
		CreatedAt:   ch.CreatedAt,
		UpdatedAt:   ch.UpdatedAt,
	}
}

func channelMemberModelToDomain(m *model.ChannelMember) *domain.ChannelMember {
	if m == nil {
		return nil
	}
	return &domain.ChannelMember{
		ID:         m.ID,
		ChannelID:  m.ChannelID,
		UserID:     m.UserID,
		LastReadAt: m.LastReadAt,
		JoinedAt:   m.JoinedAt,
	}
}

func channelMemberDomainToModel(cm *domain.ChannelMember) *model.ChannelMember {
	if cm == nil {
		return nil
	}
	return &model.ChannelMember{
		ID:         cm.ID,
		ChannelID:  cm.ChannelID,
		UserID:     cm.UserID,
		LastReadAt: cm.LastReadAt,
		JoinedAt:   cm.JoinedAt,
	}
}

func messageModelToDomain(m *model.Message) *domain.Message {
	if m == nil {
		return nil
	}
	msg := &domain.Message{
		ID:           m.ID,
		ChannelID:    m.ChannelID,
		UserID:       m.UserID,
		ThreadRootID: m.ThreadRootID,
		Content:      m.Content,
		IsEdited:     m.IsEdited,
		EditedAt:     m.EditedAt,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
	if m.DeletedAt.Valid {
		t := m.DeletedAt.Time
		msg.DeletedAt = &t
	}
	return msg
}

func messageDomainToModel(msg *domain.Message) *model.Message {
	if msg == nil {
		return nil
	}
	return &model.Message{
		ID:           msg.ID,
		ChannelID:    msg.ChannelID,
		UserID:       msg.UserID,
		ThreadRootID: msg.ThreadRootID,
		Content:      msg.Content,
		IsEdited:     msg.IsEdited,
		EditedAt:     msg.EditedAt,
		CreatedAt:    msg.CreatedAt,
		UpdatedAt:    msg.UpdatedAt,
	}
}

func messageAttachmentModelToDomain(m *model.MessageAttachment) *domain.MessageAttachment {
	if m == nil {
		return nil
	}
	return &domain.MessageAttachment{
		ID:        m.ID,
		MessageID: m.MessageID,
		FileID:    m.FileID,
	}
}

func messageAttachmentDomainToModel(a *domain.MessageAttachment) *model.MessageAttachment {
	if a == nil {
		return nil
	}
	return &model.MessageAttachment{
		ID:        a.ID,
		MessageID: a.MessageID,
		FileID:    a.FileID,
	}
}

func reactionModelToDomain(m *model.Reaction) *domain.Reaction {
	if m == nil {
		return nil
	}
	return &domain.Reaction{
		ID:        m.ID,
		MessageID: m.MessageID,
		UserID:    m.UserID,
		EmojiCode: m.EmojiCode,
		CreatedAt: m.CreatedAt,
	}
}

func reactionDomainToModel(r *domain.Reaction) *model.Reaction {
	if r == nil {
		return nil
	}
	return &model.Reaction{
		ID:        r.ID,
		MessageID: r.MessageID,
		UserID:    r.UserID,
		EmojiCode: r.EmojiCode,
		CreatedAt: r.CreatedAt,
	}
}

func nowUTC() time.Time {
	return time.Now().UTC()
}
