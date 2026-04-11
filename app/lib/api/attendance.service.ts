import apiClient from './api-client';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecord {
    id: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
    enrollmentId?: string;
    userId?: string;
    recordedById: string;
}

export interface AttendanceRow {
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

export interface MarkAttendanceDto {
    enrollmentId?: string;
    userId?: string;
    date: string;
    status: AttendanceStatus;
    remarks?: string;
}

export interface BulkMarkAttendanceDto {
    records: MarkAttendanceDto[];
}

export const attendanceService = {
    /**
     * Mark attendance for a single student.
     */
    markStudent: async (dto: MarkAttendanceDto): Promise<AttendanceRecord> => {
        const response = await apiClient.post<AttendanceRecord>('attendance/student', dto);
        return response.data;
    },

    /**
     * Mark attendance for multiple students (usually for a whole section).
     */
    markBulkStudent: async (dto: BulkMarkAttendanceDto): Promise<AttendanceRecord[]> => {
        const response = await apiClient.post<AttendanceRecord[]>('attendance/student/bulk', dto);
        return response.data;
    },

    /**
     * Mark attendance for a staff member.
     */
    markStaff: async (dto: MarkAttendanceDto): Promise<AttendanceRecord> => {
        const response = await apiClient.post<AttendanceRecord>('attendance/staff', dto);
        return response.data;
    },

    /**
     * Get attendance history for a specific student enrollment.
     */
    getStudentHistory: async (enrollmentId: string): Promise<AttendanceRecord[]> => {
        const response = await apiClient.get<AttendanceRecord[]>(`attendance/student/${enrollmentId}`);
        return response.data;
    },

    /**
     * Get attendance history for a specific staff member.
     */
    getStaffHistory: async (userId: string): Promise<AttendanceRecord[]> => {
        const response = await apiClient.get<AttendanceRecord[]>(`attendance/staff/${userId}`);
        return response.data;
    },

    /**
     * Get the current attendance sheet for a course on a specific date.
     */
    getCourseAttendance: async (courseId: string, date?: string, semester?: string): Promise<AttendanceRow[]> => {
        const params: any = { params: {} };
        if (date) params.params.date = date;
        if (semester) params.params.semester = semester;
        const response = await apiClient.get<AttendanceRow[]>(`attendance/course/${courseId}`, params);
        return response.data;
    },

    /**
     * Get attendance analytics and trends for a specific course.
     */
    getCourseAnalysis: async (courseId: string, semester?: string): Promise<AttendanceAnalysis> => {
        const url = semester 
            ? `attendance/course/${courseId}/analysis?semester=${encodeURIComponent(semester)}`
            : `attendance/course/${courseId}/analysis`;
        const response = await apiClient.get<AttendanceAnalysis>(url);
        return response.data;
    },
};

export default attendanceService;
