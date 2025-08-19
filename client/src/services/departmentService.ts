import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Department } from '../types/models';

export interface CreateDepartmentRequest {
  name: string;
  strength: number;
  programme_id: number;
}

export interface UpdateDepartmentRequest {
  name: string;
  strength: number;
  is_active?: boolean;
}

class DepartmentService {
  async getAll(): Promise<Department[]> {
    return apiClient.get<Department[]>(API_ENDPOINTS.departments.list);
  }

  async getById(id: number): Promise<Department> {
    return apiClient.get<Department>(API_ENDPOINTS.departments.get(id));
  }

  async getByProgramme(programmeId: number): Promise<Department[]> {
    return apiClient.get<Department[]>(API_ENDPOINTS.departments.byProgramme(programmeId));
  }

  async create(data: CreateDepartmentRequest): Promise<Department> {
    return apiClient.post<Department>(API_ENDPOINTS.departments.create, data);
  }

  async update(id: number, data: UpdateDepartmentRequest): Promise<Department> {
    return apiClient.put<Department>(API_ENDPOINTS.departments.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.departments.delete(id));
  }
}

export const departmentService = new DepartmentService();