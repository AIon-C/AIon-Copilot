package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/AIon-C/AIon-Copilot/backend/internal/infra"
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

	mux := http.NewServeMux()

	// Health & readiness checks
	infra.RegisterHealthHandlers(mux, db, rdb)

	// TODO: Register Connect RPC handlers
	// mux.Handle(authv1connect.NewAuthServiceHandler(...))
	// mux.Handle(userv1connect.NewUserServiceHandler(...))
	// mux.Handle(workspacev1connect.NewWorkspaceServiceHandler(...))
	// mux.Handle(channelv1connect.NewChannelServiceHandler(...))
	// mux.Handle(messagev1connect.NewMessageServiceHandler(...))

	srv := infra.NewServer(cfg, mux)
	if err := infra.ListenAndServeGracefully(srv); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}
