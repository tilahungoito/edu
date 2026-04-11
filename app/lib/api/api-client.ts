import axios, { AxiosInstance, AxiosError } from 'axios';
import { Permission } from '../types/permissions';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000/api/v1').replace(/\/$/, '') + '/';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and data unwrapping
apiClient.interceptors.response.use(
    (response) => {
        // Automatically unwrap standardized responses: { success: true, data: ... }
        if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
            return {
                ...response,
                data: response.data.data
            };
        }
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data as { message?: string };

            switch (status) {
                case 401:
                    // Unauthorized - clear stored auth data and redirect to login
                    sessionStorage.removeItem('access_token');
                    document.cookie = 'access_token=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
                    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                        window.location.href = '/login?expired=true';
                    }
                    throw new Error(data.message || 'Session expired. Please login again.');
                case 403:
                    throw new Error(data.message || 'Access denied. You do not have permission to perform this action.');
                case 404:
                    throw new Error('Resource not found.');
                case 500:
                    throw new Error('Server error. Please try again later.');
                default:
                    throw new Error(data.message || 'An error occurred. Please try again.');
            }
        } else if (error.request) {
            // Request made but no response received
            throw new Error('Unable to connect to server. Please check your connection.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred.');
        }
    }
);

// Auth API endpoints
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
        scopeType: string;
        scopeId: string | null;
        permissions: Permission[];
    };
}

export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: {
        id: string;
        name: string;
    };
    scopeType: string;
    scopeId: string | null;
    profilePicture?: string;
    isActive: boolean;
}

export const authApi = {
    // Login user
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('auth/login', credentials);
        return response.data;
    },

    // Get current user profile
    getMe: async (): Promise<User> => {
        const response = await apiClient.get<User>('auth/me');
        return response.data;
    },

    // Register user (if needed)
    register: async (data: {
        email: string;
        username: string;
        password: string;
        phone: string;
        roleName: string;
        scopeType?: string;
        scopeId?: string;
    }) => {
        const response = await apiClient.post('auth/register', data);
        return response.data;
    },

    // Logout user
    logout: async (): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>('auth/logout');
        return response.data;
    },
};

export default apiClient;
