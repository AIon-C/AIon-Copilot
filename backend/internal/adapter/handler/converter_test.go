package handler

import (
	"testing"
	"time"

	"github.com/AIon-C/AIon-Copilot/backend/internal/domain"
	"google.golang.org/protobuf/types/known/timestamppb"
)

var testTime = time.Date(2025, 1, 15, 10, 30, 0, 0, time.UTC)
var testTime2 = time.Date(2025, 2, 20, 14, 0, 0, 0, time.UTC)

func TestToTimestamppb(t *testing.T) {
	got := toTimestamppb(testTime)
	want := timestamppb.New(testTime)
	if got.AsTime() != want.AsTime() {
		t.Errorf("toTimestamppb() = %v, want %v", got.AsTime(), want.AsTime())
	}
}

func TestToTimestamppbPtr(t *testing.T) {
	t.Run("nil", func(t *testing.T) {
		if got := toTimestamppbPtr(nil); got != nil {
			t.Errorf("toTimestamppbPtr(nil) = %v, want nil", got)
		}
	})

	t.Run("non-nil", func(t *testing.T) {
		tm := testTime
		got := toTimestamppbPtr(&tm)
		if got == nil {
			t.Fatal("toTimestamppbPtr() returned nil")
		}
		if got.AsTime() != testTime {
			t.Errorf("toTimestamppbPtr() = %v, want %v", got.AsTime(), testTime)
		}
	})
}

func TestToAuditMetadata(t *testing.T) {
	t.Run("with deletedAt", func(t *testing.T) {
		del := testTime2
		md := toAuditMetadata(testTime, testTime2, &del)
		if md.CreatedAt.AsTime() != testTime {
			t.Errorf("CreatedAt = %v, want %v", md.CreatedAt.AsTime(), testTime)
		}
		if md.UpdatedAt.AsTime() != testTime2 {
			t.Errorf("UpdatedAt = %v, want %v", md.UpdatedAt.AsTime(), testTime2)
		}
		if md.DeletedAt == nil || md.DeletedAt.AsTime() != testTime2 {
			t.Errorf("DeletedAt = %v, want %v", md.DeletedAt, testTime2)
		}
	})

	t.Run("without deletedAt", func(t *testing.T) {
		md := toAuditMetadata(testTime, testTime2, nil)
		if md.DeletedAt != nil {
			t.Errorf("DeletedAt = %v, want nil", md.DeletedAt)
		}
	})
}

func TestUserToProto(t *testing.T) {
	u := &domain.User{
		ID:          "user-1",
		Email:       "test@example.com",
		DisplayName: "Test User",
		AvatarURL:   "https://example.com/avatar.png",
		CreatedAt:   testTime,
		UpdatedAt:   testTime2,
		DeletedAt:   nil,
	}
	p := userToProto(u)
	if p.Id != u.ID {
		t.Errorf("Id = %q, want %q", p.Id, u.ID)
	}
	if p.Email != u.Email {
		t.Errorf("Email = %q, want %q", p.Email, u.Email)
	}
	if p.DisplayName != u.DisplayName {
		t.Errorf("DisplayName = %q, want %q", p.DisplayName, u.DisplayName)
	}
	if p.AvatarUrl != u.AvatarURL {
		t.Errorf("AvatarUrl = %q, want %q", p.AvatarUrl, u.AvatarURL)
	}
	if p.Metadata == nil {
		t.Fatal("Metadata is nil")
	}
	if p.Metadata.DeletedAt != nil {
		t.Errorf("Metadata.DeletedAt = %v, want nil", p.Metadata.DeletedAt)
	}
}

func TestWorkspaceToProto(t *testing.T) {
	w := &domain.Workspace{
		ID:        "ws-1",
		Name:      "My Workspace",
		Slug:      "my-workspace",
		IconURL:   "https://example.com/icon.png",
		CreatedAt: testTime,
		UpdatedAt: testTime2,
	}
	p := workspaceToProto(w)
	if p.Id != w.ID {
		t.Errorf("Id = %q, want %q", p.Id, w.ID)
	}
	if p.Name != w.Name {
		t.Errorf("Name = %q, want %q", p.Name, w.Name)
	}
	if p.Slug != w.Slug {
		t.Errorf("Slug = %q, want %q", p.Slug, w.Slug)
	}
	if p.IconUrl != w.IconURL {
		t.Errorf("IconUrl = %q, want %q", p.IconUrl, w.IconURL)
	}
}

func TestWorkspaceMemberToProto(t *testing.T) {
	m := &domain.WorkspaceMember{
		ID:          "wm-1",
		WorkspaceID: "ws-1",
		UserID:      "user-1",
		Role:        "admin",
		JoinedAt:    testTime,
	}
	p := workspaceMemberToProto(m)
	if p.Id != m.ID {
		t.Errorf("Id = %q, want %q", p.Id, m.ID)
	}
	if p.WorkspaceId != m.WorkspaceID {
		t.Errorf("WorkspaceId = %q, want %q", p.WorkspaceId, m.WorkspaceID)
	}
	if p.UserId != m.UserID {
		t.Errorf("UserId = %q, want %q", p.UserId, m.UserID)
	}
	if p.Role != m.Role {
		t.Errorf("Role = %q, want %q", p.Role, m.Role)
	}
	if p.JoinedAt.AsTime() != testTime {
		t.Errorf("JoinedAt = %v, want %v", p.JoinedAt.AsTime(), testTime)
	}
}

func TestChannelToProto(t *testing.T) {
	c := &domain.Channel{
		ID:          "ch-1",
		WorkspaceID: "ws-1",
		Name:        "general",
		Description: "General channel",
		CreatedBy:   "user-1",
		CreatedAt:   testTime,
		UpdatedAt:   testTime2,
	}
	p := channelToProto(c)
	if p.Id != c.ID {
		t.Errorf("Id = %q, want %q", p.Id, c.ID)
	}
	if p.WorkspaceId != c.WorkspaceID {
		t.Errorf("WorkspaceId = %q, want %q", p.WorkspaceId, c.WorkspaceID)
	}
	if p.Name != c.Name {
		t.Errorf("Name = %q, want %q", p.Name, c.Name)
	}
	if p.Description != c.Description {
		t.Errorf("Description = %q, want %q", p.Description, c.Description)
	}
	if p.CreatedBy != c.CreatedBy {
		t.Errorf("CreatedBy = %q, want %q", p.CreatedBy, c.CreatedBy)
	}
}

func TestChannelMemberToProto(t *testing.T) {
	lastRead := testTime2
	m := &domain.ChannelMember{
		ID:         "cm-1",
		ChannelID:  "ch-1",
		UserID:     "user-1",
		LastReadAt: &lastRead,
		JoinedAt:   testTime,
	}
	p := channelMemberToProto(m)
	if p.Id != m.ID {
		t.Errorf("Id = %q, want %q", p.Id, m.ID)
	}
	if p.ChannelId != m.ChannelID {
		t.Errorf("ChannelId = %q, want %q", p.ChannelId, m.ChannelID)
	}
	if p.LastReadAt == nil || p.LastReadAt.AsTime() != testTime2 {
		t.Errorf("LastReadAt = %v, want %v", p.LastReadAt, testTime2)
	}

	// nil LastReadAt
	m.LastReadAt = nil
	p = channelMemberToProto(m)
	if p.LastReadAt != nil {
		t.Errorf("LastReadAt = %v, want nil", p.LastReadAt)
	}
}

func TestMessageToProto(t *testing.T) {
	threadID := "msg-root"
	editedAt := testTime2
	m := &domain.Message{
		ID:           "msg-1",
		ChannelID:    "ch-1",
		UserID:       "user-1",
		ThreadRootID: &threadID,
		Content:      "hello",
		IsEdited:     true,
		EditedAt:     &editedAt,
		CreatedAt:    testTime,
		UpdatedAt:    testTime2,
	}
	p := messageToProto(m)
	if p.Id != m.ID {
		t.Errorf("Id = %q, want %q", p.Id, m.ID)
	}
	if p.ThreadRootId == nil || *p.ThreadRootId != threadID {
		t.Errorf("ThreadRootId = %v, want %q", p.ThreadRootId, threadID)
	}
	if !p.IsEdited {
		t.Error("IsEdited = false, want true")
	}
	if p.EditedAt == nil || p.EditedAt.AsTime() != testTime2 {
		t.Errorf("EditedAt = %v, want %v", p.EditedAt, testTime2)
	}

	// nil optional fields
	m.ThreadRootID = nil
	m.EditedAt = nil
	p = messageToProto(m)
	if p.ThreadRootId != nil {
		t.Errorf("ThreadRootId = %v, want nil", p.ThreadRootId)
	}
	if p.EditedAt != nil {
		t.Errorf("EditedAt = %v, want nil", p.EditedAt)
	}
}

func TestMessageAttachmentToProto(t *testing.T) {
	a := &domain.MessageAttachment{ID: "att-1", MessageID: "msg-1", FileID: "file-1"}
	p := messageAttachmentToProto(a)
	if p.Id != a.ID || p.MessageId != a.MessageID || p.FileId != a.FileID {
		t.Errorf("got (%q, %q, %q), want (%q, %q, %q)", p.Id, p.MessageId, p.FileId, a.ID, a.MessageID, a.FileID)
	}
}

func TestFileToProto(t *testing.T) {
	f := &domain.File{
		ID:          "file-1",
		WorkspaceID: "ws-1",
		UploadedBy:  "user-1",
		FileName:    "doc.pdf",
		FileKey:     "uploads/doc.pdf",
		ContentType: "application/pdf",
		FileSize:    1024,
		CreatedAt:   testTime,
	}
	p := fileToProto(f)
	if p.Id != f.ID {
		t.Errorf("Id = %q, want %q", p.Id, f.ID)
	}
	if p.FileName != f.FileName {
		t.Errorf("FileName = %q, want %q", p.FileName, f.FileName)
	}
	if p.FileSize != f.FileSize {
		t.Errorf("FileSize = %d, want %d", p.FileSize, f.FileSize)
	}
	if p.CreatedAt.AsTime() != testTime {
		t.Errorf("CreatedAt = %v, want %v", p.CreatedAt.AsTime(), testTime)
	}
}

func TestReactionToProto(t *testing.T) {
	r := &domain.Reaction{
		ID:        "react-1",
		MessageID: "msg-1",
		UserID:    "user-1",
		EmojiCode: "thumbsup",
		CreatedAt: testTime,
	}
	p := reactionToProto(r)
	if p.Id != r.ID {
		t.Errorf("Id = %q, want %q", p.Id, r.ID)
	}
	if p.EmojiCode != r.EmojiCode {
		t.Errorf("EmojiCode = %q, want %q", p.EmojiCode, r.EmojiCode)
	}
	if p.CreatedAt.AsTime() != testTime {
		t.Errorf("CreatedAt = %v, want %v", p.CreatedAt.AsTime(), testTime)
	}
}

func TestToPageResponse(t *testing.T) {
	tests := []struct {
		name       string
		page       int
		pageSize   int
		totalCount int64
		wantNext   bool
		wantPrev   bool
	}{
		{"first page with more", 1, 10, 25, true, false},
		{"middle page", 2, 10, 25, true, true},
		{"last page", 3, 10, 25, false, true},
		{"single page", 1, 10, 5, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := toPageResponse(tt.page, tt.pageSize, tt.totalCount)
			if p.Page != int32(tt.page) {
				t.Errorf("Page = %d, want %d", p.Page, tt.page)
			}
			if p.PageSize != int32(tt.pageSize) {
				t.Errorf("PageSize = %d, want %d", p.PageSize, tt.pageSize)
			}
			if p.TotalCount != tt.totalCount {
				t.Errorf("TotalCount = %d, want %d", p.TotalCount, tt.totalCount)
			}
			if p.HasNext != tt.wantNext {
				t.Errorf("HasNext = %v, want %v", p.HasNext, tt.wantNext)
			}
			if p.HasPrev != tt.wantPrev {
				t.Errorf("HasPrev = %v, want %v", p.HasPrev, tt.wantPrev)
			}
		})
	}
}

func TestToCursorResponse(t *testing.T) {
	p := toCursorResponse("next-cursor", "prev-cursor", true, false)
	if p.NextCursor != "next-cursor" {
		t.Errorf("NextCursor = %q, want %q", p.NextCursor, "next-cursor")
	}
	if p.PrevCursor != "prev-cursor" {
		t.Errorf("PrevCursor = %q, want %q", p.PrevCursor, "prev-cursor")
	}
	if !p.HasMoreAfter {
		t.Error("HasMoreAfter = false, want true")
	}
	if p.HasMoreBefore {
		t.Error("HasMoreBefore = true, want false")
	}
}
