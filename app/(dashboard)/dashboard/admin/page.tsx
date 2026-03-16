'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    Public as RegionIcon,
    PeopleAlt as UsersIcon,
    AdminPanelSettings as RolesIcon,
    Settings as SettingsIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { UserDialog } from '@/app/components/management/UserDialog';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStats } from '@/app/lib/api/dashboard.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { systemHealthService } from '@/app/lib/api/system-health.service';
import { CircularProgress, Alert } from '@mui/material';

export default function SystemAdminDashboard() {
    const { user } = useAuthStore();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);

    // Fetch System Stats
    const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
        queryKey: ['dashboard', 'system-stats'],
        queryFn: () => dashboardService.getStats() as Promise<DashboardStats>,
    });

    // Fetch Regions for distribution data
    const { data: regions, isLoading: regionsLoading } = useQuery({
        queryKey: ['regions', 'all'],
        queryFn: () => regionsService.getAll(),
    });

    // Fetch System Health for uptime
    const { data: health } = useQuery({
        queryKey: ['system', 'health'],
        queryFn: () => systemHealthService.getHealth(),
        refetchInterval: 30000, // Refresh every 30s
    });

    if (statsLoading || regionsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (statsError) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                Error loading dashboard statistics. Please try again later.
            </Alert>
        );
    }

    const kpis = [
        {
            label: 'Active Regions',
            value: regions?.length || 0,
            icon: 'Public',
            trend: 'stable'
        },
        {
            label: 'Total Active Users',
            value: stats?.usersByRole.reduce((acc, curr) => acc + curr._count, 0) || 0,
            icon: 'PeopleAlt',
            trend: 'up',
            change: 0 // We don't have historical data in the basic endpoint
        },
        {
            label: 'System Uptime',
            value: health ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '99.9%',
            icon: 'Storage',
            trend: 'stable'
        },
        {
            label: 'Institutions',
            value: stats?.institutions || 0,
            icon: 'Business',
            trend: 'stable',
        }
    ];

    const distributionData = regions?.map(r => ({
        name: r.name,
        institutions: r.totalSchools || 0,
        users: r.totalStudents || 0 // Using totalStudents as a proxy for 'users' in the chart
    })) || [];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    System Administration
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Global overview of the Tigray EDU platform. Logged in as: {user?.firstName} (Super Admin)
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis as any} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Regional Institutional Distribution"
                        subtitle="Institutions and students by region"
                        data={distributionData}
                        type="bar"
                        dataKeys={['institutions', 'users']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>System Controls</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5 }}
                            onClick={() => window.location.href = '/dashboard/management/regions'}
                        >
                            Manage Regions
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<UsersIcon />}
                            onClick={() => setOpenUserDialog(true)}
                            sx={{ py: 1.5 }}
                        >
                            Create Regional Admin
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<RolesIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Roles & Permissions
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<SettingsIcon />}
                            sx={{ py: 1.5 }}
                        >
                            System Configuration
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => {
                    console.log('User created');
                }}
            />
        </Box>
    );
}
