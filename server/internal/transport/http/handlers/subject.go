package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SubjectHandler struct {
	subjectService service.SubjectService
}

func NewSubjectHandler(subjectService service.SubjectService) *SubjectHandler {
	return &SubjectHandler{
		subjectService: subjectService,
	}
}

func (h *SubjectHandler) CreateSubject(c *gin.Context) {
	var req dto.CreateSubjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	subject := &models.Subject{
		Name:             req.Name,
		Code:             req.Code,
		Credit:           req.Credit,
		ClassLoadPerWeek: req.ClassLoadPerWeek,
		ProgrammeID:      req.ProgrammeID,
		DepartmentID:     req.DepartmentID,
		SubjectTypeID:    req.SubjectTypeID,
		IsActive:         true,
	}

	if err := h.subjectService.CreateSubject(subject); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    subject,
	})
}

func (h *SubjectHandler) GetAllSubjects(c *gin.Context) {
	subjects, err := h.subjectService.GetAllSubjects()
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
		Data:    subjects,
	})
}

func (h *SubjectHandler) GetSubject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	subject, err := h.subjectService.GetSubjectByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Subject not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    subject,
	})
}

func (h *SubjectHandler) GetSubjectsByDepartment(c *gin.Context) {
	// Try to get department_id first, if not found, try id
	idStr := c.Param("department_id")
	if idStr == "" {
		idStr = c.Param("id")
	}
	departmentID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid department ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	subjects, err := h.subjectService.GetSubjectsByDepartmentID(uint(departmentID))
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
		Data:    subjects,
	})
}

func (h *SubjectHandler) GetSubjectsByProgrammeAndDepartment(c *gin.Context) {
	programmeIDStr := c.Query("programme_id")
	departmentIDStr := c.Query("department_id")

	programmeID, err := strconv.ParseUint(programmeIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid programme ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	departmentID, err := strconv.ParseUint(departmentIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid department ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	subjects, err := h.subjectService.GetSubjectsByProgrammeAndDepartment(uint(programmeID), uint(departmentID))
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
		Data:    subjects,
	})
}

func (h *SubjectHandler) UpdateSubject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateSubjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Fetch existing subject to preserve ProgrammeID and DepartmentID
	existing, err := h.subjectService.GetSubjectByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Subject not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Update only the allowed fields
	existing.Name = req.Name
	existing.Code = req.Code
	existing.Credit = req.Credit
	existing.ClassLoadPerWeek = req.ClassLoadPerWeek
	existing.IsActive = req.IsActive
	
	// Only update SubjectTypeID if provided
	if req.SubjectTypeID != 0 {
		existing.SubjectTypeID = req.SubjectTypeID
	}

	if err := h.subjectService.UpdateSubject(existing); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    existing,
	})
}

func (h *SubjectHandler) DeleteSubject(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.subjectService.DeleteSubject(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Subject deleted successfully",
	})
}

type SubjectTypeHandler struct {
	subjectTypeService service.SubjectTypeService
}

func NewSubjectTypeHandler(subjectTypeService service.SubjectTypeService) *SubjectTypeHandler {
	return &SubjectTypeHandler{
		subjectTypeService: subjectTypeService,
	}
}

func (h *SubjectTypeHandler) CreateSubjectType(c *gin.Context) {
	var req dto.CreateSubjectTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	subjectType := &models.SubjectType{
		Name:  req.Name,
		IsLab: req.IsLab,
	}

	if err := h.subjectTypeService.CreateSubjectType(subjectType); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    subjectType,
	})
}

func (h *SubjectTypeHandler) GetAllSubjectTypes(c *gin.Context) {
	subjectTypes, err := h.subjectTypeService.GetAllSubjectTypes()
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
		Data:    subjectTypes,
	})
}

func (h *SubjectTypeHandler) GetSubjectType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject type ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	subjectType, err := h.subjectTypeService.GetSubjectTypeByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Subject type not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    subjectType,
	})
}

func (h *SubjectTypeHandler) UpdateSubjectType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject type ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateSubjectTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	subjectType := &models.SubjectType{
		ID:    uint(id),
		Name:  req.Name,
		IsLab: req.IsLab,
	}

	if err := h.subjectTypeService.UpdateSubjectType(subjectType); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    subjectType,
	})
}

func (h *SubjectTypeHandler) DeleteSubjectType(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid subject type ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.subjectTypeService.DeleteSubjectType(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Subject type deleted successfully",
	})
}