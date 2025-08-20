package main

import (
    "fmt"
    "icrogen/internal/database"
    "log"
    "os"

    "github.com/joho/godotenv"
)

func main() {
    // Load .env file
    if err := godotenv.Load(); err != nil {
        log.Println("Warning: .env file not found")
    }

    // Get database URL from environment
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        log.Fatal("DATABASE_URL is not set")
    }

    // Connect to database
    db, err := database.Connect(dbURL)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    sqlDB, err := db.DB()
    if err != nil {
        log.Fatal("Failed to get underlying SQL database:", err)
    }
    defer sqlDB.Close()

    fmt.Println("=== UPDATING TOTAL STUDENTS FOR TESTING ===\n")

    // Update semester offering with ID 90002 to have total students
    // Let's set it to 120 students to test lab division
    totalStudents := 120
    
    result := db.Table("semester_offerings").
        Where("id = ?", 90002).
        Update("total_students", totalStudents)
    
    if result.Error != nil {
        log.Fatal("Failed to update total students:", result.Error)
    }
    
    fmt.Printf("✅ Updated semester offering 90002 to have %d total students\n", totalStudents)
    fmt.Printf("   Rows affected: %d\n", result.RowsAffected)
    
    // Verify the update
    var count int64
    db.Table("semester_offerings").
        Where("id = ? AND total_students = ?", 90002, totalStudents).
        Count(&count)
    
    if count > 0 {
        fmt.Printf("✅ Verification successful: total_students is now %d\n", totalStudents)
    } else {
        fmt.Println("❌ Verification failed: update might not have worked")
    }

    // Show expected lab divisions
    fmt.Println("\n=== EXPECTED LAB DIVISIONS ===")
    fmt.Println("With 120 total students:")
    fmt.Println("- Digital Logic Lab (H/W LAB, capacity 60): Should create 2 groups (Gx, Gy)")
    fmt.Println("- Data Structures Lab (CSD-2, capacity 120): No division needed (120 = 120)")
    fmt.Println("- Signals and Systems Lab (H/W LAB, capacity 60): Should create 2 groups (Gx, Gy)")
}
