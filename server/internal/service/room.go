package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// RoomService interface for room business logic
type RoomService interface {
	CreateRoom(room *models.Room) error
	GetRoomByID(id uint) (*models.Room, error)
	GetAllRooms() ([]models.Room, error)
	GetRoomsByType(roomType string) ([]models.Room, error)
	GetRoomsByDepartmentID(departmentID uint) ([]models.Room, error)
	UpdateRoom(room *models.Room) error
	DeleteRoom(id uint) error
	CheckRoomAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error)
	GetAvailableRooms(sessionID uint, dayOfWeek int, slotNumber int, roomType string) ([]models.Room, error)
}

type roomService struct {
	roomRepo       repository.RoomRepository
	departmentRepo repository.DepartmentRepository
}

func NewRoomService(
	roomRepo repository.RoomRepository,
	departmentRepo repository.DepartmentRepository,
) RoomService {
	return &roomService{
		roomRepo:       roomRepo,
		departmentRepo: departmentRepo,
	}
}

func (s *roomService) CreateRoom(room *models.Room) error {
	// Validate room data
	if room.Name == "" {
		return errors.New("room name is required")
	}
	if room.RoomNumber == "" {
		return errors.New("room number is required")
	}
	if room.Type == "" {
		return errors.New("room type is required")
	}
	if room.Capacity < 0 {
		return errors.New("capacity cannot be negative")
	}
	
	// Validate room type
	validTypes := map[string]bool{"THEORY": true, "LAB": true, "OTHER": true}
	if !validTypes[room.Type] {
		return errors.New("invalid room type")
	}
	
	// Validate department if provided
	if room.DepartmentID != nil {
		_, err := s.departmentRepo.GetByID(*room.DepartmentID)
		if err != nil {
			return errors.New("invalid department ID")
		}
	}
	
	return s.roomRepo.Create(room)
}

func (s *roomService) GetRoomByID(id uint) (*models.Room, error) {
	if id == 0 {
		return nil, errors.New("invalid room ID")
	}
	return s.roomRepo.GetByID(id)
}

func (s *roomService) GetAllRooms() ([]models.Room, error) {
	return s.roomRepo.GetAll()
}

func (s *roomService) GetRoomsByType(roomType string) ([]models.Room, error) {
	validTypes := map[string]bool{"THEORY": true, "LAB": true, "OTHER": true}
	if !validTypes[roomType] {
		return nil, errors.New("invalid room type")
	}
	return s.roomRepo.GetByType(roomType)
}

func (s *roomService) GetRoomsByDepartmentID(departmentID uint) ([]models.Room, error) {
	if departmentID == 0 {
		return nil, errors.New("invalid department ID")
	}
	return s.roomRepo.GetByDepartmentID(departmentID)
}

func (s *roomService) UpdateRoom(room *models.Room) error {
	if room.ID == 0 {
		return errors.New("room ID is required for update")
	}
	
	// Validate room data
	if room.Name == "" {
		return errors.New("room name is required")
	}
	if room.RoomNumber == "" {
		return errors.New("room number is required")
	}
	if room.Type == "" {
		return errors.New("room type is required")
	}
	if room.Capacity < 0 {
		return errors.New("capacity cannot be negative")
	}
	
	return s.roomRepo.Update(room)
}

func (s *roomService) DeleteRoom(id uint) error {
	if id == 0 {
		return errors.New("invalid room ID")
	}
	
	// TODO: Check if room has active assignments
	// This would require checking RoomAssignment records
	
	return s.roomRepo.Delete(id)
}

func (s *roomService) CheckRoomAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumber int) (bool, error) {
	if roomID == 0 || sessionID == 0 {
		return false, errors.New("invalid room ID or session ID")
	}
	if dayOfWeek < 1 || dayOfWeek > 5 {
		return false, errors.New("invalid day of week (1-5)")
	}
	if slotNumber < 1 || slotNumber > 8 {
		return false, errors.New("invalid slot number (1-8)")
	}
	
	return s.roomRepo.CheckAvailability(roomID, sessionID, dayOfWeek, slotNumber)
}

func (s *roomService) GetAvailableRooms(sessionID uint, dayOfWeek int, slotNumber int, roomType string) ([]models.Room, error) {
	if sessionID == 0 {
		return nil, errors.New("invalid session ID")
	}
	if dayOfWeek < 1 || dayOfWeek > 5 {
		return nil, errors.New("invalid day of week (1-5)")
	}
	if slotNumber < 1 || slotNumber > 8 {
		return nil, errors.New("invalid slot number (1-8)")
	}
	
	return s.roomRepo.GetAvailableRooms(sessionID, dayOfWeek, slotNumber, roomType)
}