package dto

import "time"

// Request DTOs
type CreateProgrammeRequest struct {
	Name           string `json:"name" binding:"required"`
	DurationYears  int    `json:"duration_years" binding:"required,min=1"`
	TotalSemesters int    `json:"total_semesters" binding:"required,min=1"`
}

type UpdateProgrammeRequest struct {
	Name           string `json:"name" binding:"required"`
	DurationYears  int    `json:"duration_years" binding:"required,min=1"`
	TotalSemesters int    `json:"total_semesters" binding:"required,min=1"`
	IsActive       *bool  `json:"is_active"`
}

type CreateDepartmentRequest struct {
	Name        string `json:"name" binding:"required"`
	Strength    int    `json:"strength" binding:"min=0"`
	ProgrammeID uint   `json:"programme_id" binding:"required"`
}

type UpdateDepartmentRequest struct {
	Name     string `json:"name" binding:"required"`
	Strength int    `json:"strength" binding:"min=0"`
	IsActive *bool  `json:"is_active"`
}

type CreateTeacherRequest struct {
	Name         string `json:"name" binding:"required"`
	Initials     string `json:"initials"`
	Email        string `json:"email" binding:"required,email"`
	DepartmentID uint   `json:"department_id" binding:"required"`
}

type UpdateTeacherRequest struct {
	Name         string `json:"name" binding:"required"`
	Initials     string `json:"initials"`
	Email        string `json:"email" binding:"required,email"`
	DepartmentID uint   `json:"department_id" binding:"required"`
	IsActive     bool   `json:"is_active"`
}

type CreateSubjectTypeRequest struct {
	Name                        string `json:"name" binding:"required"`
	IsLab                       bool   `json:"is_lab"`
	DefaultConsecutivePreferred bool   `json:"default_consecutive_preferred"`
}

type UpdateSubjectTypeRequest struct {
	Name                        string `json:"name" binding:"required"`
	IsLab                       bool   `json:"is_lab"`
	DefaultConsecutivePreferred bool   `json:"default_consecutive_preferred"`
}

type CreateSubjectRequest struct {
	Name             string `json:"name" binding:"required"`
	Code             string `json:"code" binding:"required"`
	Credit           int    `json:"credit" binding:"required,min=1"`
	ClassLoadPerWeek int    `json:"class_load_per_week" binding:"required,min=1"`
	ProgrammeID      uint   `json:"programme_id" binding:"required"`
	DepartmentID     uint   `json:"department_id" binding:"required"`
	SubjectTypeID    uint   `json:"subject_type_id" binding:"required"`
}

type UpdateSubjectRequest struct {
	Name             string `json:"name" binding:"required"`
	Code             string `json:"code" binding:"required"`
	Credit           int    `json:"credit" binding:"required,min=1"`
	ClassLoadPerWeek int    `json:"class_load_per_week" binding:"required,min=1"`
	SubjectTypeID    uint   `json:"subject_type_id"`
	IsActive         bool   `json:"is_active"`
}

type CreateRoomRequest struct {
	Name         string `json:"name" binding:"required"`
	RoomNumber   string `json:"room_number" binding:"required"`
	Capacity     int    `json:"capacity" binding:"min=0"`
	Type         string `json:"type" binding:"required,oneof=THEORY LAB OTHER"`
	DepartmentID *uint  `json:"department_id"`
}

type UpdateRoomRequest struct {
	Name         string `json:"name" binding:"required"`
	RoomNumber   string `json:"room_number" binding:"required"`
	Capacity     int    `json:"capacity" binding:"min=0"`
	Type         string `json:"type" binding:"required,oneof=THEORY LAB OTHER"`
	DepartmentID *uint  `json:"department_id"`
	IsActive     *bool  `json:"is_active"`
}

type CreateSessionRequest struct {
	Name         string    `json:"name" binding:"required,oneof=SPRING FALL"`
	AcademicYear string    `json:"academic_year" binding:"required"`
	StartDate    time.Time `json:"start_date" binding:"required"`
	EndDate      time.Time `json:"end_date" binding:"required"`
}

type UpdateSessionRequest struct {
	Name      string    `json:"name" binding:"required,oneof=SPRING FALL"`
	StartDate time.Time `json:"start_date" binding:"required"`
	EndDate   time.Time `json:"end_date" binding:"required"`
}

type UpdateSemesterOfferingRequest struct {
	Status string `json:"status" binding:"required,oneof=DRAFT ACTIVE ARCHIVED"`
}

type CreateSemesterOfferingRequest struct {
	ProgrammeID    uint   `json:"programme_id" binding:"required"`
	DepartmentID   uint   `json:"department_id" binding:"required"`
	SessionID      uint   `json:"session_id" binding:"required"`
	SemesterNumber int    `json:"semester_number" binding:"required,min=1"`
}

type CreateCourseOfferingRequest struct {
	SubjectID           uint   `json:"subject_id" binding:"required"`
	WeeklyRequiredSlots int    `json:"weekly_required_slots" binding:"required,min=1"`
	RequiredPattern     string `json:"required_pattern"`
	PreferredRoomID     *uint  `json:"preferred_room_id"`
	TeacherIDs          []uint `json:"teacher_ids"`
	Notes               string `json:"notes"`
}

type AssignTeacherRequest struct {
	TeacherID uint `json:"teacher_id" binding:"required"`
	Weight    int  `json:"weight" binding:"min=1"`
}

type AssignRoomRequest struct {
	RoomID   uint `json:"room_id" binding:"required"`
	Priority int  `json:"priority" binding:"min=1"`
}

type GenerateRoutineRequest struct {
	SemesterOfferingID uint `json:"semester_offering_id" binding:"required"`
}

// Response DTOs
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Total   int         `json:"total"`
	Page    int         `json:"page"`
	Limit   int         `json:"limit"`
}

// Error response
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Code    int    `json:"code,omitempty"`
}

// Success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}