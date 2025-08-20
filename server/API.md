# ICRoGen Server - API Documentation

## Authentication

Currently, the API operates without authentication. In production, implement JWT-based authentication with the following header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
http://localhost:8080/api
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": 400
}
```

## Endpoints

### Programmes

#### Create Programme
```http
POST /api/programmes
Content-Type: application/json

{
  "name": "B.Tech",
  "duration_years": 4,
  "total_semesters": 8
}
```

#### Get All Programmes
```http
GET /api/programmes
```

#### Get Programme by ID
```http
GET /api/programmes/{id}
```

#### Update Programme
```http
PUT /api/programmes/{id}
Content-Type: application/json

{
  "name": "B.Tech (Updated)",
  "duration_years": 4,
  "total_semesters": 8,
  "is_active": true
}
```

#### Delete Programme
```http
DELETE /api/programmes/{id}
```

#### Get Programme with Departments
```http
GET /api/programmes/{id}/departments
```

### Departments

#### Create Department
```http
POST /api/departments
Content-Type: application/json

{
  "name": "Computer Science & Technology",
  "strength": 60,
  "programme_id": 1
}
```

#### Get All Departments
```http
GET /api/departments
```

#### Get Department by ID
```http
GET /api/departments/{id}
```

#### Get Departments by Programme
```http
GET /api/programmes/{programme_id}/departments
```

#### Update Department
```http
PUT /api/departments/{id}
Content-Type: application/json

{
  "name": "Computer Science & Technology",
  "strength": 65,
  "is_active": true
}
```

#### Delete Department
```http
DELETE /api/departments/{id}
```

### Routine Generation

#### Generate Routine
```http
POST /api/routines/generate
Content-Type: application/json

{
  "semester_offering_id": 1
}
```

Response includes:
- Schedule run ID
- Generation report with placed/unplaced blocks
- Conflict details and suggestions

#### Get Schedule Run
```http
GET /api/routines/{schedule_run_id}
```

#### Get Schedule Runs by Semester Offering
```http
GET /api/routines/semester-offering/{semester_offering_id}
```

#### Commit Schedule Run
```http
POST /api/routines/{schedule_run_id}/commit
```

Commits a draft schedule run, making it active and preventing conflicts.

#### Cancel Schedule Run
```http
POST /api/routines/{schedule_run_id}/cancel
```

Cancels a draft schedule run and frees up the allocated slots.

### Health Check

#### Service Health
```http
GET /api/health
```

Returns service status and basic information.

## Data Models

### Programme
```json
{
  "id": 1,
  "name": "B.Tech",
  "duration_years": 4,
  "total_semesters": 8,
  "is_active": true,
  "created_at": "2025-08-19T10:00:00Z",
  "updated_at": "2025-08-19T10:00:00Z"
}
```

### Department
```json
{
  "id": 1,
  "name": "Computer Science & Technology",
  "strength": 60,
  "programme_id": 1,
  "is_active": true,
  "created_at": "2025-08-19T10:00:00Z",
  "updated_at": "2025-08-19T10:00:00Z",
  "programme": { ... }
}
```

### Schedule Run
```json
{
  "id": 1,
  "semester_offering_id": 1,
  "status": "DRAFT",
  "algorithm_version": "v1.0",
  "generated_at": "2025-08-19T10:00:00Z",
  "committed_at": null,
  "meta": "{\"total_blocks\": 15, \"placed_blocks\": 13, \"unplaced_blocks\": 2}",
  "schedule_entries": [...]
}
```

### Schedule Entry
```json
{
  "id": 1,
  "schedule_run_id": 1,
  "semester_offering_id": 1,
  "session_id": 1,
  "course_offering_id": 1,
  "teacher_id": 1,
  "room_id": 1,
  "day_of_week": 1,
  "slot_number": 1,
  "course_offering": { ... },
  "teacher": { ... },
  "room": { ... }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |

## Status Codes

### Schedule Run Status
- `DRAFT` - Generated but not committed
- `COMMITTED` - Active and committed
- `CANCELLED` - Cancelled draft
- `FAILED` - Generation failed

### Session Parity
- `ODD` - For Fall semesters (1, 3, 5, 7)
- `EVEN` - For Spring semesters (2, 4, 6, 8)

### Room Types
- `THEORY` - Lecture halls for theory classes
- `LAB` - Laboratory rooms for practical sessions
- `OTHER` - Other specialized rooms

## Time Slot System

The system uses a fixed time slot structure:

- **Days**: Monday (1) to Friday (5)
- **Slots**: 8 slots per day (1-8)
- **Duration**: 55 minutes per slot
- **Break**: Lunch break between slot 4 and 5

### Typical Schedule
| Slot | Time |
|------|------|
| 1 | 09:00-09:55 |
| 2 | 09:55-10:50 |
| 3 | 10:50-11:45 |
| 4 | 11:45-12:40 |
| *Break* | 13:00-14:00 |
| 5 | 13:50-14:45 |
| 6 | 14:45-15:40 |
| 7 | 15:40-16:35 |

## Usage Flow

1. **Setup Phase**:
   - Create programmes and departments
   - Add teachers, subjects, and rooms
   - Create academic sessions

2. **Configuration Phase**:
   - Create semester offerings
   - Add course offerings with subject assignments
   - Assign teachers and rooms to course offerings

3. **Generation Phase**:
   - Generate routine for semester offering
   - Review generated schedule and conflicts
   - Commit or regenerate as needed

4. **Management Phase**:
   - View committed schedules
   - Handle conflicts across semesters
   - Make adjustments for next session