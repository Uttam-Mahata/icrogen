package main

import (
	"flag"
	"log"
	"os"

	"icrogen/internal/config"
	"icrogen/internal/database"
	"icrogen/internal/transport/http"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func main() {
	// Parse command line flags
	migrate := flag.Bool("migrate", false, "Run database migrations")
	flag.Parse()

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

	// Initialize database with or without migrations
	var db *gorm.DB
	if *migrate || os.Getenv("RUN_MIGRATIONS") == "true" {
		logrus.Info("Running database migrations...")
		db, err = database.Connect(cfg.DatabaseURL)
		if err != nil {
			logrus.Fatal("Failed to connect to database:", err)
		}
		logrus.Info("Database connected and migrations completed successfully")
	} else {
		logrus.Info("Connecting to database without migrations...")
		db, err = database.ConnectWithoutMigration(cfg.DatabaseURL)
		if err != nil {
			logrus.Fatal("Failed to connect to database:", err)
		}
		logrus.Info("Database connected successfully")
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