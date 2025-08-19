import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type ScheduleRun, type ScheduleSlot } from '../types/models';

export interface GenerateRoutineRequest {
  semester_offering_id: number;
  config?: {
    respect_teacher_preferences?: boolean;
    respect_room_preferences?: boolean;
    max_iterations?: number;
    temperature?: number;
  };
}

export interface CommitScheduleRequest {
  message?: string;
}

class RoutineService {
  async generateRoutine(data: GenerateRoutineRequest): Promise<ScheduleRun> {
    return apiClient.post<ScheduleRun>(API_ENDPOINTS.routines.generate, data);
  }

  async getScheduleRun(id: number): Promise<ScheduleRun> {
    return apiClient.get<ScheduleRun>(API_ENDPOINTS.routines.get(id));
  }

  async getScheduleRunsBySemesterOffering(semesterOfferingId: number): Promise<ScheduleRun[]> {
    return apiClient.get<ScheduleRun[]>(
      API_ENDPOINTS.routines.bySemesterOffering(semesterOfferingId)
    );
  }

  async commitSchedule(id: number, data?: CommitScheduleRequest): Promise<ScheduleRun> {
    return apiClient.post<ScheduleRun>(API_ENDPOINTS.routines.commit(id), data || {});
  }

  async cancelSchedule(id: number): Promise<void> {
    return apiClient.post(API_ENDPOINTS.routines.cancel(id), {});
  }

  async getScheduleSlots(scheduleRunId: number): Promise<ScheduleSlot[]> {
    return apiClient.get<ScheduleSlot[]>(`/routines/${scheduleRunId}/slots`);
  }

  // Helper method to format time slot
  formatTimeSlot(dayOfWeek: number, slotNumber: number): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const times = [
      '9:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-1:00',
      '2:00-3:00',
      '3:00-4:00',
      '4:00-5:00',
      '5:00-6:00'
    ];
    
    return `${days[dayOfWeek - 1]} ${times[slotNumber - 1]}`;
  }

  // Helper method to group slots by day
  groupSlotsByDay(slots: ScheduleSlot[]): Map<number, ScheduleSlot[]> {
    const grouped = new Map<number, ScheduleSlot[]>();
    
    for (const slot of slots) {
      if (!grouped.has(slot.day_of_week)) {
        grouped.set(slot.day_of_week, []);
      }
      grouped.get(slot.day_of_week)?.push(slot);
    }
    
    // Sort slots within each day by slot number
    grouped.forEach((daySlots) => {
      daySlots.sort((a, b) => a.slot_number - b.slot_number);
    });
    
    return grouped;
  }

  // Helper method to group slots by room
  groupSlotsByRoom(slots: ScheduleSlot[]): Map<number, ScheduleSlot[]> {
    const grouped = new Map<number, ScheduleSlot[]>();
    
    for (const slot of slots) {
      if (!grouped.has(slot.room_id)) {
        grouped.set(slot.room_id, []);
      }
      grouped.get(slot.room_id)?.push(slot);
    }
    
    // Sort slots within each room by day and slot
    grouped.forEach((roomSlots) => {
      roomSlots.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }
        return a.slot_number - b.slot_number;
      });
    });
    
    return grouped;
  }
}

export const routineService = new RoutineService();