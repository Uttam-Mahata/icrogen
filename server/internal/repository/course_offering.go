package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// CourseOfferingRepository interface for course offering operations
type CourseOfferingRepository interface {
	Create(offering *models.CourseOffering) error
	GetByID(id uint) (*models.CourseOffering, error)
	GetBySemesterOffering(semesterOfferingID uint) ([]models.CourseOffering, error)
	Update(offering *models.CourseOffering) error
	Delete(id uint) error
	AssignTeacher(assignment *models.TeacherAssignment) error
	RemoveTeacherAssignment(assignmentID uint) error
	AssignRoom(assignment *models.RoomAssignment) error
	RemoveRoomAssignment(assignmentID uint) error
	GetTeacherAssignments(courseOfferingID uint) ([]models.TeacherAssignment, error)
	GetRoomAssignments(courseOfferingID uint) ([]models.RoomAssignment, error)
}

type courseOfferingRepository struct {
	db *gorm.DB
}

func NewCourseOfferingRepository(db *gorm.DB) CourseOfferingRepository {
	return &courseOfferingRepository{db: db}
}

func (r *courseOfferingRepository) Create(offering *models.CourseOffering) error {
	return r.db.Create(offering).Error
}

func (r *courseOfferingRepository) GetByID(id uint) (*models.CourseOffering, error) {
	var offering models.CourseOffering
	err := r.db.Preload("Subject").
		Preload("Subject.SubjectType").
		Preload("TeacherAssignments").
		Preload("TeacherAssignments.Teacher").
		Preload("RoomAssignments").
		Preload("RoomAssignments.Room").
		First(&offering, id).Error
	if err != nil {
		return nil, err
	}
	return &offering, nil
}

func (r *courseOfferingRepository) GetBySemesterOffering(semesterOfferingID uint) ([]models.CourseOffering, error) {
	var offerings []models.CourseOffering
	err := r.db.Preload("Subject").
		Preload("Subject.SubjectType").
		Preload("TeacherAssignments").
		Preload("TeacherAssignments.Teacher").
		Preload("RoomAssignments").
		Preload("RoomAssignments.Room").
		Where("semester_offering_id = ?", semesterOfferingID).
		Find(&offerings).Error
	return offerings, err
}

func (r *courseOfferingRepository) Update(offering *models.CourseOffering) error {
	return r.db.Save(offering).Error
}

func (r *courseOfferingRepository) Delete(id uint) error {
	return r.db.Delete(&models.CourseOffering{}, id).Error
}

func (r *courseOfferingRepository) AssignTeacher(assignment *models.TeacherAssignment) error {
	return r.db.Create(assignment).Error
}

func (r *courseOfferingRepository) RemoveTeacherAssignment(assignmentID uint) error {
	return r.db.Delete(&models.TeacherAssignment{}, assignmentID).Error
}

func (r *courseOfferingRepository) AssignRoom(assignment *models.RoomAssignment) error {
	return r.db.Create(assignment).Error
}

func (r *courseOfferingRepository) RemoveRoomAssignment(assignmentID uint) error {
	return r.db.Delete(&models.RoomAssignment{}, assignmentID).Error
}

func (r *courseOfferingRepository) GetTeacherAssignments(courseOfferingID uint) ([]models.TeacherAssignment, error) {
	var assignments []models.TeacherAssignment
	err := r.db.Preload("Teacher").
		Where("course_offering_id = ?", courseOfferingID).
		Find(&assignments).Error
	return assignments, err
}

func (r *courseOfferingRepository) GetRoomAssignments(courseOfferingID uint) ([]models.RoomAssignment, error) {
	var assignments []models.RoomAssignment
	err := r.db.Preload("Room").
		Where("course_offering_id = ?", courseOfferingID).
		Find(&assignments).Error
	return assignments, err
}