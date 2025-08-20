package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// TeacherRepository interface for teacher operations
type TeacherRepository interface {
	Create(teacher *models.Teacher) error
	GetByID(id uint) (*models.Teacher, error)
	GetByDepartmentID(departmentID uint) ([]models.Teacher, error)
	GetAll() ([]models.Teacher, error)
	GetActive() ([]models.Teacher, error)
	Update(teacher *models.Teacher) error
	Delete(id uint) error
	CheckAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error)
}

type teacherRepository struct {
	db *gorm.DB
}

func NewTeacherRepository(db *gorm.DB) TeacherRepository {
	return &teacherRepository{db: db}
}

func (r *teacherRepository) Create(teacher *models.Teacher) error {
	return r.db.Create(teacher).Error
}

func (r *teacherRepository) GetByID(id uint) (*models.Teacher, error) {
	var teacher models.Teacher
	err := r.db.Preload("Department").Preload("Department.Programme").First(&teacher, id).Error
	if err != nil {
		return nil, err
	}
	return &teacher, nil
}

func (r *teacherRepository) GetByDepartmentID(departmentID uint) ([]models.Teacher, error) {
	var teachers []models.Teacher
	err := r.db.Where("department_id = ?", departmentID).Find(&teachers).Error
	return teachers, err
}

func (r *teacherRepository) GetAll() ([]models.Teacher, error) {
	var teachers []models.Teacher
	err := r.db.Preload("Department").Find(&teachers).Error
	return teachers, err
}

func (r *teacherRepository) GetActive() ([]models.Teacher, error) {
	var teachers []models.Teacher
	err := r.db.Preload("Department").Where("is_active = ?", true).Find(&teachers).Error
	return teachers, err
}

func (r *teacherRepository) Update(teacher *models.Teacher) error {
	// Only update specific fields to avoid datetime issues
	updates := map[string]interface{}{
		"name":          teacher.Name,
		"email":         teacher.Email,
		"department_id": teacher.DepartmentID,
		"is_active":     teacher.IsActive,
	}
	
	// Handle nullable initials
	if teacher.Initials != nil {
		updates["initials"] = teacher.Initials
	} else {
		updates["initials"] = nil
	}
	
	return r.db.Model(&models.Teacher{}).
		Where("id = ?", teacher.ID).
		Updates(updates).Error
}

func (r *teacherRepository) Delete(id uint) error {
	return r.db.Delete(&models.Teacher{}, id).Error
}

func (r *teacherRepository) CheckAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error) {
	var count int64
	err := r.db.Model(&models.ScheduleEntry{}).
		Where("teacher_id = ? AND session_id = ? AND day_of_week = ? AND slot_number = ?", 
			teacherID, sessionID, dayOfWeek, slotNumber).
		Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count == 0, nil
}