'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    LocationOn as WoredaIcon,
    School as SchoolIcon,
    Add as AddIcon,
    Groups as PeopleIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';
import { UserDialog } from '@/app/components/management/UserDialog';

export default function ZoneAdminDashboard() {
    const { user } = useAuthStore();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);

    const kpis: KPIData[] = [
        {
            label: 'Total Woredas',
            value: 8,
            icon: 'LocationOn',
            trend: 'stable'
        },
        {
            label: 'Total Schools',
            value: 112,
            icon: 'School',
            trend: 'up',
            change: 3
        },
        {
            label: 'Total Students',
            value: 34500,
            icon: 'People',
            trend: 'up',
            change: 850
        },
        {
            label: 'Teacher Count',
            value: 1450,
            icon: 'Badge',
            trend: 'up'
        }
    ];

    const woredaData = [
        { name: 'Woreda A', students: 5200, teachers: 210 },
        { name: 'Woreda B', students: 4800, teachers: 195 },
        { name: 'Woreda C', students: 6100, teachers: 245 },
        { name: 'Woreda D', students: 3900, teachers: 160 },
        { name: 'Woreda E', students: 4200, teachers: 180 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Zone Dashboard
                    {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Administrative oversight for Woredas and Schools in this zone. Welcome back, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Woreda Distribution"
                        subtitle="Student and Teacher population by Woreda"
                        data={woredaData}
                        type="bar"
                        dataKeys={['students', 'teachers']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Zone Management</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<AddIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Create New Woreda
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PeopleIcon />}
                            onClick={() => setOpenUserDialog(true)}
                            sx={{ py: 1.5 }}
                        >
                            Create Woreda Admin
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<SchoolIcon />}
                            sx={{ py: 1.5 }}
                        >
                            View All Schools
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
