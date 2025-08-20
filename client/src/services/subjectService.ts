import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Subject, type SubjectType } from '../types/models';

export interface CreateSubjectRequest {
  name: string;
  code: string;
  credit: number;
  class_load_per_week: number;
  programme_id: number;
  department_id: number;
  subject_type_id: number;
}

export interface UpdateSubjectRequest {
  name: string;
  code: string;
  credit: number;
  class_load_per_week: number;
  is_active?: boolean;
}

export interface CreateSubjectTypeRequest {
  name: string;
  is_lab: boolean;
  default_consecutive_preferred: boolean;
}

export interface UpdateSubjectTypeRequest {
  name: string;
  is_lab: boolean;
  default_consecutive_preferred: boolean;
}

class SubjectService {
  async getAll(): Promise<Subject[]> {
    return apiClient.get<Subject[]>(API_ENDPOINTS.subjects.list);
  }

  async getById(id: number): Promise<Subject> {
    return apiClient.get<Subject>(API_ENDPOINTS.subjects.get(id));
  }

  async getByDepartment(departmentId: number): Promise<Subject[]> {
    return apiClient.get<Subject[]>(API_ENDPOINTS.subjects.byDepartment(departmentId));
  }

  async create(data: CreateSubjectRequest): Promise<Subject> {
    return apiClient.post<Subject>(API_ENDPOINTS.subjects.create, data);
  }

  async update(id: number, data: UpdateSubjectRequest): Promise<Subject> {
    return apiClient.put<Subject>(API_ENDPOINTS.subjects.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.subjects.delete(id));
  }

  // Subject Types
  async getSubjectTypes(): Promise<SubjectType[]> {
    return apiClient.get<SubjectType[]>(API_ENDPOINTS.subjectTypes.list);
  }

  async createSubjectType(data: CreateSubjectTypeRequest): Promise<SubjectType> {
    return apiClient.post<SubjectType>(API_ENDPOINTS.subjectTypes.create, data);
  }

  async updateSubjectType(id: number, data: UpdateSubjectTypeRequest): Promise<SubjectType> {
    return apiClient.put<SubjectType>(API_ENDPOINTS.subjectTypes.update(id), data);
  }

  async deleteSubjectType(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.subjectTypes.delete(id));
  }
}

export const subjectService = new SubjectService();