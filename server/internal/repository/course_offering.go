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
	AssignTeacher(courseOfferingID, teacherID uint) error
	RemoveTeacher(courseOfferingID, teacherID uint) error
	AssignRoom(courseOfferingID, roomID uint, priority int) error
	RemoveRoom(courseOfferingID, roomID uint) error
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

func (r *courseOfferingRepository) AssignTeacher(courseOfferingID, teacherID uint) error {
	assignment := &models.TeacherAssignment{
		CourseOfferingID: courseOfferingID,
		TeacherID:        teacherID,
		Weight:           1,
	}
	return r.db.Create(assignment).Error
}

func (r *courseOfferingRepository) RemoveTeacher(courseOfferingID, teacherID uint) error {
	return r.db.Where("course_offering_id = ? AND teacher_id = ?", 
		courseOfferingID, teacherID).Delete(&models.TeacherAssignment{}).Error
}

func (r *courseOfferingRepository) AssignRoom(courseOfferingID, roomID uint, priority int) error {
	assignment := &models.RoomAssignment{
		CourseOfferingID: courseOfferingID,
		RoomID:           roomID,
		Priority:         priority,
	}
	return r.db.Create(assignment).Error
}

func (r *courseOfferingRepository) RemoveRoom(courseOfferingID, roomID uint) error {
	return r.db.Where("course_offering_id = ? AND room_id = ?", 
		courseOfferingID, roomID).Delete(&models.RoomAssignment{}).Error
}