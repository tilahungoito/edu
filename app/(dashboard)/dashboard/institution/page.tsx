'use client';

import React from 'react';
import { Box, Typography, Grid, Button } from '@mui/material';
import {
    Groups as StudentIcon,
    Badge as TeacherIcon,
    Add as AddIcon,
    EventNote as AttendanceIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';
import { UserDialog } from '@/app/components/management/UserDialog';

import { useSearchParams } from 'next/navigation';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { InstitutionDashboard } from '@/app/components/analytics/dashboards/RoleDashboards';

export default function SchoolAdminDashboard() {
    const { user } = useAuthStore();
    const searchParams = useSearchParams();
    const [openUserDialog, setOpenUserDialog] = React.useState(false);
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [institutionName, setInstitutionName] = React.useState('');

    const institutionId = searchParams.get('id') || user?.tenantId;

    React.useEffect(() => {
        const fetchData = async () => {
            if (!institutionId) return;
            setLoading(true);
            try {
                const [statsData, institutionData] = await Promise.all([
                    dashboardService.getStats('INSTITUTION', institutionId),
                    institutionsService.getById(institutionId)
                ]);
                setStats(statsData);
                setInstitutionName(institutionData.name);
            } catch (error) {
                console.error('Error fetching institution data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [institutionId]);

    const kpis: KPIData[] = [
        {
            label: 'Total Students',
            value: 8500,
            icon: 'People',
            trend: 'up',
            change: 12
        },
        {
            label: 'Total Teachers',
            value: 42,
            icon: 'Badge',
            trend: 'stable'
        },
        {
            label: 'Daily Attendance',
            value: '96.5%',
            icon: 'EventAvailable',
            trend: 'up'
        },
        {
            label: 'School Rank',
            value: '#4',
            icon: 'EmojiEvents',
            trend: 'up'
        }
    ];

    const gradeDistribution = [
        { name: 'Grade 9', students: 210, male: 110, female: 100 },
        { name: 'Grade 10', students: 205, male: 105, female: 100 },
        { name: 'Grade 11', students: 220, male: 115, female: 105 },
        { name: 'Grade 12', students: 215, male: 110, female: 105 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    School Dashboard
                    {(institutionName || user?.tenantName) && <Typography component="span" variant="h4" color="primary">: {institutionName || user?.tenantName}</Typography>}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Managing daily operations and academic standards for your school. Welcome back, {user?.firstName}.
                </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
                <InstitutionDashboard stats={stats} loading={loading} user={user} />
            </Box>

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => console.log('User created')}
            />
        </Box>
    );
}
