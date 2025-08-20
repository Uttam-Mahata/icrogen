package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
	"regexp"
)

// TeacherService interface for teacher business logic
type TeacherService interface {
	CreateTeacher(teacher *models.Teacher) error
	GetTeacherByID(id uint) (*models.Teacher, error)
	GetTeachersByDepartmentID(departmentID uint) ([]models.Teacher, error)
	GetAllTeachers() ([]models.Teacher, error)
	GetActiveTeachers() ([]models.Teacher, error)
	UpdateTeacher(teacher *models.Teacher) error
	DeleteTeacher(id uint) error
	CheckTeacherAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error)
}

type teacherService struct {
	teacherRepo     repository.TeacherRepository
	departmentRepo  repository.DepartmentRepository
}

func NewTeacherService(
	teacherRepo repository.TeacherRepository,
	departmentRepo repository.DepartmentRepository,
) TeacherService {
	return &teacherService{
		teacherRepo:    teacherRepo,
		departmentRepo: departmentRepo,
	}
}

func (s *teacherService) CreateTeacher(teacher *models.Teacher) error {
	// Validate teacher data
	if teacher.Name == "" {
		return errors.New("teacher name is required")
	}
	if teacher.DepartmentID == 0 {
		return errors.New("department ID is required")
	}
	if teacher.Email == "" {
		return errors.New("email is required")
	}
	
	// Validate email format
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(teacher.Email) {
		return errors.New("invalid email format")
	}
	
	// Handle empty initials - set to nil if empty
	if teacher.Initials != nil && *teacher.Initials == "" {
		teacher.Initials = nil
	}
	
	// Validate that department exists
	_, err := s.departmentRepo.GetByID(teacher.DepartmentID)
	if err != nil {
		return errors.New("invalid department ID")
	}
	
	return s.teacherRepo.Create(teacher)
}

func (s *teacherService) GetTeacherByID(id uint) (*models.Teacher, error) {
	if id == 0 {
		return nil, errors.New("invalid teacher ID")
	}
	return s.teacherRepo.GetByID(id)
}

func (s *teacherService) GetTeachersByDepartmentID(departmentID uint) ([]models.Teacher, error) {
	if departmentID == 0 {
		return nil, errors.New("invalid department ID")
	}
	return s.teacherRepo.GetByDepartmentID(departmentID)
}

func (s *teacherService) GetAllTeachers() ([]models.Teacher, error) {
	return s.teacherRepo.GetAll()
}

func (s *teacherService) GetActiveTeachers() ([]models.Teacher, error) {
	return s.teacherRepo.GetActive()
}

func (s *teacherService) UpdateTeacher(teacher *models.Teacher) error {
	if teacher.ID == 0 {
		return errors.New("teacher ID is required for update")
	}
	
	// Validate teacher data
	if teacher.Name == "" {
		return errors.New("teacher name is required")
	}
	if teacher.DepartmentID == 0 {
		return errors.New("department ID is required")
	}
	if teacher.Email == "" {
		return errors.New("email is required")
	}
	
	// Validate email format
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !emailRegex.MatchString(teacher.Email) {
		return errors.New("invalid email format")
	}
	
	// Handle empty initials - set to nil if empty
	if teacher.Initials != nil && *teacher.Initials == "" {
		teacher.Initials = nil
	}
	
	return s.teacherRepo.Update(teacher)
}

func (s *teacherService) DeleteTeacher(id uint) error {
	if id == 0 {
		return errors.New("invalid teacher ID")
	}
	
	// TODO: Check if teacher has active assignments
	// This would require checking TeacherAssignment records
	
	return s.teacherRepo.Delete(id)
}

func (s *teacherService) CheckTeacherAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error) {
	if teacherID == 0 || sessionID == 0 {
		return false, errors.New("invalid teacher ID or session ID")
	}
	if dayOfWeek < 1 || dayOfWeek > 5 {
		return false, errors.New("invalid day of week (1-5)")
	}
	if slotNumber < 1 || slotNumber > 8 {
		return false, errors.New("invalid slot number (1-8)")
	}
	
	return s.teacherRepo.CheckAvailability(teacherID, sessionID, dayOfWeek, slotNumber)
}