package infra

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/cors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func NewServer(cfg *Config, handler http.Handler) *http.Server {
	c := cors.New(cors.Options{
		AllowedOrigins: cfg.CORSOrigins,
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"Content-Type",
			"Connect-Protocol-Version",
			"Connect-Timeout-Ms",
			"Grpc-Timeout",
			"Authorization",
		},
		ExposedHeaders: []string{
			"Connect-Protocol-Version",
			"Grpc-Status",
			"Grpc-Message",
		},
		AllowCredentials: true,
	})

	// h2c enables HTTP/2 cleartext — required for gRPC clients (grpcui, grpcurl)
	// while still supporting HTTP/1.1 for Connect protocol JSON requests
	h2cHandler := h2c.NewHandler(c.Handler(handler), &http2.Server{})

	return &http.Server{
		Addr:         cfg.ServerAddr,
		Handler:      h2cHandler,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// ListenAndServeGracefully starts the server and handles graceful shutdown on SIGINT/SIGTERM.
func ListenAndServeGracefully(srv *http.Server) error {
	errCh := make(chan error, 1)
	go func() {
		fmt.Printf("Backend server listening on %s\n", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
		close(errCh)
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-quit:
		fmt.Printf("Received signal %s, shutting down...\n", sig)
	case err := <-errCh:
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	return srv.Shutdown(ctx)
}
