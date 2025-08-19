package models

import (
	"time"

	"gorm.io/gorm"
)

// TimeSlot represents the static time slot definitions
type TimeSlot struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	DayOfWeek   int       `json:"day_of_week" gorm:"not null"` // 1=Monday, 5=Friday
	SlotNumber  int       `json:"slot_number" gorm:"not null"` // 1-8
	StartTime   time.Time `json:"start_time" gorm:"type:time;not null"`
	EndTime     time.Time `json:"end_time" gorm:"type:time;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ScheduleRun represents a routine generation run
type ScheduleRun struct {
	ID                   uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	SemesterOfferingID   uint             `json:"semester_offering_id" gorm:"not null"`
	Status               string           `json:"status" gorm:"type:enum('DRAFT','COMMITTED','CANCELLED','FAILED');default:'DRAFT'"`
	AlgorithmVersion     string           `json:"algorithm_version" gorm:"type:varchar(20)"`
	GeneratedByUserID    *uint            `json:"generated_by_user_id"`
	GeneratedAt          time.Time        `json:"generated_at"`
	CommittedAt          *time.Time       `json:"committed_at"`
	Meta                 string           `json:"meta" gorm:"type:json"` // JSON for stats, conflicts, choices
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
	DeletedAt            gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	SemesterOffering     SemesterOffering `json:"semester_offering,omitempty" gorm:"foreignKey:SemesterOfferingID"`
	ScheduleBlocks       []ScheduleBlock  `json:"schedule_blocks,omitempty" gorm:"foreignKey:ScheduleRunID"`
	ScheduleEntries      []ScheduleEntry  `json:"schedule_entries,omitempty" gorm:"foreignKey:ScheduleRunID"`
}

// ScheduleBlock represents a continuous block of time (for multi-slot classes)
type ScheduleBlock struct {
	ID               uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	ScheduleRunID    uint             `json:"schedule_run_id" gorm:"not null"`
	CourseOfferingID uint             `json:"course_offering_id" gorm:"not null"`
	TeacherID        uint             `json:"teacher_id" gorm:"not null"`
	RoomID           uint             `json:"room_id" gorm:"not null"`
	DayOfWeek        int              `json:"day_of_week" gorm:"not null"`
	SlotStart        int              `json:"slot_start" gorm:"not null"`
	SlotLength       int              `json:"slot_length" gorm:"not null"` // 1, 2, or 3 slots
	IsLab            bool             `json:"is_lab" gorm:"default:false"`
	CreatedAt        time.Time        `json:"created_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	DeletedAt        gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	ScheduleRun      ScheduleRun      `json:"schedule_run,omitempty" gorm:"foreignKey:ScheduleRunID"`
	CourseOffering   CourseOffering   `json:"course_offering,omitempty" gorm:"foreignKey:CourseOfferingID"`
	Teacher          Teacher          `json:"teacher,omitempty" gorm:"foreignKey:TeacherID"`
	Room             Room             `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	ScheduleEntries  []ScheduleEntry  `json:"schedule_entries,omitempty" gorm:"foreignKey:BlockID"`
}

// ScheduleEntry represents individual time slots in the schedule
type ScheduleEntry struct {
	ID                   uint             `json:"id" gorm:"primaryKey;autoIncrement"`
	ScheduleRunID        uint             `json:"schedule_run_id" gorm:"not null"`
	SemesterOfferingID   uint             `json:"semester_offering_id" gorm:"not null"`
	SessionID            uint             `json:"session_id" gorm:"not null"` // Denormalized for fast global conflict checks
	CourseOfferingID     uint             `json:"course_offering_id" gorm:"not null"`
	TeacherID            uint             `json:"teacher_id" gorm:"not null"`
	RoomID               uint             `json:"room_id" gorm:"not null"`
	DayOfWeek            int              `json:"day_of_week" gorm:"not null"`
	SlotNumber           int              `json:"slot_number" gorm:"not null"`
	BlockID              *uint            `json:"block_id"` // Reference to parent block
	CreatedAt            time.Time        `json:"created_at"`
	UpdatedAt            time.Time        `json:"updated_at"`
	DeletedAt            gorm.DeletedAt   `json:"-" gorm:"index"`
	
	// Relationships
	ScheduleRun          ScheduleRun      `json:"schedule_run,omitempty" gorm:"foreignKey:ScheduleRunID"`
	SemesterOffering     SemesterOffering `json:"semester_offering,omitempty" gorm:"foreignKey:SemesterOfferingID"`
	Session              Session          `json:"session,omitempty" gorm:"foreignKey:SessionID"`
	CourseOffering       CourseOffering   `json:"course_offering,omitempty" gorm:"foreignKey:CourseOfferingID"`
	Teacher              Teacher          `json:"teacher,omitempty" gorm:"foreignKey:TeacherID"`
	Room                 Room             `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	Block                *ScheduleBlock   `json:"block,omitempty" gorm:"foreignKey:BlockID"`
}

// ClassBlock represents a class session to be scheduled (used in algorithm)
type ClassBlock struct {
	SubjectID         uint `json:"subject_id"`
	TeacherID         uint `json:"teacher_id"`
	RoomID            uint `json:"room_id"`
	DurationSlots     int  `json:"duration_slots"` // 1, 2, or 3 slots
	IsLab             bool `json:"is_lab"`
	SemesterOfferingID uint `json:"semester_offering_id"`
	CourseOfferingID  uint `json:"course_offering_id"`
}

// TimeSlotInfo represents timetable slot information during generation
type TimeSlotInfo struct {
	IsBooked bool        `json:"is_booked"`
	Block    *ClassBlock `json:"block,omitempty"`
}

// Timetable represents the weekly timetable during generation
// map[DayOfWeek][SlotNumber]TimeSlotInfo
type Timetable map[int]map[int]TimeSlotInfo