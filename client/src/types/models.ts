export interface Programme {
  id: number;
  name: string;
  duration_years: number;
  total_semesters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  departments?: Department[];
  semester_definitions?: SemesterDefinition[];
  subjects?: Subject[];
  semester_offerings?: SemesterOffering[];
}

export interface Department {
  id: number;
  name: string;
  strength: number;
  programme_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  programme?: Programme;
  teachers?: Teacher[];
  subjects?: Subject[];
  rooms?: Room[];
  semester_offerings?: SemesterOffering[];
}

export interface Teacher {
  id: number;
  name: string;
  initials?: string | null;
  email: string;
  department_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
  teacher_assignments?: TeacherAssignment[];
  schedule_entries?: ScheduleEntry[];
}

export interface SubjectType {
  id: number;
  name: string;
  is_lab: boolean;
  requires_room: boolean;
  default_consecutive_preferred: boolean;
  created_at: string;
  updated_at: string;
  subjects?: Subject[];
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  credit: number;
  class_load_per_week: number;
  programme_id: number;
  department_id: number;
  subject_type_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  programme?: Programme;
  department?: Department;
  subject_type?: SubjectType;
  course_offerings?: CourseOffering[];
}

export interface Room {
  id: number;
  name: string;
  room_number: string;
  capacity: number;
  type: 'THEORY' | 'LAB' | 'OTHER';
  department_id?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: Department | null;
  room_assignments?: RoomAssignment[];
  schedule_entries?: ScheduleEntry[];
}

export interface Session {
  id: number;
  name: 'SPRING' | 'FALL';
  academic_year: string;
  parity: 'ODD' | 'EVEN';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  semester_offerings?: SemesterOffering[];
}

export interface SemesterDefinition {
  id: number;
  programme_id: number;
  semester_number: number;
  programme?: Programme;
}

export interface SemesterOffering {
  id: number;
  programme_id: number;
  department_id: number;
  session_id: number;
  semester_number: number;
  total_students: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  programme?: Programme;
  department?: Department;
  session?: Session;
  course_offerings?: CourseOffering[];
  schedule_runs?: ScheduleRun[];
}

export interface CourseOffering {
  id: number;
  semester_offering_id: number;
  subject_id: number;
  weekly_required_slots: number;
  required_pattern?: string;
  is_lab: boolean;
  lab_group?: string;
  preferred_room_id?: number | null;
  requires_room: boolean;
  notes?: string;
  semester_offering?: SemesterOffering;
  subject?: Subject;
  preferred_room?: Room | null;
  teacher_assignments?: TeacherAssignment[];
  room_assignments?: RoomAssignment[];
  schedule_blocks?: ScheduleBlock[];
  schedule_entries?: ScheduleEntry[];
}

export interface TeacherAssignment {
  id: number;
  course_offering_id: number;
  teacher_id: number;
  weight: number;
  course_offering?: CourseOffering;
  teacher?: Teacher;
}

export interface RoomAssignment {
  id: number;
  course_offering_id: number;
  room_id: number;
  priority: number;
  course_offering?: CourseOffering;
  room?: Room;
}

export interface ScheduleRun {
  id: number;
  semester_offering_id: number;
  status: 'DRAFT' | 'COMMITTED' | 'CANCELLED' | 'FAILED';
  algorithm_version: string;
  generated_by_user_id?: number | null;
  generated_at: string;
  committed_at?: string | null;
  meta?: any;
  semester_offering?: SemesterOffering;
  schedule_blocks?: ScheduleBlock[];
  schedule_entries?: ScheduleEntry[];
}

export interface ScheduleBlock {
  id: number;
  schedule_run_id: number;
  course_offering_id: number;
  teacher_id: number;
  room_id: number;
  day_of_week: number;
  slot_start: number;
  slot_length: number;
  is_lab: boolean;
  lab_group?: string;
  schedule_run?: ScheduleRun;
  course_offering?: CourseOffering;
  teacher?: Teacher;
  room?: Room;
}

export interface ScheduleEntry {
  id: number;
  schedule_run_id: number;
  semester_offering_id: number;
  session_id: number;
  course_offering_id: number;
  teacher_id: number;
  room_id: number;
  day_of_week: number;
  slot_number: number;
  block_id: number;
  lab_group?: string;
  schedule_run?: ScheduleRun;
  semester_offering?: SemesterOffering;
  session?: Session;
  course_offering?: CourseOffering;
  teacher?: Teacher;
  room?: Room;
  block?: ScheduleBlock;
}

export interface TimeSlot {
  id: number;
  day_of_week: number;
  slot_number: number;
  start_time: string;
  end_time: string;
}

export interface RoutineGenerationRequest {
  semester_offering_id: number;
}

export interface RoutineGenerationResponse {
  schedule_run_id: number;
  report: {
    total_blocks: number;
    placed_blocks: number;
    unplaced_blocks: number;
    conflicts?: string[];
    suggestions?: string[];
  };
  schedule_entries: ScheduleEntry[];
}