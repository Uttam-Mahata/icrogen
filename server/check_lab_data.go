package main

import (
	"fmt"
	"icrogen/internal/database"
	"icrogen/internal/models"
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

	fmt.Println("=== CHECKING LAB DATA FOR GROUP DIVISION ===\n")

	// 1. Check semester offerings with total students
	fmt.Println("1. SEMESTER OFFERINGS WITH TOTAL STUDENTS:")
	fmt.Println("-------------------------------------------")
	var semesterOfferings []models.SemesterOffering
	db.Where("status = ?", "ACTIVE").Find(&semesterOfferings)
	
	for _, so := range semesterOfferings {
		var programme models.Programme
		var department models.Department
		db.First(&programme, so.ProgrammeID)
		db.First(&department, so.DepartmentID)
		
		fmt.Printf("ID: %d | %s - %s - Sem %d | Total Students: %d\n", 
			so.ID, programme.Name, department.Name, so.SemesterNumber, so.TotalStudents)
	}

	// 2. Check lab courses and their room assignments
	fmt.Println("\n2. LAB COURSES AND ROOM ASSIGNMENTS:")
	fmt.Println("-------------------------------------")
	
	for _, so := range semesterOfferings {
		var courseOfferings []models.CourseOffering
		db.Where("semester_offering_id = ? AND is_lab = ?", so.ID, true).
			Preload("Subject").
			Preload("RoomAssignments.Room").
			Find(&courseOfferings)
		
		if len(courseOfferings) == 0 {
			continue
		}
		
		fmt.Printf("\nSemester Offering ID %d (Total Students: %d):\n", so.ID, so.TotalStudents)
		
		for _, co := range courseOfferings {
			fmt.Printf("  Lab: %s (ID: %d)\n", co.Subject.Name, co.ID)
			
			if len(co.RoomAssignments) == 0 {
				fmt.Println("    ❌ NO ROOM ASSIGNED")
			} else {
				for _, ra := range co.RoomAssignments {
					fmt.Printf("    Room: %s (Capacity: %d)\n", ra.Room.Name, ra.Room.Capacity)
					
					// Check if division is needed
					if so.TotalStudents > 0 && ra.Room.Capacity > 0 {
						if ra.Room.Capacity < so.TotalStudents {
							numGroups := (so.TotalStudents + ra.Room.Capacity - 1) / ra.Room.Capacity
							fmt.Printf("    ✅ NEEDS DIVISION: %d students / %d capacity = %d groups\n", 
								so.TotalStudents, ra.Room.Capacity, numGroups)
						} else {
							fmt.Printf("    ❌ NO DIVISION NEEDED: %d capacity >= %d students\n", 
								ra.Room.Capacity, so.TotalStudents)
						}
					}
				}
			}
		}
	}

	// 3. Check rooms and their capacities
	fmt.Println("\n3. LAB ROOMS AND CAPACITIES:")
	fmt.Println("-----------------------------")
	var labRooms []models.Room
	db.Where("type = ?", "LAB").Find(&labRooms)
	
	for _, room := range labRooms {
		fmt.Printf("Room: %s (ID: %d) | Capacity: %d\n", room.Name, room.ID, room.Capacity)
	}

	// 4. Check the latest schedule blocks for lab groups
	fmt.Println("\n4. RECENT LAB SCHEDULE BLOCKS:")
	fmt.Println("-------------------------------")
	var scheduleBlocks []models.ScheduleBlock
	db.Where("is_lab = ?", true).
		Order("created_at DESC").
		Limit(10).
		Preload("CourseOffering.Subject").
		Find(&scheduleBlocks)
	
	for _, block := range scheduleBlocks {
		labGroup := block.LabGroup
		if labGroup == "" {
			labGroup = "(no group)"
		}
		fmt.Printf("Block ID: %d | Lab: %s | Group: %s | Created: %s\n", 
			block.ID, block.CourseOffering.Subject.Name, labGroup, block.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	// 5. SQL query to find labs that should be divided
	fmt.Println("\n5. LABS THAT SHOULD BE DIVIDED (SQL Check):")
	fmt.Println("--------------------------------------------")
	
	type LabDivisionCheck struct {
		SubjectName    string
		TotalStudents  int
		RoomCapacity   int
		GroupsNeeded   int
		CourseOfferingID uint
	}
	
	var labChecks []LabDivisionCheck
	query := `
		SELECT 
			s.name as subject_name,
			so.total_students,
			r.capacity as room_capacity,
			CEIL(so.total_students / r.capacity) as groups_needed,
			co.id as course_offering_id
		FROM course_offerings co
		JOIN semester_offerings so ON co.semester_offering_id = so.id
		JOIN subjects s ON co.subject_id = s.id
		JOIN room_assignments ra ON ra.course_offering_id = co.id
		JOIN rooms r ON ra.room_id = r.id
		WHERE co.is_lab = 1 
			AND so.status = 'ACTIVE'
			AND so.total_students > 0
			AND r.capacity > 0
			AND r.capacity < so.total_students
	`
	
	db.Raw(query).Scan(&labChecks)
	
	if len(labChecks) == 0 {
		fmt.Println("❌ NO LABS FOUND THAT NEED DIVISION")
		fmt.Println("\nPossible reasons:")
		fmt.Println("- Room capacities are >= total students")
		fmt.Println("- Total students is 0 for semester offerings")
		fmt.Println("- No active semester offerings with labs")
	} else {
		for _, check := range labChecks {
			fmt.Printf("✅ %s: %d students / %d capacity = %d groups needed (CO ID: %d)\n", 
				check.SubjectName, check.TotalStudents, check.RoomCapacity, 
				check.GroupsNeeded, check.CourseOfferingID)
		}
	}

	fmt.Println("\n=== DIAGNOSTIC COMPLETE ===")
}