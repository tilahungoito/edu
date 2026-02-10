'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    School as InstitutionIcon,
    Groups as PeopleIcon,
    Add as AddIcon,
    LocationCity as CityIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';
import { UserDialog } from '@/app/components/management/UserDialog';

export default function KebeleAdminDashboard() {
    const { user } = useAuthStore();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);

    const kpis: KPIData[] = [
        {
            label: 'Institutions',
            value: 4,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Total Students',
            value: 1240,
            icon: 'People',
            trend: 'up',
            change: 15
        },
        {
            label: 'Teachers',
            value: 52,
            icon: 'Badge',
            trend: 'stable'
        },
        {
            label: 'Community Support',
            value: 'High',
            icon: 'Favorite',
            trend: 'up'
        }
    ];

    const attendanceData = [
        { name: 'Mon', attendance: 92 },
        { name: 'Tue', attendance: 94 },
        { name: 'Wed', attendance: 91 },
        { name: 'Thu', attendance: 95 },
        { name: 'Fri', attendance: 93 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Kebele Dashboard
                    {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Community-level education management and school support. Welcome, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Average Weekly Attendance"
                        subtitle="Consolidated attendance across Kebele schools"
                        data={attendanceData}
                        type="bar"
                        dataKeys={['attendance']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Kebele Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Register New Institution
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PeopleIcon />}
                            onClick={() => setOpenUserDialog(true)}
                            sx={{ py: 1.5 }}
                        >
                            Create Institution Admin
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<CityIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Manage Institutions
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => console.log('User created')}
            />
        </Box>
    );
}
