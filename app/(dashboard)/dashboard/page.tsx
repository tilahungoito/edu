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
    Chip,
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
    RegistrarDashboard,
    AccountantDashboard,
} from '@/app/components/analytics/dashboards/RoleDashboards';
import { dashboardService } from '@/app/lib/api/dashboard.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { notificationsService } from '@/app/lib/api/notifications.service';
import { TenantDialog } from '@/app/components/management/TenantDialog';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { useRouter } from 'next/navigation';
import type { Zone, KPIData, TenantType, ResourceType } from '@/app/lib/types';
import { Notifications as NotificationsIcon, DoneAll as DoneAllIcon } from '@mui/icons-material';

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
    { field: 'code', headerName: 'Code', width: 80 },
    {
        field: 'totalSchools',
        headerName: 'Schools',
        width: 100,
        type: 'number',
    },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    { 
        field: 'status', 
        headerName: 'Status', 
        width: 100,
        renderCell: (params) => (
            <Chip 
                label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : 'Active'} 
                size="small" 
                color="success" 
                variant="soft" 
                sx={{ fontWeight: 700 }}
            />
        )
    },
];

// Kebele columns
const kebeleColumns: GridColDef[] = [
    { field: 'name', headerName: 'Kebele Name', flex: 1, minWidth: 150 },
    { field: 'code', headerName: 'Code', width: 80 },
    {
        field: 'totalSchools',
        headerName: 'Institutions',
        width: 120,
        type: 'number',
    },
    {
        field: 'totalStudents',
        headerName: 'Students',
        width: 120,
        type: 'number',
        valueFormatter: (value) => typeof value === 'number' ? (value as number).toLocaleString() : '-',
    },
    { 
        field: 'status', 
        headerName: 'Status', 
        width: 100,
        renderCell: (params) => (
            <Chip 
                label={params.value ? params.value.charAt(0).toUpperCase() + params.value.slice(1) : 'Active'} 
                size="small" 
                color="success" 
                variant="soft" 
                sx={{ fontWeight: 700 }}
            />
        )
    },
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
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [zones, setZones] = useState<Zone[]>([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<TenantType>('school');
    const [editingEntity, setEditingEntity] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

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

        setEditingEntity(null);
        setDialogType(typeToAdd);
        setDialogOpen(true);
    };

    const handleEditEntity = (row: any) => {
        setEditingEntity(row);
        setDialogType(user?.tenantType === 'bureau' ? 'zone' : 
                     user?.tenantType === 'zone' ? 'woreda' : 
                     user?.tenantType === 'woreda' ? 'kebele' : 'school');
        setDialogOpen(true);
    };

    const handleDeleteEntity = async (row: any) => {
        try {
            if (user?.tenantType === 'bureau') await zonesService.delete(row.id);
            else if (user?.tenantType === 'zone') await woredasService.delete(row.id);
            else if (user?.tenantType === 'woreda') await kebelesService.delete(row.id);
            else if (user?.tenantType === 'kebele') await institutionsService.delete(row.id);

            fetchData();
        } catch (error) {
            console.error('Error deleting entity:', error);
        }
    };

    const handleAddEntity = async (data: any, id?: string) => {
        try {
            if (id) {
                if (dialogType === 'zone') await zonesService.update(id, data);
                else if (dialogType === 'woreda') await woredasService.update(id, data);
                else if (dialogType === 'kebele') await kebelesService.update(id, data);
                else if (dialogType === 'school') await institutionsService.update(id, data);
            } else {
                if (dialogType === 'zone') await zonesService.create(data);
                else if (dialogType === 'woreda') await woredasService.create(data);
                else if (dialogType === 'kebele') await kebelesService.create(data);
                else if (dialogType === 'school') await institutionsService.create(data);
            }

            setDialogOpen(false);
            setEditingEntity(null);
            fetchData();
        } catch (error) {
            console.error(`Error processing ${dialogType}:`, error);
        }
    };

    useEffect(() => {
        fetchData();
        fetchNotifications();
    }, [user]);

    const handleMarkAllRead = async () => {
        await notificationsService.markAllAsRead();
        fetchNotifications();
    };

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        fetchData();
    });

    const roles = user?.roles?.map(r => r.name) || [];

    const resourceTypeMap: Record<string, ResourceType> = {
        'bureau': 'zone',
        'zone': 'woreda',
        'woreda': 'kebele',
        'kebele': 'institution'
    };

    const currentResourceType = resourceTypeMap[user?.tenantType || 'bureau'];
    const filteredZones = useScopedData(zones, currentResourceType as any);

    const dashboardTitle = user?.tenantType === 'bureau'
        ? (roles.includes('SYSTEM_ADMIN') ? 'System Administration Dashboard' : 'Regional Education Bureau Dashboard')
        : roles.includes('INSTRUCTOR')
            ? 'Instructor Dashboard'
            : roles.includes('STUDENT')
                ? 'Student Dashboard'
                : roles.includes('REGISTRAR')
                    ? 'Registrar Dashboard'
                    : roles.includes('ACCOUNTANT')
                        ? 'Accountant Dashboard'
                        : user?.tenantType === 'zone'
                            ? `${user.tenantName} Zone Dashboard`
                            : user?.tenantType === 'woreda'
                                ? `${user.tenantName} Woreda Dashboard`
                                : user?.tenantType === 'kebele'
                                    ? `${user.tenantName} Kebele Dashboard`
                                    : `${user?.tenantName || 'School'} Dashboard`;

    const renderRoleDashboard = () => {
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
                        onEdit={handleEditEntity}
                        onDelete={handleDeleteEntity}
                        onView={(row: any) => {
                            if (currentResourceType === 'zone') router.push(`/dashboard/zone?id=${row.id}`);
                            else if (currentResourceType === 'woreda') router.push(`/dashboard/woreda?id=${row.id}`);
                            else if (currentResourceType === 'kebele') router.push(`/dashboard/kebele?id=${row.id}`);
                        }}
                        resourceType={currentResourceType}
                    />
                    <TenantDialog
                        open={dialogOpen}
                        onClose={() => {
                            setDialogOpen(false);
                            setEditingEntity(null);
                        }}
                        onSubmit={handleAddEntity}
                        editData={editingEntity}
                        type={dialogType as any}
                        parentId={user?.tenantId}
                        parentType={user?.tenantType as any}
                        parentName={user?.tenantName}
                    />
                </>
            );
        }

        if (roles.includes('INSTRUCTOR')) {
            return <InstructorDashboard stats={stats} loading={loading} user={user} />;
        }

        if (roles.includes('STUDENT')) {
            return <StudentDashboard stats={stats} loading={loading} user={user} />;
        }

        // Check REGISTRAR and ACCOUNTANT before INSTITUTION_ADMIN/school tenant
        // because they also have tenantType === 'school'
        if (roles.includes('REGISTRAR')) {
            return <RegistrarDashboard stats={stats} loading={loading} user={user} />;
        }

        if (roles.includes('ACCOUNTANT')) {
            return <AccountantDashboard stats={stats} loading={loading} user={user} />;
        }

        // INSTITUTION_ADMIN or generic school tenant users
        if (roles.includes('INSTITUTION_ADMIN') || user?.tenantType === 'school') {
            return <InstitutionDashboard stats={stats} loading={loading} user={user} />;
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

            {/* Notifications Section - Only show if there are unread alerts */}
            {notifications.some(n => !n.isRead) && (
                <Card sx={{ mb: 4, borderRadius: 4, border: `1px solid ${theme.palette.warning.light}`, bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                    <CardHeader 
                        title="Active Alerts & Notifications" 
                        titleTypographyProps={{ variant: 'h6', fontWeight: 800 }}
                        action={
                            <Button startIcon={<DoneAllIcon />} size="small" onClick={handleMarkAllRead}>
                                Mark All Read
                            </Button>
                        }
                    />
                    <CardContent sx={{ pt: 0 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {notifications.filter(n => !n.isRead).map((n) => (
                                <Box key={n.id} sx={{ 
                                    p: 2, borderRadius: 2, 
                                    display: 'flex', alignItems: 'flex-start', gap: 2,
                                    bgcolor: n.type === 'ACADEMIC_ALERT' ? alpha(theme.palette.error.main, 0.05) : alpha(theme.palette.info.main, 0.05),
                                    border: `1px solid ${n.type === 'ACADEMIC_ALERT' ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.info.main, 0.1)}`
                                }}>
                                    <Box sx={{ color: n.type === 'ACADEMIC_ALERT' ? 'error.main' : 'info.main', mt: 0.5 }}>
                                        <NotificationsIcon />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={800}>{n.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{n.message}</Typography>
                                    </Box>
                                    {n.link && (
                                        <Button size="small" href={n.link} sx={{ alignSelf: 'center' }}>View</Button>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Dynamic Role-Based Dashboard */}
            {renderRoleDashboard()}
        </Box>
    );
}
