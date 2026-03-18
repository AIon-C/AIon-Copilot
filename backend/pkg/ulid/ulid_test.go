package ulid_test

import (
	"regexp"
	"testing"

	"github.com/AIon-C/AIon-Copilot/backend/pkg/ulid"
)

var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

func TestNewID_Format(t *testing.T) {
	id := ulid.NewID()
	if !uuidRegex.MatchString(id) {
		t.Errorf("NewID() = %q, want UUID v4 format", id)
	}
}

func TestNewID_Unique(t *testing.T) {
	id1 := ulid.NewID()
	id2 := ulid.NewID()
	if id1 == id2 {
		t.Errorf("NewID() returned duplicate IDs: %q", id1)
	}
}
