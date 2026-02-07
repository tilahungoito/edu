'use client';

import React, { useState, useEffect } from 'react';
import { Box, useTheme, CircularProgress, Container, Grid2 as Grid } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Sidebar, Header, Breadcrumbs } from '@/app/components/layout';
import { TenantProvider } from '@/app/lib/core';
import { useAuthStore } from '@/app/lib/store/auth-store';
import theme from '@/app/theme/theme';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return null; // Don't render anything while redirecting
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <TenantProvider>
                <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                    {/* Sidebar */}
                    <Sidebar
                        collapsed={sidebarCollapsed}
                        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />

                    {/* Main Content */}
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            backgroundColor: theme.palette.background.default,
                            minHeight: '100vh',
                            transition: theme.transitions.create(['margin', 'width'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                        }}
                    >
                        {/* Header */}
                        <Header sidebarCollapsed={sidebarCollapsed} />

                        {/* Page Content */}
                        <Box
                            sx={{
                                pt: 10, // Account for fixed header
                                px: 3,
                                pb: 3,
                            }}
                        >
                            <Breadcrumbs />
                            {children}
                        </Box>
                    </Box>
                </Box>
            </TenantProvider>
        </ThemeProvider>
    );
}
