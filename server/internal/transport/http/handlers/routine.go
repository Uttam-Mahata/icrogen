package handlers

import (
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RoutineHandler struct {
	routineService service.RoutineGenerationService
}

func NewRoutineHandler(routineService service.RoutineGenerationService) *RoutineHandler {
	return &RoutineHandler{
		routineService: routineService,
	}
}

// GenerateRoutine generates a routine for a semester offering
func (h *RoutineHandler) GenerateRoutine(c *gin.Context) {
	var req dto.GenerateRoutineRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	scheduleRun, err := h.routineService.GenerateRoutine(req.SemesterOfferingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Routine generated successfully",
		Data:    scheduleRun,
	})
}

// GetScheduleRun gets a schedule run by ID
func (h *RoutineHandler) GetScheduleRun(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid schedule run ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	scheduleRun, err := h.routineService.GetScheduleRun(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    scheduleRun,
	})
}

// GetScheduleRunsBySemesterOffering gets schedule runs by semester offering ID
func (h *RoutineHandler) GetScheduleRunsBySemesterOffering(c *gin.Context) {
	semesterOfferingIDStr := c.Param("semester_offering_id")
	semesterOfferingID, err := strconv.ParseUint(semesterOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	scheduleRuns, err := h.routineService.GetScheduleRunsBySemesterOffering(uint(semesterOfferingID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusInternalServerError,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Data:    scheduleRuns,
	})
}

// CommitScheduleRun commits a draft schedule run
func (h *RoutineHandler) CommitScheduleRun(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid schedule run ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.routineService.CommitScheduleRun(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Schedule run committed successfully",
	})
}

// CancelScheduleRun cancels a draft schedule run
func (h *RoutineHandler) CancelScheduleRun(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid schedule run ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.routineService.CancelScheduleRun(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Schedule run cancelled successfully",
	})
}