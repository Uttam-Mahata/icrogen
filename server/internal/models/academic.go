package models

import (
	"time"

	"gorm.io/gorm"
)

// Session represents an academic session (Fall/Spring)
type Session struct {
	ID              uint               `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string             `json:"name" gorm:"type:enum('SPRING','FALL');not null"`
	AcademicYear    string             `json:"academic_year" gorm:"type:varchar(9);not null"` // e.g., "2025-26"
	Parity          string             `json:"parity" gorm:"type:enum('ODD','EVEN');not null"`
	StartDate       time.Time          `json:"start_date"`
	EndDate         time.Time          `json:"end_date"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
	DeletedAt       gorm.DeletedAt     `json:"-" gorm:"index"`
	
	// Relationships
	SemesterOfferings []SemesterOffering `json:"semester_offerings,omitempty" gorm:"foreignKey:SessionID"`
	ScheduleEntries   []ScheduleEntry    `json:"schedule_entries,omitempty" gorm:"foreignKey:SessionID"`
}

// SemesterDefinition represents the definition of semesters for a programme
type SemesterDefinition struct {
	ID             uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	ProgrammeID    uint           `json:"programme_id" gorm:"not null"`
	SemesterNumber int            `json:"semester_number" gorm:"not null"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Programme      Programme      `json:"programme,omitempty" gorm:"foreignKey:ProgrammeID"`
}

// SemesterOffering represents a specific semester offering for a department
type SemesterOffering struct {
	ID             uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	ProgrammeID    uint             `json:"programme_id" gorm:"not null"`
	DepartmentID   uint             `json:"department_id" gorm:"not null"`
	SessionID      uint             `json:"session_id" gorm:"not null"`
	SemesterNumber int              `json:"semester_number" gorm:"not null"`
	Status         string           `json:"status" gorm:"type:enum('DRAFT','ACTIVE','ARCHIVED');default:'DRAFT'"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
	DeletedAt      gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	Programme        Programme        `json:"programme,omitempty" gorm:"foreignKey:ProgrammeID"`
	Department       Department       `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	Session          Session          `json:"session,omitempty" gorm:"foreignKey:SessionID"`
	CourseOfferings  []CourseOffering `json:"course_offerings,omitempty" gorm:"foreignKey:SemesterOfferingID"`
	ScheduleRuns     []ScheduleRun    `json:"schedule_runs,omitempty" gorm:"foreignKey:SemesterOfferingID"`
}

// CourseOffering represents a subject offered in a specific semester
type CourseOffering struct {
	ID                   uint                 `json:"id" gorm:"primaryKey;autoIncrement"`
	SemesterOfferingID   uint                 `json:"semester_offering_id" gorm:"not null"`
	SubjectID            uint                 `json:"subject_id" gorm:"not null"`
	WeeklyRequiredSlots  int                  `json:"weekly_required_slots" gorm:"not null"`
	RequiredPattern      string               `json:"required_pattern" gorm:"type:json"` // JSON array like ["2+2"] or ["3"]
	IsLab                bool                 `json:"is_lab" gorm:"default:false"`
	PreferredRoomID      *uint                `json:"preferred_room_id"`
	Notes                string               `json:"notes" gorm:"type:text"`
	CreatedAt            time.Time            `json:"created_at"`
	UpdatedAt            time.Time            `json:"updated_at"`
	DeletedAt            gorm.DeletedAt       `json:"-" gorm:"index"`
	
	// Relationships
	SemesterOffering     SemesterOffering     `json:"semester_offering,omitempty" gorm:"foreignKey:SemesterOfferingID"`
	Subject              Subject              `json:"subject,omitempty" gorm:"foreignKey:SubjectID"`
	PreferredRoom        *Room                `json:"preferred_room,omitempty" gorm:"foreignKey:PreferredRoomID"`
	TeacherAssignments   []TeacherAssignment  `json:"teacher_assignments,omitempty" gorm:"foreignKey:CourseOfferingID"`
	RoomAssignments      []RoomAssignment     `json:"room_assignments,omitempty" gorm:"foreignKey:CourseOfferingID"`
	ScheduleEntries      []ScheduleEntry      `json:"schedule_entries,omitempty" gorm:"foreignKey:CourseOfferingID"`
}

// TeacherAssignment represents assignment of teachers to course offerings
type TeacherAssignment struct {
	ID               uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	CourseOfferingID uint           `json:"course_offering_id" gorm:"not null"`
	TeacherID        uint           `json:"teacher_id" gorm:"not null"`
	Weight           int            `json:"weight" gorm:"default:1"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	CourseOffering   CourseOffering `json:"course_offering,omitempty" gorm:"foreignKey:CourseOfferingID"`
	Teacher          Teacher        `json:"teacher,omitempty" gorm:"foreignKey:TeacherID"`
}

// RoomAssignment represents assignment of rooms to course offerings
type RoomAssignment struct {
	ID               uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	CourseOfferingID uint           `json:"course_offering_id" gorm:"not null"`
	RoomID           uint           `json:"room_id" gorm:"not null"`
	Priority         int            `json:"priority" gorm:"default:1"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	CourseOffering   CourseOffering `json:"course_offering,omitempty" gorm:"foreignKey:CourseOfferingID"`
	Room             Room           `json:"room,omitempty" gorm:"foreignKey:RoomID"`
}