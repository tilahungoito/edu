'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    Button,
    CircularProgress,
    Tabs,
    Tab,
    Card,
    CardContent,
    Stack,
    Chip,
    Avatar,
    useTheme,
    alpha
} from '@mui/material';
import {
    School as CourseIcon,
    Groups as StudentIcon,
    EventNote as AttendanceIcon,
    LibraryBooks as AssetsIcon,
    AddCircleOutline as AddIcon,
    TrendingUp as TrendingIcon,
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    MoreVert as MoreIcon,
    Person as PersonIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { DataTable } from '@/app/components/tables';
import { useAuthStore } from '@/app/lib/store';
import { dashboardService, InstructorStats } from '@/app/lib/api/dashboard.service';
import { KPIData } from '@/app/lib/types';
import { GridColDef } from '@mui/x-data-grid';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`instructor-tabpanel-${index}`}
            aria-labelledby={`instructor-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function InstructorDashboard() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<InstructorStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats() as InstructorStats;
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch instructor stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const kpis: KPIData[] = [
        {
            label: 'Total Students',
            value: stats?.totalStudents || 0,
            icon: 'Groups',
            trend: 'stable'
        },
        {
            label: 'Active Courses',
            value: stats?.courses?.length || 0,
            icon: 'School',
            trend: 'stable'
        },
        {
            label: 'Avg Attendance',
            value: stats?.avgAttendance || '0%',
            icon: 'EventNote',
            trend: 'up'
        },
        {
            label: 'At Risk',
            value: stats?.atRiskCount || 0,
            icon: 'Warning',
            trend: stats?.atRiskCount && stats.atRiskCount > 0 ? 'up' : 'stable'
        }
    ];

    const studentColumns: GridColDef[] = [
        {
            field: 'name',
            headerName: 'Student Name',
            flex: 1.5,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                        {params.value.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
                </Box>
            )
        },
        { field: 'courseCode', headerName: 'Course', flex: 1 },
        { 
            field: 'attendance', 
            headerName: 'Attendance', 
            flex: 1,
            renderCell: (params) => (
                <Chip 
                    label={`${params.value}%`} 
                    size="small" 
                    color={params.value > 85 ? 'success' : params.value > 70 ? 'warning' : 'error'}
                    variant="soft"
                />
            )
        },
        { field: 'midterm', headerName: 'Midterm', flex: 0.8 },
        { field: 'final', headerName: 'Final', flex: 0.8 },
        { 
            field: 'total', 
            headerName: 'Total Score', 
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={700} color="primary.main">
                    {params.value}%
                </Typography>
            )
        }
    ];

    return (
        <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                        Instructor Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Welcome back, <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>{user?.firstName || 'Instructor'}</Box>. 
                        Here's your academic overview for today.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}>
                        New Record
                    </Button>
                </Box>
            </Box>

            {/* KPI Section */}
            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            {/* Tabs Section */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
                    <Tab label="Overview" icon={<TrendingIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
                    <Tab label="Students" icon={<StudentIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
                    <Tab label="Courses" icon={<CourseIcon />} iconPosition="start" sx={{ fontWeight: 600 }} />
                </Tabs>
            </Box>

            {/* Overview Tab */}
            <CustomTabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Stack spacing={3}>
                            <AnalyticsChart
                                title="Attendance Trends"
                                subtitle="Weekly attendance percentage across all courses"
                                type="area"
                                data={stats?.attendanceTrends || []}
                                dataKeys={['attendance']}
                                height={320}
                            />
                            
                            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ScheduleIcon color="primary" /> Teaching Schedule
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                {stats?.schedule && stats.schedule.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {stats.schedule.map((item: any, i: number) => (
                                            <Grid key={i} size={{ xs: 12, sm: 6 }}>
                                                <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                            <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: 'uppercase' }}>
                                                                {item.day}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {item.time}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body1" fontWeight={700}>{item.course}</Typography>
                                                        <Typography variant="body2" color="text.secondary">Room: {item.room}</Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                                        No scheduled classes found.
                                    </Typography>
                                )}
                            </Paper>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            <AnalyticsChart
                                title="Grade Distribution"
                                subtitle="Student performance across all levels"
                                type="bar"
                                data={stats?.gradeDistribution || []}
                                dataKeys={['value']}
                                colors={[theme.palette.secondary.main]}
                                height={280}
                            />

                            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>Quick Actions</Typography>
                                <Divider sx={{ my: 1, mb: 2 }} />
                                <Stack spacing={1.5}>
                                    <Button fullWidth variant="contained" startIcon={<AttendanceIcon />} sx={{ borderRadius: 2, py: 1 }}>Record Attendance</Button>
                                    <Button fullWidth variant="outlined" startIcon={<AssignmentIcon />} sx={{ borderRadius: 2, py: 1 }}>Classroom Behavior</Button>
                                    <Button fullWidth variant="outlined" startIcon={<AssetsIcon />} sx={{ borderRadius: 2, py: 1 }}>Request Lab Assets</Button>
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6" fontWeight={700} gutterBottom>Recent Activity</Typography>
                                <Box sx={{ mt: 2 }}>
                                    {stats?.recentAttendance && stats.recentAttendance.length > 0 ? (
                                        <Stack spacing={2}>
                                            {stats.recentAttendance.map((att: any) => (
                                                <Box key={att.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                    <Avatar sx={{ width: 28, height: 28, bgcolor: att.status === 'PRESENT' ? 'success.light' : 'error.light' }}>
                                                        <PersonIcon sx={{ fontSize: 16 }} />
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography variant="body2" fontWeight={600}>{att.studentName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Marked {att.status.toLowerCase()} • {new Date(att.date).toLocaleDateString()}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">No recent activity.</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </CustomTabPanel>

            {/* Students Tab */}
            <CustomTabPanel value={tabValue} index={1}>
                <DataTable
                    title="Student Performance"
                    subtitle="Track and manage student academic progress and attendance across your courses."
                    columns={studentColumns}
                    rows={stats?.studentPerformance || []}
                    loading={loading}
                    module="grading"
                    showExport={true}
                    resourceType="grade"
                />
            </CustomTabPanel>

            {/* Courses Tab */}
            <CustomTabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                    {stats?.courses && stats.courses.length > 0 ? (
                        stats.courses.map((course: any) => (
                            <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid', borderColor: 'divider', transition: 'all 0.2s', '&:hover': { boxShadow: theme.shadows[4], transform: 'translateY(-4px)' } }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar sx={{ bgcolor: 'primary.light', width: 48, height: 48 }}>
                                                <CourseIcon />
                                            </Avatar>
                                            <Chip label={course.code} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                        </Box>
                                        <Typography variant="h6" fontWeight={700} gutterBottom>{course.name}</Typography>
                                        <Divider sx={{ my: 1.5, opacity: 0.5 }} />
                                        <Stack spacing={1}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Students</Typography>
                                                <Typography variant="body2" fontWeight={700}>{course.enrollmentsCount}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Avg. Score</Typography>
                                                <Typography variant="body2" fontWeight={700} color="primary.main">{course.avgScore}%</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="text.secondary">Credits</Typography>
                                                <Typography variant="body2" fontWeight={700}>{course.credit}</Typography>
                                            </Box>
                                        </Stack>
                                        <Button fullWidth variant="soft" sx={{ mt: 3, borderRadius: 2 }}>
                                            Manage Course
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Grid size={12}>
                            <Paper sx={{ py: 10, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                                <CourseIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="text.secondary">No courses assigned to you.</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </CustomTabPanel>
        </Box>
    );
}
