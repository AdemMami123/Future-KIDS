import api from './api';

export interface Class {
  classId: string;
  name: string;
  grade: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  createdAt: any;
  updatedAt: any;
}

export interface ClassWithStudents extends Class {
  students: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    grade?: string;
  }[];
}

export interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  totalQuizzes: number;
  activeGames: number;
}

/**
 * Create a new class
 */
export const createClass = async (data: {
  name: string;
  grade: string;
  subject: string;
}): Promise<Class> => {
  const response = await api.post('/classes', data);
  return response.data.data;
};

/**
 * Get all classes for the current teacher
 */
export const getTeacherClasses = async (teacherId: string): Promise<Class[]> => {
  const response = await api.get(`/classes/teacher/${teacherId}`);
  return response.data.data || response.data;
};

/**
 * Get teacher statistics
 */
export const getTeacherStats = async (): Promise<TeacherStats> => {
  const response = await api.get('/classes/stats');
  return response.data.data || response.data;
};

/**
 * Get class by ID
 */
export const getClassById = async (classId: string): Promise<Class> => {
  const response = await api.get(`/classes/${classId}`);
  return response.data.data;
};

/**
 * Get class with student details
 */
export const getClassWithStudents = async (classId: string): Promise<ClassWithStudents> => {
  const response = await api.get(`/classes/${classId}/students`);
  return response.data.data || response.data;
};

/**
 * Update class
 */
export const updateClass = async (
  classId: string,
  data: {
    name?: string;
    grade?: string;
    subject?: string;
  }
): Promise<Class> => {
  const response = await api.patch(`/classes/${classId}`, data);
  return response.data.data || response.data;
};

/**
 * Delete class
 */
export const deleteClass = async (classId: string): Promise<void> => {
  await api.delete(`/classes/${classId}`);
};

/**
 * Add student to class
 */
export const addStudentToClass = async (
  classId: string,
  studentId: string
): Promise<void> => {
  await api.post(`/classes/${classId}/students`, { studentId });
};

/**
 * Remove student from class
 */
export const removeStudentFromClass = async (
  classId: string,
  studentId: string
): Promise<void> => {
  await api.delete(`/classes/${classId}/students/${studentId}`);
};
