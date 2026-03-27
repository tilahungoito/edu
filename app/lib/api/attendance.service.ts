import apiClient from './api-client';

export interface AttendanceRecord {
    id: string;
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    remarks?: string;
    enrollmentId?: string;
}

export interface CourseAttendanceRow {
    enrollmentId: string;
    studentId: string;
    student: {
        id: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            username: string;
        };
    };
    latestAttendance: AttendanceRecord | null;
}

export interface AttendanceAnalysis {
    totalStudents: number;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    presentRate: number;
    trend: { date: string; present: number; absent: number; late: number }[];
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
        const response = await apiClient.post('attendance/student', data);
        return response.data;
    },

    markBulkStudent: async (data: { records: MarkStudentAttendanceData[] }) => {
        const response = await apiClient.post('attendance/student/bulk', data);
        return response.data;
    },

    markStaff: async (data: MarkStaffAttendanceData) => {
        const response = await apiClient.post('attendance/staff', data);
        return response.data;
    },

    getStudentHistory: async (enrollmentId: string) => {
        const response = await apiClient.get<AttendanceRecord[]>(`attendance/student/${enrollmentId}`);
        return response.data;
    },

    getStaffHistory: async (userId: string) => {
        const response = await apiClient.get<AttendanceRecord[]>(`attendance/staff/${userId}`);
        return response.data;
    },

    getCourseAttendance: async (courseId: string, date?: string) => {
        const params = date ? { params: { date } } : {};
        const response = await apiClient.get<CourseAttendanceRow[]>(`attendance/course/${courseId}`, params);
        return response.data;
    },

    getCourseAnalysis: async (courseId: string) => {
        const response = await apiClient.get<AttendanceAnalysis>(`attendance/course/${courseId}/analysis`);
        return response.data;
    },
};

export default attendanceService;
