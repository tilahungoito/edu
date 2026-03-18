'use client';

import React from 'react';
import { Box, Typography, alpha, useTheme, Card, CardContent, Avatar } from '@mui/material';
import {
    School as SchoolIcon,
    Groups as PeopleIcon,
    Assignment as CourseIcon,
    MoneyOff as MoneyOffIcon,
    Receipt as ReceiptIcon,
    Pending as PendingIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '../';
import { DataTable } from '../../tables';

export function BureauDashboard({ stats, loading, zones, columns, tableTitle, onAdd, resourceType }: any) {
    const theme = useTheme();

    const kpis = stats ? [
        { label: 'Institutions', value: stats.institutions || 0, icon: 'School', trend: 'stable' as const },
        { label: 'Total Students', value: stats.students || 0, icon: 'People', trend: 'stable' as const },
        { label: 'Total Teachers', value: stats.teachers || 0, icon: 'Badge', trend: 'stable' as const },
        { label: 'Current Budget', value: '1.2B', icon: 'Budget', trend: 'up' as const },
    ] : [];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, my: 4 }}>
                <AnalyticsChart
                    title="Enrollment Trends"
                    subtitle="Students and teachers over time"
                    data={stats?.enrollmentTrends || []}
                    type="area"
                    dataKeys={['students', 'teachers']}
                    loading={loading}
                    height={300}
                />
                <AnalyticsChart
                    title="Institution Levels"
                    subtitle="Distribution by tier"
                    data={stats?.institutionLevels || []}
                    type="pie"
                    loading={loading}
                    height={300}
                />
            </Box>

            <DataTable
                title={tableTitle || "Regional Zones"}
                subtitle="Overview of administrative divisions"
                columns={columns}
                rows={zones}
                loading={loading}
                module="management"
                resourceType={resourceType}
                onAdd={onAdd}
                onView={() => { }}
            />
        </Box>
    );
}

export function InstitutionDashboard({ stats, loading, user }: any) {
    const theme = useTheme();

    const kpis = [
        { label: 'Total Students', value: stats?.students || 0, icon: 'People', trend: 'up' as const },
        { label: 'Courses', value: stats?.courses || 0, icon: 'School', trend: 'stable' as const },
        { label: 'At-Risk Students', value: stats?.atRiskCount || 0, icon: 'Warning', trend: (stats?.atRiskCount > 0 ? 'down' : 'stable') as any, color: 'error' },
        { label: 'Revenue (ETB)', value: stats?.totalRevenue || 0, icon: 'Budget', trend: 'up' as const },
    ];

    const chartData = [
        { name: 'Mon', attendance: 92, revenue: 4500 },
        { name: 'Tue', attendance: 88, revenue: 3200 },
        { name: 'Wed', attendance: 95, revenue: 5100 },
        { name: 'Thu', attendance: 91, revenue: 2800 },
        { name: 'Fri', attendance: 89, revenue: 3900 },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, mt: 4 }}>
                <AnalyticsChart
                    title="Daily Attendance & Collections"
                    subtitle="Last 5 business days"
                    data={stats?.attendanceAndRevenue || []}
                    type="area"
                    dataKeys={['attendance', 'revenue']}
                    loading={loading}
                    height={300}
                />

                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Quick Actions</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Register Student', icon: <PeopleIcon />, color: theme.palette.primary.main, href: '/students' },
                                { label: 'Course Catalog', icon: <SchoolIcon />, color: theme.palette.secondary.main, href: '/academic/courses' },
                                { label: 'Transfers', icon: <CourseIcon />, color: theme.palette.success.main, href: '/hr/transfers' },
                            ].map((action, i) => (
                                <Box key={i} 
                                    component="a"
                                    href={action.href}
                                    sx={{
                                    p: 2, borderRadius: 3, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    bgcolor: alpha(action.color, 0.05),
                                    border: `1px solid ${alpha(action.color, 0.1)}`,
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    '&:hover': { bgcolor: alpha(action.color, 0.1) }
                                }}>
                                    <Avatar sx={{ bgcolor: action.color, width: 32, height: 32 }}>
                                        {action.icon}
                                    </Avatar>
                                    <Typography variant="body2" fontWeight={700}>{action.label}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export function InstructorDashboard({ stats, loading }: any) {
    const theme = useTheme();

    const kpis = [
        { label: 'Courses', value: stats?.courses?.length || 0, icon: 'School', trend: 'stable' as const },
        { label: 'My Students', value: stats?.totalStudents || 0, icon: 'People', trend: 'up' as const },
        { label: 'Avg Attendance', value: stats?.recentAttendance?.length > 0 ? 'Verified' : 'N/A', icon: 'Badge', trend: 'up' as const },
        { label: 'Grading Status', value: stats?.courses?.length > 0 ? 'Active' : 'N/A', icon: 'Groups', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4 }}>
                <AnalyticsChart
                    title="Course Performance"
                    subtitle="Average scores across assigned subjects"
                    data={stats?.courses?.map((c: any) => ({
                        name: c.code,
                        score: c.avgScore || 0 
                    })) || []}
                    type="bar"
                    dataKeys={['score']}
                    loading={loading}
                    height={300}
                />
            </Box>
        </Box>
    );
}

export function StudentDashboard({ stats, loading, user }: any) {
    const theme = useTheme();

    const kpis = [
        { label: 'Current Courses', value: stats?.enrollments?.length || 0, icon: 'School', trend: 'stable' as const },
        { label: 'GPA', value: stats?.gpa || '0.00', icon: 'Badge', trend: 'up' as const },
        { label: 'Attendance', value: `${stats?.attendanceRate || 0}%`, icon: 'People', trend: 'up' as const },
        { label: 'Pending Dues', value: '0 ETB', icon: 'Budget', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Upcoming Schedule</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {stats?.upcomingSchedule?.map((cls: any, i: number) => (
                                <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{cls.time}</Typography>
                                    <Typography variant="body2" fontWeight={800}>{cls.subject}</Typography>
                                    <Typography variant="caption" color="text.secondary">{cls.room}</Typography>
                                </Box>
                            )) || <Typography variant="body2" color="text.secondary">No upcoming classes.</Typography>}
                        </Box>
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Grade Distribution</Typography>
                        <AnalyticsChart
                            title=""
                            data={[
                                { name: 'A', count: 4 },
                                { name: 'B', count: 2 },
                                { name: 'C', count: 0 },
                            ]}
                            type="pie"
                            dataKeys={['count']}
                            loading={loading}
                            height={250}
                        />
                    </CardContent>
                </Card>
            </Box>
        </Box>

    );
}

export function RegistrarDashboard({ stats, loading }: any) {
    const theme = useTheme();

    const kpis = [
        { label: 'New Enrollments', value: stats?.recentEnrollments || 0, icon: 'People', trend: 'up' as const },
        { label: 'Unassigned Students', value: stats?.unassignedCount || 0, icon: 'Warning', trend: (stats?.unassignedCount > 0 ? 'down' : 'stable') as any, color: 'warning' },
        { label: 'Transcripts Issued', value: stats?.transcriptsIssued || 0, icon: 'School', trend: 'up' as const },
        { label: 'Active Students', value: stats?.totalStudents || 0, icon: 'Groups', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                <AnalyticsChart
                    title="Enrollment Trends"
                    subtitle="Processed applications this month"
                    data={stats?.enrollmentTrends || []}
                    type="area"
                    dataKeys={['value']}
                    loading={loading}
                    height={300}
                />
                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Recent Activities</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {stats?.recentActivities?.map((act: any, i: number) => (
                                <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.04) }}>
                                    <Typography variant="body2" fontWeight={700}>{act.action}</Typography>
                                    <Typography variant="caption" color="text.secondary">{act.target} • {act.time}</Typography>
                                </Box>
                            )) || <Typography variant="body2" color="text.secondary">No recent activities.</Typography>}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}

export function AccountantDashboard({ stats, loading }: any) {
    // const theme = useTheme(); // Unused

    const kpis = [
        { label: 'Total Revenue', value: `${stats?.totalRevenue?.toLocaleString() || 0} ETB`, icon: 'Budget', trend: 'up' as const },
        { label: 'Active Students', value: stats?.students || 0, icon: 'People', trend: 'stable' as const },
        { label: 'Active Courses', value: stats?.courses || 0, icon: 'School', trend: 'up' as const },
        { label: 'Total Enrollments', value: stats?.enrollments || 0, icon: 'Groups', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4 }}>
                <AnalyticsChart
                    title="Financial Overview"
                    subtitle="Daily Revenue Collection"
                    data={stats?.attendanceAndRevenue || []}
                    type="bar"
                    dataKeys={['revenue']}
                    loading={loading}
                    height={300}
                />
            </Box>
        </Box>
    );
}
