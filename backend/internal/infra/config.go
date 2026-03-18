package infra

import (
	"fmt"
	"os"
)

type Config struct {
	ServerAddr  string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	GCSBucket   string
}

func LoadConfig() (*Config, error) {
	cfg := &Config{
		ServerAddr:  getEnv("SERVER_ADDR", ":8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		GCSBucket:   os.Getenv("GCS_BUCKET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
