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

import { useSearchParams } from 'next/navigation';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';

export default function KebeleAdminDashboard() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [kebeleName, setKebeleName] = React.useState('');

    const kebeleId = searchParams.get('id') || user?.tenantId;

    React.useEffect(() => {
        const fetchData = async () => {
            if (!kebeleId) return;
            setLoading(true);
            try {
                const [statsData, kebeleData] = await Promise.all([
                    dashboardService.getStats('KEBELE', kebeleId),
                    kebelesService.getById(kebeleId)
                ]);
                setStats(statsData);
                setKebeleName(kebeleData.name);
            } catch (error) {
                console.error('Error fetching kebele data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [kebeleId]);

    const kpis: KPIData[] = [
        {
            label: 'Institutions',
            value: stats?.institutions || 0,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Total Students',
            value: stats?.students || 0,
            icon: 'People',
            trend: 'up'
        },
        {
            label: 'Teachers',
            value: stats?.teachers || 0,
            icon: 'Badge',
            trend: 'stable'
        },
        {
            label: 'Resource Status',
            value: 'Optimal',
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
                    {(kebeleName || user?.tenantName) && <Typography component="span" variant="h4" color="primary">: {kebeleName || user?.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Community-level education management and school support. Welcome, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} loading={loading} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Institution Distribution"
                        subtitle="School breakdown by level"
                        data={stats?.institutionLevels || []}
                        type="pie"
                        loading={loading}
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
