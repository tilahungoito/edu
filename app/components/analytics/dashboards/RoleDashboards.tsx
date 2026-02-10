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
            <KPIGrid kpis={kpis} loading={loading} columns={6} />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, my: 4 }}>
                <AnalyticsChart
                    title="Enrollment Trends"
                    subtitle="Students and teachers over time"
                    data={[
                        { name: 'Jan', students: 420000, teachers: 14200 },
                        { name: 'Feb', students: 425000, teachers: 14350 },
                        { name: 'Mar', students: 430000, teachers: 14500 },
                        { name: 'Apr', students: 435000, teachers: 14650 },
                    ]}
                    type="area"
                    dataKeys={['students', 'teachers']}
                    loading={loading}
                    height={320}
                />
                <AnalyticsChart
                    title="Institution Levels"
                    subtitle="Distribution by tier"
                    data={[
                        { name: 'Primary', value: 620 },
                        { name: 'Secondary', value: 245 },
                        { name: 'Preparatory', value: 83 },
                    ]}
                    type="pie"
                    loading={loading}
                    height={320}
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
        { label: 'Active Enrollments', value: stats?.enrollments || 0, icon: 'Groups', trend: 'up' as const },
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
                    data={chartData}
                    type="area"
                    dataKeys={['attendance', 'revenue']}
                    loading={loading}
                    height={350}
                />

                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Quick Actions</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { label: 'Register Student', icon: <PeopleIcon />, color: theme.palette.primary.main },
                                { label: 'Create Course', icon: <SchoolIcon />, color: theme.palette.secondary.main },
                                { label: 'Record Fee', icon: <CourseIcon />, color: theme.palette.success.main },
                            ].map((action, i) => (
                                <Box key={i} sx={{
                                    p: 2, borderRadius: 3, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    bgcolor: alpha(action.color, 0.05),
                                    border: `1px solid ${alpha(action.color, 0.1)}`,
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
        { label: 'My Courses', value: stats?.courses?.length || 0, icon: 'School', trend: 'stable' as const },
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
                        score: 0 // We don't have avg score in stats yet, but we can list the courses
                    })) || []}
                    type="bar"
                    dataKeys={['score']}
                    loading={loading}
                    height={350}
                />
            </Box>
        </Box>
    );
}

export function StudentDashboard({ stats, loading, user }: any) {
    const theme = useTheme();

    const kpis = [
        { label: 'Current Courses', value: stats?.enrollments?.length || 0, icon: 'School', trend: 'stable' as const },
        { label: 'GPA', value: 'N/A', icon: 'Badge', trend: 'up' as const },
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
                            {[
                                { time: '08:30 AM', subject: 'Advanced Mathematics', room: 'Hall 4A' },
                                { time: '10:45 AM', subject: 'Inorganic Chemistry', room: 'Lab 2' },
                                { time: '02:00 PM', subject: 'Computer Programming', room: 'IT Center' },
                            ].map((cls, i) => (
                                <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.04), borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{cls.time}</Typography>
                                    <Typography variant="body2" fontWeight={800}>{cls.subject}</Typography>
                                    <Typography variant="caption" color="text.secondary">{cls.room}</Typography>
                                </Box>
                            ))}
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
                            height={200}
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
        { label: 'New Enrollments', value: stats?.recentEnrollments || 12, icon: 'People', trend: 'up' as const },
        { label: 'Pending Apps', value: stats?.pendingApplications || 5, icon: 'Course', trend: 'stable' as const },
        { label: 'Transcripts Issued', value: stats?.transcriptsIssued || 28, icon: 'School', trend: 'up' as const },
        { label: 'Active Students', value: stats?.totalStudents || 850, icon: 'Groups', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                <AnalyticsChart
                    title="Enrollment Trends"
                    subtitle="Processed applications this month"
                    data={[
                        { name: 'Week 1', value: 45 },
                        { name: 'Week 2', value: 52 },
                        { name: 'Week 3', value: 38 },
                        { name: 'Week 4', value: 65 },
                    ]}
                    type="area"
                    dataKeys={['value']}
                    loading={loading}
                    height={350}
                />
                <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Recent Activities</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {[
                                { action: 'Approved Application', target: 'Student #12345', time: '2 mins ago' },
                                { action: 'Issued Transcript', target: 'Student #67890', time: '1 hour ago' },
                                { action: 'Updated Record', target: 'Student #54321', time: '3 hours ago' },
                            ].map((act, i) => (
                                <Box key={i} sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.action.hover, 0.04) }}>
                                    <Typography variant="body2" fontWeight={700}>{act.action}</Typography>
                                    <Typography variant="caption" color="text.secondary">{act.target} • {act.time}</Typography>
                                </Box>
                            ))}
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
        { label: 'Total Revenue', value: '1.2M ETB', icon: 'Budget', trend: 'up' as const },
        { label: 'Outstanding Fees', value: '450K ETB', icon: 'MoneyOff', trend: 'down' as const },
        { label: 'Paid Invoices', value: 1250, icon: 'Receipt', trend: 'up' as const },
        { label: 'Pending Payments', value: 45, icon: 'Pending', trend: 'stable' as const },
    ];

    return (
        <Box>
            <KPIGrid kpis={kpis} loading={loading} columns={4} />
            <Box sx={{ mt: 4 }}>
                <AnalyticsChart
                    title="Financial Overview"
                    subtitle="Revenue vs Outstanding"
                    data={[
                        { name: 'Jan', revenue: 250000, outstanding: 80000 },
                        { name: 'Feb', revenue: 320000, outstanding: 60000 },
                        { name: 'Mar', revenue: 280000, outstanding: 95000 },
                        { name: 'Apr', revenue: 410000, outstanding: 45000 },
                    ]}
                    type="bar"
                    dataKeys={['revenue', 'outstanding']}
                    loading={loading}
                    height={350}
                />
            </Box>
        </Box>
    );
}
