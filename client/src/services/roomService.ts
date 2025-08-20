import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type Room } from '../types/models';

export interface CreateRoomRequest {
  name: string;
  room_number: string;
  capacity: number;
  type: 'THEORY' | 'LAB' | 'OTHER';
  department_id?: number | null;
}

export interface UpdateRoomRequest {
  name: string;
  room_number: string;
  capacity: number;
  type: 'THEORY' | 'LAB' | 'OTHER';
  department_id?: number | null;
  is_active: boolean;
}

class RoomService {
  async getAll(): Promise<Room[]> {
    return apiClient.get<Room[]>(API_ENDPOINTS.rooms.list);
  }

  async getById(id: number): Promise<Room> {
    return apiClient.get<Room>(API_ENDPOINTS.rooms.get(id));
  }

  async getByType(type: 'THEORY' | 'LAB' | 'OTHER'): Promise<Room[]> {
    return apiClient.get<Room[]>(`${API_ENDPOINTS.rooms.list}/type?type=${type}`);
  }

  async getByDepartment(departmentId: number): Promise<Room[]> {
    return apiClient.get<Room[]>(`${API_ENDPOINTS.rooms.list}/department/${departmentId}`);
  }

  async create(data: CreateRoomRequest): Promise<Room> {
    return apiClient.post<Room>(API_ENDPOINTS.rooms.create, data);
  }

  async update(id: number, data: UpdateRoomRequest): Promise<Room> {
    return apiClient.put<Room>(API_ENDPOINTS.rooms.update(id), data);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.rooms.delete(id));
  }

  async checkAvailability(
    roomId: number,
    sessionId: number,
    dayOfWeek: number,
    slotNumber: number
  ): Promise<{ available: boolean }> {
    const params = new URLSearchParams({
      room_id: roomId.toString(),
      session_id: sessionId.toString(),
      day_of_week: dayOfWeek.toString(),
      slot_number: slotNumber.toString(),
    });
    return apiClient.get<{ available: boolean }>(`${API_ENDPOINTS.rooms.list}/availability?${params}`);
  }
}

export const roomService = new RoomService();