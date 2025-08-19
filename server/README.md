# ICRoGen Server

A Go-based backend for the ICRoGen (IIEST Central Routine Generator) system. This system automates the creation of conflict-free academic schedules for IIEST, Shibpur.

## Features

- **Complete Academic Entity Management**: Programmes, Departments, Teachers, Subjects, Rooms
- **Semester Configuration**: Configure semester-specific offerings with subject-teacher-room assignments
- **Intelligent Routine Generation**: Backtracking algorithm for conflict-free timetable generation
- **Cross-Department Teaching**: Teachers can be assigned across different departments/programmes
- **Conflict Detection**: Prevents teacher and room double-booking across the entire institution
- **RESTful API**: Clean REST endpoints for frontend integration

## Architecture

The system follows Clean Architecture principles with:
- **Transport Layer**: HTTP handlers using Gin framework
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Data access abstraction using GORM
- **Database**: MySQL with proper constraints and indexes

## Core Algorithm

The routine generation uses a **backtracking algorithm** that:
1. Sorts class blocks by constraints (most constrained first)
2. Places labs first (3-hour blocks)
3. Handles theory subjects with configurable patterns
4. Respects lunch breaks and preferred time slots
5. Ensures global conflict prevention across all semesters

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository
2. Navigate to the server directory
3. Run the stack:

```bash
docker-compose up -d
```

This will start:
- MySQL database on port 3306
- ICRoGen API on port 8080
- Adminer (database admin) on port 8081

### Manual Setup

1. Install Go 1.21+
2. Install MySQL 8.0+
3. Set up environment variables:

```bash
export DATABASE_URL="user:password@tcp(localhost:3306)/icrogen?charset=utf8mb4&parseTime=True&loc=Local"
export PORT=8080
export LOG_LEVEL=info
```

4. Run the application:

```bash
go mod download
go run cmd/main.go
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `DATABASE_URL` | MySQL connection string | See .env file |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key-change-in-production` |

## API Endpoints

### Programmes
- `POST /api/programmes` - Create programme
- `GET /api/programmes` - List all programmes
- `GET /api/programmes/:id` - Get programme by ID
- `PUT /api/programmes/:id` - Update programme
- `DELETE /api/programmes/:id` - Delete programme
- `GET /api/programmes/:id/departments` - Get programme with departments

### Departments
- `POST /api/departments` - Create department
- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get department by ID
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department
- `GET /api/programmes/:programme_id/departments` - Get departments by programme

### Routine Generation
- `POST /api/routines/generate` - Generate routine for semester offering
- `GET /api/routines/:id` - Get schedule run details
- `GET /api/routines/semester-offering/:id` - Get schedule runs by semester offering
- `POST /api/routines/:id/commit` - Commit draft routine
- `POST /api/routines/:id/cancel` - Cancel draft routine

### Health Check
- `GET /api/health` - Service health status

## Database Schema

The system uses a normalized relational schema with:
- **Core Entities**: Programme, Department, Teacher, Subject, Room
- **Academic Session**: Session, SemesterOffering, CourseOffering
- **Scheduling**: ScheduleRun, ScheduleBlock, ScheduleEntry
- **Constraints**: Unique indexes prevent conflicts

## Usage Example

1. **Create Programme**:
```json
POST /api/programmes
{
  "name": "B.Tech",
  "duration_years": 4,
  "total_semesters": 8
}
```

2. **Create Department**:
```json
POST /api/departments
{
  "name": "Computer Science & Technology",
  "strength": 60,
  "programme_id": 1
}
```

3. **Generate Routine**:
```json
POST /api/routines/generate
{
  "semester_offering_id": 1
}
```

## Development

### Project Structure
```
server/
├── cmd/main.go                 # Application entry point
├── internal/
│   ├── config/                 # Configuration management
│   ├── database/               # Database connection & migrations
│   ├── models/                 # Data models
│   ├── repository/             # Data access layer
│   ├── service/                # Business logic layer
│   └── transport/http/         # HTTP transport layer
├── docker-compose.yml          # Docker setup
├── Dockerfile                  # Container build
└── README.md
```

### Running Tests
```bash
go test ./...
```

### Building
```bash
go build -o icrogen ./cmd/main.go
```

## Algorithm Details

The routine generation algorithm works as follows:

1. **Preparation Phase**:
   - Fetch semester offering with course assignments
   - Generate class blocks based on subject types and credits
   - Initialize weekly timetable grid (5 days × 8 slots)
   - Load existing committed schedules to mark occupied slots

2. **Constraint Ordering**:
   - Labs first (most constrained - need 3 consecutive slots)
   - Longer duration blocks before shorter ones
   - Group by teacher to minimize conflicts

3. **Placement Algorithm**:
   - For each block, try all possible time slots
   - Check local availability (timetable grid)
   - Check global constraints (teacher/room conflicts)
   - Check student group conflicts
   - Place block and recurse, backtrack if needed

4. **Conflict Resolution**:
   - Generate suggestions for unplaced blocks
   - Report conflicts with reasons
   - Provide alternative time slots

## Time Slot Rules

- **Days**: Monday to Friday (5 days)
- **Slots**: 8 slots per day (55 minutes each)
- **Break**: Lunch break between slot 4 and 5
- **Labs**: 3-hour consecutive blocks, preferably afternoon
- **Theory**: 1-2 hour blocks, maximum 2 slots per day per subject

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following Go best practices
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.