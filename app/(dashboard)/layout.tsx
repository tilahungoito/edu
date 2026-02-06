'use client';

import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Sidebar, Header, Breadcrumbs } from '@/app/components/layout';
import { TenantProvider } from '@/app/lib/core';
import theme from '@/app/theme/theme';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const drawerWidth = sidebarCollapsed ? 72 : 280;

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
