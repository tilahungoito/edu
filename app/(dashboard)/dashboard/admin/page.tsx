'use client';

import React from 'react';
import { Box, Typography, Grid2 as Grid, Button } from '@mui/material';
import {
    Public as RegionIcon,
    PeopleAlt as UsersIcon,
    AdminPanelSettings as RolesIcon,
    Settings as SettingsIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';
import { UserDialog } from '@/app/components/management/UserDialog';

export default function SystemAdminDashboard() {
    const { user } = useAuthStore();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);

    const kpis: KPIData[] = [
        {
            label: 'Active Regions',
            value: 6,
            icon: 'Public',
            trend: 'stable'
        },
        {
            label: 'Total Active Users',
            value: 1240,
            icon: 'PeopleAlt',
            trend: 'up',
            change: 45
        },
        {
            label: 'System Uptime',
            value: '99.9%',
            icon: 'Storage',
            trend: 'stable'
        },
        {
            label: 'Pending Requests',
            value: 12,
            icon: 'NotificationsActive',
            trend: 'down',
            change: -2
        }
    ];

    const distributionData = [
        { name: 'Mekelle', institutions: 120, users: 450 },
        { name: 'Adigrat', institutions: 85, users: 320 },
        { name: 'Axum', institutions: 75, users: 280 },
        { name: 'Shire', institutions: 60, users: 210 },
        { name: 'Wukro', institutions: 45, users: 150 },
    ];

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
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Institutional Distribution"
                        subtitle="Institutions and users by region"
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
                        >
                            Create New Region
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
                    // Refresh data if needed
                }}
            />
        </Box>
    );
}
