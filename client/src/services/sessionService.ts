import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Session } from '../types/models';

export interface CreateSessionRequest {
  name: 'SPRING' | 'FALL';
  academic_year: string;
  start_date: string;
  end_date: string;
}

export interface UpdateSessionRequest {
  name: 'SPRING' | 'FALL';
  start_date: string;
  end_date: string;
}

class SessionService {
  async getAll(): Promise<Session[]> {
    return apiClient.get<Session[]>(API_ENDPOINTS.sessions.list);
  }

  async getById(id: number): Promise<Session> {
    return apiClient.get<Session>(API_ENDPOINTS.sessions.get(id));
  }

  async getByYear(academicYear: string): Promise<Session[]> {
    return apiClient.get<Session[]>(`${API_ENDPOINTS.sessions.list}/year?academic_year=${academicYear}`);
  }

  async create(data: CreateSessionRequest): Promise<Session> {
    return apiClient.post<Session>(API_ENDPOINTS.sessions.create, data);
  }

  async update(id: number, data: UpdateSessionRequest): Promise<Session> {
    return apiClient.put<Session>(API_ENDPOINTS.sessions.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.sessions.delete(id));
  }
}

export const sessionService = new SessionService();