export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const API_ENDPOINTS = {
  // Programmes
  programmes: {
    list: '/programmes',
    create: '/programmes',
    get: (id: number) => `/programmes/${id}`,
    update: (id: number) => `/programmes/${id}`,
    delete: (id: number) => `/programmes/${id}`,
    departments: (id: number) => `/programmes/${id}/departments`,
  },
  
  // Departments
  departments: {
    list: '/departments',
    create: '/departments',
    get: (id: number) => `/departments/${id}`,
    update: (id: number) => `/departments/${id}`,
    delete: (id: number) => `/departments/${id}`,
    byProgramme: (programmeId: number) => `/programmes/${programmeId}/departments`,
  },
  
  // Teachers
  teachers: {
    list: '/teachers',
    create: '/teachers',
    get: (id: number) => `/teachers/${id}`,
    update: (id: number) => `/teachers/${id}`,
    delete: (id: number) => `/teachers/${id}`,
    byDepartment: (departmentId: number) => `/departments/${departmentId}/teachers`,
  },
  
  // Subjects
  subjects: {
    list: '/subjects',
    create: '/subjects',
    get: (id: number) => `/subjects/${id}`,
    update: (id: number) => `/subjects/${id}`,
    delete: (id: number) => `/subjects/${id}`,
    byDepartment: (departmentId: number) => `/departments/${departmentId}/subjects`,
  },
  
  // Subject Types
  subjectTypes: {
    list: '/subject-types',
    create: '/subject-types',
    get: (id: number) => `/subject-types/${id}`,
    update: (id: number) => `/subject-types/${id}`,
    delete: (id: number) => `/subject-types/${id}`,
  },
  
  // Rooms
  rooms: {
    list: '/rooms',
    create: '/rooms',
    get: (id: number) => `/rooms/${id}`,
    update: (id: number) => `/rooms/${id}`,
    delete: (id: number) => `/rooms/${id}`,
  },
  
  // Sessions
  sessions: {
    list: '/sessions',
    create: '/sessions',
    get: (id: number) => `/sessions/${id}`,
    update: (id: number) => `/sessions/${id}`,
    delete: (id: number) => `/sessions/${id}`,
  },
  
  // Semester Offerings
  semesterOfferings: {
    list: '/semester-offerings',
    create: '/semester-offerings',
    get: (id: number) => `/semester-offerings/${id}`,
    update: (id: number) => `/semester-offerings/${id}`,
    delete: (id: number) => `/semester-offerings/${id}`,
    courseOfferings: (id: number) => `/semester-offerings/${id}/course-offerings`,
  },
  
  // Course Offerings
  courseOfferings: {
    list: '/course-offerings',
    create: '/course-offerings',
    get: (id: number) => `/course-offerings/${id}`,
    update: (id: number) => `/course-offerings/${id}`,
    delete: (id: number) => `/course-offerings/${id}`,
    assignTeacher: (id: number) => `/course-offerings/${id}/teachers`,
    removeTeacher: (id: number, teacherId: number) => `/course-offerings/${id}/teachers/${teacherId}`,
    assignRoom: (id: number) => `/course-offerings/${id}/rooms`,
    removeRoom: (id: number, roomId: number) => `/course-offerings/${id}/rooms/${roomId}`,
  },
  
  // Routines
  routines: {
    generate: '/routines/generate',
    get: (id: number) => `/routines/${id}`,
    bySemesterOffering: (id: number) => `/routines/semester-offering/${id}`,
    commit: (id: number) => `/routines/${id}/commit`,
    cancel: (id: number) => `/routines/${id}/cancel`,
    delete: (id: number) => `/routines/${id}`,
  },
  
  // Health
  health: '/health',
};