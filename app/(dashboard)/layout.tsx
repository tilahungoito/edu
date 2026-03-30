'use client';

import React, { useState, useEffect } from 'react';
import { Box, useTheme, CircularProgress, Container, Grid } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Sidebar, Header, Breadcrumbs } from '@/app/components/layout';
import { TenantProvider } from '@/app/lib/core';
import { useAuthStore } from '@/app/lib/store/auth-store';
import theme from '@/app/theme/theme';
import { useMediaQuery } from '@mui/material';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if initialization is complete and user is not authenticated
        if (isInitialized && !isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, isInitialized, router]);

    // Show loading while auth is initializing or loading
    if (!isInitialized || isLoading) {
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
                        onToggle={() => isMobile ? setMobileOpen(!mobileOpen) : setSidebarCollapsed(!sidebarCollapsed)}
                        variant={isMobile ? "temporary" : "permanent"}
                        open={isMobile ? mobileOpen : true}
                        onClose={() => setMobileOpen(false)}
                    />

                    {/* Main Content */}
                    <Box
                        component="main"
                        sx={{
                            flexGrow: 1,
                            width: { xs: '100%', md: `calc(100% - ${sidebarCollapsed ? 80 : 280}px)` },
                            backgroundColor: theme.palette.background.default,
                            minHeight: '100vh',
                            transition: theme.transitions.create(['margin', 'width'], {
                                easing: theme.transitions.easing.sharp,
                                duration: theme.transitions.duration.enteringScreen,
                            }),
                        }}
                    >
                        {/* Header */}
                        <Header
                            sidebarCollapsed={isMobile ? true : sidebarCollapsed}
                            onMenuClick={() => setMobileOpen(true)}
                        />

                        {/* Page Content */}
                        <Box
                            sx={{
                                pt: 10, // Account for fixed header
                                px: { xs: 2, sm: 3 },
                                pb: 3,
                                width: '100%',
                                overflowX: 'hidden' // Trap any internal leaks
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
