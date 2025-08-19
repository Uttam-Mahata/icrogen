package main

import (
	"icrogen/internal/database"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Printf("No .env file found: %v", err)
	}

	// Get database URL from environment
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "root:password@tcp(localhost:3306)/icrogen?charset=utf8mb4&parseTime=True&loc=Local"
	}

	// Connect to database
	db, err := database.Connect(databaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Seed the database
	if err := database.SeedData(db); err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	log.Println("Database seeded successfully!")
}