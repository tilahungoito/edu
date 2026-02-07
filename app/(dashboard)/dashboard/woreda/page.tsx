'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    School as SchoolIcon,
    People as PeopleIcon,
    Add as AddIcon,
    BarChart as StatsIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';

export default function WoredaAdminDashboard() {
    const { user } = useAuthStore();
    const kpis: KPIData[] = [
        {
            label: 'Woreda Schools',
            value: 24,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Total Students',
            value: 8200,
            icon: 'People',
            trend: 'up',
            change: 145
        },
        {
            label: 'Avg Class Size',
            value: 45,
            icon: 'Groups',
            trend: 'down',
            change: -2
        },
        {
            label: 'Attendance Rate',
            value: '94.2%',
            icon: 'EventAvailable',
            trend: 'up'
        }
    ];

    const schoolPerformanceData = [
        { name: 'School 01', performance: 78, attendance: 92 },
        { name: 'School 02', performance: 85, attendance: 95 },
        { name: 'School 03', performance: 72, attendance: 88 },
        { name: 'School 04', performance: 91, attendance: 97 },
        { name: 'School 05', performance: 65, attendance: 84 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Woreda Dashboard
                    {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Local management of schools and educational outcomes. Welcome, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="School Performance & Attendance"
                        subtitle="Key metrics for schools in this Woreda"
                        data={schoolPerformanceData}
                        type="bar"
                        dataKeys={['performance', 'attendance']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Woreda Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Register New School
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PeopleIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Manage School Admins
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<StatsIcon />}
                            sx={{ py: 1.5 }}
                        >
                            View Woreda stats
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
