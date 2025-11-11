# Cross-Department and Cross-Programme Scheduling

## Overview

ICRoGen's routine generation algorithm supports **cross-department and cross-programme teacher assignments** with full conflict resolution. Teachers from any department can be assigned to teach courses in other departments without conflicts.

## Architecture

### Session-Level Conflict Detection

The conflict resolution system operates at the **session level**, not the department level. This design enables cross-department teaching while preventing scheduling conflicts across the entire institution.

```
Session (e.g., Fall 2024)
├── Department: Computer Science
│   ├── Semester 1 (ODD)
│   └── Semester 3 (ODD)
├── Department: Electrical Engineering
│   ├── Semester 1 (ODD)
│   └── Semester 3 (ODD)
└── Conflict Check: All schedules within this session are checked together
```

### Key Implementation Details

#### 1. Teacher Availability Check

Located in `server/internal/repository/schedule.go`:

```go
func (r *scheduleRepository) CheckTeacherAvailability(teacherID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error) {
    var count int64
    err := r.db.Model(&models.ScheduleEntry{}).
        Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
        Where("schedule_entries.teacher_id = ? AND schedule_entries.session_id = ? AND schedule_entries.day_of_week = ? AND schedule_entries.slot_number IN ? AND schedule_runs.status = ?",
            teacherID, sessionID, dayOfWeek, slotNumbers, "COMMITTED").
        Count(&count).Error
    return count == 0, nil
}
```

**Key Points:**
- Queries by `teacher_id` + `session_id` (NOT `department_id`)
- Checks ALL committed schedules across all departments in the session
- Returns false if teacher is already scheduled anywhere during those slots

#### 2. Room Availability Check

Located in `server/internal/repository/schedule.go`:

```go
func (r *scheduleRepository) CheckRoomAvailability(roomID uint, sessionID uint, dayOfWeek int, slotNumbers []int) (bool, error) {
    var count int64
    err := r.db.Model(&models.ScheduleEntry{}).
        Joins("JOIN schedule_runs ON schedule_entries.schedule_run_id = schedule_runs.id").
        Where("schedule_entries.room_id = ? AND schedule_entries.session_id = ? AND schedule_entries.day_of_week = ? AND schedule_entries.slot_number IN ? AND schedule_runs.status = ?",
            roomID, sessionID, dayOfWeek, slotNumbers, "COMMITTED").
        Count(&count).Error
    return count == 0, nil
}
```

**Key Points:**
- Similar session-level design for room conflicts
- Prevents double-booking rooms across all departments

#### 3. Constraint Validation in Backtracking Algorithm

Located in `server/internal/service/routine_generation.go`:

The `canPlaceBlock` function validates all global constraints:

```go
// Check teacher availability (session-level - prevents double-booking across ALL departments)
teacherAvailable, err := s.scheduleRepo.CheckTeacherAvailability(block.TeacherID, sessionID, day, slotNumbers)
if !teacherAvailable {
    logrus.WithFields(logrus.Fields{
        "teacher_id": block.TeacherID,
        "session_id": sessionID,
        "day":        day,
        "slots":      slotNumbers,
    }).Debug("Teacher unavailable - already scheduled in another department/programme")
    return false
}

// Check room availability (session-level - prevents double-booking across ALL departments)
roomAvailable, err := s.scheduleRepo.CheckRoomAvailability(block.RoomID, sessionID, day, slotNumbers)
if !roomAvailable {
    logrus.WithFields(logrus.Fields{
        "room_id":    block.RoomID,
        "session_id": sessionID,
        "day":        day,
        "slots":      slotNumbers,
    }).Debug("Room unavailable - already booked by another department/programme")
    return false
}
```

## How Cross-Department Teaching Works

### Step 1: Assign Teacher from Another Department

When creating a course offering, you can assign any teacher regardless of their home department:

```json
POST /api/semester-offerings/:id/course-offerings/:course_offering_id/teachers
{
    "teacher_id": 5,  // Teacher from CS department
    "weight": 1
}
```

This teacher (ID 5) from Computer Science can be assigned to teach a course in Electrical Engineering department.

### Step 2: Generate Routine

When generating the routine:

```json
POST /api/routines/generate
{
    "semester_offering_id": 10  // Electrical Engineering Semester 1
}
```

The algorithm will:
1. Check if Teacher #5 is already scheduled in ANY department during a given time slot
2. Only place the class if the teacher is free across the entire session
3. Prevent conflicts with the teacher's classes in their home department (CS)

### Step 3: Bulk Generation with Cross-Department Support

The bulk generation feature also respects cross-department constraints:

```json
POST /api/routines/generate-bulk
{
    "session_id": 1,
    "parity": "ODD",
    "department_id": null  // Generate for all departments
}
```

This will:
1. Generate routines for all odd semesters sequentially
2. Each generation considers ALL previously committed schedules
3. Ensures no teacher or room is double-booked across departments

## Logging and Debugging

Enhanced logging in `routine_generation.go` provides detailed conflict information:

```
DEBUG[0123] Teacher unavailable - already scheduled in another department/programme
    teacher_id=5
    session_id=1
    day=1
    slots=[1,2]
```

```
DEBUG[0124] Room unavailable - already booked by another department/programme
    room_id=12
    session_id=1
    day=2
    slots=[5,6,7]
```

Enable debug logging with:
```bash
LOG_LEVEL=debug make run
```

## Database Schema Support

### TeacherAssignment

Teachers can be assigned to any course offering:

```go
type TeacherAssignment struct {
    ID               uint
    CourseOfferingID uint
    TeacherID        uint  // Teacher from ANY department
    Weight           int
}
```

### ScheduleEntry

Each schedule entry tracks the session for global conflict checking:

```go
type ScheduleEntry struct {
    ID            uint
    ScheduleRunID uint
    SessionID     uint     // Used for cross-department conflict checking
    TeacherID     uint
    RoomID        uint
    DayOfWeek     int
    SlotNumber    int
    // ... other fields
}
```

## Example Scenario

### Scenario: CS Professor Teaching in Electrical Engineering

**Setup:**
- Dr. Smith (Teacher ID: 5) - Home Department: Computer Science
- Dr. Smith is assigned to teach "Digital Logic" in Electrical Engineering Department
- Session: Fall 2024 (Session ID: 1)

**Step 1:** CS Department Routine Generated
```
Monday, Slots 1-2: Dr. Smith teaches "Data Structures" (CS Semester 3)
Wednesday, Slots 3-4: Dr. Smith teaches "Algorithms" (CS Semester 5)
```

**Step 2:** Electrical Engineering Routine Generated
The algorithm will:
- Attempt to place "Digital Logic" with Dr. Smith
- Check availability: `CheckTeacherAvailability(teacher_id=5, session_id=1, day=1, slots=[1,2])`
- Result: **Unavailable** (already teaching Data Structures)
- Attempt other time slots: Tuesday, Thursday, Friday
- Successfully place on Tuesday, Slots 1-2 (Dr. Smith is free)

**Final Schedule:**
```
Dr. Smith (CS Department):
  Monday 1-2:    Data Structures (CS Dept)
  Tuesday 1-2:   Digital Logic (EE Dept) ← Cross-department teaching
  Wednesday 3-4: Algorithms (CS Dept)
```

## Best Practices

### 1. Assign Teachers Strategically
- Consider teacher workload across all departments
- Assign cross-department teachers early in the semester setup

### 2. Generate Routines Sequentially
- Use bulk generation to ensure consistent conflict checking
- Generate routines for larger departments first (more constraints)

### 3. Monitor Logs
- Enable debug logging during routine generation
- Review "unavailable" logs to understand scheduling decisions

### 4. Commit Schedules Incrementally
- Commit each department's routine after verification
- This makes their slots unavailable for subsequent generations

### 5. Handle Partial Solutions
- If a routine has status "PARTIAL", review unplaced blocks
- Consider adjusting teacher assignments or time constraints
- Re-generate with updated constraints

## API Endpoints

### Assign Cross-Department Teacher
```bash
POST /api/semester-offerings/:id/course-offerings/:course_offering_id/teachers
Content-Type: application/json

{
    "teacher_id": 5,
    "weight": 1
}
```

### Generate Routine with Cross-Department Support
```bash
POST /api/routines/generate
Content-Type: application/json

{
    "semester_offering_id": 10
}
```

### Bulk Generate All Departments
```bash
POST /api/routines/generate-bulk
Content-Type: application/json

{
    "session_id": 1,
    "parity": "ODD",
    "department_id": null
}
```

## Troubleshooting

### Issue: Teacher Shows as Unavailable

**Check:**
1. Verify teacher isn't already scheduled in another department:
   ```sql
   SELECT * FROM schedule_entries se
   JOIN schedule_runs sr ON se.schedule_run_id = sr.id
   WHERE se.teacher_id = 5
     AND se.session_id = 1
     AND sr.status = 'COMMITTED';
   ```

2. Review debug logs for conflict details

3. Check if previous routine was committed (only committed schedules block slots)

### Issue: Cross-Department Conflicts Not Detected

**Check:**
1. Ensure session_id is correctly set on all schedule entries
2. Verify both routines belong to the same session
3. Confirm status is "COMMITTED" (drafts don't block slots)

## Performance Considerations

- **Session-level queries** are indexed on `teacher_id`, `session_id`, `day_of_week`, `slot_number`
- **Bulk generation** processes sequentially to maintain consistency
- **Database connection pooling** optimizes concurrent query performance (MaxOpenConns: 100)

## Conclusion

ICRoGen's cross-department scheduling is achieved through:
1. **Session-level conflict detection** (not department-level)
2. **Global teacher/room availability checks** across all departments
3. **Flexible teacher assignment** model supporting any department combination
4. **Sequential bulk generation** ensuring consistency

This design enables academic institutions to optimize teacher utilization across departments while maintaining conflict-free schedules.
