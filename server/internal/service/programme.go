package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// ProgrammeService interface for programme business logic
type ProgrammeService interface {
	CreateProgramme(programme *models.Programme) error
	GetProgrammeByID(id uint) (*models.Programme, error)
	GetAllProgrammes() ([]models.Programme, error)
	UpdateProgramme(programme *models.Programme) error
	DeleteProgramme(id uint) error
	GetProgrammeWithDepartments(id uint) (*models.Programme, error)
}

type programmeService struct {
	programmeRepo repository.ProgrammeRepository
	departmentRepo repository.DepartmentRepository
}

// NewProgrammeService creates a new programme service
func NewProgrammeService(programmeRepo repository.ProgrammeRepository, departmentRepo repository.DepartmentRepository) ProgrammeService {
	return &programmeService{
		programmeRepo:  programmeRepo,
		departmentRepo: departmentRepo,
	}
}

func (s *programmeService) CreateProgramme(programme *models.Programme) error {
	// Validate programme data
	if programme.Name == "" {
		return errors.New("programme name is required")
	}
	if programme.DurationYears <= 0 {
		return errors.New("duration years must be positive")
	}
	if programme.TotalSemesters <= 0 {
		return errors.New("total semesters must be positive")
	}
	
	// Validate that total semesters matches duration years
	expectedSemesters := programme.DurationYears * 2 // Assuming 2 semesters per year
	if programme.TotalSemesters != expectedSemesters {
		return errors.New("total semesters should match duration years (2 semesters per year)")
	}
	
	return s.programmeRepo.Create(programme)
}

func (s *programmeService) GetProgrammeByID(id uint) (*models.Programme, error) {
	if id == 0 {
		return nil, errors.New("invalid programme ID")
	}
	return s.programmeRepo.GetByID(id)
}

func (s *programmeService) GetAllProgrammes() ([]models.Programme, error) {
	return s.programmeRepo.GetAll()
}

func (s *programmeService) UpdateProgramme(programme *models.Programme) error {
	if programme.ID == 0 {
		return errors.New("programme ID is required for update")
	}
	
	// Validate programme data
	if programme.Name == "" {
		return errors.New("programme name is required")
	}
	if programme.DurationYears <= 0 {
		return errors.New("duration years must be positive")
	}
	if programme.TotalSemesters <= 0 {
		return errors.New("total semesters must be positive")
	}
	
	return s.programmeRepo.Update(programme)
}

func (s *programmeService) DeleteProgramme(id uint) error {
	if id == 0 {
		return errors.New("invalid programme ID")
	}
	
	// Check if programme has departments
	departments, err := s.departmentRepo.GetByProgrammeID(id)
	if err != nil {
		return err
	}
	
	if len(departments) > 0 {
		return errors.New("cannot delete programme with existing departments")
	}
	
	return s.programmeRepo.Delete(id)
}

func (s *programmeService) GetProgrammeWithDepartments(id uint) (*models.Programme, error) {
	if id == 0 {
		return nil, errors.New("invalid programme ID")
	}
	return s.programmeRepo.GetWithDepartments(id)
}