'use client';

import React from 'react';
import {
    Box, Typography, alpha, useTheme, Card, CardHeader, CardContent, Avatar, Divider, Stack,
    Grid, Paper, FormControl, InputLabel, Select, MenuItem, Button, Chip, Tooltip, LinearProgress
} from '@mui/material';
import {
    School as SchoolIcon,
    Groups as PeopleIcon,
    Assignment as CourseIcon,
    MoneyOff as MoneyOffIcon,
    Receipt as ReceiptIcon,
    Pending as PendingIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon,
    EmojiEvents as AwardsIcon,
    EventAvailable as ScheduleIcon,
    AutoGraph as InsightIcon,
    Favorite as WellnessIcon,
    TrendingUp as TrendingUpIcon,
    FilterList as FilterListIcon,
    Download as DownloadIcon,
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

export function InstructorDashboard({ stats, loading, user }: any) {
    const theme = useTheme();
    const [selectedCourse, setSelectedCourse] = React.useState('all');
    const [selectedSemester, setSelectedSemester] = React.useState('1');
    const [timeRange, setTimeRange] = React.useState('month');
    const [attendanceView, setAttendanceView] = React.useState<'day' | 'week'>('week');
    const [currentDay, setCurrentDay] = React.useState('');

    // Filtered data states
    const [filteredStats, setFilteredStats] = React.useState<any>(null);

    React.useEffect(() => {
        setCurrentDay(new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase());
    }, []);

    // Apply filters locally for instant responsiveness
    React.useEffect(() => {
        if (!stats) return;

        const filtered = { ...stats };

        // 1. Calculate students for the selected course to derive other metrics
        const baseStudents = stats.studentPerformance || [];
        const currentFiltered = selectedCourse === 'all'
            ? baseStudents
            : baseStudents.filter((s: any) => s.courseCode === stats?.courses?.find((c: any) => c.id === selectedCourse)?.code);

        // 2. Dynamically Re-calculate Grade Distribution from filtered students
        const allScores = currentFiltered.map((s: any) => s.total);
        filtered.gradeDistribution = [
            { name: 'A (85+)', value: allScores.filter((v: any) => v >= 85).length },
            { name: 'B (75-84)', value: allScores.filter((v: any) => v >= 75 && v < 85).length },
            { name: 'C (60-74)', value: allScores.filter((v: any) => v >= 60 && v < 75).length },
            { name: 'D (50-59)', value: allScores.filter((v: any) => v >= 50 && v < 60).length },
            { name: 'F (<50)', value: allScores.filter((v: any) => v < 50).length },
        ];

        // 3. Filter Assessment Averages
        if (selectedCourse !== 'all') {
            const courseData = stats.assessmentAverages?.find((a: any) => a.courseId === selectedCourse);
            filtered.assessmentAverages = courseData ? courseData.breakdown : [];
        } else {
            // Average all assessment breakdowns
            const allBreakdowns = stats.assessmentAverages || [];
            if (allBreakdowns.length > 0) {
                const combined: any = {};
                allBreakdowns.forEach((b: any) => {
                    if (b.breakdown) {
                        b.breakdown.forEach((item: any) => {
                            if (!combined[item.name]) combined[item.name] = { sum: 0, count: 0 };
                            combined[item.name].sum += item.score;
                            combined[item.name].count += 1;
                        });
                    }
                });
                filtered.assessmentAverages = Object.keys(combined).map(name => ({
                    name,
                    score: Math.round(combined[name].sum / combined[name].count)
                }));
            }
        }

        setFilteredStats(filtered);
    }, [selectedCourse, selectedSemester, timeRange, stats]);

    const displayStats = filteredStats || stats;

    const baseStudents = stats?.studentPerformance || [];
    const filteredStudents = selectedCourse === 'all'
        ? baseStudents
        : baseStudents.filter((s: any) => s.courseCode === stats?.courses?.find((c: any) => c.id === selectedCourse)?.code);

    const kpis = [
        {
            label: 'Active Students',
            value: filteredStudents?.length || 0,
            change: selectedCourse === 'all' ? 2.1 : 0,
            trend: 'up' as const,
            icon: 'People',
        },
        {
            label: 'Selection Attendance',
            value: filteredStudents.length > 0
                ? `${Math.round(filteredStudents.reduce((a: any, b: any) => a + b.attendance, 0) / filteredStudents.length)}%`
                : '0%',
            change: -0.5,
            trend: 'down' as const,
            icon: 'Badge',
        },
        {
            label: 'At-Risk Detection',
            value: (displayStats?.atRiskCount || 0).toString(),
            change: displayStats?.atRiskCount > 0 ? 1 : 0,
            trend: (displayStats?.atRiskCount > 0 ? 'down' : 'stable') as any,
            icon: 'Warning',
        },
        {
            label: 'Selection Avg Score',
            value: filteredStudents.length > 0
                ? `${Math.round(filteredStudents.reduce((a: any, b: any) => a + b.total, 0) / filteredStudents.length)}%`
                : '0%',
            change: 4.8,
            trend: 'up' as const,
            icon: 'TrendingUp',
        },
    ];

    const attendanceData = attendanceView === 'week' ? displayStats?.attendanceTrends : displayStats?.attendanceByDay;
    const gradeDistribution = displayStats?.gradeDistribution || [];
    const behaviorData = displayStats?.behaviorSummary || [];

    // New: Teaching schedule with 'current session' highlights (depends on hydrated currentDay)
    const todaySchedule = currentDay ? (displayStats?.schedule?.filter((s: any) => s.day === currentDay) || []) : [];

    const milestones = displayStats?.milestones || [];

    // Columns with 'At-Risk' badges
    const studentColumns: any[] = [
        {
            field: 'name',
            headerName: 'Student Name',
            flex: 1,
            minWidth: 200,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{params.value}</Typography>
                    {(params.row.attendance < 75 || params.row.total < 50) && (
                        <Tooltip title="At-Risk: Low attendance or falling behind in score">
                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
                        </Tooltip>
                    )}
                </Box>
            )
        },
        { field: 'id', headerName: 'ID', width: 120 },
        {
            field: 'attendance',
            headerName: 'Attendance',
            width: 120,
            renderCell: (params: any) => (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={params.value}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        color={params.value > 85 ? 'success' : params.value > 70 ? 'primary' : 'error'}
                    />
                    <Typography variant="caption" fontWeight={700}>{params.value}%</Typography>
                </Box>
            )
        },
        { field: 'courseCode', headerName: 'Course', width: 100 },
        {
            field: 'total',
            headerName: 'Score',
            width: 100,
            type: 'number',
            renderCell: (params: any) => {
                const val = params.value;
                const color = val >= 85 ? 'success' : val >= 60 ? 'primary' : 'error';
                return <Chip label={val} color={color} size="small" variant="soft" sx={{ fontWeight: 700 }} />;
            }
        },
    ];

    const handleExport = () => {
        if (!filteredStudents.length) return;
        // Trigger a simple CSV download
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Name,Attendance,Midterm,Final,Total,Course\n"
            + filteredStudents.map((s: any) => `${s.id},${s.name},${s.attendance},${s.midterm},${s.final},${s.total},${s.courseCode}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Instructor_Report_${selectedCourse}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Box>
            {/* Professional Filter Header */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4, p: 2, borderRadius: 3,
                    display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <FilterListIcon fontSize="small" />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={800}>Filter Analytics</Typography>
                </Stack>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel id="course-select-label">Course Subject</InputLabel>
                    <Select
                        labelId="course-select-label"
                        value={selectedCourse}
                        label="Course Subject"
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="all">All Assigned Courses</MenuItem>
                        {stats?.courses?.map((c: any) => (
                            <MenuItem key={c.id} value={c.id}>{c.name} ({c.code})</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="semester-select-label">Semester</InputLabel>
                    <Select
                        labelId="semester-select-label"
                        value={selectedSemester}
                        label="Semester"
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="1">1st Semester</MenuItem>
                        <MenuItem value="2">2nd Semester</MenuItem>
                        <MenuItem value="summer">Summer Session</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="range-select-label">Time Period</InputLabel>
                    <Select
                        labelId="range-select-label"
                        value={timeRange}
                        label="Time Period"
                        onChange={(e) => setTimeRange(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="week">Past 7 Days</MenuItem>
                        <MenuItem value="month">Current Month</MenuItem>
                        <MenuItem value="term">Academic Term</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ flexGrow: 1 }} />

                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                >
                    Generate Report
                </Button>
            </Paper>

            {/* KPI Section */}
            <KPIGrid kpis={kpis} loading={loading} columns={4} />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Main Trends Chart */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Attendance Tracking"
                        subtitle={attendanceView === 'week' ? "Weekly presence percentage (Last 6 weeks)" : "Daily presence tracking (Current week)"}
                        data={attendanceData || []}
                        type="area"
                        dataKeys={['attendance', 'target']}
                        colors={[theme.palette.primary.main, theme.palette.divider]}
                        loading={loading}
                        height={350}
                        onExport={handleExport}
                        extraActions={
                            <Stack direction="row" spacing={1} sx={{ bgcolor: alpha(theme.palette.action.hover, 0.1), p: 0.5, borderRadius: 2 }}>
                                <Button
                                    size="small"
                                    variant={attendanceView === 'day' ? 'contained' : 'text'}
                                    onClick={() => setAttendanceView('day')}
                                    sx={{ minWidth: 60, borderRadius: 1.5, fontSize: '0.7rem', py: 0 }}
                                >
                                    Daily
                                </Button>
                                <Button
                                    size="small"
                                    variant={attendanceView === 'week' ? 'contained' : 'text'}
                                    onClick={() => setAttendanceView('week')}
                                    sx={{ minWidth: 60, borderRadius: 1.5, fontSize: '0.7rem', py: 0 }}
                                >
                                    Weekly
                                </Button>
                            </Stack>
                        }
                    />
                    {!loading && (!attendanceData || attendanceData.length === 0) && (
                        <Box sx={{ mt: -2, pb: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">No attendance trends found for current selections.</Typography>
                        </Box>
                    )}
                </Grid>

                {/* Academic Progress / Timeline Side Card */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <CardContent>
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }}>
                                    <TimelineIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={800}>Academic Timeline</Typography>
                                    <Typography variant="caption" color="text.secondary">2026 Academic Year • Semester 1</Typography>
                                </Box>
                            </Box>

                            <Stack spacing={3}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={700}>Syllabus Completion</Typography>
                                        <Typography variant="body2" color="primary.main" fontWeight={800}>{displayStats?.syllabusCompletion || 65}%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={displayStats?.syllabusCompletion || 65} sx={{ height: 8, borderRadius: 4 }} />
                                </Box>

                                <Divider />

                                <Box>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ScheduleIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                        Today&apos;s Sessions
                                    </Typography>
                                    <Stack spacing={1}>
                                        {todaySchedule.length > 0 ? todaySchedule.map((session: any, idx: number) => (
                                            <Box key={idx} sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.action.hover, 0.05), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                                                <Typography variant="caption" color="text.secondary" fontWeight={800}>{session.time}</Typography>
                                                <Typography variant="body2" fontWeight={800}>{session.course}</Typography>
                                                <Typography variant="caption" color="text.secondary">Room: {session.room}</Typography>
                                            </Box>
                                        )) : (
                                            <Typography variant="caption" color="text.secondary">No scheduled sessions for today.</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Smart Insights & Classroom Wellness */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <AnalyticsChart
                        title="Classroom Wellness"
                        subtitle="Engagement trends by behavioral records"
                        data={behaviorData || []}
                        type="pie"
                        loading={loading}
                        height={320}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Card sx={{ borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `2px dashed ${alpha(theme.palette.primary.main, 0.1)}`, minHeight: 320 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                                    <InsightIcon />
                                </Avatar>
                                <Typography variant="h6" fontWeight={800}>AI Instruction Insights</Typography>
                            </Box>

                            <Stack spacing={2}>
                                {[
                                    { title: "Class Performance Benchmark", text: `Your ${selectedCourse === 'all' ? 'active selection' : 'current class'} is performing ${(displayStats?.peerAvgScore - 65).toFixed(1)}% above the school benchmark of ${displayStats?.peerAvgScore}%.`, type: 'success' },
                                    { title: "At-Risk Alert", text: displayStats?.atRiskCount > 0 ? `${displayStats?.atRiskCount} student(s) show signs of disengagement. One-on-one intervention recommended.` : "All students are current on their coursework. Keep up the high engagement!", type: displayStats?.atRiskCount > 0 ? 'warning' : 'success' }
                                ].map((note, i) => (
                                    <Box key={i} sx={{ p: 2, borderRadius: 2, bgcolor: alpha((theme.palette as any)[note.type].main, 0.05), borderLeft: `4px solid ${(theme.palette as any)[note.type].main}` }}>
                                        <Typography variant="subtitle2" fontWeight={800} color={`${note.type}.main`}>{note.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{note.text}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button size="small" sx={{ fontWeight: 800 }}>Deeper Student Analysis →</Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Course Comparison & Activity Stream */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <AnalyticsChart
                        title="Subject Comparison"
                        subtitle="Benchmarking performance across all assigned subjects"
                        data={displayStats?.comparisonRadar || []}
                        type="radar"
                        dataKeys={['Academic', 'Attendance', 'Engagement']}
                        colors={[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.warning.main]}
                        loading={loading}
                        height={350}
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <CardHeader
                            title={<Typography variant="subtitle1" fontWeight={800}>Activity Stream</Typography>}
                            avatar={<Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 1), width: 32, height: 32 }}><InsightIcon sx={{ fontSize: 16, color: '#fff' }} /></Avatar>}
                        />
                        <CardContent sx={{ pt: 0 }}>
                            <Stack spacing={2}>
                                {displayStats?.activityFeed?.length > 0 ? displayStats.activityFeed.map((item: any) => (
                                    <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{ mt: 0.5, width: 8, height: 8, borderRadius: '50%', bgcolor: item.type === 'attendance' ? 'error.main' : 'primary.main', flexShrink: 0 }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{item.text}</Typography>
                                            <Typography variant="caption" color="text.secondary">{item.time}</Typography>
                                        </Box>
                                    </Box>
                                )) : (
                                    <Typography variant="caption" color="text.secondary">No recent activities recorded.</Typography>
                                )}
                            </Stack>
                            <Button fullWidth variant="outlined" sx={{ mt: 3, borderRadius: 2, borderStyle: 'dashed', textTransform: 'none', fontWeight: 700 }}>
                                View Full Audit Log
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Final Analytics Row: Grade Distribution, Quick Actions, and Assessments */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Grade Distribution */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <AnalyticsChart
                        title="Grade Distribution"
                        subtitle="Performance breakdown for the selected cohort"
                        data={gradeDistribution.length > 0 ? gradeDistribution : []}
                        type="pie"
                        dataKeys={['value']}
                        loading={loading}
                        height={320}
                        onExport={handleExport}
                    />
                    {!loading && gradeDistribution.every((d: any) => d.value === 0) && (
                        <Box sx={{ mt: -2, pb: 2, textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">No graded assessments found.</Typography>
                        </Box>
                    )}
                </Grid>

                {/* Quick Academic Actions Card */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>Quick Management</Typography>
                            <Stack spacing={2}>
                                {[
                                    { label: 'Take Attendance', desc: 'Record student presence for today', icon: <PeopleIcon />, color: theme.palette.primary.main, link: '/academic/attendance' },
                                    { label: 'Manage Grades', desc: 'Input scores and finalize transcripts', icon: <AwardsIcon />, color: theme.palette.success.main, link: '/academic/grades' },
                                    { label: 'Assessment Plan', desc: 'Define quizzes, exams and weights', icon: <CourseIcon />, color: theme.palette.info.main, link: '/academic/assessments' },
                                ].map((action, i) => (
                                    <Box
                                        key={i}
                                        component="a"
                                        href={action.link}
                                        sx={{
                                            p: 2, borderRadius: 3, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            bgcolor: alpha(action.color, 0.05),
                                            border: `1px solid ${alpha(action.color, 0.1)}`,
                                            textDecoration: 'none', color: 'inherit',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                bgcolor: alpha(action.color, 0.08),
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 4px 12px ${alpha(action.color, 0.1)}`
                                            }
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: action.color, width: 40, height: 40, boxShadow: `0 4px 10px ${alpha(action.color, 0.2)}` }}>
                                            {action.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={800}>{action.label}</Typography>
                                            <Typography variant="caption" color="text.secondary">{action.desc}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>

                            <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}` }}>
                                <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ fontSize: 14 }} /> Dashboard Note:
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                    Data reflects finalized records. Use the actions above to record real student data if your dashboard appears empty.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Assessment Performance chart */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <AnalyticsChart
                        title="Assessment Performance"
                        subtitle="Average results per evaluation type"
                        data={displayStats?.assessmentAverages || []}
                        type="bar"
                        dataKeys={['score']}
                        loading={loading}
                        height={320}
                        onExport={handleExport}
                    />
                </Grid>
            </Grid>

            {/* Student Records Table */}
            <Box sx={{ mt: 4 }}>
                <DataTable
                    title={selectedCourse === 'all' ? "Overall Student Performance" : `Student Performance: ${stats?.courses?.find((c: any) => c.id === selectedCourse)?.name}`}
                    subtitle={`Comprehensive record management for ${selectedCourse === 'all' ? 'all' : 'selected'} students`}
                    columns={studentColumns}
                    rows={filteredStudents}
                    loading={loading}
                    module="academic"
                    resourceType={"student" as any}
                    showSearch
                    showExport
                    onView={() => { }}
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
