import apiClient from './api-client';

export const notificationsService = {
  getAll: async () => {
    const response = await apiClient.get('notifications');
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await apiClient.patch(`notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await apiClient.post('notifications/read-all');
    return response.data;
  },
  getUnreadCount: async () => {
    const response = await apiClient.get<{ unreadCount: number }>('notifications/unread-count');
    return response.data;
  },
};
