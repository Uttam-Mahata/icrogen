package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// SubjectService interface for subject business logic
type SubjectService interface {
	CreateSubject(subject *models.Subject) error
	GetSubjectByID(id uint) (*models.Subject, error)
	GetSubjectsByDepartmentID(departmentID uint) ([]models.Subject, error)
	GetSubjectsByProgrammeAndDepartment(programmeID uint, departmentID uint) ([]models.Subject, error)
	GetAllSubjects() ([]models.Subject, error)
	UpdateSubject(subject *models.Subject) error
	DeleteSubject(id uint) error
}

type subjectService struct {
	subjectRepo     repository.SubjectRepository
	programmeRepo   repository.ProgrammeRepository
	departmentRepo  repository.DepartmentRepository
	subjectTypeRepo repository.SubjectTypeRepository
}

func NewSubjectService(
	subjectRepo repository.SubjectRepository,
	programmeRepo repository.ProgrammeRepository,
	departmentRepo repository.DepartmentRepository,
	subjectTypeRepo repository.SubjectTypeRepository,
) SubjectService {
	return &subjectService{
		subjectRepo:     subjectRepo,
		programmeRepo:   programmeRepo,
		departmentRepo:  departmentRepo,
		subjectTypeRepo: subjectTypeRepo,
	}
}

func (s *subjectService) CreateSubject(subject *models.Subject) error {
	// Validate subject data
	if subject.Name == "" {
		return errors.New("subject name is required")
	}
	if subject.Code == "" {
		return errors.New("subject code is required")
	}
	if subject.Credit <= 0 {
		return errors.New("credit must be positive")
	}
	if subject.ClassLoadPerWeek <= 0 {
		return errors.New("class load per week must be positive")
	}
	if subject.ProgrammeID == 0 {
		return errors.New("programme ID is required")
	}
	if subject.DepartmentID == 0 {
		return errors.New("department ID is required")
	}
	if subject.SubjectTypeID == 0 {
		return errors.New("subject type ID is required")
	}
	
	// Validate that referenced entities exist
	_, err := s.programmeRepo.GetByID(subject.ProgrammeID)
	if err != nil {
		return errors.New("invalid programme ID")
	}
	
	_, err = s.departmentRepo.GetByID(subject.DepartmentID)
	if err != nil {
		return errors.New("invalid department ID")
	}
	
	subjectType, err := s.subjectTypeRepo.GetByID(subject.SubjectTypeID)
	if err != nil {
		return errors.New("invalid subject type ID")
	}
	
	// Validate class load based on subject type
	if subjectType.IsLab {
		// Labs typically have 3-hour blocks once per week
		if subject.ClassLoadPerWeek != 3 {
			return errors.New("lab subjects should have 3 class hours per week")
		}
	} else {
		// Theory subjects - class load should generally match credits
		if subject.ClassLoadPerWeek != subject.Credit {
			return errors.New("theory subjects should have class load equal to credits")
		}
	}
	
	return s.subjectRepo.Create(subject)
}

func (s *subjectService) GetSubjectByID(id uint) (*models.Subject, error) {
	if id == 0 {
		return nil, errors.New("invalid subject ID")
	}
	return s.subjectRepo.GetByID(id)
}

func (s *subjectService) GetSubjectsByDepartmentID(departmentID uint) ([]models.Subject, error) {
	if departmentID == 0 {
		return nil, errors.New("invalid department ID")
	}
	return s.subjectRepo.GetByDepartmentID(departmentID)
}

func (s *subjectService) GetSubjectsByProgrammeAndDepartment(programmeID uint, departmentID uint) ([]models.Subject, error) {
	if programmeID == 0 || departmentID == 0 {
		return nil, errors.New("invalid programme ID or department ID")
	}
	return s.subjectRepo.GetByProgrammeAndDepartment(programmeID, departmentID)
}

func (s *subjectService) GetAllSubjects() ([]models.Subject, error) {
	return s.subjectRepo.GetAll()
}

func (s *subjectService) UpdateSubject(subject *models.Subject) error {
	if subject.ID == 0 {
		return errors.New("subject ID is required for update")
	}
	
	// Validate subject data
	if subject.Name == "" {
		return errors.New("subject name is required")
	}
	if subject.Code == "" {
		return errors.New("subject code is required")
	}
	if subject.Credit <= 0 {
		return errors.New("credit must be positive")
	}
	if subject.ClassLoadPerWeek <= 0 {
		return errors.New("class load per week must be positive")
	}
	
	return s.subjectRepo.Update(subject)
}

func (s *subjectService) DeleteSubject(id uint) error {
	if id == 0 {
		return errors.New("invalid subject ID")
	}
	
	// TODO: Check if subject has active course offerings
	// This would require checking CourseOffering records
	
	return s.subjectRepo.Delete(id)
}

// SubjectTypeService interface for subject type business logic
type SubjectTypeService interface {
	CreateSubjectType(subjectType *models.SubjectType) error
	GetSubjectTypeByID(id uint) (*models.SubjectType, error)
	GetAllSubjectTypes() ([]models.SubjectType, error)
	UpdateSubjectType(subjectType *models.SubjectType) error
	DeleteSubjectType(id uint) error
}

type subjectTypeService struct {
	subjectTypeRepo repository.SubjectTypeRepository
}

func NewSubjectTypeService(subjectTypeRepo repository.SubjectTypeRepository) SubjectTypeService {
	return &subjectTypeService{
		subjectTypeRepo: subjectTypeRepo,
	}
}

func (s *subjectTypeService) CreateSubjectType(subjectType *models.SubjectType) error {
	if subjectType.Name == "" {
		return errors.New("subject type name is required")
	}
	
	return s.subjectTypeRepo.Create(subjectType)
}

func (s *subjectTypeService) GetSubjectTypeByID(id uint) (*models.SubjectType, error) {
	if id == 0 {
		return nil, errors.New("invalid subject type ID")
	}
	return s.subjectTypeRepo.GetByID(id)
}

func (s *subjectTypeService) GetAllSubjectTypes() ([]models.SubjectType, error) {
	return s.subjectTypeRepo.GetAll()
}

func (s *subjectTypeService) UpdateSubjectType(subjectType *models.SubjectType) error {
	if subjectType.ID == 0 {
		return errors.New("subject type ID is required for update")
	}
	
	if subjectType.Name == "" {
		return errors.New("subject type name is required")
	}
	
	return s.subjectTypeRepo.Update(subjectType)
}

func (s *subjectTypeService) DeleteSubjectType(id uint) error {
	if id == 0 {
		return errors.New("invalid subject type ID")
	}
	
	// TODO: Check if subject type has subjects
	// This would require checking Subject records
	
	return s.subjectTypeRepo.Delete(id)
}