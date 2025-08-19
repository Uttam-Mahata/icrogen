package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RoomHandler struct {
	roomService service.RoomService
}

func NewRoomHandler(roomService service.RoomService) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
	}
}

func (h *RoomHandler) CreateRoom(c *gin.Context) {
	var req dto.CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	room := &models.Room{
		Name:         req.Name,
		RoomNumber:   req.RoomNumber,
		Capacity:     req.Capacity,
		Type:         req.Type,
		DepartmentID: req.DepartmentID,
		IsActive:     true,
	}

	if err := h.roomService.CreateRoom(room); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    room,
	})
}

func (h *RoomHandler) GetAllRooms(c *gin.Context) {
	rooms, err := h.roomService.GetAllRooms()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    rooms,
	})
}

func (h *RoomHandler) GetRoom(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid room ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	room, err := h.roomService.GetRoomByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Room not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    room,
	})
}

func (h *RoomHandler) GetRoomsByType(c *gin.Context) {
	roomType := c.Query("type")
	if roomType == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Room type is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	rooms, err := h.roomService.GetRoomsByType(roomType)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    rooms,
	})
}

func (h *RoomHandler) GetRoomsByDepartment(c *gin.Context) {
	idStr := c.Param("department_id")
	departmentID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid department ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	rooms, err := h.roomService.GetRoomsByDepartmentID(uint(departmentID))
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    rooms,
	})
}

func (h *RoomHandler) UpdateRoom(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid room ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	room := &models.Room{
		ID:           uint(id),
		Name:         req.Name,
		RoomNumber:   req.RoomNumber,
		Capacity:     req.Capacity,
		Type:         req.Type,
		DepartmentID: req.DepartmentID,
		IsActive:     *req.IsActive,
	}

	if err := h.roomService.UpdateRoom(room); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    room,
	})
}

func (h *RoomHandler) DeleteRoom(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid room ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.roomService.DeleteRoom(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Room deleted successfully",
	})
}

func (h *RoomHandler) CheckRoomAvailability(c *gin.Context) {
	roomIDStr := c.Query("room_id")
	sessionIDStr := c.Query("session_id")
	dayOfWeekStr := c.Query("day_of_week")
	slotNumberStr := c.Query("slot_number")

	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid room ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	sessionID, err := strconv.ParseUint(sessionIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	dayOfWeek, err := strconv.Atoi(dayOfWeekStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid day of week",
			Code:    http.StatusBadRequest,
		})
		return
	}

	slotNumber, err := strconv.Atoi(slotNumberStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid slot number",
			Code:    http.StatusBadRequest,
		})
		return
	}

	available, err := h.roomService.CheckRoomAvailability(uint(roomID), uint(sessionID), dayOfWeek, slotNumber)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data: map[string]bool{
			"available": available,
		},
	})
}