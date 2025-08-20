package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type TeacherHandler struct {
	teacherService service.TeacherService
}

func NewTeacherHandler(teacherService service.TeacherService) *TeacherHandler {
	return &TeacherHandler{
		teacherService: teacherService,
	}
}

func (h *TeacherHandler) CreateTeacher(c *gin.Context) {
	var req dto.CreateTeacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	teacher := &models.Teacher{
		Name:         req.Name,
		Email:        req.Email,
		DepartmentID: req.DepartmentID,
		IsActive:     true,
	}

	if err := h.teacherService.CreateTeacher(teacher); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    teacher,
	})
}

func (h *TeacherHandler) GetAllTeachers(c *gin.Context) {
	teachers, err := h.teacherService.GetAllTeachers()
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
		Data:    teachers,
	})
}

func (h *TeacherHandler) GetTeacher(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid teacher ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	teacher, err := h.teacherService.GetTeacherByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Teacher not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    teacher,
	})
}

func (h *TeacherHandler) GetTeachersByDepartment(c *gin.Context) {
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

	teachers, err := h.teacherService.GetTeachersByDepartmentID(uint(departmentID))
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
		Data:    teachers,
	})
}

func (h *TeacherHandler) UpdateTeacher(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid teacher ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateTeacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	teacher := &models.Teacher{
		ID:           uint(id),
		Name:         req.Name,
		Email:        req.Email,
		DepartmentID: req.DepartmentID,
		IsActive:     req.IsActive,
	}

	if err := h.teacherService.UpdateTeacher(teacher); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    teacher,
	})
}

func (h *TeacherHandler) DeleteTeacher(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid teacher ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.teacherService.DeleteTeacher(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Teacher deleted successfully",
	})
}