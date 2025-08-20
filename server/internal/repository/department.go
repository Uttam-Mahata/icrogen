package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// DepartmentRepository interface for department operations
type DepartmentRepository interface {
	Create(department *models.Department) error
	GetByID(id uint) (*models.Department, error)
	GetByProgrammeID(programmeID uint) ([]models.Department, error)
	GetAll() ([]models.Department, error)
	Update(department *models.Department) error
	Delete(id uint) error
	GetWithTeachers(id uint) (*models.Department, error)
}

type departmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) Create(department *models.Department) error {
	return r.db.Create(department).Error
}

func (r *departmentRepository) GetByID(id uint) (*models.Department, error) {
	var department models.Department
	err := r.db.Preload("Programme").First(&department, id).Error
	if err != nil {
		return nil, err
	}
	return &department, nil
}

func (r *departmentRepository) GetByProgrammeID(programmeID uint) ([]models.Department, error) {
	var departments []models.Department
	err := r.db.Where("programme_id = ? AND is_active = ?", programmeID, true).Find(&departments).Error
	return departments, err
}

func (r *departmentRepository) GetAll() ([]models.Department, error) {
	var departments []models.Department
	err := r.db.Preload("Programme").Where("is_active = ?", true).Find(&departments).Error
	return departments, err
}

func (r *departmentRepository) Update(department *models.Department) error {
	// Only update specific fields to avoid datetime issues
	return r.db.Model(&models.Department{}).
		Where("id = ?", department.ID).
		Updates(map[string]interface{}{
			"name":         department.Name,
			"strength":     department.Strength,
			"programme_id": department.ProgrammeID,
			"is_active":    department.IsActive,
		}).Error
}

func (r *departmentRepository) Delete(id uint) error {
	return r.db.Delete(&models.Department{}, id).Error
}

func (r *departmentRepository) GetWithTeachers(id uint) (*models.Department, error) {
	var department models.Department
	err := r.db.Preload("Teachers").Preload("Programme").First(&department, id).Error
	if err != nil {
		return nil, err
	}
	return &department, nil
}