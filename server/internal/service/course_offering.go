package service

import (
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// CourseOfferingService interface for course offering business logic
type CourseOfferingService interface {
	CreateCourseOffering(offering *models.CourseOffering) error
	GetCourseOfferingByID(id uint) (*models.CourseOffering, error)
	GetCourseOfferingsBySemesterOffering(semesterOfferingID uint) ([]models.CourseOffering, error)
	UpdateCourseOffering(offering *models.CourseOffering) error
	DeleteCourseOffering(id uint) error
	AssignTeacher(assignment *models.TeacherAssignment) error
	RemoveTeacherAssignment(assignmentID uint) error
	AssignRoom(assignment *models.RoomAssignment) error
	RemoveRoomAssignment(assignmentID uint) error
	GetTeacherAssignments(courseOfferingID uint) ([]models.TeacherAssignment, error)
	GetRoomAssignments(courseOfferingID uint) ([]models.RoomAssignment, error)
}

type courseOfferingService struct {
	courseOfferingRepo repository.CourseOfferingRepository
	subjectRepo        repository.SubjectRepository
	teacherRepo        repository.TeacherRepository
	roomRepo           repository.RoomRepository
}

func NewCourseOfferingService(
	courseOfferingRepo repository.CourseOfferingRepository,
	subjectRepo repository.SubjectRepository,
	teacherRepo repository.TeacherRepository,
	roomRepo repository.RoomRepository,
) CourseOfferingService {
	return &courseOfferingService{
		courseOfferingRepo: courseOfferingRepo,
		subjectRepo:        subjectRepo,
		teacherRepo:        teacherRepo,
		roomRepo:           roomRepo,
	}
}

func (s *courseOfferingService) CreateCourseOffering(offering *models.CourseOffering) error {
	// Validate offering data
	if offering.SemesterOfferingID == 0 {
		return errors.New("semester offering ID is required")
	}
	if offering.SubjectID == 0 {
		return errors.New("subject ID is required")
	}
	if offering.WeeklyRequiredSlots <= 0 {
		return errors.New("weekly required slots must be positive")
	}

	// Get subject to check if it's a lab
	subject, err := s.subjectRepo.GetByID(offering.SubjectID)
	if err != nil {
		return errors.New("invalid subject ID")
	}

	// Check if subject type is lab
	if subject.SubjectType.IsLab {
		offering.IsLab = true
		// Labs typically need 3-hour consecutive slots
		if offering.RequiredPattern == "" {
			offering.RequiredPattern = "3-consecutive"
		}
	} else {
		offering.IsLab = false
	}

	// Validate preferred room if provided
	if offering.PreferredRoomID != nil {
		_, err := s.roomRepo.GetByID(*offering.PreferredRoomID)
		if err != nil {
			return errors.New("invalid preferred room ID")
		}
	}

	return s.courseOfferingRepo.Create(offering)
}

func (s *courseOfferingService) GetCourseOfferingByID(id uint) (*models.CourseOffering, error) {
	if id == 0 {
		return nil, errors.New("invalid course offering ID")
	}
	return s.courseOfferingRepo.GetByID(id)
}

func (s *courseOfferingService) GetCourseOfferingsBySemesterOffering(semesterOfferingID uint) ([]models.CourseOffering, error) {
	if semesterOfferingID == 0 {
		return nil, errors.New("invalid semester offering ID")
	}
	return s.courseOfferingRepo.GetBySemesterOffering(semesterOfferingID)
}

func (s *courseOfferingService) UpdateCourseOffering(offering *models.CourseOffering) error {
	if offering.ID == 0 {
		return errors.New("course offering ID is required for update")
	}

	// Validate offering data
	if offering.WeeklyRequiredSlots <= 0 {
		return errors.New("weekly required slots must be positive")
	}

	return s.courseOfferingRepo.Update(offering)
}

func (s *courseOfferingService) DeleteCourseOffering(id uint) error {
	if id == 0 {
		return errors.New("invalid course offering ID")
	}

	// TODO: Check if course offering has schedule entries
	// This would require checking ScheduleEntry records

	return s.courseOfferingRepo.Delete(id)
}

func (s *courseOfferingService) AssignTeacher(assignment *models.TeacherAssignment) error {
	// Validate assignment data
	if assignment.CourseOfferingID == 0 {
		return errors.New("course offering ID is required")
	}
	if assignment.TeacherID == 0 {
		return errors.New("teacher ID is required")
	}
	if assignment.Weight <= 0 {
		assignment.Weight = 1 // Default weight
	}

	// Validate teacher exists
	_, err := s.teacherRepo.GetByID(assignment.TeacherID)
	if err != nil {
		return errors.New("invalid teacher ID")
	}

	// Validate course offering exists
	_, err = s.courseOfferingRepo.GetByID(assignment.CourseOfferingID)
	if err != nil {
		return errors.New("invalid course offering ID")
	}

	return s.courseOfferingRepo.AssignTeacher(assignment)
}

func (s *courseOfferingService) RemoveTeacherAssignment(assignmentID uint) error {
	if assignmentID == 0 {
		return errors.New("invalid assignment ID")
	}
	return s.courseOfferingRepo.RemoveTeacherAssignment(assignmentID)
}

func (s *courseOfferingService) AssignRoom(assignment *models.RoomAssignment) error {
	// Validate assignment data
	if assignment.CourseOfferingID == 0 {
		return errors.New("course offering ID is required")
	}
	if assignment.RoomID == 0 {
		return errors.New("room ID is required")
	}
	if assignment.Priority <= 0 {
		assignment.Priority = 1 // Default priority
	}

	// Validate room exists
	_, err := s.roomRepo.GetByID(assignment.RoomID)
	if err != nil {
		return errors.New("invalid room ID")
	}

	// Validate course offering exists
	courseOffering, err := s.courseOfferingRepo.GetByID(assignment.CourseOfferingID)
	if err != nil {
		return errors.New("invalid course offering ID")
	}

	// Check if room type matches subject type (lab room for lab subject)
	room, _ := s.roomRepo.GetByID(assignment.RoomID)
	if courseOffering.IsLab && room.Type != "LAB" {
		return errors.New("lab subjects require lab rooms")
	}
	if !courseOffering.IsLab && room.Type == "LAB" {
		return errors.New("theory subjects cannot use lab rooms")
	}

	return s.courseOfferingRepo.AssignRoom(assignment)
}

func (s *courseOfferingService) RemoveRoomAssignment(assignmentID uint) error {
	if assignmentID == 0 {
		return errors.New("invalid assignment ID")
	}
	return s.courseOfferingRepo.RemoveRoomAssignment(assignmentID)
}

func (s *courseOfferingService) GetTeacherAssignments(courseOfferingID uint) ([]models.TeacherAssignment, error) {
	if courseOfferingID == 0 {
		return nil, errors.New("invalid course offering ID")
	}
	return s.courseOfferingRepo.GetTeacherAssignments(courseOfferingID)
}

func (s *courseOfferingService) GetRoomAssignments(courseOfferingID uint) ([]models.RoomAssignment, error) {
	if courseOfferingID == 0 {
		return nil, errors.New("invalid course offering ID")
	}
	return s.courseOfferingRepo.GetRoomAssignments(courseOfferingID)
}