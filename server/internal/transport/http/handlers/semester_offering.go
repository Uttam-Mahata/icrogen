package handlers

import (
	"icrogen/internal/models"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SemesterOfferingHandler struct {
	semesterOfferingService service.SemesterOfferingService
	courseOfferingService   service.CourseOfferingService
}

func NewSemesterOfferingHandler(
	semesterOfferingService service.SemesterOfferingService,
	courseOfferingService service.CourseOfferingService,
) *SemesterOfferingHandler {
	return &SemesterOfferingHandler{
		semesterOfferingService: semesterOfferingService,
		courseOfferingService:   courseOfferingService,
	}
}

func (h *SemesterOfferingHandler) CreateSemesterOffering(c *gin.Context) {
	var req dto.CreateSemesterOfferingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	offering := &models.SemesterOffering{
		ProgrammeID:     req.ProgrammeID,
		DepartmentID:    req.DepartmentID,
		SessionID:       req.SessionID,
		SemesterNumber:  req.SemesterNumber,
		Status:          "DRAFT",
	}

	if err := h.semesterOfferingService.CreateSemesterOffering(offering); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    offering,
	})
}

func (h *SemesterOfferingHandler) GetAllSemesterOfferings(c *gin.Context) {
	offerings, err := h.semesterOfferingService.GetAllSemesterOfferings()
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
		Data:    offerings,
	})
}

func (h *SemesterOfferingHandler) GetSemesterOfferingsBySession(c *gin.Context) {
	sessionIDStr := c.Param("session_id")
	sessionID, err := strconv.ParseUint(sessionIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid session ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	offerings, err := h.semesterOfferingService.GetSemesterOfferingsBySession(uint(sessionID))
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
		Data:    offerings,
	})
}

func (h *SemesterOfferingHandler) GetSemesterOffering(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	offering, err := h.semesterOfferingService.GetSemesterOfferingWithCourseOfferings(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Semester offering not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    offering,
	})
}

func (h *SemesterOfferingHandler) UpdateSemesterOffering(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.UpdateSemesterOfferingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	// Fetch existing offering first to get all required fields
	existing, err := h.semesterOfferingService.GetSemesterOfferingByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Error:   "Semester offering not found",
			Code:    http.StatusNotFound,
		})
		return
	}

	// Update only the status field
	existing.Status = req.Status

	if err := h.semesterOfferingService.UpdateSemesterOffering(existing); err != nil {
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

func (h *SemesterOfferingHandler) DeleteSemesterOffering(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.semesterOfferingService.DeleteSemesterOffering(uint(id)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Semester offering deleted successfully",
	})
}

// Course offering management within a semester offering
func (h *SemesterOfferingHandler) AddCourseOffering(c *gin.Context) {
	idStr := c.Param("id")
	semesterOfferingID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.CreateCourseOfferingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	courseOffering := &models.CourseOffering{
		SemesterOfferingID:  uint(semesterOfferingID),
		SubjectID:           req.SubjectID,
		WeeklyRequiredSlots: req.WeeklyRequiredSlots,
		RequiredPattern:     req.RequiredPattern,
		PreferredRoomID:     req.PreferredRoomID,
		Notes:               req.Notes,
	}

	// Create course offering with optional teacher assignments
	if err := h.courseOfferingService.CreateCourseOfferingWithTeachers(courseOffering, req.TeacherIDs); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{
		Success: true,
		Data:    courseOffering,
	})
}

// Teacher assignment for a course offering
func (h *SemesterOfferingHandler) AssignTeacherToCourse(c *gin.Context) {
	courseOfferingIDStr := c.Param("course_offering_id")
	
	courseOfferingID, err := strconv.ParseUint(courseOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid course offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.AssignTeacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	assignment := &models.TeacherAssignment{
		CourseOfferingID: uint(courseOfferingID),
		TeacherID:        req.TeacherID,
		Weight:           req.Weight,
	}

	if err := h.courseOfferingService.AssignTeacher(assignment); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    assignment,
	})
}

// Room assignment for a course offering
func (h *SemesterOfferingHandler) AssignRoomToCourse(c *gin.Context) {
	courseOfferingIDStr := c.Param("course_offering_id")
	
	courseOfferingID, err := strconv.ParseUint(courseOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid course offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	var req dto.AssignRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	assignment := &models.RoomAssignment{
		CourseOfferingID: uint(courseOfferingID),
		RoomID:           req.RoomID,
		Priority:         req.Priority,
	}

	if err := h.courseOfferingService.AssignRoom(assignment); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Data:    assignment,
	})
}

// Get course offerings for a semester offering
func (h *SemesterOfferingHandler) GetCourseOfferings(c *gin.Context) {
	idStr := c.Param("id")
	semesterOfferingID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid semester offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	offerings, err := h.courseOfferingService.GetCourseOfferingsBySemesterOffering(uint(semesterOfferingID))
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
		Data:    offerings,
	})
}

// Remove course offering
func (h *SemesterOfferingHandler) RemoveCourseOffering(c *gin.Context) {
	courseOfferingIDStr := c.Param("course_offering_id")
	courseOfferingID, err := strconv.ParseUint(courseOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid course offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.courseOfferingService.DeleteCourseOffering(uint(courseOfferingID)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Course offering removed successfully",
	})
}

// Remove teacher from course
func (h *SemesterOfferingHandler) RemoveTeacherFromCourse(c *gin.Context) {
	courseOfferingIDStr := c.Param("course_offering_id")
	teacherIDStr := c.Param("teacher_id")
	
	courseOfferingID, err := strconv.ParseUint(courseOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid course offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	teacherID, err := strconv.ParseUint(teacherIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid teacher ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.courseOfferingService.RemoveTeacher(uint(courseOfferingID), uint(teacherID)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Teacher removed successfully",
	})
}

// Remove room from course
func (h *SemesterOfferingHandler) RemoveRoomFromCourse(c *gin.Context) {
	courseOfferingIDStr := c.Param("course_offering_id")
	roomIDStr := c.Param("room_id")
	
	courseOfferingID, err := strconv.ParseUint(courseOfferingIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid course offering ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   "Invalid room ID",
			Code:    http.StatusBadRequest,
		})
		return
	}

	if err := h.courseOfferingService.RemoveRoom(uint(courseOfferingID), uint(roomID)); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Error:   err.Error(),
			Code:    http.StatusBadRequest,
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{
		Success: true,
		Message: "Room removed successfully",
	})
}