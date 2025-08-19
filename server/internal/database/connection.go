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
	return connectWithMigration(databaseURL, true)
}

// ConnectWithoutMigration establishes a connection to the MySQL database without running migrations
func ConnectWithoutMigration(databaseURL string) (*gorm.DB, error) {
	return connectWithMigration(databaseURL, false)
}

// connectWithMigration is the internal function that handles connection with optional migration
func connectWithMigration(databaseURL string, runMigrations bool) (*gorm.DB, error) {
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
	
	db, err := gorm.Open(mysqlDriver.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	if runMigrations {
		// Auto-migrate the schema
		err = db.AutoMigrate(
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
			return nil, err
		}

		// Add indexes for performance and constraints
		if err := addIndexes(db); err != nil {
			return nil, err
		}
	}

	return db, nil
}

// addIndexes creates additional indexes for performance and constraints
func addIndexes(db *gorm.DB) error {
	// Unique constraints
	if err := db.Exec("ALTER TABLE departments ADD UNIQUE INDEX uq_dept_prog_name (programme_id, name)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE subjects ADD UNIQUE INDEX uq_subj_prog_dept_code (programme_id, department_id, code)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE semester_definitions ADD UNIQUE INDEX uq_sem_def_prog_num (programme_id, semester_number)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE sessions ADD UNIQUE INDEX uq_session_name_year (name, academic_year)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE semester_offerings ADD UNIQUE INDEX uq_sem_off_prog_dept_sess_num (programme_id, department_id, session_id, semester_number)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE course_offerings ADD UNIQUE INDEX uq_course_off_sem_subj (semester_offering_id, subject_id)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE teacher_assignments ADD UNIQUE INDEX uq_teacher_assign_course_teacher (course_offering_id, teacher_id)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE room_assignments ADD UNIQUE INDEX uq_room_assign_course_room (course_offering_id, room_id)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE time_slots ADD UNIQUE INDEX uq_time_slot_day_num (day_of_week, slot_number)").Error; err != nil {
		// Ignore if already exists
	}

	// Conflict prevention indexes for schedule_entries
	if err := db.Exec("ALTER TABLE schedule_entries ADD UNIQUE INDEX uq_sched_entry_sess_day_slot_teacher (session_id, day_of_week, slot_number, teacher_id)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE schedule_entries ADD UNIQUE INDEX uq_sched_entry_sess_day_slot_room (session_id, day_of_week, slot_number, room_id)").Error; err != nil {
		// Ignore if already exists
	}
	
	if err := db.Exec("ALTER TABLE schedule_entries ADD UNIQUE INDEX uq_sched_entry_run_day_slot_course (schedule_run_id, day_of_week, slot_number, course_offering_id)").Error; err != nil {
		// Ignore if already exists
	}

	return nil
}