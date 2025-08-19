package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ProgrammeHandler struct {
	programmeService service.ProgrammeService
}

func NewProgrammeHandler(programmeService service.ProgrammeService) *ProgrammeHandler {
	return &ProgrammeHandler{
		programmeService: programmeService,
	}
}

// CreateProgramme creates a new programme
func (h *ProgrammeHandler) CreateProgramme(c *gin.Context) {
	var req dto.CreateProgrammeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	programme := &models.Programme{
		Name:           req.Name,
		DurationYears:  req.DurationYears,
		TotalSemesters: req.TotalSemesters,
		IsActive:       true,
	}

	if err := h.programmeService.CreateProgramme(programme); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.APIResponse{
		Success: true,
		Message: "Programme created successfully",
		Data:    programme,
	})
}

// GetProgramme gets a programme by ID
func (h *ProgrammeHandler) GetProgramme(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid programme ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	programme, err := h.programmeService.GetProgrammeByID(uint(id))
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
		Data:    programme,
	})
}

// GetAllProgrammes gets all programmes
func (h *ProgrammeHandler) GetAllProgrammes(c *gin.Context) {
	programmes, err := h.programmeService.GetAllProgrammes()
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
		Data:    programmes,
	})
}

// UpdateProgramme updates a programme
func (h *ProgrammeHandler) UpdateProgramme(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid programme ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateProgrammeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Get existing programme
	programme, err := h.programmeService.GetProgrammeByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusNotFound,
		})
		return
	}

	// Update fields
	programme.Name = req.Name
	programme.DurationYears = req.DurationYears
	programme.TotalSemesters = req.TotalSemesters
	if req.IsActive != nil {
		programme.IsActive = *req.IsActive
	}

	if err := h.programmeService.UpdateProgramme(programme); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Programme updated successfully",
		Data:    programme,
	})
}

// DeleteProgramme deletes a programme
func (h *ProgrammeHandler) DeleteProgramme(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid programme ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.programmeService.DeleteProgramme(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.APIResponse{
		Success: true,
		Message: "Programme deleted successfully",
	})
}

// GetProgrammeWithDepartments gets a programme with its departments
func (h *ProgrammeHandler) GetProgrammeWithDepartments(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid programme ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	programme, err := h.programmeService.GetProgrammeWithDepartments(uint(id))
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
		Data:    programme,
	})
}