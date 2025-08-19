package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// SubjectRepository interface for subject operations
type SubjectRepository interface {
	Create(subject *models.Subject) error
	GetByID(id uint) (*models.Subject, error)
	GetByDepartmentID(departmentID uint) ([]models.Subject, error)
	GetByProgrammeAndDepartment(programmeID uint, departmentID uint) ([]models.Subject, error)
	GetAll() ([]models.Subject, error)
	Update(subject *models.Subject) error
	Delete(id uint) error
}

type subjectRepository struct {
	db *gorm.DB
}

func NewSubjectRepository(db *gorm.DB) SubjectRepository {
	return &subjectRepository{db: db}
}

func (r *subjectRepository) Create(subject *models.Subject) error {
	return r.db.Create(subject).Error
}

func (r *subjectRepository) GetByID(id uint) (*models.Subject, error) {
	var subject models.Subject
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("SubjectType").
		First(&subject, id).Error
	if err != nil {
		return nil, err
	}
	return &subject, nil
}

func (r *subjectRepository) GetByDepartmentID(departmentID uint) ([]models.Subject, error) {
	var subjects []models.Subject
	err := r.db.Preload("SubjectType").
		Where("department_id = ? AND is_active = ?", departmentID, true).
		Find(&subjects).Error
	return subjects, err
}

func (r *subjectRepository) GetByProgrammeAndDepartment(programmeID uint, departmentID uint) ([]models.Subject, error) {
	var subjects []models.Subject
	err := r.db.Preload("SubjectType").
		Where("programme_id = ? AND department_id = ? AND is_active = ?", 
			programmeID, departmentID, true).
		Find(&subjects).Error
	return subjects, err
}

func (r *subjectRepository) GetAll() ([]models.Subject, error) {
	var subjects []models.Subject
	err := r.db.Preload("Programme").
		Preload("Department").
		Preload("SubjectType").
		Where("is_active = ?", true).
		Find(&subjects).Error
	return subjects, err
}

func (r *subjectRepository) Update(subject *models.Subject) error {
	return r.db.Save(subject).Error
}

func (r *subjectRepository) Delete(id uint) error {
	return r.db.Delete(&models.Subject{}, id).Error
}

// SubjectTypeRepository interface for subject type operations
type SubjectTypeRepository interface {
	Create(subjectType *models.SubjectType) error
	GetByID(id uint) (*models.SubjectType, error)
	GetAll() ([]models.SubjectType, error)
	Update(subjectType *models.SubjectType) error
	Delete(id uint) error
}

type subjectTypeRepository struct {
	db *gorm.DB
}

func NewSubjectTypeRepository(db *gorm.DB) SubjectTypeRepository {
	return &subjectTypeRepository{db: db}
}

func (r *subjectTypeRepository) Create(subjectType *models.SubjectType) error {
	return r.db.Create(subjectType).Error
}

func (r *subjectTypeRepository) GetByID(id uint) (*models.SubjectType, error) {
	var subjectType models.SubjectType
	err := r.db.First(&subjectType, id).Error
	if err != nil {
		return nil, err
	}
	return &subjectType, nil
}

func (r *subjectTypeRepository) GetAll() ([]models.SubjectType, error) {
	var subjectTypes []models.SubjectType
	err := r.db.Find(&subjectTypes).Error
	return subjectTypes, err
}

func (r *subjectTypeRepository) Update(subjectType *models.SubjectType) error {
	return r.db.Save(subjectType).Error
}

func (r *subjectTypeRepository) Delete(id uint) error {
	return r.db.Delete(&models.SubjectType{}, id).Error
}