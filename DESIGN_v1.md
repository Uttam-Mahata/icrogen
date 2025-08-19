Title: ICRoGen – System Design (Go backend + MySQL)

Overview
ICRoGen (IIEST Central Routine Generator) is a comprehensive backend system to manage and generate academic schedules across multiple programmes, departments, and semesters, preventing conflicts across teachers, rooms, and time slots. It provides CRUD for core academic entities, tools to select subjects per semester, assign teachers/rooms across departments/programmes, and a routine generator that respects time rules and resolves conflicts by suggesting free slot combinations.

Goals
- Centralized data model for programmes, departments, teachers, subjects, rooms, semesters, and sessions.
- Cross-programme/department subject-teacher-room assignment.
- Deterministic routine generation per semester with conflict prevention across the whole session (term).
- Draft-save workflow for generated routines with optimistic concurrency controls.
- Extensible, observable, and scalable Go backend with MySQL persistence.

Non-Goals
- UI/Frontend implementation.
- Timetable visualization and printing.
- Hard optimization (e.g., ILP solver); we start with a heuristic generator with backtracking.

Glossary
- Programme: Degree programme (e.g., B.Tech, M.Sc) with configured number of semesters.
- Department: Academic department under a programme (e.g., CSE under B.Tech).
- Session: Academic session/term (Spring=even semesters; Fall=odd semesters).
- Semester Definition: 1..N numbered semesters defined by a programme.
- Semester Offering: A specific semester of a department for a given session.
- Subject Type: Theory/Lab/Other types, configurable.
- Subject: Course with credit and weekly class load, tied to a programme+department.
- Course Offering: A subject selected into a specific Semester Offering, with teachers/room(s) assigned.
- Routine/Schedule: Actual placement of course sessions into weekly time slots.
- Time Slot: Atomic 55-minute periods; Monday–Friday; 8 per day.

Functional Requirements
1) Manage Programmes
- CRUD for programmes. Fields: name, duration (years), total_semesters, etc.

2) Manage Departments
- On selecting a Programme, list its Departments with Department Strength; full CRUD.

3) Manage Teachers
- On selecting a Department, show Teachers with active/inactive status; inline CRUD.
- Teachers belong to a “home” department but can teach across any programme/department.

4) Manage Subjects and Subject Types
- On select Programme, then Department, list Subjects; CRUD.
- Subject fields: code, name, credit, class_load_per_week, subject_type (configurable), owner department.
- Subject Type table: CRUD for types (e.g., Theory, Lab), flags like is_lab, default rules.

5) Manage Rooms
- CRUD. Fields: name, capacity, room_type (Theory, Lab), owner department (optional), active.

6) Manage Semesters and Assignments
- On select Programme, Department, Session: show the applicable Odd/Even semester cards.
- For each Semester card, select Subjects from that (Programme, Department).
- Assign one or more Teacher(s) to each selected Subject (inter-department/programme allowed).
- Assign Room(s) to each selected Subject (may be shared across depts/programmes if available).
- Persist all selections and allow edit/delete.

7) Generate Routines
- Inputs: Programme, Department, Session, Semester Number (odd/even list derived from session).
- Output: Auto-allocated weekly routine table (Subject, Teacher, Room, Day, Time).
- Actions: Save (commit and book slots globally for the session) or Cancel (discard draft).
- Global conflicts prevented: teacher or room cannot be double-booked across any programme/department in the same session.
- Time rules:
  - Days: Monday–Friday.
  - Periods (55 mins): 
    1: 09:00–09:55
    2: 09:55–10:50
    3: 10:50–11:45
    4: 11:45–12:40
    break
    5: 13:50–14:45
    6: 14:45–15:40
    7: 15:40–16:35
    8: optionally reserved/disabled if needed, but available by spec as 3:40–4:35 pm
  - Labs: 3 consecutive slots (e.g., 2–4 or 5–7) once per week.
  - Theory maximum per day: 2 hours (i.e., 2 slots) per course for a semester.
  - Credit-to-sessions mapping:
    - Credit 4 (weekly 4 hours): schedule as 2+2 or 2+1+1.
    - Credit 3: 2+1 or 1+1+1.
    - Credit 2: any two consecutive slots preferable (or 1+1 if needed).
  - Labs are generally 2 credits but 3-hour block once a week.

High-Level Architecture
- Language: Go
- Database: MySQL (InnoDB)
- API: REST (JSON)
- Layers (Clean Architecture):
  - transport/http: HTTP handlers, DTOs, routing, validation
  - core/service: business logic, orchestration
  - core/scheduler: routine generation algorithm
  - core/domain: entities and domain logic
  - data/repo: repositories (SQL queries), transaction management
  - pkg: utilities (auth, config, logging, errors)
- Migrations: golang-migrate
- Observability: structured logging (Zap/Logrus), OpenTelemetry traces/metrics, pprof
- Deployment: containerized (Docker), 12-factor configuration

Data Model (ER Outline)
- programmes (1) — (N) departments
- programmes (1) — (N) semester_definitions
- sessions (1) — (N) semester_offerings
- departments (1) — (N) teachers
- subject_types (1) — (N) subjects
- programme+department (1) — (N) subjects
- semester_offerings (1) — (N) course_offerings
- course_offerings (1) — (N) teacher_assignments
- course_offerings (1) — (N) room_assignments
- sessions (1) — (N) schedule_entries via semester_offerings
- schedule_blocks (1) — (N) schedule_entries (rows per slot)

Key Entities and Tables (MySQL)
Conventions:
- All tables: id BIGINT PK AUTO_INCREMENT; created_at, updated_at; soft delete optional (deleted_at NULL).
- FK: ON UPDATE CASCADE, ON DELETE RESTRICT (except lookups where SET NULL may be desired).
- Unique and composite indexes for conflict prevention.

programmes
- id, name (unique), duration_years, total_semesters, is_active

departments
- id, programme_id FK -> programmes.id
- name, strength, is_active
- unique(programme_id, name)

teachers
- id, department_id FK -> departments.id (home dept)
- name, email (unique), is_active, max_weekly_load_slots (optional)

subject_types
- id, name (unique), is_lab BOOL, default_consecutive_preferred BOOL

subjects
- id
- programme_id FK -> programmes.id
- department_id FK -> departments.id (owner department)
- subject_type_id FK -> subject_types.id
- code (unique within programme), name
- credit INT, class_load_per_week INT (slots/week)
- is_active
- unique(programme_id, department_id, code)

rooms
- id
- name (unique), capacity INT
- room_type ENUM('THEORY','LAB','OTHER')
- department_id FK nullable (owner or default)
- is_active

semester_definitions
- id
- programme_id FK
- semester_number INT (1..N)
- unique(programme_id, semester_number)

sessions
- id
- name ENUM('SPRING','FALL')
- academic_year VARCHAR(9) (e.g., "2025-26")
- parity ENUM('ODD','EVEN')  -- derived from name for convenience
- start_date, end_date
- unique(name, academic_year)

semester_offerings
- id
- programme_id FK
- department_id FK
- session_id FK
- semester_number INT
- status ENUM('DRAFT','ACTIVE','ARCHIVED')
- unique(programme_id, department_id, session_id, semester_number)

course_offerings
- id
- semester_offering_id FK
- subject_id FK
- weekly_required_slots INT  -- denormalized from subject.class_load_per_week
- required_pattern JSON      -- e.g., ["2+2"] or ["2","1","1"]; lab=[3]
- is_lab BOOL (denormalized)
- preferred_room_id FK NULL
- notes TEXT
- unique(semester_offering_id, subject_id)

teacher_assignments
- id
- course_offering_id FK
- teacher_id FK
- weight INT DEFAULT 1  -- for load balance or rotation (optional)
- unique(course_offering_id, teacher_id)

room_assignments
- id
- course_offering_id FK
- room_id FK
- priority SMALLINT DEFAULT 1
- unique(course_offering_id, room_id)

timeslots (static dictionary)
- id
- day_of_week TINYINT (1=Mon..5=Fri)
- slot_number TINYINT (1..8)
- start_time TIME, end_time TIME
- unique(day_of_week, slot_number)

schedule_runs
- id
- semester_offering_id FK
- status ENUM('DRAFT','COMMITTED','CANCELLED','FAILED')
- algorithm_version VARCHAR(20)
- generated_by_user_id BIGINT NULL
- generated_at DATETIME
- committed_at DATETIME NULL
- meta JSON (stats, conflicts, choices)

schedule_blocks
- id
- schedule_run_id FK
- course_offering_id FK
- teacher_id FK
- room_id FK
- day_of_week TINYINT
- slot_start TINYINT
- slot_length TINYINT  -- e.g., 1,2,3
- is_lab BOOL

schedule_entries
- id
- schedule_run_id FK
- semester_offering_id FK (redundant for fast queries)
- session_id FK (redundant for global conflict checks)
- course_offering_id FK
- teacher_id FK
- room_id FK
- day_of_week TINYINT
- slot_number TINYINT
- block_id FK -> schedule_blocks.id
- UNIQUE KEYS for conflict prevention:
  - unique(session_id, day_of_week, slot_number, teacher_id) (teacher cannot overlap globally in session)
  - unique(session_id, day_of_week, slot_number, room_id) (room cannot overlap globally in session)
  - unique(schedule_run_id, day_of_week, slot_number, course_offering_id) (avoid duplicates in draft/commit)

Rationale:
- One row per slot in schedule_entries simplifies conflict constraints using simple unique indexes. Multi-slot blocks (2 or 3) create 2–3 entries referencing one schedule_block.
- session_id is denormalized in schedule_entries for fast global checks.

Derived/Validation Rules
- sessions.parity determines valid semester numbers available (ODD -> 1,3,5,7... up to total_semesters; EVEN -> 2,4,6,8...).
- subjects.class_load_per_week must align with credit and subject type:
  - Theory: class_load_per_week typically equals credit (hours) -> slots/week.
  - Lab: 3-slot block once per week (class_load_per_week = 3), credits often 2.
- Teachers and Rooms must be active to be assignable.
- Rooms’ room_type must be compatible with subject_type (e.g., Lab needs LAB room).
- Per-day theory limit: for a given subject occurrence within a semester, do not place more than 2 slots on the same day (unless explicitly allowed).

Routine Generation Algorithm (Heuristic + Backtracking)
Inputs:
- semester_offering_id (programme, department, session, semester_number)
- For each course_offering: subject, weekly_required_slots, is_lab, assigned teachers (1..N), assigned rooms (1..N), optional preferences.
- Global occupancy: existing COMMITTED schedule_entries for the same session_id across all programmes/departments/semesters.

Preparation:
1) Build the weekly time grid: days Mon–Fri, slots 1..8. Mark break after slot 4 conceptually (no slot inserted for break).
2) Pull teacher and room availability maps for the session by querying schedule_entries for existing commitments; compute teacher_free[day][slot], room_free[day][slot].
3) Expand each course_offering into a set of session-units to place:
   - Labs: one 3-slot block (2–4 or 5–7). If afternoon-only labs are preferred, prioritize 5–7.
   - Theory: expand into patterns; enumerate feasible splits given weekly_required_slots and constraints:
     - Credit 4: prefer 2+2; fallback 2+1+1; fallback 1+1+1+1.
     - Credit 3: prefer 2+1; fallback 1+1+1.
     - Credit 2: prefer consecutive 2; fallback 1+1.
   Represent each sub-session with required length (1,2,3) and label.

Ordering (most constrained first):
- Place labs first (length=3).
- Then courses with higher weekly_required_slots.
- Then courses with fewer candidate teachers and fewer candidate rooms.
- Then courses with limited compatible rooms (e.g., labs) and teachers with lower free slots.

Placement Heuristic:
For each session-unit (block length L in {1,2,3}):
1) Candidate teachers: teacher_assignments for the course; filter those active and free on candidate slots.
2) Candidate rooms: room_assignments for the course; if empty, choose from any compatible room_type that is free.
3) Enumerate day, slot_start candidates:
   - For L=3: only (2,5) start or (5,5) start; configurable to allow (1..3) or (3..5) patterns if institution allows.
   - For L=2: any two consecutive slots (1–2), (2–3), (3–4), (5–6), (6–7).
   - For L=1: any single slot {1,2,3,4,5,6,7}.
   Skip any violating:
     - Teacher conflicts: any of the L slots occupied by teacher.
     - Room conflicts: any of the L slots occupied by room.
     - Per-day theory limit (>2 slots for the same course on the same day).
     - Institutional rules (e.g., avoid first/last slot if configured).
4) Scoring function (choose minimal-cost placement):
   - Balance teacher load across the week.
   - Prefer earlier in the day or afternoon based on subject_type.
   - Room proximity or preference match.
   - Avoid consecutive sessions of the same course if undesired.
5) Commit placement tentatively; update availability maps.
6) If stuck:
   - Backtrack limited depth (e.g., K=3) and try alternatives.
   - If still no solution, return partial routine with conflict suggestions and list of “free slot suggestions” for each unplaced unit.

Output:
- A DRAFT schedule_run with schedule_blocks and per-slot schedule_entries.
- A report: placed vs unplaced, conflicts avoided, reasons for unplaced.

Save/Cancel Workflow
- Generate (DRAFT): schedule_run.status = DRAFT; entries inserted without violating unique constraints? For drafts, store in a run-scoped table space; defer global unique constraints to COMMIT, or use temp tables. Simpler: draft uses separate draft tables or uses schedule_entries with schedule_run_id and no global unique indexes enforced; on commit, transactional copy to committed table enforcing unique constraints.
- Save (COMMIT): within a single DB transaction:
  1) Revalidate against current global occupancy by inserting entries into the committed schedule_entries table with global unique constraints (session_id, day, slot, teacher/room).
  2) If any conflict, abort and return updated conflicts and “find free slots” recalculated.
  3) Mark schedule_run as COMMITTED.
- Cancel: mark schedule_run as CANCELLED and delete draft entries.

Conflict Detection and Free Slot Suggestion
- Conflict query examples:
  - SELECT COUNT(*) FROM schedule_entries WHERE session_id=? AND day=? AND slot IN (…) AND teacher_id=?;
  - Same for room_id=?.
- Free slot search:
  - For given teacher_id and room_id set, enumerate all day/slot_start combos satisfying length L, filter by current occupancy; return top-N suggestions.

Indexes and Constraints
- schedule_entries
  - UNIQUE(session_id, day_of_week, slot_number, teacher_id)
  - UNIQUE(session_id, day_of_week, slot_number, room_id)
  - INDEX(session_id, semester_offering_id)
  - INDEX(course_offering_id)
- teacher_assignments: UNIQUE(course_offering_id, teacher_id)
- room_assignments: UNIQUE(course_offering_id, room_id)
- departments: UNIQUE(programme_id, name)
- semester_offerings: UNIQUE(programme_id, department_id, session_id, semester_number)
- timeslots: UNIQUE(day_of_week, slot_number)

API Design (REST, JSON)
Auth and RBAC (recommended)
- JWT-based auth (access/refresh).
- Roles: Admin, ProgrammeAdmin, DepartmentAdmin, Scheduler, Viewer.
- Resource scoping by programme_id and department_id.

Programme Management
- POST /api/programmes
- GET /api/programmes
- GET /api/programmes/{id}
- PATCH /api/programmes/{id}
- DELETE /api/programmes/{id}

Department Management
- POST /api/programmes/{programme_id}/departments
- GET /api/programmes/{programme_id}/departments
- GET /api/departments/{id}
- PATCH /api/departments/{id}
- DELETE /api/departments/{id}

Teacher Management
- POST /api/departments/{department_id}/teachers
- GET /api/departments/{department_id}/teachers?active=…
- PATCH /api/teachers/{id}  (inline edits: name, active, load, etc.)
- DELETE /api/teachers/{id}

Subject Types
- POST /api/subject-types
- GET /api/subject-types
- PATCH /api/subject-types/{id}
- DELETE /api/subject-types/{id}

Subject Management
- POST /api/programmes/{programme_id}/departments/{department_id}/subjects
- GET /api/programmes/{programme_id}/departments/{department_id}/subjects
- GET /api/subjects/{id}
- PATCH /api/subjects/{id}
- DELETE /api/subjects/{id}

Room Management
- POST /api/rooms
- GET /api/rooms?type=LAB&department_id=…
- GET /api/rooms/{id}
- PATCH /api/rooms/{id}
- DELETE /api/rooms/{id}

Sessions and Semesters
- POST /api/sessions
- GET /api/sessions?year=2025-26
- POST /api/programmes/{programme_id}/semesters/definitions  (bulk create 1..N)
- GET /api/programmes/{programme_id}/semesters/definitions
- POST /api/semester-offerings
  Body: programme_id, department_id, session_id, semester_number
- GET /api/semester-offerings?programme_id=&department_id=&session_id=&semester_number=

Course Offerings and Assignments
- POST /api/semester-offerings/{id}/course-offerings  (subject_id list or single)
- GET /api/semester-offerings/{id}/course-offerings
- DELETE /api/course-offerings/{id}
- POST /api/course-offerings/{id}/teachers  (assign teacher_id)
- DELETE /api/course-offerings/{id}/teachers/{teacher_id}
- POST /api/course-offerings/{id}/rooms  (assign room_id)
- DELETE /api/course-offerings/{id}/rooms/{room_id}

Generate and Manage Routines
- POST /api/routines/generate
  Body: programme_id, department_id, session_id, semester_number
  Response: schedule_run_id, entries (draft), report
- POST /api/routines/{schedule_run_id}/save
  Commits draft (transactional). Returns conflict details if failed.
- POST /api/routines/{schedule_run_id}/cancel
- GET /api/routines?programme_id=&department_id=&session_id=&semester_number=
- GET /api/routines/{schedule_run_id}
- GET /api/availability/free-slots
  Query: teacher_id, room_type, length, session_id, constraints…

Validation and Business Rules (Examples)
- Creating semester_offering: ensure semester_number matches session parity and <= programme.total_semesters.
- Adding course_offering: subject must belong to the same programme+department as semester_offering.
- Teacher/Room assignment: validate is_active and compatibility (room_type vs subject_type).
- Routine generation: enforce max 2 theory slots per day per course and lab block rules.
- Save commit re-checks conflicts and rejects if any slot is newly occupied.

Go Project Structure
- cmd/icrogen-api/main.go
- internal/
  - transport/http/
    - router.go (chi/gin)
    - handlers/*.go (programmes, departments, teachers, subjects, rooms, sessions, semesters, offerings, assignments, routines)
    - dto/*.go (request/response models)
    - middleware/auth.go, logging.go
  - core/
    - domain/*.go (entities, value objects)
    - service/*.go (use cases: CRUD, offering mgmt, generator orchestration)
    - scheduler/
      - generator.go (heuristics, scoring, backtracking)
      - constraints.go (teacher, room, per-day limits)
      - availability.go (maps, queries)
      - patterns.go (credit-to-sessions expansions)
      - report.go
  - data/repo/
    - mysql/*.go (repositories)
    - tx.go (transaction manager)
    - migrations/*.sql
  - pkg/
    - config/
    - logger/
    - auth/
    - errors/
- Makefile, Dockerfile, docker-compose.yml (MySQL, app), .env

Sample DDL Fragments (illustrative)
```sql
CREATE TABLE programmes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  duration_years TINYINT NOT NULL,
  total_semesters TINYINT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  programme_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  strength INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_dept (programme_id, name),
  CONSTRAINT fk_dept_prog FOREIGN KEY (programme_id) REFERENCES programmes(id)
);

CREATE TABLE subject_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  is_lab TINYINT(1) NOT NULL DEFAULT 0,
  default_consecutive_preferred TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE subjects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  programme_id BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  subject_type_id BIGINT NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  credit TINYINT NOT NULL,
  class_load_per_week TINYINT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_subject (programme_id, department_id, code),
  CONSTRAINT fk_subj_prog FOREIGN KEY (programme_id) REFERENCES programmes(id),
  CONSTRAINT fk_subj_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_subj_type FOREIGN KEY (subject_type_id) REFERENCES subject_types(id)
);

CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  capacity INT NOT NULL,
  room_type ENUM('THEORY','LAB','OTHER') NOT NULL,
  department_id BIGINT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_room_dept FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name ENUM('SPRING','FALL') NOT NULL,
  academic_year VARCHAR(9) NOT NULL,
  parity ENUM('ODD','EVEN') NOT NULL,
  start_date DATE, end_date DATE,
  UNIQUE KEY uq_session (name, academic_year)
);

CREATE TABLE semester_offerings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  programme_id BIGINT NOT NULL,
  department_id BIGINT NOT NULL,
  session_id BIGINT NOT NULL,
  semester_number TINYINT NOT NULL,
  status ENUM('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  UNIQUE KEY uq_sem_off (programme_id, department_id, session_id, semester_number),
  CONSTRAINT fk_so_prog FOREIGN KEY (programme_id) REFERENCES programmes(id),
  CONSTRAINT fk_so_dept FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_so_sess FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE course_offerings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  semester_offering_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  weekly_required_slots TINYINT NOT NULL,
  required_pattern JSON NULL,
  is_lab TINYINT(1) NOT NULL DEFAULT 0,
  preferred_room_id BIGINT NULL,
  notes TEXT,
  UNIQUE KEY uq_co (semester_offering_id, subject_id),
  CONSTRAINT fk_co_so FOREIGN KEY (semester_offering_id) REFERENCES semester_offerings(id),
  CONSTRAINT fk_co_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_co_room FOREIGN KEY (preferred_room_id) REFERENCES rooms(id)
);

CREATE TABLE teacher_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_offering_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  weight INT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_co_teacher (course_offering_id, teacher_id),
  CONSTRAINT fk_ta_co FOREIGN KEY (course_offering_id) REFERENCES course_offerings(id),
  CONSTRAINT fk_ta_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

CREATE TABLE room_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  course_offering_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 1,
  UNIQUE KEY uq_co_room (course_offering_id, room_id),
  CONSTRAINT fk_ra_co FOREIGN KEY (course_offering_id) REFERENCES course_offerings(id),
  CONSTRAINT fk_ra_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE timeslots (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  day_of_week TINYINT NOT NULL,  -- 1..5
  slot_number TINYINT NOT NULL,  -- 1..7 (or 1..8 if used)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE KEY uq_timeslot (day_of_week, slot_number)
);

CREATE TABLE schedule_runs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  semester_offering_id BIGINT NOT NULL,
  status ENUM('DRAFT','COMMITTED','CANCELLED','FAILED') NOT NULL,
  algorithm_version VARCHAR(20) NOT NULL,
  generated_by_user_id BIGINT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  committed_at DATETIME NULL,
  meta JSON NULL,
  CONSTRAINT fk_sr_so FOREIGN KEY (semester_offering_id) REFERENCES semester_offerings(id)
);

CREATE TABLE schedule_blocks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  schedule_run_id BIGINT NOT NULL,
  course_offering_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL,
  slot_start TINYINT NOT NULL,
  slot_length TINYINT NOT NULL,
  is_lab TINYINT(1) NOT NULL,
  CONSTRAINT fk_sb_run FOREIGN KEY (schedule_run_id) REFERENCES schedule_runs(id),
  CONSTRAINT fk_sb_co FOREIGN KEY (course_offering_id) REFERENCES course_offerings(id),
  CONSTRAINT fk_sb_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_sb_room FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE schedule_entries (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  schedule_run_id BIGINT NOT NULL,
  semester_offering_id BIGINT NOT NULL,
  session_id BIGINT NOT NULL,
  course_offering_id BIGINT NOT NULL,
  teacher_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  day_of_week TINYINT NOT NULL,
  slot_number TINYINT NOT NULL,
  block_id BIGINT NOT NULL,
  CONSTRAINT fk_se_run FOREIGN KEY (schedule_run_id) REFERENCES schedule_runs(id),
  CONSTRAINT fk_se_so FOREIGN KEY (semester_offering_id) REFERENCES semester_offerings(id),
  CONSTRAINT fk_se_session FOREIGN KEY (session_id) REFERENCES sessions(id),
  CONSTRAINT fk_se_co FOREIGN KEY (course_offering_id) REFERENCES course_offerings(id),
  CONSTRAINT fk_se_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_se_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_se_block FOREIGN KEY (block_id) REFERENCES schedule_blocks(id),
  UNIQUE KEY uq_teacher_occupancy (session_id, day_of_week, slot_number, teacher_id),
  UNIQUE KEY uq_room_occupancy (session_id, day_of_week, slot_number, room_id),
  UNIQUE KEY uq_run_dup (schedule_run_id, day_of_week, slot_number, course_offering_id),
  INDEX idx_se_so (session_id, semester_offering_id)
);
```

Transaction and Concurrency Strategy
- All write operations performed within a transaction (READ COMMITTED).
- Routine COMMIT:
  - Start transaction.
  - Recompute/verify no conflicts by attempting to insert into schedule_entries with unique constraints—let the DB enforce conflict safety.
  - On unique violation, rollback and return conflicts; client can regenerate.
  - On success, commit.
- Optimistic Concurrency:
  - schedule_runs has status; COMMIT only if DRAFT; state transition guarded with WHERE status='DRAFT' in UPDATE.

Scheduler Pseudocode (Simplified)
```go
func GenerateRoutine(ctx, semesterOfferingID) (runID, report, error) {
  data := loadData(semesterOfferingID)
  grid := buildGrid() // Mon-Fri, slots 1..7
  occupancy := loadGlobalOccupancy(data.sessionID)
  demand := expandCourseDemand(data.courseOfferings)

  order := sortByConstraint(demand) // labs, high load, low options first
  placements := []Placement{}

  if backtrackPlace(0, order, grid, occupancy, &placements) {
    runID := persistDraft(placements)
    return runID, buildReport(placements), nil
  }
  return 0, buildReport(placements), ErrNoFeasibleSolution
}

func backtrackPlace(i int, items []SessionUnit, grid *Grid, occ *Occupancy, out *[]Placement) bool {
  if i == len(items) { return true }
  unit := items[i]
  candidates := enumerateCandidates(unit, grid, occ) // teacher, room, day, start
  sortCandidates(candidates) // scoring heuristic

  for _, c := range candidates {
    if !violates(unit, c, occ) {
      apply(c, grid, occ, out)
      if backtrackPlace(i+1, items, grid, occ, out) {
        return true
      }
      revert(c, grid, occ, out)
    }
  }
  return false
}
```

Security
- JWT-based authentication; short-lived access tokens.
- RBAC enforcing:
  - Admin: all resources
  - ProgrammeAdmin: programme-scoped resources
  - DepartmentAdmin: department-scoped resources
  - Scheduler: generate/save routines
  - Viewer: read-only
- Input validation and parameterized queries to prevent SQL injection.
- Audit logging for generation/commit actions.

Performance and Scaling
- Heavy reads on availability checks; ensure proper covering indexes.
- Cache static lookups (timeslots, subject types) in-memory.
- Batch inserts for schedule_entries during commit for efficiency.
- Connection pool tuning (database/sql).
- Horizontal scaling: stateless API, DB as single source of truth. Use queue/lock if running multiple generators on the same offering concurrently (e.g., advisory lock by semester_offering_id).

Observability
- Structured logs with correlation IDs (schedule_run_id).
- Metrics:
  - generation_duration_seconds
  - placements_attempted_total, backtracks_total
  - conflicts_detected_total
- Tracing across handler -> service -> repo -> DB.

Migration and Seeding
- Migrations with golang-migrate.
- Seed timeslots (Mon–Fri, slots 1..7):
  - (1, 09:00–09:55), (2, 09:55–10:50), (3, 10:50–11:45), (4, 11:45–12:40), (5, 13:50–14:45), (6, 14:45–15:40), (7, 15:40–16:35)
- Optional: seed subject types (Theory, Lab).

Edge Cases and Notes
- Inter-programme/department teaching: allowed via teacher_assignments; conflicts prevented by session-level unique keys.
- Room sharing across programmes: enforced by session-level room unique keys.
- Labs must be consecutive and once per week; enforce in patterns and validator.
- If a subject has multiple teachers assigned, the generator can select one per session-unit or rotate by weight.
- Per-day theory limit: ensure that for a given course_offering and day, count of scheduled theory slots ≤ 2.
- Manual overrides: allow manual edits (future enhancement) with same conflict checks.

Testing Strategy
- Unit tests for:
  - Pattern expansion (credits -> weekly session units).
  - Conflict checks (teacher/room).
  - Availability enumeration and scoring.
- Integration tests:
  - End-to-end generate->save flow with race conditions (simulated concurrent commits).
  - Cross-department/programme conflicts.
- Property tests:
  - No overlaps in a committed schedule (DB uniqueness plus logical checks).
- Performance tests for large datasets.

Future Enhancements
- Hard optimization (ILP/CP-SAT) for better fairness and compactness.
- Teacher availability preferences, blackout periods.
- Room features and subject-required features matching.
- Fair load distribution across teachers.
- Manual drag-and-drop editor with reconciliation.

Conclusion
This design defines a robust, conflict-safe scheduling backend tailored to IIEST needs. It models institutional entities cleanly, supports cross-programme teaching, and provides a practical heuristic generator with transactional commit semantics to keep the global timetable consistent across programmes, departments, and semesters.