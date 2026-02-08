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
            // Redirect based on role
            // Since we have multiple roles, we take the primary one or checks
            const roleName = user.roles[0]?.name;

            if (roleName === 'SYSTEM_ADMIN') {
                router.push('/dashboard/admin');
            } else if (roleName === 'REGIONAL_ADMIN') {
                router.push('/dashboard/region');
            } else if (roleName === 'ZONE_ADMIN') {
                router.push('/dashboard/zone');
            } else if (roleName === 'WOREDA_ADMIN') {
                router.push('/dashboard/woreda');
            } else if (roleName === 'KEBELE_ADMIN') {
                router.push('/dashboard/kebele');
            } else if (roleName === 'INSTITUTION_ADMIN') {
                router.push('/dashboard/institution');
            } else if (roleName === 'REGISTRAR') {
                router.push('/dashboard/registrar');
            } else if (roleName === 'ACCOUNTANT') {
                router.push('/dashboard/accountant');
            } else if (roleName === 'INSTRUCTOR' || roleName === 'STUDENT') {
                router.push('/dashboard/academic');
            } else {
                router.push('/dashboard/dashboard');
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
