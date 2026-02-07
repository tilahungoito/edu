'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    HowToReg as RegIcon,
    Assessment as ReportsIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';

export default function RegistrarDashboard() {
    const { user } = useAuthStore();
    const kpis: KPIData[] = [
        {
            label: 'Total Students',
            value: 12450,
            icon: 'People',
            trend: 'up',
            change: 120
        },
        {
            label: 'New Registrations',
            value: 450,
            icon: 'PersonAdd',
            trend: 'up',
            change: 25
        },
        {
            label: 'Pending Approval',
            value: 32,
            icon: 'HourglassEmpty',
            trend: 'down',
            change: -5
        },
        {
            label: 'Completion Rate',
            value: '98.5%',
            icon: 'CheckCircle',
            trend: 'up'
        }
    ];

    const enrollmentData = [
        { name: 'Week 1', registered: 45, pending: 12 },
        { name: 'Week 2', registered: 52, pending: 15 },
        { name: 'Week 3', registered: 61, pending: 10 },
        { name: 'Week 4', registered: 58, pending: 8 },
        { name: 'Week 5', registered: 65, pending: 5 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Registrar Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome back, {user?.firstName}. Managing student records for {user?.tenantName || 'Institution'}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Enrollment Activity"
                        subtitle="Weekly registration vs pending approvals"
                        data={enrollmentData}
                        type="area"
                        dataKeys={['registered', 'pending']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Quick Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<PersonAddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Register New Student
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<RegIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Review Pending Files
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<ReportsIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Generate Batch Report
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
