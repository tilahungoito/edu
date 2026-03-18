import apiClient from './api-client';

export interface Grade {
    id: string;
    enrollmentId: string;
    score: number;
    grade: string;
    remark?: string;
    submittedAt: string;
}

export interface Transcript {
    studentId: string;
    studentName: string;
    results: {
        courseCode: string;
        courseName: string;
        grade: string;
        credits: number;
    }[];
    gpa: number;
}

export interface CreateGradeData {
    enrollmentId: string;
    score: number;
    grade: string;
    remark?: string;
}

// GRADEBOOK - status per enrollment row
export type GradeBookStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'LOCKED';

export interface GradeBookRow {
    id: string;
    enrollmentId: string;
    totalScore: number | null;
    letterGrade: string | null;
    gradePoints: number | null;
    status: GradeBookStatus;
    submittedAt: string | null;
    approvedAt: string | null;
    lockedAt: string | null;
    remarks: string | null;
    enrollment: {
        student: {
            user: { firstName: string; lastName: string; username: string; };
        };
    };
}

export const gradesService = {
    create: async (data: CreateGradeData) => {
        const response = await apiClient.post<Grade>('grades', data);
        return response.data;
    },

    getByCourse: async (courseId: string) => {
        const response = await apiClient.get<Grade[]>(`grades/course/${courseId}`);
        return response.data;
    },

    getTranscript: async (studentId: string) => {
        const response = await apiClient.get<Transcript>(`grades/transcript/${studentId}`);
        return response.data;
    },

    getGradeBookStatus: async (courseId: string) => {
        const response = await apiClient.get<GradeBookRow[]>(`grades/course/${courseId}/gradebook`);
        return response.data;
    },

    submitForReview: async (courseId: string, remarks?: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/submit`, { remarks });
        return response.data;
    },

    approveAndLock: async (courseId: string, remarks?: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/approve`, { remarks });
        return response.data;
    },

    exportExcel: async (courseId: string, courseName?: string) => {
        const response = await apiClient.get(`grades/course/${courseId}/export/excel`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradebook-${courseName || courseId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    downloadTranscriptPdf: async (studentId: string, studentName?: string) => {
        const response = await apiClient.get(`grades/transcript/${studentId}/pdf`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcript-${studentName || studentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    exportPdf: async (courseId: string, courseName?: string) => {
        const response = await apiClient.get(`grades/course/${courseId}/export/pdf`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradebook-${courseName || courseId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
};

export default gradesService;
