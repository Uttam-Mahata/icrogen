package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// DepartmentService interface for department business logic
type DepartmentService interface {
	CreateDepartment(department *models.Department) error
	GetDepartmentByID(id uint) (*models.Department, error)
	GetDepartmentsByProgrammeID(programmeID uint) ([]models.Department, error)
	GetAllDepartments() ([]models.Department, error)
	UpdateDepartment(department *models.Department) error
	DeleteDepartment(id uint) error
	GetDepartmentWithTeachers(id uint) (*models.Department, error)
}

type departmentService struct {
	departmentRepo  repository.DepartmentRepository
	programmeRepo   repository.ProgrammeRepository
	teacherRepo     repository.TeacherRepository
}

func NewDepartmentService(
	departmentRepo repository.DepartmentRepository,
	programmeRepo repository.ProgrammeRepository,
	teacherRepo repository.TeacherRepository,
) DepartmentService {
	return &departmentService{
		departmentRepo: departmentRepo,
		programmeRepo:  programmeRepo,
		teacherRepo:    teacherRepo,
	}
}

func (s *departmentService) CreateDepartment(department *models.Department) error {
	// Validate department data
	if department.Name == "" {
		return errors.New("department name is required")
	}
	if department.ProgrammeID == 0 {
		return errors.New("programme ID is required")
	}
	if department.Strength < 0 {
		return errors.New("strength cannot be negative")
	}
	
	// Validate that programme exists
	_, err := s.programmeRepo.GetByID(department.ProgrammeID)
	if err != nil {
		return errors.New("invalid programme ID")
	}
	
	return s.departmentRepo.Create(department)
}

func (s *departmentService) GetDepartmentByID(id uint) (*models.Department, error) {
	if id == 0 {
		return nil, errors.New("invalid department ID")
	}
	return s.departmentRepo.GetByID(id)
}

func (s *departmentService) GetDepartmentsByProgrammeID(programmeID uint) ([]models.Department, error) {
	if programmeID == 0 {
		return nil, errors.New("invalid programme ID")
	}
	return s.departmentRepo.GetByProgrammeID(programmeID)
}

func (s *departmentService) GetAllDepartments() ([]models.Department, error) {
	return s.departmentRepo.GetAll()
}

func (s *departmentService) UpdateDepartment(department *models.Department) error {
	if department.ID == 0 {
		return errors.New("department ID is required for update")
	}
	
	// Validate department data
	if department.Name == "" {
		return errors.New("department name is required")
	}
	if department.ProgrammeID == 0 {
		return errors.New("programme ID is required")
	}
	if department.Strength < 0 {
		return errors.New("strength cannot be negative")
	}
	
	return s.departmentRepo.Update(department)
}

func (s *departmentService) DeleteDepartment(id uint) error {
	if id == 0 {
		return errors.New("invalid department ID")
	}
	
	// Check if department has teachers
	teachers, err := s.teacherRepo.GetByDepartmentID(id)
	if err != nil {
		return err
	}
	
	if len(teachers) > 0 {
		return errors.New("cannot delete department with existing teachers")
	}
	
	return s.departmentRepo.Delete(id)
}

func (s *departmentService) GetDepartmentWithTeachers(id uint) (*models.Department, error) {
	if id == 0 {
		return nil, errors.New("invalid department ID")
	}
	return s.departmentRepo.GetWithTeachers(id)
}