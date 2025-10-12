package main

import (
	"log"
	"os"

	"icrogen/internal/config"
	"icrogen/internal/database"

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
	logrus.SetFormatter(&logrus.JSONFormatter{})
	logrus.SetOutput(os.Stdout)
	logrus.SetLevel(logrus.InfoLevel)

	// Connect to database
	logrus.Info("Connecting to database...")
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logrus.Fatal("Failed to connect to database:", err)
	}
	logrus.Info("Database connected successfully")

	// Run migrations
	logrus.Info("Running database migrations...")
	if err := database.Migrate(db); err != nil {
		logrus.Fatal("Failed to run migrations:", err)
	}

	logrus.Info("Migrations completed successfully!")
}
