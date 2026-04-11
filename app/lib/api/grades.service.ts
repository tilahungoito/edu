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

    getByCourse: async (courseId: string, semester?: string) => {
        const url = semester 
            ? `grades/course/${courseId}?semester=${encodeURIComponent(semester)}`
            : `grades/course/${courseId}`;
        const response = await apiClient.get<Grade[]>(url);
        return response.data;
    },

    getTranscript: async (studentId: string) => {
        const response = await apiClient.get<Transcript>(`grades/transcript/${studentId}`);
        return response.data;
    },

    getGradeBookStatus: async (courseId: string, semester?: string) => {
        const url = semester 
            ? `grades/course/${courseId}/gradebook?semester=${encodeURIComponent(semester)}`
            : `grades/course/${courseId}/gradebook`;
        const response = await apiClient.get<GradeBookRow[]>(url);
        return response.data;
    },

    submitForReview: async (courseId: string, semester: string, remarks?: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/submit?semester=${encodeURIComponent(semester)}`, { remarks });
        return response.data;
    },

    approveAndLock: async (courseId: string, semester: string, remarks?: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/approve?semester=${encodeURIComponent(semester)}`, { remarks });
        return response.data;
    },

    requestUnlock: async (courseId: string, reason: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/unlock-request`, { reason });
        return response.data;
    },

    unlockGradebook: async (courseId: string, semester: string, reason?: string) => {
        const response = await apiClient.post(`grades/course/${courseId}/unlock?semester=${encodeURIComponent(semester)}`, { reason });
        return response.data;
    },

    exportExcel: async (courseId: string, courseName?: string, semester?: string) => {
        const url = semester
            ? `grades/course/${courseId}/export/excel?semester=${encodeURIComponent(semester)}`
            : `grades/course/${courseId}/export/excel`;
        const response = await apiClient.get(url, {
            responseType: 'blob',
        });
        const blobUrl = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `gradebook-${courseName || courseId}${semester ? '-' + semester : ''}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
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

    exportPdf: async (courseId: string, courseName?: string, semester?: string) => {
        const url = semester
            ? `grades/course/${courseId}/export/pdf?semester=${encodeURIComponent(semester)}`
            : `grades/course/${courseId}/export/pdf`;
        const response = await apiClient.get(url, {
            responseType: 'blob',
        });
        const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `gradebook-${courseName || courseId}${semester ? '-' + semester : ''}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    },
};

export default gradesService;
