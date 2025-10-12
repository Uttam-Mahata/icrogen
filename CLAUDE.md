# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ICRoGen (IIEST Central Routine Generator) is a full-stack academic timetable generation system that automates conflict-free schedule creation for educational institutions. The system uses a backtracking algorithm to solve the Constraint Satisfaction Problem (CSP) of scheduling classes across multiple departments, semesters, teachers, and rooms.

**Tech Stack:**
- Backend: Go 1.21+ with Gin Gonic framework
- Frontend: React + TypeScript with Vite and Material-UI
- Database: MySQL with GORM
- Containerization: Docker + Docker Compose

## Development Commands

### Backend (Go)

Navigate to `server/` directory for all backend commands:

```bash
# Start full stack with Docker (recommended for development)
cd server && docker-compose up -d

# Run backend locally (requires MySQL running)
make run                    # Without migrations
make run-migrate            # With migrations
make run-with-env-migrate   # With migrations via env var

# Build and test
make build          # Build to bin/icrogen
make test           # Run all tests
make test-coverage  # Generate coverage report (coverage.html)

# Code quality
make fmt            # Format code with go fmt
make lint           # Run golangci-lint (if installed)

# Dependencies
make deps           # Download and tidy dependencies

# Docker operations
make docker-run     # Start containers
make docker-stop    # Stop containers
make docker-logs    # View API logs

# Database operations
make db-up          # Start MySQL only
make db-down        # Stop MySQL
make db-reset       # Reset database (destroys data)
```

### Frontend (React)

Navigate to `client/` directory:

```bash
npm install         # Install dependencies
npm run dev         # Start dev server (localhost:5173)
npm run build       # Build for production
npm run lint        # Lint TypeScript/React code
npm run preview     # Preview production build
```

## Architecture

### Backend Structure (Clean Architecture)

The Go backend follows a layered service-oriented architecture:

```
server/
├── cmd/
│   ├── main.go              # Application entry point
│   └── seed/                # Database seeding utilities
├── internal/
│   ├── config/              # Configuration management
│   ├── database/            # Database connection and migrations
│   ├── models/              # Domain models and entities
│   │   ├── core.go          # Programme, Department, Teacher, Subject, Room
│   │   ├── academic.go      # Session, SemesterOffering, CourseOffering
│   │   └── schedule.go      # ScheduleRun, ScheduleEntry, ClassBlock, Timetable
│   ├── repository/          # Data access layer (GORM)
│   ├── service/             # Business logic layer
│   │   └── routine_generation.go  # Core scheduling algorithm
│   └── transport/http/
│       ├── server.go        # Route registration and dependency injection
│       ├── handlers/        # HTTP request handlers
│       ├── dto/             # Data transfer objects
│       └── middleware/      # CORS, logging, error handling
└── Makefile
```

**Key Layers:**
1. **Transport Layer** (`transport/http`): Gin handlers, routing, request validation
2. **Service Layer** (`service/`): Business logic, algorithm orchestration
3. **Repository Layer** (`repository/`): GORM data access, query abstraction
4. **Models** (`models/`): Domain entities and data structures

### Frontend Structure

```
client/src/
├── components/
│   ├── Common/              # Reusable UI components
│   └── Layout/              # Layout components (MainLayout)
├── pages/                   # Page components organized by entity
│   ├── Departments/
│   ├── Programmes/
│   ├── Teachers/
│   ├── Subjects/
│   ├── Rooms/
│   ├── Sessions/
│   ├── SemesterOfferings/
│   └── Routines/            # Routine generation interface
└── App.tsx                  # Main routing
```

## Core Algorithm: Routine Generation

The routine generation engine is the heart of the system, located in `server/internal/service/routine_generation.go`.

### Algorithm Flow

1. **Initialization** (`GenerateRoutine`):
   - Fetch semester offering with all course offerings
   - Load existing committed schedules for the session (to avoid conflicts)
   - Create a new `ScheduleRun` with status "DRAFT"

2. **Class Block Generation** (`generateClassBlocks`):
   - Convert course offerings into `ClassBlock` entities
   - Labs: Typically 3-hour blocks (3 consecutive slots)
   - Theory: Split by credit patterns (e.g., 4-credit → two 2-slot blocks, 3-credit → 2+1 slots)
   - Each block includes: SubjectID, TeacherID, RoomID, DurationSlots, IsLab

3. **Backtracking Algorithm** (`backtrack`):
   - Sorts blocks by constraint priority (labs first, longer blocks first)
   - For each block, tries all valid day/slot combinations with scoring
   - Validates global constraints:
     - Teacher availability (no double-booking across departments)
     - Room availability (no double-booking)
     - Student group availability (same semester offering)
     - Time constraints (no spanning lunch break, max 2 slots/day per course)
   - Recursively places blocks; backtracks on failure

4. **Constraint Checking** (`canPlaceBlock`):
   - Checks consecutive slot availability
   - Validates lab-specific slots (slots 2-4 or 5-7)
   - Queries database for teacher/room conflicts across the entire session
   - Prevents theory classes from exceeding 2 slots/day per course

5. **Conversion and Persistence** (`convertTimetableToEntries`):
   - Creates `ScheduleBlock` entities (one per unique block placement)
   - Creates `ScheduleEntry` entities (one per occupied slot)
   - Updates `ScheduleRun` with generation report (placed/unplaced blocks)

### Key Data Structures

```go
// ClassBlock: A scheduled class unit
type ClassBlock struct {
    SubjectID          uint
    TeacherID          uint
    RoomID             uint
    DurationSlots      int  // 1, 2, or 3 slots
    IsLab              bool
    SemesterOfferingID uint
    CourseOfferingID   uint
}

// Timetable: Day → Slot → SlotInfo mapping
type Timetable map[int]map[int]TimeSlotInfo

type TimeSlotInfo struct {
    IsBooked bool
    Block    *ClassBlock  // nil for externally booked slots
}
```

### Time Slot System

- **Days**: Monday (1) to Friday (5)
- **Slots**: 7 slots per day
  - Slots 1-4: Morning (09:00-12:40)
  - Lunch break: 12:40-13:50
  - Slots 5-7: Afternoon (13:50-16:35)
- **Duration**: 55 minutes per slot
- Labs require 3 consecutive slots in one session (2-4 or 5-7)

## Database Schema

Key entities and relationships:

- **Programme** → **Department** (1:N)
- **Department** → **Teacher** (1:N, home department)
- **Department** → **Subject** (1:N)
- **Session** → **SemesterOffering** (1:N) - Groups semesters by academic year and parity (ODD/EVEN)
- **SemesterOffering** → **CourseOffering** (1:N) - Specific semester configuration
- **CourseOffering** → **TeacherAssignment** (1:N) - Cross-departmental teacher assignment
- **CourseOffering** → **RoomAssignment** (1:N)
- **ScheduleRun** → **ScheduleEntry** (1:N) - Generated timetable
- **ScheduleRun** → **ScheduleBlock** (1:N) - Groups multi-slot classes

**Important**: Teachers and rooms can be assigned across departments. Conflicts are checked globally across the entire session (e.g., all odd semesters).

## API Documentation

See `server/API.md` for complete endpoint documentation.

**Base URL**: `http://localhost:8080/api`

**Key API Patterns**:
- Standard CRUD: `POST`, `GET /:id`, `GET`, `PUT /:id`, `DELETE /:id`
- Routine generation: `POST /api/routines/generate` with `{"semester_offering_id": 1}`
- Routine lifecycle: `/api/routines/:id/commit` and `/api/routines/:id/cancel`
- Health check: `GET /api/health`

## Development Workflow

### Working with the Routine Generation Algorithm

When modifying the scheduling algorithm:

1. **Read the context first**: Review `DESIGN_v2.md` for algorithm design and constraints
2. **Key files**:
   - `internal/service/routine_generation.go` - Main algorithm
   - `internal/repository/schedule.go` - Conflict checking queries
   - `internal/models/schedule.go` - Data structures
3. **Testing approach**:
   - Create test semester offerings with varying constraints
   - Check logs for "Backtracking algorithm completed" metrics
   - Verify placed vs. unplaced blocks in `ScheduleRun.Meta`
4. **Common issues**:
   - Unplaced blocks: Check constraint priority and slot candidates
   - Performance: Review backtracking depth and pruning heuristics
   - Conflicts: Verify session-level teacher/room availability queries

### Database Migrations

Migrations run automatically when:
- Using `make run-migrate` or `make run-with-env-migrate`
- Starting with Docker Compose (default behavior)

GORM AutoMigrate handles schema evolution in `internal/database/connection.go`.

### Adding New Entities

1. Define model in `internal/models/`
2. Create repository interface and implementation in `internal/repository/`
3. Create service interface and implementation in `internal/service/`
4. Create handler in `internal/transport/http/handlers/`
5. Register routes in `internal/transport/http/server.go`
6. Add DTO if needed in `internal/transport/http/dto/`

## Important Constraints and Business Rules

1. **Labs**:
   - Must be 3 consecutive slots
   - Valid slots: 2-4 (morning) or 5-7 (afternoon)
   - Cannot span lunch break

2. **Theory Classes**:
   - Maximum 2 slots per day for same course
   - Prefer 2-slot blocks over 1-slot blocks
   - Cannot span lunch break

3. **Global Constraints**:
   - Teacher cannot be double-booked across any department in the same session
   - Room cannot be double-booked
   - Student group (semester offering) cannot have overlapping classes

4. **Schedule Lifecycle**:
   - `DRAFT`: Generated but not committed
   - `COMMITTED`: Active and locked (prevents conflicts)
   - `CANCELLED`: Draft cancelled and deleted
   - `FAILED`: Partial solution (some blocks unplaced)

5. **Session Parity**:
   - `ODD`: Semesters 1, 3, 5, 7 (typically Fall)
   - `EVEN`: Semesters 2, 4, 6, 8 (typically Spring)
   - Used to group semesters for conflict-free generation

## Running Tests

```bash
cd server
make test              # Run all tests
make test-coverage     # Generate HTML coverage report
```

Currently, the codebase focuses on integration testing via the API. Consider adding unit tests for the backtracking algorithm with mock repositories.

## Logging

The backend uses `logrus` with structured logging. Key log levels:
- **Info**: Normal operations, algorithm progress
- **Debug**: Detailed placement attempts, constraint checks
- **Warn**: Partial failures, skipped course offerings
- **Error**: Critical failures, database errors

Enable debug logs with `LOG_LEVEL=debug` in `.env`.

## Environment Configuration

Backend configuration is managed via `.env` file in `server/`:

```env
PORT=8080
DATABASE_URL=user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True&loc=Local
LOG_LEVEL=info
RUN_MIGRATIONS=true
```

See `internal/config/config.go` for all configuration options.
