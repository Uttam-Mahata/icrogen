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
	routineService := service.NewRoutineGenerationService(scheduleRepo, semesterOfferingRepo, courseOfferingRepo, teacherRepo, roomRepo)

	// Initialize handlers
	programmeHandler := handlers.NewProgrammeHandler(programmeService)
	departmentHandler := handlers.NewDepartmentHandler(departmentService)
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
		}

		// Programme-specific department routes
		api.GET("/programmes/:programme_id/departments", departmentHandler.GetDepartmentsByProgramme)

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