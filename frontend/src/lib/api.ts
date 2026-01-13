import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Send cookies with requests
        });

        // Request interceptor (cookies are sent automatically)
        this.client.interceptors.request.use(
            (config) => {
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Handle unauthorized - redirect to login
                    this.handleUnauthorized();
                }
                return Promise.reject(error);
            }
        );
    }

    private handleUnauthorized(): void {
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
    }

    // Generic request methods
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.post(url, data, config);
        return response.data;
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.put(url, data, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.patch(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.delete(url, config);
        return response.data;
    }

    // Upload files
    async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            },
        };

        return this.post<T>(url, formData, config);
    }
}

// Export singleton instance
const api = new ApiClient();
export const apiClient = api;

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
    },

    // Users
    USERS: {
        PROFILE: '/api/users/profile',
        UPDATE_PROFILE: '/api/users/profile',
        GET_BY_ID: (userId: string) => `/api/users/${userId}`,
    },

    // Classes
    CLASSES: {
        CREATE: '/api/classes',
        LIST: (teacherId: string) => `/api/classes/teacher/${teacherId}`,
        GET: (classId: string) => `/api/classes/${classId}`,
        UPDATE: (classId: string) => `/api/classes/${classId}`,
        DELETE: (classId: string) => `/api/classes/${classId}`,
        ADD_STUDENTS: (classId: string) => `/api/classes/${classId}/students`,
        REMOVE_STUDENT: (classId: string, studentId: string) => `/api/classes/${classId}/students/${studentId}`,
    },

    // Quizzes
    QUIZZES: {
        CREATE: '/api/quizzes',
        LIST: (teacherId: string) => `/api/quizzes/teacher/${teacherId}`,
        GET: (quizId: string) => `/api/quizzes/${quizId}`,
        UPDATE: (quizId: string) => `/api/quizzes/${quizId}`,
        DELETE: (quizId: string) => `/api/quizzes/${quizId}`,
        DUPLICATE: (quizId: string) => `/api/quizzes/${quizId}/duplicate`,
    },

    // Game Sessions
    GAMES: {
        CREATE: '/api/games',
        GET: (sessionId: string) => `/api/games/${sessionId}`,
        RESULTS: (sessionId: string) => `/api/games/${sessionId}/results`,
        USER_RESULTS: (sessionId: string, userId: string) => `/api/games/${sessionId}/results/${userId}`,
        EXPORT: (sessionId: string) => `/api/games/${sessionId}/export`,
    },

    // Quiz Attempts
    ATTEMPTS: {
        CREATE: '/api/quiz-attempts',
        GET: (attemptId: string) => `/api/quiz-attempts/${attemptId}`,
        SAVE_PROGRESS: (attemptId: string) => `/api/quiz-attempts/${attemptId}`,
        SUBMIT: (attemptId: string) => `/api/quiz-attempts/${attemptId}/submit`,
        GRADE: (attemptId: string) => `/api/quiz-attempts/${attemptId}/grade`,
    },

    // Student
    STUDENTS: {
        QUIZZES: (studentId: string) => `/api/students/${studentId}/quizzes`,
        ATTEMPTS: (studentId: string) => `/api/students/${studentId}/attempts`,
        STATS: (studentId: string) => `/api/students/${studentId}/stats`,
        JOIN_GAME: '/api/students/join-game',
    },

    // Parent-Child
    PARENT_CHILD: {
        REQUEST: '/api/parent-child/request',
        REQUESTS: (userId: string) => `/api/parent-child/requests/${userId}`,
        APPROVE: (linkId: string) => `/api/parent-child/requests/${linkId}/approve`,
        REJECT: (linkId: string) => `/api/parent-child/requests/${linkId}/reject`,
        REMOVE: (linkId: string) => `/api/parent-child/${linkId}`,
        CHILDREN: (parentId: string) => `/api/parent-child/children/${parentId}`,
        PARENTS: (childId: string) => `/api/parent-child/parents/${childId}`,
    },

    // Parent
    PARENTS: {
        CHILDREN: (parentId: string) => `/api/parents/${parentId}/children`,
        CHILD_STATS: (parentId: string, childId: string) => `/api/parents/${parentId}/children/${childId}/stats`,
        CHILD_ATTEMPTS: (parentId: string, childId: string) => `/api/parents/${parentId}/children/${childId}/attempts`,
        CHILD_REPORT: (parentId: string, childId: string) => `/api/parents/${parentId}/children/${childId}/report`,
        SUBSCRIBE_ALERTS: (parentId: string) => `/api/parents/${parentId}/alerts/subscribe`,
    },

    // Analytics
    ANALYTICS: {
        CLASS: (classId: string) => `/api/analytics/class/${classId}`,
        QUIZ: (quizId: string) => `/api/analytics/quiz/${quizId}`,
        STUDENT: (studentId: string) => `/api/analytics/student/${studentId}`,
        CUSTOM_REPORT: '/api/analytics/custom-report',
    },

    // Gamification
    GAMIFICATION: {
        ACHIEVEMENTS: (userId: string) => `/api/gamification/achievements/${userId}`,
        UNLOCK: '/api/gamification/achievements/unlock',
        LEADERBOARD: (classId: string) => `/api/gamification/leaderboard/${classId}`,
        STREAKS: (userId: string) => `/api/gamification/streaks/${userId}`,
    },

    // Upload
    UPLOAD: {
        IMAGE: '/api/upload/image',
        AVATAR: '/api/upload/avatar',
    },
};

// Export default instance
export default api;
