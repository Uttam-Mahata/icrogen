package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// SessionRepository interface for session operations
type SessionRepository interface {
	Create(session *models.Session) error
	GetByID(id uint) (*models.Session, error)
	GetAll() ([]models.Session, error)
	GetByYear(academicYear string) ([]models.Session, error)
	Update(session *models.Session) error
	Delete(id uint) error
}

type sessionRepository struct {
	db *gorm.DB
}

func NewSessionRepository(db *gorm.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) Create(session *models.Session) error {
	return r.db.Create(session).Error
}

func (r *sessionRepository) GetByID(id uint) (*models.Session, error) {
	var session models.Session
	err := r.db.First(&session, id).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *sessionRepository) GetAll() ([]models.Session, error) {
	var sessions []models.Session
	err := r.db.Find(&sessions).Error
	return sessions, err
}

func (r *sessionRepository) GetByYear(academicYear string) ([]models.Session, error) {
	var sessions []models.Session
	err := r.db.Where("academic_year = ?", academicYear).Find(&sessions).Error
	return sessions, err
}

func (r *sessionRepository) Update(session *models.Session) error {
	return r.db.Save(session).Error
}

func (r *sessionRepository) Delete(id uint) error {
	// Use Unscoped().Delete() for hard delete to avoid unique constraint issues
	// Or alternatively, we could update the unique constraint to include deleted_at
	return r.db.Unscoped().Delete(&models.Session{}, id).Error
}

// SemesterOfferingRepository interface for semester offering operations
type SemesterOfferingRepository interface {
	Create(offering *models.SemesterOffering) error
	GetAll() ([]models.SemesterOffering, error)
	GetByID(id uint) (*models.SemesterOffering, error)
	GetBySession(sessionID uint) ([]models.SemesterOffering, error)
	GetByProgrammeDepartmentSession(programmeID, departmentID, sessionID uint) ([]models.SemesterOffering, error)
	GetWithCourseOfferings(id uint) (*models.SemesterOffering, error)
	Update(offering *models.SemesterOffering) error
	Delete(id uint) error
}

type semesterOfferingRepository struct {
	db *gorm.DB
}

func NewSemesterOfferingRepository(db *gorm.DB) SemesterOfferingRepository {
	return &semesterOfferingRepository{db: db}
}

func (r *semesterOfferingRepository) Create(offering *models.SemesterOffering) error {
	return r.db.Create(offering).Error
}

func (r *semesterOfferingRepository) GetAll() ([]models.SemesterOffering, error) {
	var offerings []models.SemesterOffering
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("Session").
		Find(&offerings).Error
	return offerings, err
}

func (r *semesterOfferingRepository) GetByID(id uint) (*models.SemesterOffering, error) {
	var offering models.SemesterOffering
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("Session").
		First(&offering, id).Error
	if err != nil {
		return nil, err
	}
	return &offering, nil
}

func (r *semesterOfferingRepository) GetBySession(sessionID uint) ([]models.SemesterOffering, error) {
	var offerings []models.SemesterOffering
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("Session").
		Where("session_id = ?", sessionID).
		Find(&offerings).Error
	return offerings, err
}

func (r *semesterOfferingRepository) GetByProgrammeDepartmentSession(programmeID, departmentID, sessionID uint) ([]models.SemesterOffering, error) {
	var offerings []models.SemesterOffering
	err := r.db.Where("programme_id = ? AND department_id = ? AND session_id = ?", 
		programmeID, departmentID, sessionID).Find(&offerings).Error
	return offerings, err
}

func (r *semesterOfferingRepository) GetWithCourseOfferings(id uint) (*models.SemesterOffering, error) {
	var offering models.SemesterOffering
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("Session").
		Preload("CourseOfferings").
		Preload("CourseOfferings.Subject").
		Preload("CourseOfferings.Subject.SubjectType").
		Preload("CourseOfferings.TeacherAssignments").
		Preload("CourseOfferings.TeacherAssignments.Teacher").
		Preload("CourseOfferings.RoomAssignments").
		Preload("CourseOfferings.RoomAssignments.Room").
		First(&offering, id).Error
	if err != nil {
		return nil, err
	}
	return &offering, nil
}

func (r *semesterOfferingRepository) Update(offering *models.SemesterOffering) error {
	return r.db.Save(offering).Error
}

func (r *semesterOfferingRepository) Delete(id uint) error {
	return r.db.Delete(&models.SemesterOffering{}, id).Error
}