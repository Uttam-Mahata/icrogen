import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/api';
import { type ScheduleRun, type ScheduleEntry, type ScheduleBlock } from '../types/models';

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
    // Routine generation can take a long time due to complex calculations
    // Increase timeout to 5 minutes (300000ms)
    return apiClient.post<ScheduleRun>(API_ENDPOINTS.routines.generate, data, {
      timeout: 300000
    });
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

  async deleteSchedule(id: number): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.routines.delete(id));
  }

  async getScheduleEntries(scheduleRunId: number): Promise<ScheduleEntry[]> {
    const run = await this.getScheduleRun(scheduleRunId);
    return run.schedule_entries || [];
  }

  // Helper method to format time slot
  formatTimeSlot(dayOfWeek: number, slotNumber: number): string {
    const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Slots 1-4: Morning classes, Lunch break 12:40-13:50, Slots 5-7: Afternoon classes
    const times = [
      '',
      '09:00-09:55',  // Slot 1
      '09:55-10:50',  // Slot 2
      '10:50-11:45',  // Slot 3
      '11:45-12:40',  // Slot 4
      '13:50-14:45',  // Slot 5
      '14:45-15:40',  // Slot 6
      '15:40-16:35',  // Slot 7
    ];
    
    return `${days[dayOfWeek] || ''} ${times[slotNumber] || ''}`;
  }

  // Helper method to group entries by day
  groupEntriesByDay(entries: ScheduleEntry[]): Map<number, ScheduleEntry[]> {
    const grouped = new Map<number, ScheduleEntry[]>();
    
    for (const entry of entries) {
      if (!grouped.has(entry.day_of_week)) {
        grouped.set(entry.day_of_week, []);
      }
      grouped.get(entry.day_of_week)?.push(entry);
    }
    
    // Sort entries within each day by slot number
    grouped.forEach((dayEntries) => {
      dayEntries.sort((a, b) => a.slot_number - b.slot_number);
    });
    
    return grouped;
  }

  // Helper method to group entries by room
  groupEntriesByRoom(entries: ScheduleEntry[]): Map<number, ScheduleEntry[]> {
    const grouped = new Map<number, ScheduleEntry[]>();
    
    for (const entry of entries) {
      if (!grouped.has(entry.room_id)) {
        grouped.set(entry.room_id, []);
      }
      grouped.get(entry.room_id)?.push(entry);
    }
    
    // Sort entries within each room by day and slot
    grouped.forEach((roomEntries) => {
      roomEntries.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week;
        }
        return a.slot_number - b.slot_number;
      });
    });
    
    return grouped;
  }

  // Helper method to group entries by teacher
  groupEntriesByTeacher(entries: ScheduleEntry[]): Map<number, ScheduleEntry[]> {
    const grouped = new Map<number, ScheduleEntry[]>();
    
    for (const entry of entries) {
      if (!grouped.has(entry.teacher_id)) {
        grouped.set(entry.teacher_id, []);
      }
      grouped.get(entry.teacher_id)?.push(entry);
    }
    
    // Sort entries within each teacher by day and slot
    grouped.forEach((teacherEntries) => {
      teacherEntries.sort((a, b) => {
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