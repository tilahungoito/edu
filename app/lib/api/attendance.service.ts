import apiClient from './api-client';

export interface AttendanceRecord {
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    remarks?: string;
}

export interface MarkStudentAttendanceData {
    enrollmentId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    remarks?: string;
}

export interface MarkStaffAttendanceData {
    userId: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    remarks?: string;
}

export const attendanceService = {
    markStudent: async (data: MarkStudentAttendanceData) => {
        const response = await apiClient.post('/attendance/student', data);
        return response.data;
    },

    markStaff: async (data: MarkStaffAttendanceData) => {
        const response = await apiClient.post('/attendance/staff', data);
        return response.data;
    },

    getStudentHistory: async (enrollmentId: string) => {
        const response = await apiClient.get<AttendanceRecord[]>(`/attendance/student/${enrollmentId}`);
        return response.data;
    },

    getStaffHistory: async (userId: string) => {
        const response = await apiClient.get<AttendanceRecord[]>(`/attendance/staff/${userId}`);
        return response.data;
    },
};

export default attendanceService;
