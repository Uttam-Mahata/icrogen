## **1. Introduction**

### **1.1. Purpose**

This document outlines the complete technical design for the **ICRoGen** backend. The system is designed to automate the creation of complex, conflict-free academic schedules for educational institutions. It will manage all core academic entities and provide a robust engine for routine generation.

### **1.2. Scope**

  * **In Scope:**
      * Full CRUD (Create, Read, Update, Delete) management for Programmes, Departments, Teachers, Subjects, Subject Types, and Rooms.
      * A module for configuring semester-specific offerings, including assigning subjects, teachers (inter/intra-departmental), and rooms.
      * A powerful routine generation engine that solves scheduling conflicts for teachers and rooms across the entire institution for a given academic session.
      * Generation of routines for all relevant semesters (e.g., all odd semesters) in a single operation.
      * A RESTful API to be consumed by a frontend client.
  * **Out of Scope:**
      * Frontend UI/UX design.
      * Student registration and enrollment.
      * Grading, attendance, and examination scheduling.

-----

## **2. System Requirements**

### **2.1. Functional Requirements**

  * **Programme Management:** System administrators can create, view, update, and delete academic programmes, specifying details like name, duration, and the total number of semesters.
  * **Department Management:** For each programme, administrators can manage departments, including department name and student strength.
  * **Teacher Management:** Administrators can manage teacher profiles per department, including their details and active/inactive status.
  * **Subject Management:** Manage subjects for each department, including credits, weekly class load, and type (e.g., Theory, Lab).
  * **Room Management:** Manage a list of available rooms with details like room number and type (Lecture Hall, Lab).
  * **Semester Configuration:** A core feature where an administrator configures a specific semester (e.g., B.Tech CST 5th Sem, Fall 2025) by:
      * Selecting subjects from the department's list.
      * Assigning one or more teachers to each subject. Teachers can be from any department or program.
      * Assigning a suitable room for each subject.
  * **Routine Generation:** On user command, the system will:
      * Generate a complete, conflict-free timetable for a selected semester or an entire session (all odd/even semesters).
      * Automatically allocate days and time slots for all classes.
      * Adhere to predefined class structures (e.g., 3-hour labs, 2-hour theory blocks).
      * Present the generated routine for review before saving.
  * **Persistence:** Once approved, the generated routine is saved, and those time slots for the assigned teachers and rooms become unavailable for any other scheduling.

### **2.2. Non-Functional Requirements**

  * **Performance:** API responses for CRUD operations should be under 300ms. Routine generation for an entire session with multiple semesters should ideally complete within 60 seconds.
  * **Scalability:** The system must be able to handle dozens of programmes and hundreds of teachers and subjects without a significant degradation in performance.
  * **Reliability:** The system must be highly available with minimal downtime, especially during the critical period of schedule creation at the beginning of an academic term.
  * **Security:** The system must include authentication and role-based access control (RBAC) to ensure that only authorized users can perform administrative actions.

-----

## **3. System Architecture**

We will adopt a **service-oriented monolithic architecture**. This design provides a clean separation of concerns within a single deployable application, making it manageable for the current scope while allowing for future expansion into microservices if needed.

  * **API Layer (Gin Gonic):** This layer is the entry point to the application. It handles HTTP requests, routing, request validation, and marshaling JSON responses. It will also manage authentication middleware.
  * **Service Layer:** This layer contains the core business logic. It's isolated from the web layer. For example, `ProgrammeService` will handle the logic for managing programmes, and the crucial `RoutineGenerationService` will orchestrate the entire scheduling algorithm.
  * **Data Access Layer (DAL):** This layer abstracts all database operations. It provides a clean API for the service layer to interact with the database without needing to know the specific SQL queries. We will use **GORM** (which supports MySQL) or a Go MySQL driver for this purpose.

-----

## **4. Database Design (MySQL)**

The schema is designed to be relational and normalized to ensure data integrity using the **MySQL** database system. We will use auto-incrementing integers for primary keys, which is a common and efficient pattern in MySQL.

### **4.1. ER Diagram**

### **4.2. Detailed Schema (MySQL Dialect)**

```sql
-- Use the InnoDB engine for transaction support and foreign key constraints
-- Programmes offered by the institution
CREATE TABLE programmes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    duration_years INT NOT NULL,
    total_semesters INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Departments within each programme
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    strength INT,
    programme_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (programme_id) REFERENCES programmes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Teachers, associated with a primary department
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10) UNIQUE, -- e.g., SMK, NG, etc.
    department_id INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Rooms and labs
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INT,
    type VARCHAR(50) NOT NULL, -- 'Lecture Hall', 'Lab'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Subject details
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    credit INT NOT NULL,
    class_load_per_week INT NOT NULL,
    department_id INT NOT NULL,
    is_lab BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Central table for configuring a specific semester offering
CREATE TABLE semester_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    semester_number INT NOT NULL,
    session VARCHAR(50) NOT NULL, -- 'Fall', 'Spring'
    academic_year INT NOT NULL,
    UNIQUE KEY uq_semester_config (department_id, semester_number, session, academic_year),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Join table to assign subjects and teachers to a semester configuration
CREATE TABLE semester_subject_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_config_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    FOREIGN KEY (semester_config_id) REFERENCES semester_configurations(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- The final generated and saved schedules
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semester_config_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    room_id INT NOT NULL,
    day_of_week INT NOT NULL, -- 1 for Monday, 5 for Friday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (semester_config_id) REFERENCES semester_configurations(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
```

-----

## **5. Core Algorithm: Backtracking for Routine Generation**

The generation process is a **Constraint Satisfaction Problem (CSP)**. A backtracking algorithm is well-suited to explore the search space of possible timetables to find a valid solution.

### **5.1. Data Structures in Go**

```go
type ClassBlock struct {
    SubjectID         int
    TeacherID         int
    RoomID            int
    DurationSlots     int // 1 for 55m, 2 for 1h 50m, 3 for 2h 45m
    IsLab             bool
    SemesterConfigID  int
}

type TimeSlotInfo struct {
    IsBooked  bool
    Block     *ClassBlock
}

// Timetable: map[DayOfWeek][TimeSlotIndex]TimeSlotInfo
type Timetable map[int]map[int]TimeSlotInfo
```

### **5.2. Algorithm Steps**

1.  **Initialization**:

      * The user requests to generate a routine for a session (e.g., "Fall 2025").
      * The system fetches all `semester_configurations` for that session (e.g., 1st, 3rd, 5th, 7th sem).
      * It retrieves all `semester_subject_assignments` for these configurations.
      * It deconstructs each subject into a list of `ClassBlock`s based on credits and type (e.g., a 4-credit theory subject becomes two 2-slot blocks).

2.  **Recursive Backtracking Function**: The core of the generator is a recursive function.

    ```pseudocode
    function generate(blocksToSchedule, timetable):
      // Base case: If no more blocks to schedule, a solution is found.
      if IsEmpty(blocksToSchedule):
        return timetable

      // Select the next block to schedule (heuristics can be applied here)
      currentBlock = SelectNextBlock(blocksToSchedule)
      remainingBlocks = RemoveBlock(blocksToSchedule, currentBlock)

      // Iterate through all possible time slots
      for day from Monday to Friday:
        for slotIndex from 0 to 6:
          // Check if the block can be placed here without overlap
          if CanPlace(currentBlock, day, slotIndex, timetable):

            // **CONSTRAINT VALIDATION**
            // Check for global conflicts by querying the 'schedules' table and the current 'timetable'
            if IsTeacherAvailable(currentBlock.TeacherID, day, slotIndex) AND
               IsRoomAvailable(currentBlock.RoomID, day, slotIndex) AND
               IsStudentGroupAvailable(currentBlock.SemesterConfigID, day, slotIndex, timetable):

              // **MAKE MOVE**
              // Place the block in the temporary timetable
              Place(currentBlock, day, slotIndex, timetable)

              // **RECURSE**
              result = generate(remainingBlocks, timetable)
              if result is not null:
                return result // Success!

              // **BACKTRACK**
              // If recursion failed, undo the move and try the next slot
              Remove(currentBlock, day, slotIndex, timetable)

      // If all slots are tried and none work, return null (failure)
      return null
    ```

3.  **Constraint Checking**: The `Is...Available` functions are critical. They must perform two checks:

    1.  **Check against committed schedules**: Query the main `schedules` **MySQL** table to ensure the teacher/room isn't already booked by another department/program in a previously saved routine.
    2.  **Check against the current in-progress timetable**: Ensure the teacher/room isn't being used by another class *within the same generation batch*. This handles conflicts between, for example, the 1st and 5th semesters being generated simultaneously.

-----

## **6. Deployment**

  * **Containerization:** The Go application will be containerized using **Docker**. A `Dockerfile` will define the build process, creating a lightweight, portable image.
  * **Orchestration:** **Docker Compose** will be used for local development and simple production deployments, managing the Go application and **MySQL** database containers. For larger-scale deployments, **Kubernetes** would be the recommended platform for scalability and resilience.
  * **CI/CD:** A pipeline using **GitHub Actions** or Jenkins will be set up to automatically build, test, and deploy the application upon pushes to the main branch, ensuring code quality and rapid delivery.