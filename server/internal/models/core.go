package models

import (
	"time"

	"gorm.io/gorm"
)

// Programme represents an academic programme (e.g., B.Tech, M.Sc)
type Programme struct {
	ID              uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name            string           `json:"name" gorm:"type:varchar(255);not null;uniqueIndex"`
	DurationYears   int              `json:"duration_years" gorm:"not null"`
	TotalSemesters  int              `json:"total_semesters" gorm:"not null"`
	IsActive        bool             `json:"is_active" gorm:"default:true"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	DeletedAt       gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	Departments     []Department     `json:"departments,omitempty" gorm:"foreignKey:ProgrammeID"`
	SemesterDefs    []SemesterDefinition `json:"semester_definitions,omitempty" gorm:"foreignKey:ProgrammeID"`
	Subjects        []Subject        `json:"subjects,omitempty" gorm:"foreignKey:ProgrammeID"`
	SemesterOfferings []SemesterOffering `json:"semester_offerings,omitempty" gorm:"foreignKey:ProgrammeID"`
}

// Department represents an academic department within a programme
type Department struct {
	ID           uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name         string           `json:"name" gorm:"type:varchar(255);not null"`
	Strength     int              `json:"strength"`
	ProgrammeID  uint             `json:"programme_id" gorm:"not null"`
	IsActive     bool             `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	DeletedAt    gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	Programme    Programme        `json:"programme,omitempty" gorm:"foreignKey:ProgrammeID"`
	Teachers     []Teacher        `json:"teachers,omitempty" gorm:"foreignKey:DepartmentID"`
	Subjects     []Subject        `json:"subjects,omitempty" gorm:"foreignKey:DepartmentID"`
	Rooms        []Room           `json:"rooms,omitempty" gorm:"foreignKey:DepartmentID"`
	SemesterOfferings []SemesterOffering `json:"semester_offerings,omitempty" gorm:"foreignKey:DepartmentID"`
}

// Teacher represents a faculty member
type Teacher struct {
	ID           uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name         string         `json:"name" gorm:"type:varchar(255);not null"`
	Initials     string         `json:"initials" gorm:"type:varchar(10);uniqueIndex"`
	Email        string         `json:"email" gorm:"type:varchar(255);uniqueIndex"`
	DepartmentID uint           `json:"department_id" gorm:"not null"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Department         Department          `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	TeacherAssignments []TeacherAssignment `json:"teacher_assignments,omitempty" gorm:"foreignKey:TeacherID"`
	ScheduleEntries    []ScheduleEntry     `json:"schedule_entries,omitempty" gorm:"foreignKey:TeacherID"`
}

// SubjectType represents the type of subject (Theory, Lab, etc.)
type SubjectType struct {
	ID                        uint           `json:"id" gorm:"primaryKey;autoIncrement"`
	Name                      string         `json:"name" gorm:"type:varchar(100);not null;uniqueIndex"`
	IsLab                     bool           `json:"is_lab" gorm:"default:false"`
	DefaultConsecutivePreferred bool        `json:"default_consecutive_preferred" gorm:"default:true"`
	CreatedAt                 time.Time      `json:"created_at"`
	UpdatedAt                 time.Time      `json:"updated_at"`
	DeletedAt                 gorm.DeletedAt `json:"-" gorm:"index"`
	
	// Relationships
	Subjects                  []Subject      `json:"subjects,omitempty" gorm:"foreignKey:SubjectTypeID"`
}

// Subject represents a course/subject
type Subject struct {
	ID               uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	Code             string           `json:"code" gorm:"type:varchar(50);not null"`
	Name             string           `json:"name" gorm:"type:varchar(255);not null"`
	Credit           int              `json:"credit" gorm:"not null"`
	ClassLoadPerWeek int              `json:"class_load_per_week" gorm:"not null"`
	ProgrammeID      uint             `json:"programme_id" gorm:"not null"`
	DepartmentID     uint             `json:"department_id" gorm:"not null"`
	SubjectTypeID    uint             `json:"subject_type_id" gorm:"not null"`
	IsActive         bool             `json:"is_active" gorm:"default:true"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	DeletedAt        gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	Programme        Programme        `json:"programme,omitempty" gorm:"foreignKey:ProgrammeID"`
	Department       Department       `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	SubjectType      SubjectType      `json:"subject_type,omitempty" gorm:"foreignKey:SubjectTypeID"`
	CourseOfferings  []CourseOffering `json:"course_offerings,omitempty" gorm:"foreignKey:SubjectID"`
}

// Room represents a classroom or laboratory
type Room struct {
	ID           uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name         string           `json:"name" gorm:"type:varchar(255);not null;uniqueIndex"`
	RoomNumber   string           `json:"room_number" gorm:"type:varchar(50);not null;uniqueIndex"`
	Capacity     int              `json:"capacity"`
	Type         string           `json:"type" gorm:"type:enum('THEORY','LAB','OTHER');not null"`
	DepartmentID *uint            `json:"department_id"` // Optional owner department
	IsActive     bool             `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	DeletedAt    gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	Department      *Department      `json:"department,omitempty" gorm:"foreignKey:DepartmentID"`
	RoomAssignments []RoomAssignment `json:"room_assignments,omitempty" gorm:"foreignKey:RoomID"`
	ScheduleEntries []ScheduleEntry  `json:"schedule_entries,omitempty" gorm:"foreignKey:RoomID"`
}