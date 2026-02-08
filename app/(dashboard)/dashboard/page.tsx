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
import {
    BureauDashboard,
    InstitutionDashboard,
    InstructorDashboard,
    StudentDashboard,
} from '@/app/components/analytics/dashboards/RoleDashboards';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import type { Zone, KPIData, TenantType } from '@/app/lib/types';

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

// School level type mapping
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
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        width: 110,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 100,
    },
];

// Woreda columns
const woredaColumns: GridColDef[] = [
    { field: 'name', headerName: 'Woreda Name', flex: 1, minWidth: 150 },
    { field: 'nameAmharic', headerName: 'ስም (አማርኛ)', flex: 1, minWidth: 120 },
    { field: 'code', headerName: 'Code', width: 80 },
    {
        field: 'totalSchools',
        headerName: 'Schools',
        width: 100,
        type: 'number',
        valueGetter: (params: any) => params?.row?._count?.institutions || 0
    },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number'
    },
    { field: 'status', headerName: 'Status', width: 100 },
];

// Kebele columns
const kebeleColumns: GridColDef[] = [
    { field: 'name', headerName: 'Kebele Name', flex: 1, minWidth: 150 },
    {
        field: 'totalSchools',
        headerName: 'Institutions',
        width: 120,
        type: 'number',
        valueGetter: (params: any) => params?.row?._count?.institutions || 0
    },
    { field: 'createdAt', headerName: 'Created At', width: 150, type: 'date', valueGetter: (value) => value ? new Date(value) : null },
];

// Institution columns
const institutionColumns: GridColDef[] = [
    { field: 'name', headerName: 'Institution Name', flex: 1, minWidth: 200 },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueGetter: (params: any) => params?.row?._count?.students || 0
    },
    {
        field: 'totalTeachers',
        headerName: 'Teachers',
        width: 120,
        type: 'number'
    },
    { field: 'type', headerName: 'Level', width: 120 },
    { field: 'ownership', headerName: 'Type', width: 120 },
];

export default function Dashboard() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [zones, setZones] = useState<Zone[]>([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<TenantType>('school');

    const fetchData = async () => {
        setLoading(true);
        try {
            const statsData = await dashboardService.getStats();
            let listData: any[] = [];
            if (user?.tenantType === 'bureau') {
                listData = await zonesService.getAll();
            } else if (user?.tenantType === 'zone') {
                listData = await woredasService.getAll(user.tenantId);
            } else if (user?.tenantType === 'woreda') {
                listData = await kebelesService.getAll();
            } else if (user?.tenantType === 'kebele') {
                listData = await institutionsService.getAll({ kebeleId: user.tenantId });
            }

            setStats(statsData);
            setZones(listData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAddDialog = () => {
        if (!user) return;

        // Determine what to add based on user scope
        let typeToAdd: TenantType = 'zone';
        if (user.tenantType === 'bureau') typeToAdd = 'zone';
        else if (user.tenantType === 'zone') typeToAdd = 'woreda';
        else if (user.tenantType === 'woreda') typeToAdd = 'kebele';
        else if (user.tenantType === 'kebele') typeToAdd = 'school';

        setDialogType(typeToAdd);
        setDialogOpen(true);
    };

    const handleAddEntity = async (data: any) => {
        try {
            if (dialogType === 'zone') await zonesService.create(data);
            else if (dialogType === 'woreda') await woredasService.create(data);
            else if (dialogType === 'kebele') await kebelesService.create(data);
            else if (dialogType === 'school') await institutionsService.create(data);

            setDialogOpen(false);
            fetchData();
        } catch (error) {
            console.error(`Error creating ${dialogType}:`, error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const filteredZones = useScopedData(zones, user?.tenantType as any);

    const dashboardTitle = user?.tenantType === 'bureau'
        ? (user.roles?.some(r => r.name === 'SYSTEM_ADMIN') ? 'System Administration Dashboard' : 'Regional Education Bureau Dashboard')
        : user?.tenantType === 'zone'
            ? `${user.tenantName} Zone Dashboard`
            : user?.tenantType === 'woreda'
                ? `${user.tenantName} Woreda Dashboard`
                : user?.tenantType === 'kebele'
                    ? `${user.tenantName} Kebele Dashboard`
                    : `${user?.tenantName || 'School'} Dashboard`;

    const renderRoleDashboard = () => {
        const roles = user?.roles?.map(r => r.name) || [];

        const adminRoles = [
            'SYSTEM_ADMIN',
            'REGIONAL_ADMIN',
            'ZONE_ADMIN',
            'WOREDA_ADMIN',
            'KEBELE_ADMIN'
        ];

        if (adminRoles.some(r => roles.includes(r)) || user?.tenantType === 'bureau') {
            const tableTitle = user?.tenantType === 'bureau' ? "Regional Zones" :
                user?.tenantType === 'zone' ? "Zone Woredas" :
                    user?.tenantType === 'woreda' ? "Woreda Kebeles" :
                        user?.tenantType === 'kebele' ? "Kebele Institutions" :
                            "Local Entities";

            const currentColumns = user?.tenantType === 'bureau' ? zoneColumns :
                user?.tenantType === 'zone' ? woredaColumns :
                    user?.tenantType === 'woreda' ? kebeleColumns :
                        user?.tenantType === 'kebele' ? institutionColumns :
                            zoneColumns;

            const resourceTypeMap: Record<string, ResourceType> = {
                'bureau': 'zone',
                'zone': 'woreda',
                'woreda': 'kebele',
                'kebele': 'institution'
            };

            return (
                <>
                    <BureauDashboard
                        stats={stats}
                        loading={loading}
                        user={user}
                        zones={filteredZones}
                        columns={currentColumns}
                        tableTitle={tableTitle}
                        onAdd={handleOpenAddDialog}
                        resourceType={resourceTypeMap[user?.tenantType || 'bureau']}
                    />
                    <TenantDialog
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onSubmit={handleAddEntity}
                        type={dialogType as any}
                        parentId={user?.tenantId}
                        parentType={user?.tenantType as any}
                        parentName={user?.tenantName}
                    />
                </>
            );
        }

        if (roles.includes('INSTITUTION_ADMIN') || user?.tenantType === 'school') {
            return <InstitutionDashboard stats={stats} loading={loading} user={user} />;
        }

        if (roles.includes('INSTRUCTOR')) {
            return <InstructorDashboard stats={stats} loading={loading} user={user} />;
        }

        if (roles.includes('STUDENT')) {
            return <StudentDashboard stats={stats} loading={loading} user={user} />;
        }

        return <Typography variant="h6">Welcome to Tigray EDU Portal</Typography>;
    };

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

            {/* Dynamic Role-Based Dashboard */}
            {renderRoleDashboard()}
        </Box>
    );
}
