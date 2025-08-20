import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Teacher } from '../types/models';

export interface CreateTeacherRequest {
  name: string;
  initials: string;
  email: string;
  department_id: number;
}

export interface UpdateTeacherRequest {
  name: string;
  initials: string;
  email: string;
  department_id: number;
  is_active?: boolean;
}

class TeacherService {
  async getAll(): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(API_ENDPOINTS.teachers.list);
  }

  async getById(id: number): Promise<Teacher> {
    return apiClient.get<Teacher>(API_ENDPOINTS.teachers.get(id));
  }

  async getByDepartment(departmentId: number): Promise<Teacher[]> {
    return apiClient.get<Teacher[]>(API_ENDPOINTS.teachers.byDepartment(departmentId));
  }

  async create(data: CreateTeacherRequest): Promise<Teacher> {
    return apiClient.post<Teacher>(API_ENDPOINTS.teachers.create, data);
  }

  async update(id: number, data: UpdateTeacherRequest): Promise<Teacher> {
    return apiClient.put<Teacher>(API_ENDPOINTS.teachers.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.teachers.delete(id));
  }
}

export const teacherService = new TeacherService();