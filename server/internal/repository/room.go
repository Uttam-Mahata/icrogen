package repository

import (
	"icrogen/internal/models"

	"gorm.io/gorm"
)

// RoomRepository interface for room operations
type RoomRepository interface {
	Create(room *models.Room) error
	GetByID(id uint) (*models.Room, error)
	GetAll() ([]models.Room, error)
	GetByType(roomType string) ([]models.Room, error)
	GetByDepartmentID(departmentID uint) ([]models.Room, error)
	Update(room *models.Room) error
	Delete(id uint) error
	CheckAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error)
	GetAvailableRooms(sessionID uint, dayOfWeek int, slotNumber int, roomType string) ([]models.Room, error)
}

type roomRepository struct {
	db *gorm.DB
}

func NewRoomRepository(db *gorm.DB) RoomRepository {
	return &roomRepository{db: db}
}

func (r *roomRepository) Create(room *models.Room) error {
	return r.db.Create(room).Error
}

func (r *roomRepository) GetByID(id uint) (*models.Room, error) {
	var room models.Room
	err := r.db.Preload("Department").First(&room, id).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *roomRepository) GetAll() ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Preload("Department").Where("is_active = ?", true).Find(&rooms).Error
	return rooms, err
}

func (r *roomRepository) GetByType(roomType string) ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Where("type = ? AND is_active = ?", roomType, true).Find(&rooms).Error
	return rooms, err
}

func (r *roomRepository) GetByDepartmentID(departmentID uint) ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Where("department_id = ? AND is_active = ?", departmentID, true).Find(&rooms).Error
	return rooms, err
}

func (r *roomRepository) Update(room *models.Room) error {
	// Only update specific fields to avoid datetime issues
	return r.db.Model(&models.Room{}).
		Where("id = ?", room.ID).
		Updates(map[string]interface{}{
			"name":          room.Name,
			"room_number":   room.RoomNumber,
			"capacity":      room.Capacity,
			"type":          room.Type,
			"department_id": room.DepartmentID,
			"is_active":     room.IsActive,
		}).Error
}

func (r *roomRepository) Delete(id uint) error {
	return r.db.Delete(&models.Room{}, id).Error
}

func (r *roomRepository) CheckAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error) {
	var count int64
	err := r.db.Model(&models.ScheduleEntry{}).
		Where("room_id = ? AND session_id = ? AND day_of_week = ? AND slot_number = ?", 
			roomID, sessionID, dayOfWeek, slotNumber).
		Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count == 0, nil
}

func (r *roomRepository) GetAvailableRooms(sessionID uint, dayOfWeek int, slotNumber int, roomType string) ([]models.Room, error) {
	var rooms []models.Room
	
	subQuery := r.db.Model(&models.ScheduleEntry{}).
		Select("room_id").
		Where("session_id = ? AND day_of_week = ? AND slot_number = ?", sessionID, dayOfWeek, slotNumber)
	
	query := r.db.Where("is_active = ?", true)
	if roomType != "" {
		query = query.Where("type = ?", roomType)
	}
	
	err := query.Where("id NOT IN (?)", subQuery).Find(&rooms).Error
	return rooms, err
}