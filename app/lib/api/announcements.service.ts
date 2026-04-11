import apiClient from './api-client';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: 'INFO' | 'IMPORTANT' | 'URGENT';
    targetScope: 'SYSTEM' | 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE' | 'INSTITUTION';
    targetId?: string;
    publishedAt?: string;
    expiresAt?: string;
    createdById: string;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string;
    };
    createdAt: string;
    updatedAt: string;
    isRead?: boolean;
    readAt?: string;
}

export interface CreateAnnouncementDto {
    title: string;
    content: string;
    priority: 'INFO' | 'IMPORTANT' | 'URGENT';
    targetScope: 'SYSTEM' | 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE' | 'INSTITUTION';
    targetId?: string;
    publishedAt?: string;
    expiresAt?: string;
}

export interface UpdateAnnouncementDto {
    title?: string;
    content?: string;
    priority?: 'INFO' | 'IMPORTANT' | 'URGENT';
    publishedAt?: string;
    expiresAt?: string;
}

export const announcementsService = {
    getAll: async (): Promise<Announcement[]> => {
        const response = await apiClient.get<Announcement[]>('announcements');
        return response.data;
    },

    getById: async (id: string): Promise<Announcement> => {
        const response = await apiClient.get<Announcement>(`announcements/${id}`);
        return response.data;
    },

    create: async (data: CreateAnnouncementDto): Promise<Announcement> => {
        const response = await apiClient.post<Announcement>('announcements', data);
        return response.data;
    },

    update: async (params: { id: string; data: UpdateAnnouncementDto }): Promise<Announcement> => {
        const response = await apiClient.patch<Announcement>(`announcements/${params.id}`, params.data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`announcements/${id}`);
    },

    markAsRead: async (id: string): Promise<void> => {
        await apiClient.post(`announcements/${id}/read`);
    },

    getUnreadCount: async (): Promise<{ unreadCount: number }> => {
        const response = await apiClient.get<{ unreadCount: number }>('announcements/unread-count');
        return response.data;
    },
};

export default announcementsService;
