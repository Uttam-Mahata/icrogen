package database

import (
	"icrogen/internal/models"
	"time"

	"gorm.io/gorm"
)

// SeedData initializes the database with sample data
func SeedData(db *gorm.DB) error {
	// Create default subject types
	subjectTypes := []models.SubjectType{
		{Name: "Theory", IsLab: false, DefaultConsecutivePreferred: true},
		{Name: "Lab", IsLab: true, DefaultConsecutivePreferred: true},
		{Name: "Tutorial", IsLab: false, DefaultConsecutivePreferred: false},
		{Name: "Seminar", IsLab: false, DefaultConsecutivePreferred: false},
	}

	for _, st := range subjectTypes {
		if err := db.FirstOrCreate(&st, models.SubjectType{Name: st.Name}).Error; err != nil {
			return err
		}
	}

	// Create default time slots (Monday to Friday, 7 slots per day)
	timeSlots := []models.TimeSlot{
		// Monday
		{DayOfWeek: 1, SlotNumber: 1, StartTime: parseTime("09:00"), EndTime: parseTime("09:55")},
		{DayOfWeek: 1, SlotNumber: 2, StartTime: parseTime("09:55"), EndTime: parseTime("10:50")},
		{DayOfWeek: 1, SlotNumber: 3, StartTime: parseTime("10:50"), EndTime: parseTime("11:45")},
		{DayOfWeek: 1, SlotNumber: 4, StartTime: parseTime("11:45"), EndTime: parseTime("12:40")},
		{DayOfWeek: 1, SlotNumber: 5, StartTime: parseTime("13:50"), EndTime: parseTime("14:45")}, // After lunch break
		{DayOfWeek: 1, SlotNumber: 6, StartTime: parseTime("14:45"), EndTime: parseTime("15:40")},
		{DayOfWeek: 1, SlotNumber: 7, StartTime: parseTime("15:40"), EndTime: parseTime("16:35")},
	}

	// Repeat for Tuesday to Friday
	for day := 2; day <= 5; day++ {
		for slot := 1; slot <= 8; slot++ {
			baseSlot := timeSlots[slot-1]
			timeSlots = append(timeSlots, models.TimeSlot{
				DayOfWeek:  day,
				SlotNumber: slot,
				StartTime:  baseSlot.StartTime,
				EndTime:    baseSlot.EndTime,
			})
		}
	}

	for _, ts := range timeSlots {
		if err := db.FirstOrCreate(&ts, models.TimeSlot{
			DayOfWeek:  ts.DayOfWeek,
			SlotNumber: ts.SlotNumber,
		}).Error; err != nil {
			return err
		}
	}

	// Create sample sessions
	sessions := []models.Session{
		{
			Name:         "FALL",
			AcademicYear: "2025-26",
			Parity:       "ODD",
			StartDate:    time.Date(2025, 8, 1, 0, 0, 0, 0, time.UTC),
			EndDate:      time.Date(2025, 12, 31, 0, 0, 0, 0, time.UTC),
		},
		{
			Name:         "SPRING",
			AcademicYear: "2025-26",
			Parity:       "EVEN",
			StartDate:    time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			EndDate:      time.Date(2026, 5, 31, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, session := range sessions {
		if err := db.FirstOrCreate(&session, models.Session{
			Name:         session.Name,
			AcademicYear: session.AcademicYear,
		}).Error; err != nil {
			return err
		}
	}

	return nil
}

func parseTime(timeStr string) time.Time {
	t, _ := time.Parse("15:04", timeStr)
	return t
}