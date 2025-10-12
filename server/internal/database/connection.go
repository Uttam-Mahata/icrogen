package database

import (
	"crypto/tls"
	"icrogen/internal/models"
	"strings"

	"github.com/go-sql-driver/mysql"
	mysqlDriver "gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect establishes a connection to the MySQL database
func Connect(databaseURL string) (*gorm.DB, error) {
	// Register TLS config for TiDB if the connection string contains tls=tidb
	if strings.Contains(databaseURL, "tls=tidb") {
		mysql.RegisterTLSConfig("tidb", &tls.Config{
			MinVersion: tls.VersionTLS12,
			ServerName: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
		})
	}

	// Ensure parseTime=True is in the connection string for proper datetime parsing
	if !strings.Contains(databaseURL, "parseTime=") {
		if strings.Contains(databaseURL, "?") {
			databaseURL += "&parseTime=True"
		} else {
			databaseURL += "?parseTime=True"
		}
	}

	// Use Warn level to reduce log noise (only logs errors and slow queries)
	db, err := gorm.Open(mysqlDriver.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return nil, err
	}

	return db, nil
}

// Migrate runs database migrations - should only be called from migration command
func Migrate(db *gorm.DB) error {
	// Auto-migrate the schema
	err := db.AutoMigrate(
		&models.Programme{},
		&models.Department{},
		&models.Teacher{},
		&models.SubjectType{},
		&models.Subject{},
		&models.Room{},
		&models.Session{},
		&models.SemesterDefinition{},
		&models.SemesterOffering{},
		&models.CourseOffering{},
		&models.TeacherAssignment{},
		&models.RoomAssignment{},
		&models.TimeSlot{},
		&models.ScheduleRun{},
		&models.ScheduleBlock{},
		&models.ScheduleEntry{},
	)
	if err != nil {
		return err
	}

	// Add indexes for performance and constraints
	return addIndexes(db)
}

// addIndexes creates additional indexes for performance and constraints
func addIndexes(db *gorm.DB) error {
	indexes := []string{
		"ALTER TABLE departments ADD UNIQUE INDEX IF NOT EXISTS uq_dept_prog_name (programme_id, name)",
		"ALTER TABLE subjects ADD UNIQUE INDEX IF NOT EXISTS uq_subj_prog_dept_code (programme_id, department_id, code)",
		"ALTER TABLE semester_definitions ADD UNIQUE INDEX IF NOT EXISTS uq_sem_def_prog_num (programme_id, semester_number)",
		"ALTER TABLE sessions ADD UNIQUE INDEX IF NOT EXISTS uq_session_name_year (name, academic_year)",
		"ALTER TABLE semester_offerings ADD UNIQUE INDEX IF NOT EXISTS uq_sem_off_prog_dept_sess_num (programme_id, department_id, session_id, semester_number)",
		"ALTER TABLE course_offerings ADD UNIQUE INDEX IF NOT EXISTS uq_course_off_sem_subj (semester_offering_id, subject_id)",
		"ALTER TABLE teacher_assignments ADD UNIQUE INDEX IF NOT EXISTS uq_teacher_assign_course_teacher (course_offering_id, teacher_id)",
		"ALTER TABLE room_assignments ADD UNIQUE INDEX IF NOT EXISTS uq_room_assign_course_room (course_offering_id, room_id)",
		"ALTER TABLE time_slots ADD UNIQUE INDEX IF NOT EXISTS uq_time_slot_day_num (day_of_week, slot_number)",
		"ALTER TABLE schedule_entries ADD UNIQUE INDEX IF NOT EXISTS uq_sched_entry_sess_day_slot_teacher (session_id, day_of_week, slot_number, teacher_id)",
		"ALTER TABLE schedule_entries ADD UNIQUE INDEX IF NOT EXISTS uq_sched_entry_sess_day_slot_room (session_id, day_of_week, slot_number, room_id)",
		"ALTER TABLE schedule_entries ADD UNIQUE INDEX IF NOT EXISTS uq_sched_entry_run_day_slot_course (schedule_run_id, day_of_week, slot_number, course_offering_id)",
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			// Ignore errors (index might already exist)
			continue
		}
	}

	return nil
}
