package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// ScheduleRepository interface for schedule operations
type ScheduleRepository interface {
	CreateScheduleRun(run *models.ScheduleRun) error
	GetScheduleRunByID(id uint) (*models.ScheduleRun, error)
	GetScheduleRunsBySemesterOffering(semesterOfferingID uint) ([]models.ScheduleRun, error)
	UpdateScheduleRun(run *models.ScheduleRun) error
	
	CreateScheduleBlock(block *models.ScheduleBlock) error
	CreateScheduleEntry(entry *models.ScheduleEntry) error
	CreateScheduleEntries(entries []models.ScheduleEntry) error
	
	GetScheduleEntriesByRun(scheduleRunID uint) ([]models.ScheduleEntry, error)
	GetScheduleEntriesBySession(sessionID uint) ([]models.ScheduleEntry, error)
	GetCommittedScheduleEntries(sessionID uint) ([]models.ScheduleEntry, error)
	
	DeleteScheduleEntriesByRun(scheduleRunID uint) error
	DeleteScheduleBlocksByRun(scheduleRunID uint) error
	DeleteScheduleRun(scheduleRunID uint) error
	CommitScheduleRun(scheduleRunID uint) error
	
	CheckTeacherAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error)
	CheckRoomAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error)
	CheckStudentGroupAvailability(semesterOfferingID uint, dayOfWeek int, slotNumbers []int, excludeRunID uint) (bool, error)
}

type scheduleRepository struct {
	db *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) ScheduleRepository {
	return &scheduleRepository{db: db}
}

func (r *scheduleRepository) CreateScheduleRun(run *models.ScheduleRun) error {
	return r.db.Create(run).Error
}

func (r *scheduleRepository) GetScheduleRunByID(id uint) (*models.ScheduleRun, error) {
	var run models.ScheduleRun
	err := r.db.Preload("SemesterOffering").
		Preload("ScheduleBlocks").
		Preload("ScheduleEntries").
		Preload("ScheduleEntries.CourseOffering").
		Preload("ScheduleEntries.CourseOffering.Subject").
		Preload("ScheduleEntries.Teacher").
		Preload("ScheduleEntries.Room").
		First(&run, id).Error
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (r *scheduleRepository) GetScheduleRunsBySemesterOffering(semesterOfferingID uint) ([]models.ScheduleRun, error) {
	var runs []models.ScheduleRun
	err := r.db.Where("semester_offering_id = ?", semesterOfferingID).
		Order("created_at DESC").Find(&runs).Error
	return runs, err
}

func (r *scheduleRepository) UpdateScheduleRun(run *models.ScheduleRun) error {
	return r.db.Save(run).Error
}

func (r *scheduleRepository) CreateScheduleBlock(block *models.ScheduleBlock) error {
	return r.db.Create(block).Error
}

func (r *scheduleRepository) CreateScheduleEntry(entry *models.ScheduleEntry) error {
	return r.db.Create(entry).Error
}

func (r *scheduleRepository) CreateScheduleEntries(entries []models.ScheduleEntry) error {
	return r.db.Create(&entries).Error
}

func (r *scheduleRepository) GetScheduleEntriesByRun(scheduleRunID uint) ([]models.ScheduleEntry, error) {
	var entries []models.ScheduleEntry
	err := r.db.Preload("CourseOffering").
		Preload("CourseOffering.Subject").
		Preload("Teacher").
		Preload("Room").
		Where("schedule_run_id = ?", scheduleRunID).
		Order("day_of_week, slot_number").
		Find(&entries).Error
	return entries, err
}

func (r *scheduleRepository) GetScheduleEntriesBySession(sessionID uint) ([]models.ScheduleEntry, error) {
	var entries []models.ScheduleEntry
	err := r.db.Preload("CourseOffering").
		Preload("CourseOffering.Subject").
		Preload("Teacher").
		Preload("Room").
		Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
		Where("schedule_entries.session_id = ? AND schedule_runs.status = ?", sessionID, "COMMITTED").
		Order("day_of_week, slot_number").
		Find(&entries).Error
	return entries, err
}

func (r *scheduleRepository) GetCommittedScheduleEntries(sessionID uint) ([]models.ScheduleEntry, error) {
	var entries []models.ScheduleEntry
	err := r.db.Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
		Where("schedule_entries.session_id = ? AND schedule_runs.status = ?", sessionID, "COMMITTED").
		Find(&entries).Error
	return entries, err
}

func (r *scheduleRepository) DeleteScheduleEntriesByRun(scheduleRunID uint) error {
	return r.db.Where("schedule_run_id = ?", scheduleRunID).Delete(&models.ScheduleEntry{}).Error
}

func (r *scheduleRepository) DeleteScheduleBlocksByRun(scheduleRunID uint) error {
	return r.db.Where("schedule_run_id = ?", scheduleRunID).Delete(&models.ScheduleBlock{}).Error
}

func (r *scheduleRepository) DeleteScheduleRun(scheduleRunID uint) error {
	return r.db.Delete(&models.ScheduleRun{}, scheduleRunID).Error
}

func (r *scheduleRepository) CommitScheduleRun(scheduleRunID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Update schedule run status
		if err := tx.Model(&models.ScheduleRun{}).
			Where("id = ?", scheduleRunID).
			Updates(map[string]interface{}{
				"status":       "COMMITTED",
				"committed_at": gorm.Expr("NOW()"),
			}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *scheduleRepository) CheckTeacherAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error) {
	var count int64
	err := r.db.Model(&models.ScheduleEntry{}).
		Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
		Where("schedule_entries.teacher_id = ? AND schedule_entries.session_id = ? AND schedule_entries.day_of_week = ? AND schedule_entries.slot_number IN ? AND schedule_runs.status = ?", 
			teacherID, sessionID, dayOfWeek, slotNumbers, "COMMITTED").
		Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count == 0, nil
}

func (r *scheduleRepository) CheckRoomAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error) {
	var count int64
	err := r.db.Model(&models.ScheduleEntry{}).
		Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
		Where("schedule_entries.room_id = ? AND schedule_entries.session_id = ? AND schedule_entries.day_of_week = ? AND schedule_entries.slot_number IN ? AND schedule_runs.status = ?", 
			roomID, sessionID, dayOfWeek, slotNumbers, "COMMITTED").
		Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count == 0, nil
}

func (r *scheduleRepository) CheckStudentGroupAvailability(semesterOfferingID uint, dayOfWeek int, slotNumbers []int, excludeRunID uint) (bool, error) {
	var count int64
	query := r.db.Model(&models.ScheduleEntry{}).
		Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
		Where("schedule_entries.semester_offering_id = ? AND schedule_entries.day_of_week = ? AND schedule_entries.slot_number IN ? AND schedule_runs.status = ?", 
			semesterOfferingID, dayOfWeek, slotNumbers, "COMMITTED")
	
	if excludeRunID > 0 {
		query = query.Where("schedule_entries.schedule_run_id != ?", excludeRunID)
	}
	
	err := query.Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count == 0, nil
}