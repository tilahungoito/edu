import apiClient from './api-client';

export interface Payment {
    id: string;
    studentId: string;
    institutionId: string;
    amount: number;
    currency: string;
    status: string;
    paymentMethod: string;
    reference: string;
    createdAt: string;
}

export interface FinancialReport {
    totalRevenue: number;
    paymentCount: number;
    pendingAmount: number;
    monthlyStats: {
        month: string;
        amount: number;
    }[];
}

export interface CreatePaymentData {
    studentId: string;
    institutionId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    reference: string;
}

export const paymentsService = {
    create: async (data: CreatePaymentData) => {
        const response = await apiClient.post<Payment>('/payments', data);
        return response.data;
    },

    getInstitutionPayments: async (institutionId: string) => {
        const response = await apiClient.get<Payment[]>(`/payments/institution/${institutionId}`);
        return response.data;
    },

    getFinancialReport: async (institutionId: string) => {
        const response = await apiClient.get<FinancialReport>(`/payments/report/${institutionId}`);
        return response.data;
    },

    getStudentPayments: async (studentId: string) => {
        const response = await apiClient.get<Payment[]>(`/payments/student/${studentId}`);
        return response.data;
    },
};

export default paymentsService;
