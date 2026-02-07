'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    LocationCity as ZoneIcon,
    People as PeopleIcon,
    Add as AddIcon,
    Assignment as ReportsIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';

export default function RegionalAdminDashboard() {
    const { user } = useAuthStore();
    const kpis: KPIData[] = [
        {
            label: 'Total Zones',
            value: 12,
            icon: 'LocationCity',
            trend: 'stable'
        },
        {
            label: 'Total Woredas',
            value: 48,
            icon: 'Map',
            trend: 'stable'
        },
        {
            label: 'Regional Schools',
            value: 245,
            icon: 'School',
            trend: 'up',
            change: 8
        },
        {
            label: 'Teacher Ratio',
            value: '1:42',
            icon: 'AutoGraph',
            trend: 'up'
        }
    ];

    const zonalStats = [
        { name: 'Eastern', students: 45000, schools: 85 },
        { name: 'Western', students: 38000, schools: 72 },
        { name: 'Central', students: 62000, schools: 110 },
        { name: 'Southern', students: 51000, schools: 94 },
        { name: 'North West', students: 32000, schools: 58 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Regional Dashboard
                    {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Monitoring and managing educational resources for the region. Welcome, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Zonal Performance Overview"
                        subtitle="Students and Schools distribution by Zone"
                        data={zonalStats}
                        type="area"
                        dataKeys={['students', 'schools']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Regional Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Establish New Zone
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PeopleIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Manage Zonal Admins
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<ReportsIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Quarterly Review Report
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
