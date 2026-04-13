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
import { UserDialog } from '@/app/components/management/UserDialog';

import { useSearchParams } from 'next/navigation';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { woredasService } from '@/app/lib/api/woredas.service';

export default function WoredaAdminDashboard() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [woredaName, setWoredaName] = React.useState('');

    const woredaId = searchParams.get('id') || user?.tenantId;

    React.useEffect(() => {
        const fetchData = async () => {
            if (!woredaId) return;
            setLoading(true);
            try {
                const [statsData, woredaData] = await Promise.all([
                    dashboardService.getStats('WOREDA', woredaId),
                    woredasService.getById(woredaId)
                ]);
                setStats(statsData);
                setWoredaName(woredaData.name);
            } catch (error) {
                console.error('Error fetching woreda data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [woredaId]);

    const kpis: KPIData[] = [
        {
            label: 'Woreda Schools',
            value: stats?.institutions || 0,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Total Students',
            value: stats?.students || 0,
            icon: 'People',
            trend: 'up',
        },
        {
            label: 'Total Teachers',
            value: stats?.teachers || 0,
            icon: 'Badge',
            trend: 'stable'
        },
        {
            label: 'Level Match',
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
                    {(woredaName || user?.tenantName) && <Typography component="span" variant="h4" color="primary">: {woredaName || user?.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Local management of schools and educational outcomes. Welcome, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} loading={loading} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Enrollment Trends"
                        subtitle="Students and Teachers in this Woreda"
                        data={stats?.enrollmentTrends || []}
                        type="area"
                        dataKeys={['students', 'teachers']}
                        loading={loading}
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
                            Create New Kebele
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PeopleIcon />}
                            onClick={() => setOpenUserDialog(true)}
                            sx={{ py: 1.5 }}
                        >
                            Create Kebele Admin
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

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => console.log('User created')}
            />
        </Box>
    );
}
