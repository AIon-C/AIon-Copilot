package main

import (
	"fmt"
	"net/http"
	"os"

	"connectrpc.com/connect"

	authv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/auth/v1/authv1connect"
	channelv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/channel/v1/channelv1connect"
	messagev1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/message/v1/messagev1connect"
	reactionv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/reaction/v1/reactionv1connect"
	threadv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/thread/v1/threadv1connect"
	userv1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/user/v1/userv1connect"
	workspacev1connect "github.com/AIon-C/AIon-Copilot/backend/gen/go/chatapp/workspace/v1/workspacev1connect"
	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/handler"
	"github.com/AIon-C/AIon-Copilot/backend/internal/adapter/persistence"
	"github.com/AIon-C/AIon-Copilot/backend/internal/infra"
	"github.com/AIon-C/AIon-Copilot/backend/internal/usecase"
	"github.com/AIon-C/AIon-Copilot/backend/pkg/auth"
)

func main() {
	cfg, err := infra.LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load config: %v\n", err)
		os.Exit(1)
	}

	db, err := infra.NewDatabase(cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	rdb, err := infra.NewRedis(cfg.RedisURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to redis: %v\n", err)
		os.Exit(1)
	}
	defer rdb.Close()

	// GORM
	gormDB, err := infra.NewGormDB(db)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to init GORM: %v\n", err)
		os.Exit(1)
	}

	// Repository
	userRepo := persistence.NewUserRepository(gormDB)
	refreshTokenRepo := persistence.NewRefreshTokenRepository(gormDB)
	wsRepo := persistence.NewWorkspaceRepository(gormDB)
	wsMemberRepo := persistence.NewWorkspaceMemberRepository(gormDB)
	wsInviteRepo := persistence.NewWorkspaceInviteRepository(gormDB)
	chRepo := persistence.NewChannelRepository(gormDB)
	chMemberRepo := persistence.NewChannelMemberRepository(gormDB)
	msgRepo := persistence.NewMessageRepository(gormDB)
	msgAttachmentRepo := persistence.NewMessageAttachmentRepository(gormDB)
	reactionRepo := persistence.NewReactionRepository(gormDB)

	// JWT
	jwtManager, err := auth.NewJWTManager(cfg.JWTSecret, "chatapp")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to init JWT manager: %v\n", err)
		os.Exit(1)
	}

	// Usecase
	authUC := usecase.NewAuthUsecase(userRepo, refreshTokenRepo, jwtManager)
	userUC := usecase.NewUserUsecase(userRepo)
	wsUC := usecase.NewWorkspaceUsecase(wsRepo, wsMemberRepo, wsInviteRepo)
	chUC := usecase.NewChannelUsecase(chRepo, chMemberRepo)
	msgUC := usecase.NewMessageUsecase(msgRepo, msgAttachmentRepo)
	reactionUC := usecase.NewReactionUsecase(reactionRepo)

	// Handler + Interceptor
	interceptors := connect.WithInterceptors(handler.NewAuthInterceptor(jwtManager))

	mux := http.NewServeMux()

	// Health & readiness checks
	infra.RegisterHealthHandlers(mux, db, rdb)

	// Connect RPC handlers
	mux.Handle(authv1connect.NewAuthServiceHandler(handler.NewAuthHandler(authUC), interceptors))
	mux.Handle(userv1connect.NewUserServiceHandler(handler.NewUserHandler(userUC), interceptors))
	mux.Handle(workspacev1connect.NewWorkspaceServiceHandler(handler.NewWorkspaceHandler(wsUC), interceptors))
	mux.Handle(channelv1connect.NewChannelServiceHandler(handler.NewChannelHandler(chUC), interceptors))
	mux.Handle(messagev1connect.NewMessageServiceHandler(handler.NewMessageHandler(msgUC), interceptors))
	mux.Handle(threadv1connect.NewThreadServiceHandler(handler.NewThreadHandler(msgUC), interceptors))
	mux.Handle(reactionv1connect.NewReactionServiceHandler(handler.NewReactionHandler(reactionUC), interceptors))

	srv := infra.NewServer(cfg, mux)
	if err := infra.ListenAndServeGracefully(srv); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
