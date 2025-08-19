import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Programme } from '../types/models';

export interface CreateProgrammeRequest {
  name: string;
  duration_years: number;
  total_semesters: number;
}

export interface UpdateProgrammeRequest {
  name: string;
  duration_years: number;
  total_semesters: number;
  is_active?: boolean;
}

class ProgrammeService {
  async getAll(): Promise<Programme[]> {
    return apiClient.get<Programme[]>(API_ENDPOINTS.programmes.list);
  }

  async getById(id: number): Promise<Programme> {
    return apiClient.get<Programme>(API_ENDPOINTS.programmes.get(id));
  }

  async create(data: CreateProgrammeRequest): Promise<Programme> {
    return apiClient.post<Programme>(API_ENDPOINTS.programmes.create, data);
  }

  async update(id: number, data: UpdateProgrammeRequest): Promise<Programme> {
    return apiClient.put<Programme>(API_ENDPOINTS.programmes.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.programmes.delete(id));
  }

  async getDepartments(id: number): Promise<Programme> {
    return apiClient.get<Programme>(API_ENDPOINTS.programmes.departments(id));
  }
}

export const programmeService = new ProgrammeService();