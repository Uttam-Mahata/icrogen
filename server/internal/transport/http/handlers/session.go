package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SessionHandler struct {
	sessionService service.SessionService
}

func NewSessionHandler(sessionService service.SessionService) *SessionHandler {
	return &SessionHandler{
		sessionService: sessionService,
	}
}

func (h *SessionHandler) CreateSession(c *gin.Context) {
	var req dto.CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	session := &models.Session{
		Name:         req.Name,
		AcademicYear: req.AcademicYear,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
	}

	if err := h.sessionService.CreateSession(session); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    session,
	})
}

func (h *SessionHandler) GetAllSessions(c *gin.Context) {
	sessions, err := h.sessionService.GetAllSessions()
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
		Data:    sessions,
	})
}

func (h *SessionHandler) GetSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	session, err := h.sessionService.GetSessionByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Session not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    session,
	})
}

func (h *SessionHandler) GetSessionsByYear(c *gin.Context) {
	academicYear := c.Query("academic_year")
	if academicYear == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Academic year is required",
			Code:    http.StatusBadRequest,
		})
		return
	}

	sessions, err := h.sessionService.GetSessionsByYear(academicYear)
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
		Data:    sessions,
	})
}

func (h *SessionHandler) UpdateSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Get existing session to preserve academic year
	existingSession, err := h.sessionService.GetSessionByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Session not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	session := &models.Session{
		ID:           uint(id),
		Name:         req.Name,
		AcademicYear: existingSession.AcademicYear, // Keep original year
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
	}

	if err := h.sessionService.UpdateSession(session); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    session,
	})
}

func (h *SessionHandler) DeleteSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.sessionService.DeleteSession(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Session deleted successfully",
	})
}

func (h *SessionHandler) HardDeleteSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.sessionService.HardDeleteSession(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Session permanently deleted",
	})
}

func (h *SessionHandler) RestoreSession(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.sessionService.RestoreSession(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Session restored successfully",
	})
}