package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// SessionService interface for session business logic
type SessionService interface {
	CreateSession(session *models.Session) error
	GetSessionByID(id uint) (*models.Session, error)
	GetAllSessions() ([]models.Session, error)
	GetSessionsByYear(academicYear string) ([]models.Session, error)
	UpdateSession(session *models.Session) error
	DeleteSession(id uint) error
	HardDeleteSession(id uint) error
	RestoreSession(id uint) error
}

type sessionService struct {
	sessionRepo repository.SessionRepository
}

func NewSessionService(sessionRepo repository.SessionRepository) SessionService {
	return &sessionService{
		sessionRepo: sessionRepo,
	}
}

func (s *sessionService) CreateSession(session *models.Session) error {
	// Validate session data
	if session.Name == "" {
		return errors.New("session name is required")
	}
	if session.AcademicYear == "" {
		return errors.New("academic year is required")
	}
	
	// Validate session name
	validNames := map[string]bool{"SPRING": true, "FALL": true}
	if !validNames[session.Name] {
		return errors.New("invalid session name (must be SPRING or FALL)")
	}
	
	// Check if session with same name and year already exists (including soft-deleted)
	existingSession, _ := s.sessionRepo.GetByNameAndYear(session.Name, session.AcademicYear)
	if existingSession != nil {
		if existingSession.DeletedAt.Valid {
			// If it's soft-deleted, we need to either restore it or return an error
			return errors.New("a deleted session with the same name and academic year already exists. Please restore or permanently delete it first")
		}
		return errors.New("session with the same name and academic year already exists")
	}
	
	// Set parity based on session name
	if session.Name == "FALL" {
		session.Parity = "ODD"
	} else {
		session.Parity = "EVEN"
	}
	
	// Validate dates
	if session.StartDate.After(session.EndDate) {
		return errors.New("start date must be before end date")
	}
	
	return s.sessionRepo.Create(session)
}

func (s *sessionService) GetSessionByID(id uint) (*models.Session, error) {
	if id == 0 {
		return nil, errors.New("invalid session ID")
	}
	return s.sessionRepo.GetByID(id)
}

func (s *sessionService) GetAllSessions() ([]models.Session, error) {
	return s.sessionRepo.GetAll()
}

func (s *sessionService) GetSessionsByYear(academicYear string) ([]models.Session, error) {
	if academicYear == "" {
		return nil, errors.New("academic year is required")
	}
	return s.sessionRepo.GetByYear(academicYear)
}

func (s *sessionService) UpdateSession(session *models.Session) error {
	if session.ID == 0 {
		return errors.New("session ID is required for update")
	}
	
	// Validate session data
	if session.Name == "" {
		return errors.New("session name is required")
	}
	if session.AcademicYear == "" {
		return errors.New("academic year is required")
	}
	
	// Validate dates
	if session.StartDate.After(session.EndDate) {
		return errors.New("start date must be before end date")
	}
	
	return s.sessionRepo.Update(session)
}

func (s *sessionService) DeleteSession(id uint) error {
	if id == 0 {
		return errors.New("invalid session ID")
	}
	
	// TODO: Check if session has semester offerings
	// This would require checking SemesterOffering records
	
	return s.sessionRepo.Delete(id)
}

func (s *sessionService) HardDeleteSession(id uint) error {
	if id == 0 {
		return errors.New("invalid session ID")
	}
	
	// Permanently delete the session
	// WARNING: This will fail if there are foreign key constraints
	return s.sessionRepo.HardDelete(id)
}

func (s *sessionService) RestoreSession(id uint) error {
	if id == 0 {
		return errors.New("invalid session ID")
	}
	
	// Restore a soft-deleted session
	return s.sessionRepo.Restore(id)
}

// SemesterOfferingService interface for semester offering business logic
type SemesterOfferingService interface {
	CreateSemesterOffering(offering *models.SemesterOffering) error
	GetAllSemesterOfferings() ([]models.SemesterOffering, error)
	GetSemesterOfferingByID(id uint) (*models.SemesterOffering, error)
	GetSemesterOfferingsBySession(sessionID uint) ([]models.SemesterOffering, error)
	GetSemesterOfferingsByProgrammeDepartmentSession(programmeID, departmentID, sessionID uint) ([]models.SemesterOffering, error)
	GetSemesterOfferingWithCourseOfferings(id uint) (*models.SemesterOffering, error)
	UpdateSemesterOffering(offering *models.SemesterOffering) error
	DeleteSemesterOffering(id uint) error
}

type semesterOfferingService struct {
	semesterOfferingRepo repository.SemesterOfferingRepository
	programmeRepo        repository.ProgrammeRepository
	departmentRepo       repository.DepartmentRepository
	sessionRepo          repository.SessionRepository
}

func NewSemesterOfferingService(
	semesterOfferingRepo repository.SemesterOfferingRepository,
	programmeRepo repository.ProgrammeRepository,
	departmentRepo repository.DepartmentRepository,
	sessionRepo repository.SessionRepository,
) SemesterOfferingService {
	return &semesterOfferingService{
		semesterOfferingRepo: semesterOfferingRepo,
		programmeRepo:        programmeRepo,
		departmentRepo:       departmentRepo,
		sessionRepo:          sessionRepo,
	}
}

func (s *semesterOfferingService) CreateSemesterOffering(offering *models.SemesterOffering) error {
	// Validate offering data
	if offering.ProgrammeID == 0 {
		return errors.New("programme ID is required")
	}
	if offering.DepartmentID == 0 {
		return errors.New("department ID is required")
	}
	if offering.SessionID == 0 {
		return errors.New("session ID is required")
	}
	if offering.SemesterNumber <= 0 {
		return errors.New("semester number must be positive")
	}
	
	// Validate that referenced entities exist
	programme, err := s.programmeRepo.GetByID(offering.ProgrammeID)
	if err != nil {
		return errors.New("invalid programme ID")
	}
	
	_, err = s.departmentRepo.GetByID(offering.DepartmentID)
	if err != nil {
		return errors.New("invalid department ID")
	}
	
	session, err := s.sessionRepo.GetByID(offering.SessionID)
	if err != nil {
		return errors.New("invalid session ID")
	}
	
	// Validate semester number against programme and session parity
	if offering.SemesterNumber > programme.TotalSemesters {
		return errors.New("semester number exceeds programme total semesters")
	}
	
	// Check if semester number matches session parity
	isOddSemester := offering.SemesterNumber%2 == 1
	if (session.Parity == "ODD" && !isOddSemester) || (session.Parity == "EVEN" && isOddSemester) {
		return errors.New("semester number does not match session parity")
	}
	
	// Set default status
	if offering.Status == "" {
		offering.Status = "DRAFT"
	}
	
	return s.semesterOfferingRepo.Create(offering)
}

func (s *semesterOfferingService) GetAllSemesterOfferings() ([]models.SemesterOffering, error) {
	return s.semesterOfferingRepo.GetAll()
}

func (s *semesterOfferingService) GetSemesterOfferingByID(id uint) (*models.SemesterOffering, error) {
	if id == 0 {
		return nil, errors.New("invalid semester offering ID")
	}
	return s.semesterOfferingRepo.GetByID(id)
}

func (s *semesterOfferingService) GetSemesterOfferingsBySession(sessionID uint) ([]models.SemesterOffering, error) {
	if sessionID == 0 {
		return nil, errors.New("invalid session ID")
	}
	return s.semesterOfferingRepo.GetBySession(sessionID)
}

func (s *semesterOfferingService) GetSemesterOfferingsByProgrammeDepartmentSession(programmeID, departmentID, sessionID uint) ([]models.SemesterOffering, error) {
	if programmeID == 0 || departmentID == 0 || sessionID == 0 {
		return nil, errors.New("invalid programme, department, or session ID")
	}
	return s.semesterOfferingRepo.GetByProgrammeDepartmentSession(programmeID, departmentID, sessionID)
}

func (s *semesterOfferingService) GetSemesterOfferingWithCourseOfferings(id uint) (*models.SemesterOffering, error) {
	if id == 0 {
		return nil, errors.New("invalid semester offering ID")
	}
	return s.semesterOfferingRepo.GetWithCourseOfferings(id)
}

func (s *semesterOfferingService) UpdateSemesterOffering(offering *models.SemesterOffering) error {
	if offering.ID == 0 {
		return errors.New("semester offering ID is required for update")
	}
	
	// Basic validation
	if offering.SemesterNumber <= 0 {
		return errors.New("semester number must be positive")
	}
	
	return s.semesterOfferingRepo.Update(offering)
}

func (s *semesterOfferingService) DeleteSemesterOffering(id uint) error {
	if id == 0 {
		return errors.New("invalid semester offering ID")
	}
	
	// TODO: Check if semester offering has course offerings
	// This would require checking CourseOffering records
	
	return s.semesterOfferingRepo.Delete(id)
}