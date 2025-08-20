package http

import (
	"icrogen/internal/config"
	"icrogen/internal/repository"
	"icrogen/internal/service"
	"icrogen/internal/transport/http/handlers"
	"icrogen/internal/transport/http/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Server struct {
	config *config.Config
	db     *gorm.DB
	router *gin.Engine
}

func NewServer(cfg *config.Config, db *gorm.DB) *Server {
	return &Server{
		config: cfg,
		db:     db,
	}
}

func (s *Server) setupRoutes() {
	// Initialize repositories
	programmeRepo := repository.NewProgrammeRepository(s.db)
	departmentRepo := repository.NewDepartmentRepository(s.db)
	teacherRepo := repository.NewTeacherRepository(s.db)
	subjectRepo := repository.NewSubjectRepository(s.db)
	subjectTypeRepo := repository.NewSubjectTypeRepository(s.db)
	roomRepo := repository.NewRoomRepository(s.db)
	sessionRepo := repository.NewSessionRepository(s.db)
	semesterOfferingRepo := repository.NewSemesterOfferingRepository(s.db)
	courseOfferingRepo := repository.NewCourseOfferingRepository(s.db)
	scheduleRepo := repository.NewScheduleRepository(s.db)

	// Initialize services
	programmeService := service.NewProgrammeService(programmeRepo, departmentRepo)
	departmentService := service.NewDepartmentService(departmentRepo, programmeRepo, teacherRepo)
	teacherService := service.NewTeacherService(teacherRepo, departmentRepo)
	subjectService := service.NewSubjectService(subjectRepo, programmeRepo, departmentRepo, subjectTypeRepo)
	subjectTypeService := service.NewSubjectTypeService(subjectTypeRepo)
	roomService := service.NewRoomService(roomRepo, departmentRepo)
	sessionService := service.NewSessionService(sessionRepo)
	semesterOfferingService := service.NewSemesterOfferingService(semesterOfferingRepo, programmeRepo, departmentRepo, sessionRepo)
	courseOfferingService := service.NewCourseOfferingService(courseOfferingRepo, subjectRepo, teacherRepo, roomRepo)
	routineService := service.NewRoutineGenerationService(scheduleRepo, semesterOfferingRepo, courseOfferingRepo, teacherRepo, roomRepo)

	// Initialize handlers
	programmeHandler := handlers.NewProgrammeHandler(programmeService)
	departmentHandler := handlers.NewDepartmentHandler(departmentService)
	teacherHandler := handlers.NewTeacherHandler(teacherService)
	subjectHandler := handlers.NewSubjectHandler(subjectService)
	subjectTypeHandler := handlers.NewSubjectTypeHandler(subjectTypeService)
	roomHandler := handlers.NewRoomHandler(roomService)
	sessionHandler := handlers.NewSessionHandler(sessionService)
	semesterOfferingHandler := handlers.NewSemesterOfferingHandler(semesterOfferingService, courseOfferingService)
	routineHandler := handlers.NewRoutineHandler(routineService)

	// Setup middleware
	s.router.Use(middleware.LoggerMiddleware())
	s.router.Use(middleware.CORSMiddleware())
	s.router.Use(middleware.ErrorHandler())

	// API routes
	api := s.router.Group("/api")
	{
		// Programme routes
		programmes := api.Group("/programmes")
		{
			programmes.POST("", programmeHandler.CreateProgramme)
			programmes.GET("", programmeHandler.GetAllProgrammes)
			programmes.GET("/:id", programmeHandler.GetProgramme)
			programmes.PUT("/:id", programmeHandler.UpdateProgramme)
			programmes.DELETE("/:id", programmeHandler.DeleteProgramme)
			programmes.GET("/:id/departments", programmeHandler.GetProgrammeWithDepartments)
		}

		// Department routes
		departments := api.Group("/departments")
		{
			departments.POST("", departmentHandler.CreateDepartment)
			departments.GET("", departmentHandler.GetAllDepartments)
			departments.GET("/:id", departmentHandler.GetDepartment)
			departments.PUT("/:id", departmentHandler.UpdateDepartment)
			departments.DELETE("/:id", departmentHandler.DeleteDepartment)
			departments.GET("/:id/subjects", subjectHandler.GetSubjectsByDepartment)
			departments.GET("/:id/teachers", teacherHandler.GetTeachersByDepartment)
		}

		// Teacher routes
		teachers := api.Group("/teachers")
		{
			teachers.POST("", teacherHandler.CreateTeacher)
			teachers.GET("", teacherHandler.GetAllTeachers)
			teachers.GET("/:id", teacherHandler.GetTeacher)
			teachers.PUT("/:id", teacherHandler.UpdateTeacher)
			teachers.DELETE("/:id", teacherHandler.DeleteTeacher)
			teachers.GET("/department/:department_id", teacherHandler.GetTeachersByDepartment)
		}

		// Subject routes
		subjects := api.Group("/subjects")
		{
			subjects.POST("", subjectHandler.CreateSubject)
			subjects.GET("", subjectHandler.GetAllSubjects)
			subjects.GET("/:id", subjectHandler.GetSubject)
			subjects.PUT("/:id", subjectHandler.UpdateSubject)
			subjects.DELETE("/:id", subjectHandler.DeleteSubject)
			subjects.GET("/department/:department_id", subjectHandler.GetSubjectsByDepartment)
			subjects.GET("/filter", subjectHandler.GetSubjectsByProgrammeAndDepartment)
		}

		// Subject Type routes
		subjectTypes := api.Group("/subject-types")
		{
			subjectTypes.POST("", subjectTypeHandler.CreateSubjectType)
			subjectTypes.GET("", subjectTypeHandler.GetAllSubjectTypes)
			subjectTypes.GET("/:id", subjectTypeHandler.GetSubjectType)
			subjectTypes.PUT("/:id", subjectTypeHandler.UpdateSubjectType)
			subjectTypes.DELETE("/:id", subjectTypeHandler.DeleteSubjectType)
		}

		// Room routes
		rooms := api.Group("/rooms")
		{
			rooms.POST("", roomHandler.CreateRoom)
			rooms.GET("", roomHandler.GetAllRooms)
			rooms.GET("/:id", roomHandler.GetRoom)
			rooms.PUT("/:id", roomHandler.UpdateRoom)
			rooms.DELETE("/:id", roomHandler.DeleteRoom)
			rooms.GET("/type", roomHandler.GetRoomsByType)
			rooms.GET("/department/:department_id", roomHandler.GetRoomsByDepartment)
			rooms.GET("/availability", roomHandler.CheckRoomAvailability)
		}

		// Session routes
		sessions := api.Group("/sessions")
		{
			sessions.POST("", sessionHandler.CreateSession)
			sessions.GET("", sessionHandler.GetAllSessions)
			sessions.GET("/:id", sessionHandler.GetSession)
			sessions.PUT("/:id", sessionHandler.UpdateSession)
			sessions.DELETE("/:id", sessionHandler.DeleteSession)
			sessions.DELETE("/:id/hard", sessionHandler.HardDeleteSession)
			sessions.POST("/:id/restore", sessionHandler.RestoreSession)
			sessions.GET("/year", sessionHandler.GetSessionsByYear)
		}

		// Semester Offering routes
		semesterOfferings := api.Group("/semester-offerings")
		{
			semesterOfferings.GET("", semesterOfferingHandler.GetAllSemesterOfferings)
			semesterOfferings.POST("", semesterOfferingHandler.CreateSemesterOffering)
			semesterOfferings.GET("/session/:session_id", semesterOfferingHandler.GetSemesterOfferingsBySession)
			semesterOfferings.GET("/:id", semesterOfferingHandler.GetSemesterOffering)
			semesterOfferings.PUT("/:id", semesterOfferingHandler.UpdateSemesterOffering)
			semesterOfferings.DELETE("/:id", semesterOfferingHandler.DeleteSemesterOffering)
			
			// Course offering management within a semester offering
			semesterOfferings.GET("/:id/course-offerings", semesterOfferingHandler.GetCourseOfferings)
			semesterOfferings.POST("/:id/course-offerings", semesterOfferingHandler.AddCourseOffering)
			semesterOfferings.DELETE("/:id/course-offerings/:course_offering_id", semesterOfferingHandler.RemoveCourseOffering)
			semesterOfferings.POST("/:id/course-offerings/:course_offering_id/teachers", semesterOfferingHandler.AssignTeacherToCourse)
			semesterOfferings.DELETE("/:id/course-offerings/:course_offering_id/teachers/:teacher_id", semesterOfferingHandler.RemoveTeacherFromCourse)
			semesterOfferings.POST("/:id/course-offerings/:course_offering_id/rooms", semesterOfferingHandler.AssignRoomToCourse)
			semesterOfferings.DELETE("/:id/course-offerings/:course_offering_id/rooms/:room_id", semesterOfferingHandler.RemoveRoomFromCourse)
		}

		// Routine generation routes
		routines := api.Group("/routines")
		{
			routines.POST("/generate", routineHandler.GenerateRoutine)
			routines.GET("/:id", routineHandler.GetScheduleRun)
			routines.GET("/semester-offering/:semester_offering_id", routineHandler.GetScheduleRunsBySemesterOffering)
			routines.POST("/:id/commit", routineHandler.CommitScheduleRun)
			routines.POST("/:id/cancel", routineHandler.CancelScheduleRun)
		}

		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "healthy",
				"service": "icrogen-api",
			})
		})
	}
}

func (s *Server) Start() error {
	// Set Gin mode based on environment
	if s.config.LogLevel == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	s.router = gin.New()
	s.setupRoutes()

	// Start server
	return s.router.Run(":" + s.config.Port)
}