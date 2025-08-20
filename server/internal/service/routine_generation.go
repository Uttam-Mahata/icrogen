package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"icrogen/internal/models"
	"icrogen/internal/repository"
	"sort"
	"time"

	"github.com/sirupsen/logrus"
)

// RoutineGenerationService interface for routine generation business logic
type RoutineGenerationService interface {
	GenerateRoutine(semesterOfferingID uint) (*models.ScheduleRun, error)
	CommitScheduleRun(scheduleRunID uint) error
	CancelScheduleRun(scheduleRunID uint) error
	DeleteScheduleRun(scheduleRunID uint) error
	GetScheduleRun(scheduleRunID uint) (*models.ScheduleRun, error)
	GetScheduleRunsBySemesterOffering(semesterOfferingID uint) ([]models.ScheduleRun, error)
}

type routineGenerationService struct {
	scheduleRepo         repository.ScheduleRepository
	semesterOfferingRepo repository.SemesterOfferingRepository
	courseOfferingRepo   repository.CourseOfferingRepository
	teacherRepo          repository.TeacherRepository
	roomRepo             repository.RoomRepository
}

func NewRoutineGenerationService(
	scheduleRepo repository.ScheduleRepository,
	semesterOfferingRepo repository.SemesterOfferingRepository,
	courseOfferingRepo repository.CourseOfferingRepository,
	teacherRepo repository.TeacherRepository,
	roomRepo repository.RoomRepository,
) RoutineGenerationService {
	return &routineGenerationService{
		scheduleRepo:         scheduleRepo,
		semesterOfferingRepo: semesterOfferingRepo,
		courseOfferingRepo:   courseOfferingRepo,
		teacherRepo:          teacherRepo,
		roomRepo:             roomRepo,
	}
}

// GenerationReport represents the result of routine generation
type GenerationReport struct {
	TotalBlocks    int                   `json:"total_blocks"`
	PlacedBlocks   int                   `json:"placed_blocks"`
	UnplacedBlocks []models.ClassBlock   `json:"unplaced_blocks"`
	Conflicts      []string              `json:"conflicts"`
	Suggestions    []PlacementSuggestion `json:"suggestions"`
}

// PlacementSuggestion represents alternative time slots for unplaced blocks
type PlacementSuggestion struct {
	Block           models.ClassBlock `json:"block"`
	SuggestedSlots  []TimeSlot        `json:"suggested_slots"`
	ConflictReasons []string          `json:"conflict_reasons"`
}

// TimeSlot represents a suggested time slot
type TimeSlot struct {
	DayOfWeek   int `json:"day_of_week"`
	SlotStart   int `json:"slot_start"`
	SlotLength  int `json:"slot_length"`
}

func (s *routineGenerationService) GenerateRoutine(semesterOfferingID uint) (*models.ScheduleRun, error) {
	logrus.Info("Starting routine generation for semester offering ID: ", semesterOfferingID)
	
	// Get semester offering with all course offerings
	semesterOffering, err := s.semesterOfferingRepo.GetWithCourseOfferings(semesterOfferingID)
	if err != nil {
		return nil, fmt.Errorf("failed to get semester offering: %w", err)
	}
	
	logrus.Infof("Semester offering loaded: ID=%d, TotalStudents=%d, CourseOfferings=%d", 
		semesterOffering.ID, semesterOffering.TotalStudents, len(semesterOffering.CourseOfferings))
	
	// Create a new schedule run
	scheduleRun := &models.ScheduleRun{
		SemesterOfferingID: semesterOfferingID,
		Status:             "DRAFT",
		AlgorithmVersion:   "v1.0",
		GeneratedAt:        time.Now(),
		Meta:               "{}", // Initialize with empty JSON object
	}
	
	if err := s.scheduleRepo.CreateScheduleRun(scheduleRun); err != nil {
		return nil, fmt.Errorf("failed to create schedule run: %w", err)
	}
	
	// Generate class blocks from course offerings
	classBlocks, err := s.generateClassBlocks(semesterOffering.CourseOfferings)
	if err != nil {
		return nil, fmt.Errorf("failed to generate class blocks: %w", err)
	}
	
	// Initialize timetable
	timetable := s.initializeTimetable()
	
	// Load existing committed schedules for the session
	existingEntries, err := s.scheduleRepo.GetCommittedScheduleEntries(semesterOffering.SessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing schedule entries: %w", err)
	}
	
	// Mark existing committed slots as occupied
	s.markExistingSlots(timetable, existingEntries)
	
	// Run the backtracking algorithm
	report := s.runBacktrackingAlgorithm(classBlocks, timetable, semesterOffering.SessionID)
	
	// Convert timetable to schedule entries
	scheduleEntries := s.convertTimetableToEntries(timetable, scheduleRun.ID, semesterOffering)
	
	// Save schedule entries
	if len(scheduleEntries) > 0 {
		if err := s.scheduleRepo.CreateScheduleEntries(scheduleEntries); err != nil {
			return nil, fmt.Errorf("failed to save schedule entries: %w", err)
		}
	}
	
	// Update schedule run with report
	reportJSON, _ := json.Marshal(report)
	scheduleRun.Meta = string(reportJSON)
	
	if report.PlacedBlocks == report.TotalBlocks {
		scheduleRun.Status = "DRAFT" // Ready for commit
	} else {
		scheduleRun.Status = "FAILED" // Partial solution
	}
	
	if err := s.scheduleRepo.UpdateScheduleRun(scheduleRun); err != nil {
		return nil, fmt.Errorf("failed to update schedule run: %w", err)
	}
	
	logrus.Info("Routine generation completed. Placed: ", report.PlacedBlocks, "/", report.TotalBlocks)
	
	return s.scheduleRepo.GetScheduleRunByID(scheduleRun.ID)
}

func (s *routineGenerationService) generateClassBlocks(courseOfferings []models.CourseOffering) ([]models.ClassBlock, error) {
	var blocks []models.ClassBlock
	
	logrus.Infof("Generating class blocks for %d course offerings", len(courseOfferings))
	
	for _, offering := range courseOfferings {
		logrus.Debugf("Processing offering ID: %d, SubjectID: %d, IsLab: %v, SemesterOfferingID: %d", 
			offering.ID, offering.SubjectID, offering.IsLab, offering.SemesterOfferingID)
		logrus.Debugf("  RoomAssignments count: %d, TeacherAssignments count: %d", 
			len(offering.RoomAssignments), len(offering.TeacherAssignments))
		// Determine how many blocks needed based on weekly required slots
		weeklySlots := offering.WeeklyRequiredSlots
		isLab := offering.IsLab
		
		// Get assigned teachers
		if len(offering.TeacherAssignments) == 0 {
			logrus.Warnf("No teachers assigned to course offering %d (subject: %s), skipping", 
				offering.ID, offering.Subject.Name)
			continue // Skip this offering instead of failing
		}
		
		// Check if room is required
		var roomID uint
		if offering.RequiresRoom {
			logrus.Debugf("Offering %d requires room, RoomAssignments count: %d", offering.ID, len(offering.RoomAssignments))
			if len(offering.RoomAssignments) == 0 {
				logrus.Warnf("No rooms assigned to course offering %d (subject: %s) that requires room, skipping", 
					offering.ID, offering.Subject.Name)
				continue // Skip this offering instead of failing
			}
			roomID = offering.RoomAssignments[0].RoomID
			logrus.Debugf("Using room ID: %d for offering %d", roomID, offering.ID)
		} else {
			// For subjects that don't require room (like Other type)
			roomID = 0 // Will be handled specially in placement logic
			logrus.Debugf("Offering %d does not require room", offering.ID)
		}
		
		// Use first assigned teacher
		teacherID := offering.TeacherAssignments[0].TeacherID
		
		if isLab {
			logrus.Debugf("Processing lab offering ID: %d", offering.ID)
			// Check if lab needs to be divided into groups
			labGroups := s.determineLabGroups(offering)
			
			logrus.Debugf("Lab groups returned: %v (length: %d)", labGroups, len(labGroups))
			
			// Check if we actually have multiple groups (not just empty strings)
			hasMultipleGroups := len(labGroups) > 1 || (len(labGroups) == 1 && labGroups[0] != "")
			
			if hasMultipleGroups && len(labGroups) > 1 {
				// Create separate blocks for each lab group
				logrus.Infof("Creating %d lab blocks for groups: %v", len(labGroups), labGroups)
				for _, group := range labGroups {
					block := models.ClassBlock{
						SubjectID:          offering.SubjectID,
						TeacherID:          teacherID,
						RoomID:             roomID,
						DurationSlots:      3,
						IsLab:              true,
						LabGroup:           group,
						SemesterOfferingID: offering.SemesterOfferingID,
						CourseOfferingID:   offering.ID,
					}
					logrus.Debugf("Created lab block with group: %s", group)
					blocks = append(blocks, block)
				}
			} else {
				// Single lab block for all students (no group division needed)
				logrus.Infof("Creating single lab block without group division")
				block := models.ClassBlock{
					SubjectID:          offering.SubjectID,
					TeacherID:          teacherID,
					RoomID:             roomID,
					DurationSlots:      3,
					IsLab:              true,
					LabGroup:           "", // Empty string when no division is needed
					SemesterOfferingID: offering.SemesterOfferingID,
					CourseOfferingID:   offering.ID,
				}
				blocks = append(blocks, block)
			}
		} else {
			// Theory subjects - create blocks based on credit and weekly load
			// Apply patterns from DESIGN document
			patterns := s.getTheoryPatterns(weeklySlots, offering.Subject.Credit)
			
			for _, slotLength := range patterns {
				block := models.ClassBlock{
					SubjectID:          offering.SubjectID,
					TeacherID:          teacherID,
					RoomID:             roomID,
					DurationSlots:      slotLength,
					IsLab:              false,
					SemesterOfferingID: offering.SemesterOfferingID,
					CourseOfferingID:   offering.ID,
				}
				blocks = append(blocks, block)
			}
		}
	}
	
	return blocks, nil
}

// determineLabGroups determines if a lab needs to be split into groups based on capacity
func (s *routineGenerationService) determineLabGroups(offering models.CourseOffering) []string {
	logrus.Infof("=== DETERMINING LAB GROUPS for offering ID: %d ===", offering.ID)
	if offering.Subject.ID != 0 {
		logrus.Infof("  Subject: %s (ID: %d)", offering.Subject.Name, offering.Subject.ID)
	}
	
	// Get semester offering to check total students
	semesterOffering, err := s.semesterOfferingRepo.GetByID(offering.SemesterOfferingID)
	if err != nil {
		logrus.Errorf("Failed to get semester offering %d: %v", offering.SemesterOfferingID, err)
		return []string{""} // No group division needed
	}
	
	logrus.Infof("  Semester offering total students: %d", semesterOffering.TotalStudents)
	
	if semesterOffering.TotalStudents == 0 {
		logrus.Warn("  Total students is 0, no group division needed")
		return []string{""} // No group division needed
	}
	
	// Get room capacity if room is assigned
	if len(offering.RoomAssignments) == 0 {
		logrus.Warnf("  No room assigned to offering %d, can't determine capacity", offering.ID)
		return []string{""} // No room assigned, can't determine capacity
	}
	
	logrus.Infof("  Room assignments found: %d", len(offering.RoomAssignments))
	
	room, err := s.roomRepo.GetByID(offering.RoomAssignments[0].RoomID)
	if err != nil {
		logrus.Errorf("  Failed to get room %d: %v", offering.RoomAssignments[0].RoomID, err)
		return []string{""} // Can't determine capacity
	}
	
	logrus.Infof("  Room: %s (Type: %s, Capacity: %d)", room.Name, room.Type, room.Capacity)
	
	if room.Capacity == 0 {
		logrus.Warn("  Room capacity is 0, can't determine groups")
		return []string{""} // Can't determine capacity
	}
	
	totalStudents := semesterOffering.TotalStudents
	roomCapacity := room.Capacity
	
	// If room can accommodate all students, no division needed
	if roomCapacity >= totalStudents {
		logrus.Infof("  Room capacity (%d) >= total students (%d), no division needed", roomCapacity, totalStudents)
		return []string{""}
	}
	
	// Calculate number of groups needed
	numGroups := (totalStudents + roomCapacity - 1) / roomCapacity // Ceiling division
	
	logrus.Infof("  NEED TO DIVIDE LAB INTO %d GROUPS (Students: %d, Room capacity: %d)", numGroups, totalStudents, roomCapacity)
	
	// Generate group labels (Gx, Gy, Gz, etc.)
	groups := []string{}
	groupLabels := []string{"Gx", "Gy", "Gz", "Ga", "Gb", "Gc"} // Can extend if needed
	
	for i := 0; i < numGroups && i < len(groupLabels); i++ {
		groups = append(groups, groupLabels[i])
	}
	
	// Get subject name from the offering's subject
	subjectName := ""
	// Since Subject is loaded via Preload, we need to check if it has data
	if offering.Subject.ID != 0 {
		subjectName = offering.Subject.Name
	}
	
	logrus.Infof("  ✓ LAB DIVISION COMPLETE: %s will be divided into %d groups: %v",
		subjectName, numGroups, groups)
	logrus.Infof("  (Total Students: %d, Room Capacity: %d, Groups: %v)",
		totalStudents, roomCapacity, groups)
	
	return groups
}

// getTheoryPatterns returns the pattern of slot lengths for theory subjects
// Based on DESIGN_v1.md credit-to-sessions mapping
func (s *routineGenerationService) getTheoryPatterns(weeklySlots int, credit int) []int {
	var patterns []int
	
	switch credit {
	case 4:
		// Credit 4: prefer 2+2, fallback 2+1+1
		if weeklySlots >= 4 {
			patterns = []int{2, 2}
		} else if weeklySlots == 3 {
			patterns = []int{2, 1}
		} else {
			for i := 0; i < weeklySlots; i++ {
				patterns = append(patterns, 1)
			}
		}
	case 3:
		// Credit 3: prefer 2+1, fallback 1+1+1
		if weeklySlots >= 3 {
			patterns = []int{2, 1}
		} else {
			for i := 0; i < weeklySlots; i++ {
				patterns = append(patterns, 1)
			}
		}
	case 2:
		// Credit 2: prefer consecutive 2, fallback 1+1
		if weeklySlots >= 2 {
			patterns = []int{2}
		} else {
			patterns = []int{1}
		}
	default:
		// Default pattern: split into 2-slot blocks where possible
		remaining := weeklySlots
		for remaining > 0 {
			if remaining >= 2 {
				patterns = append(patterns, 2)
				remaining -= 2
			} else {
				patterns = append(patterns, 1)
				remaining--
			}
		}
	}
	
	return patterns
}

func (s *routineGenerationService) initializeTimetable() models.Timetable {
	timetable := make(models.Timetable)
	
	// Initialize for Monday to Friday (1-5), 7 slots per day
	// Slots 1-4: Morning (9:00-12:40)
	// Lunch break: 12:40-13:50 (not a slot)
	// Slots 5-7: Afternoon (13:50-16:35)
	for day := 1; day <= 5; day++ {
		timetable[day] = make(map[int]models.TimeSlotInfo)
		for slot := 1; slot <= 7; slot++ {
			timetable[day][slot] = models.TimeSlotInfo{
				IsBooked: false,
				Block:    nil,
			}
		}
	}
	
	return timetable
}

func (s *routineGenerationService) markExistingSlots(timetable models.Timetable, existingEntries []models.ScheduleEntry) {
	for _, entry := range existingEntries {
		if daySlots, exists := timetable[entry.DayOfWeek]; exists {
			if _, slotExists := daySlots[entry.SlotNumber]; slotExists {
				timetable[entry.DayOfWeek][entry.SlotNumber] = models.TimeSlotInfo{
					IsBooked: true,
					Block:    nil, // External block
				}
			}
		}
	}
}

func (s *routineGenerationService) runBacktrackingAlgorithm(blocks []models.ClassBlock, timetable models.Timetable, sessionID uint) GenerationReport {
	report := GenerationReport{
		TotalBlocks:    len(blocks),
		PlacedBlocks:   0,
		UnplacedBlocks: []models.ClassBlock{},
		Conflicts:      []string{},
		Suggestions:    []PlacementSuggestion{},
	}
	
	// Sort blocks by constraint priority (most constrained first)
	s.sortBlocksByConstraints(blocks)
	
	placedBlocks := s.backtrack(blocks, 0, timetable, sessionID)
	report.PlacedBlocks = placedBlocks
	
	// Identify unplaced blocks
	for i := placedBlocks; i < len(blocks); i++ {
		report.UnplacedBlocks = append(report.UnplacedBlocks, blocks[i])
		
		// Generate suggestions for unplaced blocks
		suggestions := s.generatePlacementSuggestions(blocks[i], timetable, sessionID)
		report.Suggestions = append(report.Suggestions, PlacementSuggestion{
			Block:           blocks[i],
			SuggestedSlots:  suggestions,
			ConflictReasons: []string{"No available slot found"},
		})
	}
	
	return report
}

func (s *routineGenerationService) sortBlocksByConstraints(blocks []models.ClassBlock) {
	sort.Slice(blocks, func(i, j int) bool {
		// Labs first (more constrained - need 3 consecutive slots)
		if blocks[i].IsLab && !blocks[j].IsLab {
			return true
		}
		if !blocks[i].IsLab && blocks[j].IsLab {
			return false
		}
		
		// Then by duration (longer blocks first)
		if blocks[i].DurationSlots != blocks[j].DurationSlots {
			return blocks[i].DurationSlots > blocks[j].DurationSlots
		}
		
		// Then by teacher ID (group by teacher)
		return blocks[i].TeacherID < blocks[j].TeacherID
	})
}

func (s *routineGenerationService) backtrack(blocks []models.ClassBlock, index int, timetable models.Timetable, sessionID uint) int {
	// Base case: all blocks placed
	if index >= len(blocks) {
		return index
	}
	
	currentBlock := blocks[index]
	
	// Get valid slot candidates for this block type
	slotCandidates := s.getSlotCandidates(currentBlock)
	
	// Try all possible placements with scoring
	type placement struct {
		day   int
		slot  int
		score int
	}
	
	var validPlacements []placement
	
	for day := 1; day <= 5; day++ {
		for _, slot := range slotCandidates {
			if s.canPlaceBlock(currentBlock, day, slot, timetable, sessionID) {
				score := s.scorePlacement(currentBlock, day, slot, timetable)
				validPlacements = append(validPlacements, placement{day, slot, score})
			}
		}
	}
	
	// Sort by score (higher score = better placement)
	sort.Slice(validPlacements, func(i, j int) bool {
		return validPlacements[i].score > validPlacements[j].score
	})
	
	// Try placements in order of preference
	for _, p := range validPlacements {
		// Place the block
		s.placeBlock(currentBlock, p.day, p.slot, timetable)
		
		// Recurse
		result := s.backtrack(blocks, index+1, timetable, sessionID)
		if result > index {
			return result // Found a solution
		}
		
		// Backtrack
		s.removeBlock(currentBlock, p.day, p.slot, timetable)
	}
	
	// No placement found for this block
	return index
}

// getSlotCandidates returns valid starting slots for a block
func (s *routineGenerationService) getSlotCandidates(block models.ClassBlock) []int {
	if block.IsLab && block.DurationSlots == 3 {
		// Labs: slots 2-4 (morning 09:55-12:40) or 5-7 (afternoon 13:50-16:35)
		return []int{2, 5} // Morning or afternoon lab slots
	} else if block.DurationSlots == 2 {
		// 2-slot blocks: avoid spanning lunch
		return []int{1, 2, 3, 5, 6} // Can start at 1-3 (morning) or 5-6 (afternoon)
	} else {
		// Single slots: all available
		return []int{1, 2, 3, 4, 5, 6, 7}
	}
}

// scorePlacement scores a potential placement (higher = better)
func (s *routineGenerationService) scorePlacement(block models.ClassBlock, day int, slot int, timetable models.Timetable) int {
	score := 100
	
	// Prefer spreading classes across the week
	slotsOnDay := 0
	for s := 1; s <= 7; s++ {
		if daySlots, exists := timetable[day]; exists {
			if slotInfo, slotExists := daySlots[s]; slotExists && slotInfo.IsBooked {
				slotsOnDay++
			}
		}
	}
	score -= slotsOnDay * 5
	
	// Labs: prefer afternoon
	if block.IsLab && slot >= 5 {
		score += 20
	}
	
	// Theory: prefer morning and early afternoon
	if !block.IsLab {
		if slot <= 3 {
			score += 15
		} else if slot == 5 || slot == 6 {
			score += 10
		}
	}
	
	// Avoid late slots
	if slot >= 7 {
		score -= 10
	}
	
	// Prefer Monday-Thursday over Friday
	if day == 5 {
		score -= 5
	}
	
	return score
}

func (s *routineGenerationService) canPlaceBlock(block models.ClassBlock, day int, startSlot int, timetable models.Timetable, sessionID uint) bool {
	// Check if enough consecutive slots are available
	for i := 0; i < block.DurationSlots; i++ {
		slot := startSlot + i
		if slot > 7 { // Maximum 7 slots per day
			return false
		}
		
		// Check if block spans across lunch break
		if startSlot <= 4 && slot > 4 {
			return false // Cannot span from morning to afternoon
		}
		
		// Check slot availability
		if daySlots, exists := timetable[day]; exists {
			if slotInfo, slotExists := daySlots[slot]; slotExists && slotInfo.IsBooked {
				return false
			}
		}
	}
	
	// Additional constraints for labs
	if block.IsLab {
		// Labs must be 3 consecutive slots
		if block.DurationSlots == 3 {
			// Valid lab slots: 2-4 (morning 09:55-12:40) or 5-7 (afternoon 13:50-16:35)
			if startSlot != 2 && startSlot != 5 {
				return false
			}
		}
	}
	
	// Theory constraint: max 2 slots per day for same course
	// For 4-credit courses with 2+2 pattern, only one 2-hour block per day
	if !block.IsLab {
		// Count existing slots for this course on this day
		slotsOnDay := 0
		for slot := 1; slot <= 7; slot++ {
			if daySlots, exists := timetable[day]; exists {
				if slotInfo, slotExists := daySlots[slot]; slotExists && slotInfo.IsBooked && slotInfo.Block != nil {
					if slotInfo.Block.CourseOfferingID == block.CourseOfferingID {
						slotsOnDay++
					}
				}
			}
		}
		// Check if adding this block would exceed the limit
		if slotsOnDay + block.DurationSlots > 2 {
			return false
		}
	}
	
	// Check global constraints (teacher and room availability)
	slotNumbers := make([]int, 0, block.DurationSlots)
	for i := 0; i < block.DurationSlots; i++ {
		slot := startSlot + i
		slotNumbers = append(slotNumbers, slot)
	}
	
	// Check teacher availability
	teacherAvailable, _ := s.scheduleRepo.CheckTeacherAvailability(block.TeacherID, sessionID, day, slotNumbers)
	if !teacherAvailable {
		return false
	}
	
	// Check room availability (only if room is required)
	if block.RoomID > 0 {
		roomAvailable, _ := s.scheduleRepo.CheckRoomAvailability(block.RoomID, sessionID, day, slotNumbers)
		if !roomAvailable {
			return false
		}
	}
	
	// Check student group availability (same semester offering)
	studentAvailable, _ := s.scheduleRepo.CheckStudentGroupAvailability(block.SemesterOfferingID, day, slotNumbers, 0)
	if !studentAvailable {
		return false
	}
	
	return true
}

func (s *routineGenerationService) hasConsecutiveSlots(day int, startSlot int, requiredSlots int, timetable models.Timetable) bool {
	for i := 0; i < requiredSlots; i++ {
		slot := startSlot + i
		if slot > 7 {
			return false
		}
		
		// Check if spans lunch break
		if startSlot <= 4 && slot > 4 {
			return false
		}
		
		if daySlots, exists := timetable[day]; exists {
			if slotInfo, slotExists := daySlots[slot]; slotExists && slotInfo.IsBooked {
				return false
			}
		}
	}
	return true
}

func (s *routineGenerationService) placeBlock(block models.ClassBlock, day int, startSlot int, timetable models.Timetable) {
	for i := 0; i < block.DurationSlots; i++ {
		slot := startSlot + i
		timetable[day][slot] = models.TimeSlotInfo{
			IsBooked: true,
			Block:    &block,
		}
	}
}

func (s *routineGenerationService) removeBlock(block models.ClassBlock, day int, startSlot int, timetable models.Timetable) {
	for i := 0; i < block.DurationSlots; i++ {
		slot := startSlot + i
		timetable[day][slot] = models.TimeSlotInfo{
			IsBooked: false,
			Block:    nil,
		}
	}
}

func (s *routineGenerationService) generatePlacementSuggestions(block models.ClassBlock, timetable models.Timetable, sessionID uint) []TimeSlot {
	var suggestions []TimeSlot
	
	// Find all possible slots where this block could be placed
	for day := 1; day <= 5; day++ {
		for slot := 1; slot <= 7; slot++ {
			if s.hasConsecutiveSlots(day, slot, block.DurationSlots, timetable) {
				suggestions = append(suggestions, TimeSlot{
					DayOfWeek:  day,
					SlotStart:  slot,
					SlotLength: block.DurationSlots,
				})
			}
		}
	}
	
	return suggestions
}

func (s *routineGenerationService) convertTimetableToEntries(timetable models.Timetable, scheduleRunID uint, semesterOffering *models.SemesterOffering) []models.ScheduleEntry {
	var entries []models.ScheduleEntry
	blockToID := make(map[*models.ClassBlock]uint)
	blockIDCounter := uint(1)
	
	// First pass: create schedule blocks
	processedBlocks := make(map[string]bool)
	
	for day := 1; day <= 5; day++ {
		for slot := 1; slot <= 7; slot++ {
			if slotInfo, exists := timetable[day][slot]; exists && slotInfo.IsBooked && slotInfo.Block != nil {
				// Create a unique key for this block placement
				blockKey := fmt.Sprintf("%d-%d-%d-%d", slotInfo.Block.CourseOfferingID, day, slot, slotInfo.Block.DurationSlots)
				
				// Only create schedule block once for multi-slot blocks
				if !processedBlocks[blockKey] {
					scheduleBlock := models.ScheduleBlock{
						ScheduleRunID:    scheduleRunID,
						CourseOfferingID: slotInfo.Block.CourseOfferingID,
						TeacherID:        slotInfo.Block.TeacherID,
						RoomID:           slotInfo.Block.RoomID,
						DayOfWeek:        day,
						SlotStart:        slot,
						SlotLength:       slotInfo.Block.DurationSlots,
						IsLab:            slotInfo.Block.IsLab,
						LabGroup:         slotInfo.Block.LabGroup,
					}
					
					if err := s.scheduleRepo.CreateScheduleBlock(&scheduleBlock); err == nil {
						blockToID[slotInfo.Block] = scheduleBlock.ID
						processedBlocks[blockKey] = true
					}
				}
			}
		}
	}
	
	// Second pass: create schedule entries
	for day := 1; day <= 5; day++ {
		for slot := 1; slot <= 7; slot++ {
			if slotInfo, exists := timetable[day][slot]; exists && slotInfo.IsBooked && slotInfo.Block != nil {
				blockID := blockToID[slotInfo.Block]
				if blockID == 0 {
					blockID = blockIDCounter
					blockIDCounter++
				}
				
				entry := models.ScheduleEntry{
					ScheduleRunID:        scheduleRunID,
					SemesterOfferingID:   slotInfo.Block.SemesterOfferingID,
					SessionID:            semesterOffering.SessionID,
					CourseOfferingID:     slotInfo.Block.CourseOfferingID,
					TeacherID:            slotInfo.Block.TeacherID,
					RoomID:               slotInfo.Block.RoomID,
					DayOfWeek:            day,
					SlotNumber:           slot,
					BlockID:              &blockID,
					LabGroup:             slotInfo.Block.LabGroup,
				}
				entries = append(entries, entry)
			}
		}
	}
	
	return entries
}

func (s *routineGenerationService) CommitScheduleRun(scheduleRunID uint) error {
	// Get the schedule run
	run, err := s.scheduleRepo.GetScheduleRunByID(scheduleRunID)
	if err != nil {
		return fmt.Errorf("failed to get schedule run: %w", err)
	}
	
	if run.Status != "DRAFT" {
		return errors.New("only draft schedule runs can be committed")
	}
	
	// Commit the schedule run
	return s.scheduleRepo.CommitScheduleRun(scheduleRunID)
}

func (s *routineGenerationService) CancelScheduleRun(scheduleRunID uint) error {
	// Get the schedule run
	run, err := s.scheduleRepo.GetScheduleRunByID(scheduleRunID)
	if err != nil {
		return fmt.Errorf("failed to get schedule run: %w", err)
	}
	
	if run.Status == "COMMITTED" {
		return errors.New("committed schedule runs cannot be cancelled")
	}
	
	// Delete schedule entries
	if err := s.scheduleRepo.DeleteScheduleEntriesByRun(scheduleRunID); err != nil {
		return fmt.Errorf("failed to delete schedule entries: %w", err)
	}
	
	// Update status to cancelled
	run.Status = "CANCELLED"
	return s.scheduleRepo.UpdateScheduleRun(run)
}

func (s *routineGenerationService) DeleteScheduleRun(scheduleRunID uint) error {
	// Get the schedule run
	run, err := s.scheduleRepo.GetScheduleRunByID(scheduleRunID)
	if err != nil {
		return fmt.Errorf("failed to get schedule run: %w", err)
	}
	
	// Only allow deletion of DRAFT, CANCELLED, or FAILED schedules
	if run.Status == "COMMITTED" {
		return errors.New("cannot delete committed schedule runs")
	}
	
	// Delete schedule entries first
	if err := s.scheduleRepo.DeleteScheduleEntriesByRun(scheduleRunID); err != nil {
		return fmt.Errorf("failed to delete schedule entries: %w", err)
	}
	
	// Delete schedule blocks
	if err := s.scheduleRepo.DeleteScheduleBlocksByRun(scheduleRunID); err != nil {
		return fmt.Errorf("failed to delete schedule blocks: %w", err)
	}
	
	// Delete the schedule run itself
	if err := s.scheduleRepo.DeleteScheduleRun(scheduleRunID); err != nil {
		return fmt.Errorf("failed to delete schedule run: %w", err)
	}
	
	return nil
}

func (s *routineGenerationService) GetScheduleRun(scheduleRunID uint) (*models.ScheduleRun, error) {
	return s.scheduleRepo.GetScheduleRunByID(scheduleRunID)
}

func (s *routineGenerationService) GetScheduleRunsBySemesterOffering(semesterOfferingID uint) ([]models.ScheduleRun, error) {
	return s.scheduleRepo.GetScheduleRunsBySemesterOffering(semesterOfferingID)
}