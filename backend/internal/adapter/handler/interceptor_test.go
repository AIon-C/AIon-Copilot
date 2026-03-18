package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"

	authv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/auth/v1"
	authv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/auth/v1/authv1connect"
	userv1 "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/user/v1"
	userv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/user/v1/userv1connect"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

func newTestJWTManager(t *testing.T) *auth.JWTManager {
	t.Helper()
	jwt, err := auth.NewJWTManager("test-secret-key-32chars-long!!", "chatapp")
	if err != nil {
		t.Fatal(err)
	}
	return jwt
}

// stubAuthHandler returns CodeUnimplemented for all methods but is sufficient to test interceptor
type stubAuthHandler struct {
	authv1connect.UnimplementedAuthServiceHandler
}

// stubUserHandler
type stubUserHandler struct {
	userv1connect.UnimplementedUserServiceHandler
}

func setupTestServer(t *testing.T, jwt *auth.JWTManager) *httptest.Server {
	t.Helper()
	interceptors := connect.WithInterceptors(NewAuthInterceptor(jwt))
	mux := http.NewServeMux()
	mux.Handle(authv1connect.NewAuthServiceHandler(&stubAuthHandler{}, interceptors))
	mux.Handle(userv1connect.NewUserServiceHandler(&stubUserHandler{}, interceptors))
	return httptest.NewServer(mux)
}

func TestInterceptor_PublicEndpoint_NoAuth(t *testing.T) {
	jwt := newTestJWTManager(t)
	srv := setupTestServer(t, jwt)
	defer srv.Close()

	client := authv1connect.NewAuthServiceClient(http.DefaultClient, srv.URL)

	// SignUp is public - should pass interceptor (will get Unimplemented from stub)
	_, err := client.SignUp(context.Background(), &authv1.SignUpRequest{
		Email:       "test@example.com",
		Password:    "password123",
		DisplayName: "Test",
	})
	if err == nil {
		t.Fatal("expected error from unimplemented stub")
	}
	if connect.CodeOf(err) != connect.CodeUnimplemented {
		t.Errorf("expected CodeUnimplemented for public endpoint, got %v", connect.CodeOf(err))
	}
}

func TestInterceptor_ProtectedEndpoint_NoToken(t *testing.T) {
	jwt := newTestJWTManager(t)
	srv := setupTestServer(t, jwt)
	defer srv.Close()

	client := userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL)

	_, err := client.GetMe(context.Background(), &userv1.GetMeRequest{})
	if err == nil {
		t.Fatal("expected error")
	}
	if connect.CodeOf(err) != connect.CodeUnauthenticated {
		t.Errorf("expected CodeUnauthenticated, got %v", connect.CodeOf(err))
	}
}

func TestInterceptor_ProtectedEndpoint_ValidToken(t *testing.T) {
	jwt := newTestJWTManager(t)
	srv := setupTestServer(t, jwt)
	defer srv.Close()

	token, err := jwt.GenerateAccessToken("user-123")
	if err != nil {
		t.Fatal(err)
	}

	client := userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL,
		connect.WithInterceptors(&tokenInjector{token: token}),
	)

	// Should pass interceptor, get Unimplemented from stub
	_, err = client.GetMe(context.Background(), &userv1.GetMeRequest{})
	if err == nil {
		t.Fatal("expected error from unimplemented stub")
	}
	if connect.CodeOf(err) != connect.CodeUnimplemented {
		t.Errorf("expected CodeUnimplemented (passed auth), got %v", connect.CodeOf(err))
	}
}

func TestInterceptor_ProtectedEndpoint_InvalidToken(t *testing.T) {
	jwt := newTestJWTManager(t)
	srv := setupTestServer(t, jwt)
	defer srv.Close()

	client := userv1connect.NewUserServiceClient(http.DefaultClient, srv.URL,
		connect.WithInterceptors(&tokenInjector{token: "invalid-token"}),
	)

	_, err := client.GetMe(context.Background(), &userv1.GetMeRequest{})
	if err == nil {
		t.Fatal("expected error")
	}
	if connect.CodeOf(err) != connect.CodeUnauthenticated {
		t.Errorf("expected CodeUnauthenticated, got %v", connect.CodeOf(err))
	}
}

// tokenInjector is a client-side interceptor that adds Bearer token
type tokenInjector struct {
	token string
}

func (i *tokenInjector) WrapUnary(next connect.UnaryFunc) connect.UnaryFunc {
	return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
		req.Header().Set("Authorization", "Bearer "+i.token)
		return next(ctx, req)
	}
}

func (i *tokenInjector) WrapStreamingClient(next connect.StreamingClientFunc) connect.StreamingClientFunc {
	return next
}

func (i *tokenInjector) WrapStreamingHandler(next connect.StreamingHandlerFunc) connect.StreamingHandlerFunc {
	return next
}
