'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, alpha, useTheme } from '@mui/material';
import {
    LocationOn as WoredaIcon,
    School as SchoolIcon,
    Add as AddIcon,
    Groups as PeopleIcon,
    Business as BusinessIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { woredasService, Woreda } from '@/app/lib/api/woredas.service';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { UserDialog } from '@/app/components/management/UserDialog';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useRouter } from 'next/navigation';

export default function ZoneAdminDashboard() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();
    
    const [stats, setStats] = useState<any>(null);
    const [woredas, setWoredas] = useState<Woreda[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [openWoredaDialog, setOpenWoredaDialog] = useState(false);
    const [openUserDialog, setOpenUserDialog] = useState(false);

    const fetchData = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const [statsData, woredasData] = await Promise.all([
                dashboardService.getStats(),
                woredasService.getAll(user.tenantId)
            ]);
            setStats(statsData);
            setWoredas(woredasData);
        } catch (error) {
            console.error('Error fetching zone dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    useRealTime('STATS_UPDATED', fetchData);

    const kpis = [
        {
            label: 'Total Woredas',
            value: stats?.totalWoredas || woredas.length || 0,
            icon: 'LocationOn',
            trend: 'stable' as const
        },
        {
            label: 'Total Schools',
            value: stats?.institutions || 0,
            icon: 'School',
            trend: 'up' as const
        },
        {
            label: 'Total Students',
            value: stats?.students || 0,
            icon: 'People',
            trend: 'up' as const
        },
        {
            label: 'Teacher Count',
            value: stats?.teachers || 0,
            icon: 'Badge',
            trend: 'up' as const
        }
    ];

    const woredaDistribution = woredas.map(w => ({
        name: w.name,
        students: w.totalStudents || 0,
        teachers: w.totalTeachers || 0,
        schools: w.totalSchools || 0
    }));

    const handleCreateWoreda = async (data: any) => {
        try {
            await woredasService.create({ ...data, zoneId: user?.tenantId });
            setOpenWoredaDialog(false);
            fetchData();
        } catch (error) {
            console.error('Error creating woreda:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                    Zone Dashboard
                    {user?.tenantName && (
                        <Typography component="span" variant="h4" color="primary.main" fontWeight={800}>
                            : {user.tenantName}
                        </Typography>
                    )}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Administrative oversight for Woredas and Schools in this zone. Welcome back, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} loading={loading} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 300px' }, gap: 3 }}>
                <AnalyticsChart
                    title="Woreda Distribution"
                    subtitle="Student and Teacher population by Woreda"
                    data={woredaDistribution}
                    type="bar"
                    dataKeys={['students', 'teachers']}
                    loading={loading}
                    height={400}
                />
                
                <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={800}>Zone Management</Typography>
                    
                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenWoredaDialog(true)}
                        sx={{ py: 2, borderRadius: 3, fontWeight: 700, boxShadow: theme.shadows[4] }}
                    >
                        Create Woreda
                    </Button>
                    
                    <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={<PeopleIcon />}
                        onClick={() => setOpenUserDialog(true)}
                        sx={{ py: 2, borderRadius: 3, fontWeight: 700 }}
                    >
                        New Woreda Admin
                    </Button>
                    
                    <Button
                        variant="outlined"
                        fullWidth
                        color="secondary"
                        size="large"
                        startIcon={<BusinessIcon />}
                        onClick={() => router.push('/management/institutions')}
                        sx={{ py: 2, borderRadius: 3, fontWeight: 700 }}
                    >
                        All Institutions
                    </Button>
                </Stack>
            </Box>

            <TenantDialog
                open={openWoredaDialog}
                onClose={() => setOpenWoredaDialog(false)}
                onSubmit={handleCreateWoreda}
                type="woreda"
                parentId={user?.tenantId}
                parentName={user?.tenantName}
            />

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={fetchData}
                defaultRole="WOREDA_ADMIN"
            />
        </Box>
    );
}
