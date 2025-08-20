import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type SemesterOffering, type CourseOffering, type TeacherAssignment, type RoomAssignment } from '../types/models';

export interface CreateSemesterOfferingRequest {
  programme_id: number;
  department_id: number;
  session_id: number;
  semester_number: number;
  total_students?: number;
}

export interface UpdateSemesterOfferingRequest {
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  total_students?: number;
}

export interface CreateCourseOfferingRequest {
  subject_id: number;
  weekly_required_slots: number;
  required_pattern?: string;
  preferred_room_id?: number | null;
  requires_room?: boolean;
  teacher_ids?: number[];
  notes?: string;
}

export interface AssignTeacherRequest {
  teacher_id: number;
  weight?: number;
}

export interface AssignRoomRequest {
  room_id: number;
  priority?: number;
}

class SemesterOfferingService {
  async getAll(): Promise<SemesterOffering[]> {
    return apiClient.get<SemesterOffering[]>(API_ENDPOINTS.semesterOfferings.list);
  }

  async getById(id: number): Promise<SemesterOffering> {
    return apiClient.get<SemesterOffering>(API_ENDPOINTS.semesterOfferings.get(id));
  }

  async getBySession(sessionId: number): Promise<SemesterOffering[]> {
    return apiClient.get<SemesterOffering[]>(`/semester-offerings/session/${sessionId}`);
  }

  async create(data: CreateSemesterOfferingRequest): Promise<SemesterOffering> {
    return apiClient.post<SemesterOffering>(API_ENDPOINTS.semesterOfferings.create, data);
  }

  async update(id: number, data: UpdateSemesterOfferingRequest): Promise<SemesterOffering> {
    return apiClient.put<SemesterOffering>(API_ENDPOINTS.semesterOfferings.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.semesterOfferings.delete(id));
  }

  // Course Offering management
  async addCourseOffering(semesterOfferingId: number, data: CreateCourseOfferingRequest): Promise<CourseOffering> {
    return apiClient.post<CourseOffering>(
      `/semester-offerings/${semesterOfferingId}/course-offerings`,
      data
    );
  }

  async getCourseOfferings(semesterOfferingId: number): Promise<CourseOffering[]> {
    return apiClient.get<CourseOffering[]>(
      API_ENDPOINTS.semesterOfferings.courseOfferings(semesterOfferingId)
    );
  }

  async removeCourseOffering(semesterOfferingId: number, courseOfferingId: number): Promise<void> {
    return apiClient.delete(
      `/semester-offerings/${semesterOfferingId}/course-offerings/${courseOfferingId}`
    );
  }

  // Teacher Assignment management
  async assignTeacher(
    semesterOfferingId: number,
    courseOfferingId: number,
    data: AssignTeacherRequest
  ): Promise<TeacherAssignment> {
    return apiClient.post<TeacherAssignment>(
      `/semester-offerings/${semesterOfferingId}/course-offerings/${courseOfferingId}/teachers`,
      data
    );
  }

  async removeTeacher(
    semesterOfferingId: number,
    courseOfferingId: number,
    teacherId: number
  ): Promise<void> {
    return apiClient.delete(
      `/semester-offerings/${semesterOfferingId}/course-offerings/${courseOfferingId}/teachers/${teacherId}`
    );
  }

  // Room Assignment management
  async assignRoom(
    semesterOfferingId: number,
    courseOfferingId: number,
    data: AssignRoomRequest
  ): Promise<RoomAssignment> {
    return apiClient.post<RoomAssignment>(
      `/semester-offerings/${semesterOfferingId}/course-offerings/${courseOfferingId}/rooms`,
      data
    );
  }

  async removeRoom(
    semesterOfferingId: number,
    courseOfferingId: number,
    roomId: number
  ): Promise<void> {
    return apiClient.delete(
      `/semester-offerings/${semesterOfferingId}/course-offerings/${courseOfferingId}/rooms/${roomId}`
    );
  }
}

export const semesterOfferingService = new SemesterOfferingService();