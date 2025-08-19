package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Example data structures
type Programme struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	DurationYears  int    `json:"duration_years"`
	TotalSemesters int    `json:"total_semesters"`
}

type Department struct {
	ID          uint `json:"id"`
	Name        string `json:"name"`
	Strength    int    `json:"strength"`
	ProgrammeID uint   `json:"programme_id"`
}

type Teacher struct {
	ID                 uint   `json:"id"`
	Name               string `json:"name"`
	Initials           string `json:"initials"`
	Email              string `json:"email"`
	DepartmentID       uint   `json:"department_id"`
	MaxWeeklyLoadSlots int    `json:"max_weekly_load_slots"`
}

type SubjectType struct {
	ID                        uint   `json:"id"`
	Name                      string `json:"name"`
	IsLab                     bool   `json:"is_lab"`
	DefaultConsecutivePreferred bool `json:"default_consecutive_preferred"`
}

type Subject struct {
	ID               uint `json:"id"`
	Name             string `json:"name"`
	Code             string `json:"code"`
	Credit           int    `json:"credit"`
	ClassLoadPerWeek int    `json:"class_load_per_week"`
	ProgrammeID      uint   `json:"programme_id"`
	DepartmentID     uint   `json:"department_id"`
	SubjectTypeID    uint   `json:"subject_type_id"`
}

type Room struct {
	ID           uint   `json:"id"`
	Name         string `json:"name"`
	RoomNumber   string `json:"room_number"`
	Capacity     int    `json:"capacity"`
	Type         string `json:"type"`
	DepartmentID *uint  `json:"department_id"`
}

type Session struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	AcademicYear string    `json:"academic_year"`
	Parity       string    `json:"parity"`
	StartDate    time.Time `json:"start_date"`
	EndDate      time.Time `json:"end_date"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

const baseURL = "http://localhost:8080/api"

func main() {
	fmt.Println("ICRoGen API Example - Setting up sample data...")
	
	// Wait for server to be ready
	fmt.Println("Waiting for server to be ready...")
	waitForServer()
	
	// Create sample data
	if err := createSampleData(); err != nil {
		fmt.Printf("Error creating sample data: %v\n", err)
		return
	}
	
	fmt.Println("Sample data created successfully!")
	fmt.Println("You can now:")
	fmt.Println("1. Visit http://localhost:8081 (Adminer) to view the database")
	fmt.Println("2. Use the API endpoints to manage the data")
	fmt.Println("3. Generate routines for semester offerings")
}

func waitForServer() {
	for i := 0; i < 30; i++ {
		resp, err := http.Get(baseURL + "/health")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			fmt.Println("Server is ready!")
			return
		}
		if resp != nil {
			resp.Body.Close()
		}
		fmt.Printf("Waiting for server... (%d/30)\n", i+1)
		time.Sleep(2 * time.Second)
	}
	fmt.Println("Server not ready, but continuing...")
}

func createSampleData() error {
	// 1. Create Programme
	programme := map[string]interface{}{
		"name":            "B.Tech",
		"duration_years":  4,
		"total_semesters": 8,
	}
	programmeResp, err := postJSON("/programmes", programme)
	if err != nil {
		return fmt.Errorf("failed to create programme: %w", err)
	}
	programmeID := uint(programmeResp.Data.(map[string]interface{})["id"].(float64))
	fmt.Printf("Created Programme: %s (ID: %d)\n", programme["name"], programmeID)
	
	// 2. Create Departments
	departments := []map[string]interface{}{
		{
			"name":         "Computer Science & Technology",
			"strength":     60,
			"programme_id": programmeID,
		},
		{
			"name":         "Electronics & Communication Engineering",
			"strength":     60,
			"programme_id": programmeID,
		},
	}
	
	var departmentIDs []uint
	for _, dept := range departments {
		resp, err := postJSON("/departments", dept)
		if err != nil {
			return fmt.Errorf("failed to create department: %w", err)
		}
		deptID := uint(resp.Data.(map[string]interface{})["id"].(float64))
		departmentIDs = append(departmentIDs, deptID)
		fmt.Printf("Created Department: %s (ID: %d)\n", dept["name"], deptID)
	}
	
	// 3. Create Subject Types
	subjectTypes := []map[string]interface{}{
		{
			"name":                         "Theory",
			"is_lab":                       false,
			"default_consecutive_preferred": true,
		},
		{
			"name":                         "Lab",
			"is_lab":                       true,
			"default_consecutive_preferred": true,
		},
	}
	
	var subjectTypeIDs []uint
	for _, st := range subjectTypes {
		resp, err := postJSON("/subject-types", st)
		if err != nil {
			// Skip if already exists
			fmt.Printf("Subject type %s may already exist\n", st["name"])
			continue
		}
		stID := uint(resp.Data.(map[string]interface{})["id"].(float64))
		subjectTypeIDs = append(subjectTypeIDs, stID)
		fmt.Printf("Created Subject Type: %s (ID: %d)\n", st["name"], stID)
	}
	
	// If subject types already exist, get them
	if len(subjectTypeIDs) == 0 {
		subjectTypeIDs = []uint{1, 2} // Assume default IDs
	}
	
	// 4. Create Rooms
	rooms := []map[string]interface{}{
		{
			"name":         "LH-101",
			"room_number":  "LH-101",
			"capacity":     60,
			"type":         "THEORY",
			"department_id": departmentIDs[0],
		},
		{
			"name":         "LAB-201",
			"room_number":  "LAB-201",
			"capacity":     30,
			"type":         "LAB",
			"department_id": departmentIDs[0],
		},
		{
			"name":         "LH-102",
			"room_number":  "LH-102",
			"capacity":     60,
			"type":         "THEORY",
			"department_id": departmentIDs[1],
		},
	}
	
	var roomIDs []uint
	for _, room := range rooms {
		resp, err := postJSON("/rooms", room)
		if err != nil {
			return fmt.Errorf("failed to create room: %w", err)
		}
		roomID := uint(resp.Data.(map[string]interface{})["id"].(float64))
		roomIDs = append(roomIDs, roomID)
		fmt.Printf("Created Room: %s (ID: %d)\n", room["name"], roomID)
	}
	
	// 5. Create Teachers
	teachers := []map[string]interface{}{
		{
			"name":                 "Dr. John Smith",
			"initials":             "JS",
			"email":                "john.smith@example.com",
			"department_id":        departmentIDs[0],
			"max_weekly_load_slots": 20,
		},
		{
			"name":                 "Prof. Mary Johnson",
			"initials":             "MJ",
			"email":                "mary.johnson@example.com",
			"department_id":        departmentIDs[0],
			"max_weekly_load_slots": 18,
		},
		{
			"name":                 "Dr. Robert Brown",
			"initials":             "RB",
			"email":                "robert.brown@example.com",
			"department_id":        departmentIDs[1],
			"max_weekly_load_slots": 20,
		},
	}
	
	var teacherIDs []uint
	for _, teacher := range teachers {
		resp, err := postJSON("/teachers", teacher)
		if err != nil {
			return fmt.Errorf("failed to create teacher: %w", err)
		}
		teacherID := uint(resp.Data.(map[string]interface{})["id"].(float64))
		teacherIDs = append(teacherIDs, teacherID)
		fmt.Printf("Created Teacher: %s (ID: %d)\n", teacher["name"], teacherID)
	}
	
	// 6. Create Subjects
	subjects := []map[string]interface{}{
		{
			"name":               "Data Structures and Algorithms",
			"code":               "CS301",
			"credit":             4,
			"class_load_per_week": 4,
			"programme_id":       programmeID,
			"department_id":      departmentIDs[0],
			"subject_type_id":    subjectTypeIDs[0], // Theory
		},
		{
			"name":               "Data Structures Lab",
			"code":               "CS302",
			"credit":             2,
			"class_load_per_week": 3,
			"programme_id":       programmeID,
			"department_id":      departmentIDs[0],
			"subject_type_id":    subjectTypeIDs[1], // Lab
		},
		{
			"name":               "Computer Networks",
			"code":               "CS303",
			"credit":             3,
			"class_load_per_week": 3,
			"programme_id":       programmeID,
			"department_id":      departmentIDs[0],
			"subject_type_id":    subjectTypeIDs[0], // Theory
		},
	}
	
	var subjectIDs []uint
	for _, subject := range subjects {
		resp, err := postJSON("/subjects", subject)
		if err != nil {
			return fmt.Errorf("failed to create subject: %w", err)
		}
		subjectID := uint(resp.Data.(map[string]interface{})["id"].(float64))
		subjectIDs = append(subjectIDs, subjectID)
		fmt.Printf("Created Subject: %s (ID: %d)\n", subject["name"], subjectID)
	}
	
	// 7. Create Session
	session := map[string]interface{}{
		"name":          "FALL",
		"academic_year": "2025-26",
		"start_date":    "2025-08-01T00:00:00Z",
		"end_date":      "2025-12-31T23:59:59Z",
	}
	
	sessionResp, err := postJSON("/sessions", session)
	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	sessionID := uint(sessionResp.Data.(map[string]interface{})["id"].(float64))
	fmt.Printf("Created Session: %s %s (ID: %d)\n", session["name"], session["academic_year"], sessionID)
	
	fmt.Println("\nSample data creation completed!")
	fmt.Printf("Programme ID: %d\n", programmeID)
	fmt.Printf("Department IDs: %v\n", departmentIDs)
	fmt.Printf("Teacher IDs: %v\n", teacherIDs)
	fmt.Printf("Subject IDs: %v\n", subjectIDs)
	fmt.Printf("Room IDs: %v\n", roomIDs)
	fmt.Printf("Session ID: %d\n", sessionID)
	
	return nil
}

func postJSON(endpoint string, data map[string]interface{}) (*APIResponse, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	
	resp, err := http.Post(baseURL+endpoint, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	var apiResp APIResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, err
	}
	
	if !apiResp.Success {
		return nil, fmt.Errorf("API error: %s", apiResp.Error)
	}
	
	return &apiResp, nil
}