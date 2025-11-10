package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	RedisURL    string
	LogLevel    string
	JWTSecret   string
}

func Load() (*Config, error) {
	return &Config{
		Port:        getEnv("PORT", "8888"),
		DatabaseURL: getEnv("DATABASE_URL", "root:password@tcp(localhost:3306)/icrogen?charset=utf8mb4&parseTime=True&loc=Local"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
