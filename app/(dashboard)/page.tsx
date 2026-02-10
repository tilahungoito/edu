'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function DashboardRedirect() {
    const { user, isAuthenticated, isLoading, isInitialized } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Only process redirects after initialization is complete
        if (!isInitialized) return;

        if (!isLoading && isAuthenticated && user) {
            // Redirect based on roles
            const roles = user.roles.map(r => r.name);
            console.log('[Dashboard Redirect] User roles:', roles);
            console.log('[Dashboard Redirect] User object:', user);

            if (roles.includes('SYSTEM_ADMIN')) {
                router.push('/dashboard/admin');
            } else if (roles.includes('REGIONAL_ADMIN')) {
                router.push('/dashboard/region');
            } else if (roles.includes('ZONE_ADMIN')) {
                router.push('/dashboard/zone');
            } else if (roles.includes('WOREDA_ADMIN')) {
                router.push('/dashboard/woreda');
            } else if (roles.includes('KEBELE_ADMIN')) {
                router.push('/dashboard/kebele');
            } else if (roles.includes('REGISTRAR')) {
                router.push('/dashboard/registrar');
            } else if (roles.includes('INSTITUTION_ADMIN')) {
                router.push('/dashboard/institution');
            } else if (roles.includes('ACCOUNTANT')) {
                router.push('/dashboard/accountant');
            } else if (roles.includes('INSTRUCTOR')) {
                router.push('/dashboard/teacher');
            } else if (roles.includes('STUDENT')) {
                router.push('/dashboard/student');
            } else {
                router.push('/dashboard');
            }
        } else if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [user, isAuthenticated, isLoading, isInitialized, router]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography color="text.secondary">Redirecting to your dashboard...</Typography>
        </Box>
    );
}
