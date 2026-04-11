import apiClient from './api-client';

export interface Schedule {
    id: string;
    courseId: string;
    course: {
        id: string;
        name: string;
        code: string;
    };
    timeSlotId: string;
    timeSlot: {
        id: string;
        name: string;
        startTime: string;
        endTime: string;
    };
    roomId: string;
    room: {
        id: string;
        name: string;
    };
    periodId: string;
    day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    instructorId?: string;
    instructor?: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
    };
}

export interface CreateScheduleData {
    courseId: string;
    timeSlotId: string;
    roomId: string;
    periodId: string;
    day: string;
    instructorId?: string;
    institutionId: string;
}

export const schedulesService = {
    getAll: async (institutionId: string, filters?: { instructorId?: string; roomId?: string; periodId?: string }) => {
        let url = `/schedules/institution/${institutionId}`;
        const params = new URLSearchParams();
        if (filters?.instructorId) params.append('instructorId', filters.instructorId);
        if (filters?.roomId) params.append('roomId', filters.roomId);
        if (filters?.periodId) params.append('periodId', filters.periodId);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await apiClient.get<Schedule[]>(url);
        return response.data;
    },

    create: async (data: CreateScheduleData) => {
        const response = await apiClient.post<Schedule>('schedules', data);
        return response.data;
    },

    update: async (id: string, data: Partial<CreateScheduleData>) => {
        const response = await apiClient.patch<Schedule>(`schedules/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`schedules/${id}`);
    }
};

export const scheduleConfigService = {
    getRooms: async (institutionId: string) => {
        const response = await apiClient.get(`schedule-config/rooms/${institutionId}`);
        return response.data;
    },
    getPeriods: async (institutionId: string) => {
        const response = await apiClient.get(`schedule-config/periods/${institutionId}`);
        return response.data;
    },
    getTimeSlots: async (institutionId: string) => {
        const response = await apiClient.get(`schedule-config/timeslots/${institutionId}`);
        return response.data;
    },
    createPeriod: async (data: any) => {
        const response = await apiClient.post('schedule-config/periods', data);
        return response.data;
    },
    updatePeriod: async (id: string, data: any) => {
        const response = await apiClient.put(`schedule-config/periods/${id}`, data);
        return response.data;
    },
    deletePeriod: async (id: string) => {
        const response = await apiClient.delete(`schedule-config/periods/${id}`);
        return response.data;
    }
};

export default schedulesService;
