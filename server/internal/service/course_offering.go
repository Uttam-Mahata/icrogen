package service

import (
	"encoding/json"
	"errors"
	"icrogen/internal/models"
	"icrogen/internal/repository"
)

// CourseOfferingService interface for course offering business logic
type CourseOfferingService interface {
	CreateCourseOffering(offering *models.CourseOffering) error
	CreateCourseOfferingWithTeachers(offering *models.CourseOffering, teacherIDs []uint) error
	GetCourseOfferingByID(id uint) (*models.CourseOffering, error)
	GetCourseOfferingsBySemesterOffering(semesterOfferingID uint) ([]models.CourseOffering, error)
	UpdateCourseOffering(offering *models.CourseOffering) error
	DeleteCourseOffering(id uint) error
	AssignTeacher(assignment *models.TeacherAssignment) error
	RemoveTeacherAssignment(assignmentID uint) error
	RemoveTeacher(courseOfferingID uint, teacherID uint) error
	AssignRoom(assignment *models.RoomAssignment) error
	RemoveRoomAssignment(assignmentID uint) error
	RemoveRoom(courseOfferingID uint, roomID uint) error
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
			offering.RequiredPattern = `["3"]`
		}
	} else {
		offering.IsLab = false
		// For theory classes, set default pattern if not provided
		if offering.RequiredPattern == "" {
			offering.RequiredPattern = `["1"]`
		}
	}
	
	// Validate and format RequiredPattern as JSON
	if offering.RequiredPattern != "" {
		// Check if it's already valid JSON
		var pattern []string
		err := json.Unmarshal([]byte(offering.RequiredPattern), &pattern)
		if err != nil {
			// If not valid JSON, try to convert it to JSON array
			// Support formats like "2+2" or "3"
			patternArray := []string{offering.RequiredPattern}
			jsonBytes, _ := json.Marshal(patternArray)
			offering.RequiredPattern = string(jsonBytes)
		}
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

func (s *courseOfferingService) CreateCourseOfferingWithTeachers(offering *models.CourseOffering, teacherIDs []uint) error {
	// First validate and create the course offering
	if err := s.CreateCourseOffering(offering); err != nil {
		return err
	}

	// Smart room allocation - if no preferred room is set, try to find an available room
	if offering.PreferredRoomID == nil {
		// Get subject to determine room type needed
		subject, _ := s.subjectRepo.GetByID(offering.SubjectID)
		
		// Determine required room type
		roomType := "THEORY"
		if subject.SubjectType.IsLab {
			roomType = "LAB"
		}
		
		// Get all available rooms of the required type
		rooms, err := s.roomRepo.GetByType(roomType)
		if err == nil && len(rooms) > 0 {
			// First try to find a room without department (free room)
			for _, room := range rooms {
				if room.DepartmentID == nil && room.IsActive {
					// Assign this free room
					roomAssignment := &models.RoomAssignment{
						CourseOfferingID: offering.ID,
						RoomID:          room.ID,
						Priority:        1,
					}
					s.courseOfferingRepo.AssignRoom(roomAssignment)
					break
				}
			}
			
			// If no free room found, use the first available room of correct type
			if offering.PreferredRoomID == nil {
				for _, room := range rooms {
					if room.IsActive {
						roomAssignment := &models.RoomAssignment{
							CourseOfferingID: offering.ID,
							RoomID:          room.ID,
							Priority:        2, // Lower priority for department-owned rooms
						}
						s.courseOfferingRepo.AssignRoom(roomAssignment)
						break
					}
				}
			}
		}
	} else {
		// Use the preferred room
		roomAssignment := &models.RoomAssignment{
			CourseOfferingID: offering.ID,
			RoomID:          *offering.PreferredRoomID,
			Priority:        1,
		}
		s.courseOfferingRepo.AssignRoom(roomAssignment)
	}

	// Assign teachers if provided
	for _, teacherID := range teacherIDs {
		// Validate teacher exists
		if _, err := s.teacherRepo.GetByID(teacherID); err != nil {
			continue // Skip invalid teacher IDs
		}
		
		assignment := &models.TeacherAssignment{
			CourseOfferingID: offering.ID,
			TeacherID:       teacherID,
			Weight:          1,
		}
		s.courseOfferingRepo.AssignTeacher(assignment)
	}

	return nil
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

func (s *courseOfferingService) RemoveTeacher(courseOfferingID uint, teacherID uint) error {
	if courseOfferingID == 0 || teacherID == 0 {
		return errors.New("invalid course offering or teacher ID")
	}
	
	// Find the assignment to remove
	assignments, err := s.courseOfferingRepo.GetTeacherAssignments(courseOfferingID)
	if err != nil {
		return err
	}
	
	for _, assignment := range assignments {
		if assignment.TeacherID == teacherID {
			return s.courseOfferingRepo.RemoveTeacherAssignment(assignment.ID)
		}
	}
	
	return errors.New("teacher assignment not found")
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

func (s *courseOfferingService) RemoveRoom(courseOfferingID uint, roomID uint) error {
	if courseOfferingID == 0 || roomID == 0 {
		return errors.New("invalid course offering or room ID")
	}
	
	// Find the assignment to remove
	assignments, err := s.courseOfferingRepo.GetRoomAssignments(courseOfferingID)
	if err != nil {
		return err
	}
	
	for _, assignment := range assignments {
		if assignment.RoomID == roomID {
			return s.courseOfferingRepo.RemoveRoomAssignment(assignment.ID)
		}
	}
	
	return errors.New("room assignment not found")
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