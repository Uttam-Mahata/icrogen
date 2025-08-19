package main

import (
	"log"
	"os"

	"icrogen/internal/config"
	"icrogen/internal/database"
	"icrogen/internal/transport/http"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		logrus.Warn("No .env file found")
	}

	// Initialize configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load configuration:", err)
	}

	// Setup logger
	setupLogger(cfg.LogLevel)

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logrus.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(cfg.DatabaseURL); err != nil {
		logrus.Fatal("Failed to run migrations:", err)
	}

	// Initialize and start HTTP server
	server := http.NewServer(cfg, db)
	if err := server.Start(); err != nil {
		logrus.Fatal("Failed to start server:", err)
	}
}

func setupLogger(level string) {
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)

	switch level {
	case "debug":
		logrus.SetLevel(logrus.DebugLevel)
	case "warn":
		logrus.SetLevel(logrus.WarnLevel)
	case "error":
		logrus.SetLevel(logrus.ErrorLevel)
	default:
		logrus.SetLevel(logrus.InfoLevel)
	}
}