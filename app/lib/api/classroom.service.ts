import apiClient from './api-client';

export interface BehaviorRecord {
    id: string;
    studentId: string;
    title: string;
    description: string;
    type: 'POSITIVE' | 'WARNING' | 'DISCIPLINARY' | 'CRITICAL' | 'COUNSELING' | 'OBSERVATION';
    date: string;
    isPrivate: boolean;
    recordedById: string;
    institutionId: string;
    createdAt: string;
    updatedAt: string;
    student?: {
        id: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            username: string;
        };
    };
}

export interface CreateBehaviorData {
    studentId: string;
    institutionId: string;
    title: string;
    description: string;
    type: 'POSITIVE' | 'WARNING' | 'DISCIPLINARY' | 'CRITICAL' | 'COUNSELING' | 'OBSERVATION';
    date?: string;
    isPrivate?: boolean;
}

export interface Assessment {
    id: string;
    title: string;
    type: string;
    maxScore: number;
    weight: number;
    date?: string;
    courseId: string;
    institutionId: string;
    _count?: { scores: number };
}

export interface AssessmentScore {
    id: string;
    assessmentId: string;
    enrollmentId: string;
    score: number;
    remarks?: string;
}

export interface BulkScoreData {
    scores: {
        enrollmentId: string;
        score: number;
        remarks?: string;
    }[];
}

export interface GradeBookRow {
    id: string;
    enrollmentId: string;
    totalScore: number | null;
    letterGrade: string | null;
    gradePoints: number | null;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'LOCKED';
    submittedAt: string | null;
}

export const classroomService = {
    // Behavior Records
    getBehaviorByStudent: async (studentId: string) => {
        const response = await apiClient.get<BehaviorRecord[]>(`/classroom/behavior/student/${studentId}`);
        return response.data;
    },

    getBehaviorByInstitution: async (institutionId: string, type?: string) => {
        let url = `/classroom/behavior/institution/${institutionId}`;
        if (type) url += `?type=${type}`;
        const response = await apiClient.get<BehaviorRecord[]>(url);
        return response.data;
    },

    createBehavior: async (data: CreateBehaviorData) => {
        const response = await apiClient.post<BehaviorRecord>('/classroom/behavior', data);
        return response.data;
    },

    updateBehavior: async (id: string, data: Partial<CreateBehaviorData>) => {
        const response = await apiClient.patch<BehaviorRecord>(`/classroom/behavior/${id}`, data);
        return response.data;
    },

    deleteBehavior: async (id: string) => {
        const response = await apiClient.delete(`/classroom/behavior/${id}`);
        return response.data;
    },

    // Assessments
    getAssessmentsByCourse: async (courseId: string) => {
        const response = await apiClient.get<Assessment[]>(`/classroom/assessments/course/${courseId}`);
        return response.data;
    },

    createAssessment: async (data: Partial<Assessment>) => {
        const response = await apiClient.post<Assessment>('/classroom/assessments', data);
        return response.data;
    },

    updateAssessment: async (id: string, data: Partial<Assessment>) => {
        const response = await apiClient.patch<Assessment>(`/classroom/assessments/${id}`, data);
        return response.data;
    },

    deleteAssessment: async (id: string) => {
        return apiClient.delete(`/classroom/assessments/${id}`);
    },

    // Scores
    getScoresByAssessment: async (assessmentId: string) => {
        const response = await apiClient.get<any[]>(`/classroom/assessments/${assessmentId}/scores`);
        return response.data;
    },

    bulkRecordScores: async (assessmentId: string, data: BulkScoreData) => {
        const response = await apiClient.post(`/classroom/assessments/${assessmentId}/scores/bulk`, data);
        return response.data;
    },

    // GradeBook / Grades Management
    getGradeBookStatus: async (courseId: string) => {
        const response = await apiClient.get<GradeBookRow[]>(`/grades/course/${courseId}/gradebook`);
        return response.data;
    },

    // Instructor Dashboard
    getInstructorDashboard: async () => {
        const response = await apiClient.get('/classroom/instructor/dashboard');
        return response.data;
    },

    getInstructorCourses: async () => {
        const response = await apiClient.get('/classroom/instructor/courses');
        return response.data;
    },

    getStudentsInCourse: async (courseId: string) => {
        const response = await apiClient.get(`/classroom/instructor/courses/${courseId}/students`);
        return response.data;
    }
};

export default classroomService;
