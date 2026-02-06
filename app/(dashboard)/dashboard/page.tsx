'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardHeader,
    Button,
    useTheme,
    alpha,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add as AddIcon,
    TrendingUp as TrendingUpIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { KPIGrid } from '@/app/components/analytics';
import { AnalyticsChart } from '@/app/components/analytics';
import { DataTable } from '@/app/components/tables';
import { useAuthStore } from '@/app/lib/store';
import { PermissionGate } from '@/app/lib/core';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import type { Zone, KPIData } from '@/app/lib/types';

// Sample chart data
const enrollmentTrendData = [
    { name: 'Jan', students: 420000, teachers: 14200 },
    { name: 'Feb', students: 425000, teachers: 14350 },
    { name: 'Mar', students: 430000, teachers: 14500 },
    { name: 'Apr', students: 435000, teachers: 14650 },
    { name: 'May', students: 440000, teachers: 14800 },
    { name: 'Jun', students: 447000, teachers: 15150 },
];

const zoneDistributionData = [
    { name: 'Mekelle', value: 125000 },
    { name: 'Adigrat', value: 85000 },
    { name: 'Axum', value: 78000 },
    { name: 'Shire', value: 62000 },
    { name: 'Wukro', value: 45000 },
    { name: 'Adwa', value: 52000 },
];

const schoolTypeData = [
    { name: 'Primary', value: 620 },
    { name: 'Secondary', value: 245 },
    { name: 'Preparatory', value: 83 },
];

// Zone columns
const zoneColumns: GridColDef[] = [
    { field: 'name', headerName: 'Zone Name', flex: 1, minWidth: 150 },
    { field: 'nameAmharic', headerName: 'ስም (አማርኛ)', flex: 1, minWidth: 120 },
    { field: 'code', headerName: 'Code', width: 80 },
    { field: 'totalWoredas', headerName: 'Woredas', width: 100, type: 'number' },
    { field: 'totalSchools', headerName: 'Schools', width: 100, type: 'number' },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        width: 110,
        type: 'number',
        valueFormatter: ({ value }) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 100,
    },
];

export default function Dashboard() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [zones, setZones] = useState<Zone[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsData, zonesData] = await Promise.all([
                dashboardService.getStats(),
                (user?.tenantType === 'bureau' || user?.tenantType === 'zone')
                    ? zonesService.getAll(user?.tenantType === 'zone' ? user.tenantId : undefined)
                    : Promise.resolve([])
            ]);
            setStats(statsData);
            setZones(zonesData as any);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const filteredZones = useScopedData(zones, 'zone');

    const dashboardTitle = user?.tenantType === 'bureau'
        ? 'Regional Education Bureau Dashboard'
        : user?.tenantType === 'zone'
            ? `${user.tenantName} Zone Dashboard`
            : user?.tenantType === 'woreda'
                ? `${user.tenantName} Woreda Dashboard`
                : `${user?.tenantName || 'School'} Dashboard`;

    return (
        <Box>
            {/* Page Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    {dashboardTitle}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Welcome back, {user?.firstName}! Here's an overview of the {user?.tenantType === 'bureau' ? 'Tigray Region' : user?.tenantName} education system.
                </Typography>
            </Box>

            {/* KPI Cards */}
            <Box sx={{ mb: 4 }}>
                <KPIGrid
                    kpis={stats ? [
                        {
                            label: 'Institutions',
                            value: stats.institutions || 0,
                            icon: 'School',
                            trend: 'stable'
                        },
                        {
                            label: 'Total Students',
                            value: stats.students || 0,
                            icon: 'People',
                            trend: 'stable'
                        },
                        // Map other stats as needed
                    ] : []}
                    loading={loading}
                    columns={6}
                />
            </Box>

            {/* Charts Section */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mb: 4 }}>
                <AnalyticsChart
                    title="Enrollment Trends"
                    subtitle="Students and teachers over time"
                    data={enrollmentTrendData}
                    type="area"
                    dataKeys={['students', 'teachers']}
                    loading={loading}
                    height={320}
                />
                <AnalyticsChart
                    title="School Types"
                    subtitle="Distribution by level"
                    data={schoolTypeData}
                    type="pie"
                    loading={loading}
                    height={320}
                />
            </Box>

            {/* Zone Distribution Chart */}
            {user?.tenantType === 'bureau' && (
                <Box sx={{ mb: 4 }}>
                    <AnalyticsChart
                        title="Student Distribution by Zone"
                        subtitle="Total students per zone"
                        data={zoneDistributionData}
                        type="bar"
                        loading={loading}
                        height={300}
                    />
                </Box>
            )}

            {/* Zones Table (Only for Bureau/Zone) */}
            {(user?.tenantType === 'bureau' || user?.tenantType === 'zone') && (
                <Box>
                    <DataTable
                        title={user?.tenantType === 'bureau' ? 'Zones Overview' : 'Zone Details'}
                        subtitle={`${filteredZones.length} zones in scope`}
                        columns={zoneColumns}
                        rows={filteredZones}
                        loading={loading}
                        module="management"
                        onAdd={() => console.log('Add zone')}
                        onEdit={(zone) => console.log('Edit zone', zone)}
                        onView={(zone) => console.log('View zone', zone)}
                        onDelete={(zone) => console.log('Delete zone', zone)}
                        statusField="status"
                        statusColors={{
                            active: 'success',
                            inactive: 'error',
                        }}
                    />
                </Box>
            )}
        </Box>
    );
}
