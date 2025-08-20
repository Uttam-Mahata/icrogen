package main

import (
	"fmt"
	"icrogen/internal/config"
	"icrogen/internal/database"
	"icrogen/internal/models"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Connect to database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto-migrate the SubjectType model
	if err := db.AutoMigrate(&models.SubjectType{}); err != nil {
		log.Fatal("Failed to migrate SubjectType model:", err)
	}

	// Define subject types
	subjectTypes := []models.SubjectType{
		{
			Name:  "Core Theory",
			IsLab: false,
			RequiresRoom: true,
			DefaultConsecutivePreferred: true,
		},
		{
			Name:  "Laboratory",
			IsLab: true,
			RequiresRoom: true,
			DefaultConsecutivePreferred: true,
		},
		{
			Name:  "Departmental Elective",
			IsLab: false,
			RequiresRoom: true,
			DefaultConsecutivePreferred: true,
		},
		{
			Name:  "Open Elective",
			IsLab: false,
			RequiresRoom: true,
			DefaultConsecutivePreferred: true,
		},
		{
			Name:  "Other",
			IsLab: false,
			RequiresRoom: false,
			DefaultConsecutivePreferred: false,
		},
	}

	// Insert subject types
	for _, st := range subjectTypes {
		var existing models.SubjectType
		result := db.Where("name = ?", st.Name).First(&existing)
		
		if result.Error == nil {
			fmt.Printf("Subject type '%s' already exists, skipping...\n", st.Name)
			continue
		}

		if err := db.Create(&st).Error; err != nil {
			log.Printf("Failed to create subject type '%s': %v\n", st.Name, err)
		} else {
			fmt.Printf("Created subject type: %s (IsLab: %v)\n", st.Name, st.IsLab)
		}
	}

	fmt.Println("Subject types seeding completed!")
}