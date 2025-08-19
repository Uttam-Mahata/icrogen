package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// ProgrammeRepository interface for programme operations
type ProgrammeRepository interface {
	Create(programme *models.Programme) error
	GetByID(id uint) (*models.Programme, error)
	GetAll() ([]models.Programme, error)
	Update(programme *models.Programme) error
	Delete(id uint) error
	GetWithDepartments(id uint) (*models.Programme, error)
}

type programmeRepository struct {
	db *gorm.DB
}

// NewProgrammeRepository creates a new programme repository
func NewProgrammeRepository(db *gorm.DB) ProgrammeRepository {
	return &programmeRepository{db: db}
}

func (r *programmeRepository) Create(programme *models.Programme) error {
	return r.db.Create(programme).Error
}

func (r *programmeRepository) GetByID(id uint) (*models.Programme, error) {
	var programme models.Programme
	err := r.db.First(&programme, id).Error
	if err != nil {
		return nil, err
	}
	return &programme, nil
}

func (r *programmeRepository) GetAll() ([]models.Programme, error) {
	var programmes []models.Programme
	err := r.db.Where("is_active = ?", true).Find(&programmes).Error
	return programmes, err
}

func (r *programmeRepository) Update(programme *models.Programme) error {
	return r.db.Save(programme).Error
}

func (r *programmeRepository) Delete(id uint) error {
	return r.db.Delete(&models.Programme{}, id).Error
}

func (r *programmeRepository) GetWithDepartments(id uint) (*models.Programme, error) {
	var programme models.Programme
	err := r.db.Preload("Departments").First(&programme, id).Error
	if err != nil {
		return nil, err
	}
	return &programme, nil
}