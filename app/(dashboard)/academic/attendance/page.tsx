'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, Grid, TextField, MenuItem,
    Button, Chip, alpha, useTheme, CircularProgress, Tooltip, IconButton,
    LinearProgress, Skeleton, Stack, Tab, Tabs, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Avatar, InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
    CalendarMonth as CalendarIcon, Save as SaveIcon,
    CheckCircle as PresentIcon, Cancel as AbsentIcon, AccessTime as LateIcon,
    Analytics as AnalyticsIcon, Refresh as RefreshIcon, School as SchoolIcon,
    Groups as GroupIcon, Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import coursesService from '@/app/lib/api/courses.service';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import attendanceService from '@/app/lib/api/attendance.service';
import { useAuthStore } from '@/app/lib/store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { getCurrentSemester, getSemesterOptions } from '@/app/lib/utils/semester';
import toast from 'react-hot-toast';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

// ─── Status toggle row component ─────────────────────────────────────────────
function StatusToggle({
    status, onChange,
}: { status: AttendanceStatus; onChange: (s: AttendanceStatus) => void }) {
    const theme = useTheme();
    const options = [
        { s: 'PRESENT' as const, icon: <PresentIcon sx={{ fontSize: 16 }} />, label: 'Present', color: theme.palette.success.main },
        { s: 'LATE' as const, icon: <LateIcon sx={{ fontSize: 16 }} />, label: 'Late', color: theme.palette.warning.main },
        { s: 'ABSENT' as const, icon: <AbsentIcon sx={{ fontSize: 16 }} />, label: 'Absent', color: theme.palette.error.main },
    ];
    return (
        <Box sx={{ display: 'flex', gap: 0.75 }}>
            {options.map(({ s, icon, label, color }) => {
                const active = status === s;
                return (
                    <Button
                        key={s}
                        size="small"
                        onClick={() => onChange(s)}
                        startIcon={icon}
                        sx={{
                            minWidth: 85,
                            height: 34,
                            borderRadius: 1.5,
                            fontWeight: 800,
                            fontSize: 11,
                            px: 1.2,
                            color: active ? '#fff' : color,
                            bgcolor: active ? color : alpha(color, 0.07),
                            border: `2px solid ${active ? color : alpha(color, 0.18)}`,
                            transition: 'all 0.15s ease',
                            textTransform: 'none',
                            '&:hover': {
                                bgcolor: active ? color : alpha(color, 0.15),
                                boxShadow: `0 3px 10px ${alpha(color, 0.3)}`,
                            },
                        }}
                    >
                        {label}
                    </Button>
                );
            })}
        </Box>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, total }: {
    label: string; value: number; icon: React.ReactNode; color: string; total?: number;
}) {
    const pct = total && total > 0 ? Math.round((value / total) * 100) : null;
    return (
        <Card sx={{ borderRadius: 3, borderLeft: `5px solid ${color}`, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>{label}</Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ color, mt: 0.5 }}>{value}</Typography>
                        {pct !== null && <Typography variant="caption" color="text.secondary" fontWeight={600}>{pct}% of class</Typography>}
                    </Box>
                    <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: alpha(color, 0.1), color }}>{icon}</Box>
                </Box>
                {pct !== null && (
                    <LinearProgress variant="determinate" value={pct} sx={{
                        mt: 2, borderRadius: 1, height: 6,
                        bgcolor: alpha(color, 0.1),
                        '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 1 },
                    }} />
                )}
            </CardContent>
        </Card>
    );
}

// Semester helpers now imported from @/app/lib/utils/semester

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedSemester, setSelectedSemester] = useState<string>(getCurrentSemester());
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
    const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');

    // --- Real-time Updates ---
    useRealTime('attendance_recorded', (data) => {
        // If it's a bulk record or single record for this course, invalidate
        // Note: The backend event doesn't always send courseId, but if we are on a course, we refresh
        if (selectedCourseId) {
            queryClient.invalidateQueries({ queryKey: ['course-analysis', selectedCourseId, selectedSemester] });
            queryClient.invalidateQueries({ queryKey: ['enrollments-for-attendance', selectedCourseId, selectedSemester] });

            if (data.action === 'bulk') {
                toast.success('Attendance records were updated in bulk.', { id: 'rt-attendance' });
            }
        }
    });

    // ─── Queries ───
    const { data: courses, isLoading: loadingCourses } = useQuery({
        queryKey: ['courses', user?.id],
        queryFn: () => coursesService.getAll({
            instructorId: isInstructor ? user?.id : undefined,
            institutionId: user?.scopeId || (user?.tenantType === 'school' ? user?.tenantId : undefined),
        }),
    });

    const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
        queryKey: ['enrollments-for-attendance', selectedCourseId, selectedSemester],
        queryFn: () => enrollmentsService.getByCourse(selectedCourseId, selectedSemester),
        enabled: !!selectedCourseId && !!selectedSemester,
    });

    const { data: analysis, isLoading: loadingAnalysis } = useQuery({
        queryKey: ['course-analysis', selectedCourseId, selectedSemester],
        queryFn: () => attendanceService.getCourseAnalysis(selectedCourseId, selectedSemester),
        enabled: !!selectedCourseId && !!selectedSemester,
        staleTime: 30_000,
    });

    // Sync local status when enrollments load
    useEffect(() => {
        if (!enrollments) return;
        const next: Record<string, AttendanceStatus> = {};
        enrollments.forEach(e => {
            next[e.id] = (localStatus[e.id] || 'PRESENT');
        });
        setLocalStatus(next);
    }, [enrollments]);

    // Reset when date changes
    useEffect(() => {
        if (!enrollments) return;
        const next: Record<string, AttendanceStatus> = {};
        enrollments.forEach(e => { next[e.id] = 'PRESENT'; });
        setLocalStatus(next);
        setLocalRemarks({});
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- Mutations ---
    const saveMutation = useMutation({
        mutationFn: (records: any[]) => attendanceService.markBulkStudent({ records }),
        onSuccess: () => {
            toast.success(`Attendance successfully recorded for ${enrollments?.length} students`);
            // Bug fix: must include selectedSemester to match the full query key
            queryClient.invalidateQueries({ queryKey: ['course-analysis', selectedCourseId, selectedSemester] });
            queryClient.invalidateQueries({ queryKey: ['enrollments-for-attendance', selectedCourseId, selectedSemester] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to record attendance');
        },
    });

    const handleSave = useCallback(() => {
        if (!enrollments?.length) return;
        const records = enrollments.map(e => ({
            enrollmentId: e.id,
            status: localStatus[e.id] ?? 'PRESENT',
            date: selectedDate,
            remarks: localRemarks[e.id] ?? '',
        }));
        saveMutation.mutate(records);
    }, [enrollments, localStatus, localRemarks, selectedDate, saveMutation]);

    const markAll = (status: AttendanceStatus) => {
        if (!enrollments) return;
        const next: Record<string, AttendanceStatus> = {};
        enrollments.forEach(e => { next[e.id] = status; });
        setLocalStatus(next);
    };

    const handleStatusChange = useCallback((id: string, status: AttendanceStatus) => {
        setLocalStatus(prev => ({ ...prev, [id]: status }));
    }, []);

    const selectedCourse = useMemo(() => courses?.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

    // Filtered enrollments for search
    const filteredEnrollments = useMemo(() => (enrollments ?? []).filter(e => {
        const q = search.toLowerCase();
        const fullName = `${e.student?.user?.firstName ?? ''} ${e.student?.user?.lastName ?? ''}`.toLowerCase();
        const username = (e.student?.user?.username ?? '').toLowerCase();
        return fullName.includes(q) || username.includes(q);
    }), [enrollments, search]);

    // Live summary statistics
    const totalCount = enrollments?.length ?? 0;
    const presentCount = (enrollments ?? []).filter(e => (localStatus[e.id] ?? 'PRESENT') === 'PRESENT').length;
    const lateCount = (enrollments ?? []).filter(e => localStatus[e.id] === 'LATE').length;
    const absentCount = (enrollments ?? []).filter(e => localStatus[e.id] === 'ABSENT').length;

    const PIE_COLORS = [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main];
    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Late', value: lateCount },
        { name: 'Absent', value: absentCount },
    ].filter(d => d.value > 0);

    // DataGrid rows for export
    const exportRows = useMemo(() => (enrollments ?? []).map(e => ({
        id: e.id,
        name: `${e.student?.user?.firstName ?? ''} ${e.student?.user?.lastName ?? ''}`.trim() || e.student?.user?.username,
        username: e.student?.user?.username,
        status: localStatus[e.id] ?? 'PRESENT',
        remarks: localRemarks[e.id] ?? '',
        date: selectedDate,
    })), [enrollments, localStatus, localRemarks, selectedDate]);

    const exportCols: GridColDef[] = [
        { field: 'name', headerName: 'Student Name', flex: 1.5 },
        { field: 'username', headerName: 'ID/Username', flex: 1 },
        { field: 'status', headerName: 'Status', width: 120 },
        { field: 'remarks', headerName: 'Remarks', flex: 2 },
        { field: 'date', headerName: 'Date', width: 130 },
    ];

    return (
        <Box sx={{ p: { xs: 2, md: 4, lg: 6 } }} className="animate-fade-in">
            {/* Header Section */}
            <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        display: 'flex',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`
                    }}>
                        <CalendarIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1.5, lineHeight: 1 }}>
                            Attendance Tracking
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                            Streamlined session management and real-time attendance analytics
                        </Typography>
                    </Box>
                </Box>
                {selectedCourseId && (
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Tooltip title="Refresh Data">
                            <IconButton
                                onClick={() => {
                                    queryClient.invalidateQueries({ queryKey: ['enrollments-for-attendance', selectedCourseId, selectedSemester] });
                                    queryClient.invalidateQueries({ queryKey: ['course-analysis', selectedCourseId, selectedSemester] });
                                }}
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
                            >
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
            </Box>

            <Grid container spacing={4}>
                {/* Configuration Panel */}
                <Grid size={{ xs: 12, lg: 3.5 }}>
                    <Stack spacing={3} sx={{ position: 'sticky', top: 32 }}>
                        <Card sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <SchoolIcon fontSize="small" color="primary" /> Session Parameters
                                </Typography>

                                <Stack spacing={3}>
                                    <TextField
                                        select fullWidth label="Select Course" value={selectedCourseId}
                                        onChange={e => { setSelectedCourseId(e.target.value); setSearch(''); }}
                                        disabled={loadingCourses}
                                        InputProps={{ sx: { borderRadius: 2.5 } }}
                                    >
                                        {(courses ?? []).map(c => (
                                            <MenuItem key={c.id} value={c.id}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{c.code}</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <TextField
                                        select fullWidth label="Semester" value={selectedSemester}
                                        onChange={e => setSelectedSemester(e.target.value)}
                                        InputProps={{ sx: { borderRadius: 2.5 } }}
                                    >
                                        <MenuItem value={getCurrentSemester()}>
                                            <Typography variant="body2" fontWeight={700}>Current: {getCurrentSemester()}</Typography>
                                        </MenuItem>
                                        {[0, 1].map(yearOffset => {
                                            const year = new Date().getFullYear() - yearOffset;
                                            const sem1 = `${year - 1}/${String(year).slice(-2)} Semester I`;
                                            const sem2 = `${year - 1}/${String(year).slice(-2)} Semester II`;
                                            return [
                                                <MenuItem key={`${year}-1`} value={sem1}>{sem1}</MenuItem>,
                                                <MenuItem key={`${year}-2`} value={sem2}>{sem2}</MenuItem>,
                                            ];
                                        }).flat()}
                                    </TextField>

                                    <TextField
                                        fullWidth type="date" label="Attendance Date" value={selectedDate}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{ sx: { borderRadius: 2.5 } }}
                                    />

                                    {selectedCourse && (
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: 2.5,
                                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                                            border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
                                        }}>
                                            <Typography variant="caption" fontWeight={900} color="primary" sx={{ display: 'block', mb: 0.5, letterSpacing: 1 }}>SYSTEM INFO</Typography>
                                            <Typography variant="body2" fontWeight={800}>{selectedCourse.name}</Typography>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Instructor: {selectedCourse.instructor?.username || 'N/A'}</Typography>
                                        </Box>
                                    )}

                                    {selectedCourseId && (
                                        <>
                                            <Box sx={{ p: 0.5 }}>
                                                <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ mb: 1, display: 'block', letterSpacing: 0.5 }}>QUICK MARK</Typography>
                                                <Stack direction="row" spacing={1}>
                                                    <Button fullWidth size="small" variant="outlined" color="success" onClick={() => markAll('PRESENT')} sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}>Set All Present</Button>
                                                    <Button fullWidth size="small" variant="outlined" color="error" onClick={() => markAll('ABSENT')} sx={{ fontWeight: 800, borderRadius: 2, textTransform: 'none' }}>Set All Absent</Button>
                                                </Stack>
                                            </Box>

                                            <Button
                                                fullWidth variant="contained" color="primary" onClick={handleSave}
                                                disabled={!enrollments?.length || saveMutation.isPending}
                                                startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                                sx={{ borderRadius: 3, fontWeight: 900, py: 1.5, fontSize: '0.95rem', boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}` }}
                                            >
                                                {saveMutation.isPending ? 'Processing...' : 'Commit Attendance'}
                                            </Button>
                                        </>
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Real-time stats */}
                        {selectedCourseId && enrollments && (
                            <Stack spacing={2}>
                                <StatCard label="ENROLLED" value={totalCount} icon={<GroupIcon />} color={theme.palette.info.main} />
                                <StatCard label="PRESENT" value={presentCount} total={totalCount} icon={<PresentIcon />} color={theme.palette.success.main} />
                                <StatCard label="ABSENT" value={absentCount} total={totalCount} icon={<AbsentIcon />} color={theme.palette.error.main} />
                            </Stack>
                        )}
                    </Stack>
                </Grid>

                {/* Main Content Area */}
                <Grid size={{ xs: 12, lg: 8.5 }}>
                    {!selectedCourseId ? (
                        <Box sx={{
                            height: 500,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                            border: `3px dashed ${alpha(theme.palette.divider, 0.1)}`,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            textAlign: 'center',
                            p: 4
                        }}>
                            <CalendarIcon sx={{ fontSize: 96, color: theme.palette.text.disabled, opacity: 0.15, mb: 3 }} />
                            <Typography variant="h5" color="text.secondary" fontWeight={800}>No Course Selected</Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 400 }}>
                                Please choose a course from the parameters panel to start recording session attendance.
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Card sx={{ borderRadius: 5, overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, boxShadow: '0 4px 24px rgba(0,0,0,0.03)' }}>
                                <Tabs
                                    value={tab}
                                    onChange={(_, v) => setTab(v)}
                                    sx={{
                                        px: 3, pt: 1,
                                        bgcolor: alpha(theme.palette.background.default, 0.8),
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        '& .MuiTab-root': { fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1 }
                                    }}
                                >
                                    <Tab label="Registry" />
                                    <Tab label="Analytics" />
                                    <Tab label="Export" />
                                </Tabs>

                                {/* TAB 0: Registry */}
                                {tab === 0 && (
                                    <Box>
                                        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                            <Typography variant="h6" fontWeight={800}>
                                                {dayjs(selectedDate).format('dddd, MMM D, YYYY')}
                                                <Chip label={`${filteredEnrollments.length} Records`} size="small" sx={{ ml: 2, fontWeight: 800 }} color="primary" />
                                            </Typography>
                                            <TextField
                                                size="small" placeholder="Search by name or ID..."
                                                value={search} onChange={e => setSearch(e.target.value)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><SearchIcon color="primary" /></InputAdornment>,
                                                    sx: { borderRadius: 4, width: 280, bgcolor: 'background.paper' },
                                                }}
                                            />
                                        </Box>

                                        {loadingEnrollments ? (
                                            <Box sx={{ p: 4 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} /></Box>
                                        ) : filteredEnrollments.length === 0 ? (
                                            <Box sx={{ p: 10, textAlign: 'center' }}>
                                                <GroupIcon sx={{ fontSize: 64, opacity: 0.1, mb: 2 }} />
                                                <Typography color="text.secondary" fontWeight={600}>No students found in this course registry.</Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer>
                                                <Table sx={{ minWidth: 650 }}>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', width: 60 }}>#</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Student</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Status Selection</TableCell>
                                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary' }}>Remark</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {filteredEnrollments.map((enrollment, idx) => {
                                                            const status = localStatus[enrollment.id] ?? 'PRESENT';
                                                            const user = enrollment.student?.user;
                                                            const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.username;
                                                            const initials = (fullName?.[0] || '?').toUpperCase();
                                                            const statusColor = status === 'PRESENT' ? theme.palette.success.main
                                                                : status === 'LATE' ? theme.palette.warning.main
                                                                    : theme.palette.error.main;

                                                            return (
                                                                <TableRow key={enrollment.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                                                    <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>{idx + 1}</TableCell>
                                                                    <TableCell>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                            <Avatar sx={{
                                                                                width: 40, height: 40,
                                                                                bgcolor: alpha(statusColor, 0.12),
                                                                                color: statusColor,
                                                                                fontWeight: 900,
                                                                                fontSize: '0.9rem',
                                                                                border: `2px solid ${alpha(statusColor, 0.2)}`
                                                                            }}>
                                                                                {initials}
                                                                            </Avatar>
                                                                            <Box>
                                                                                <Typography variant="body2" fontWeight={800}>{fullName}</Typography>
                                                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{user?.username}</Typography>
                                                                            </Box>
                                                                        </Box>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <StatusToggle status={status} onChange={s => handleStatusChange(enrollment.id, s)} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <TextField
                                                                            fullWidth size="small" placeholder="Optional notes..."
                                                                            value={localRemarks[enrollment.id] ?? ''}
                                                                            onChange={e => setLocalRemarks(prev => ({ ...prev, [enrollment.id]: e.target.value }))}
                                                                            variant="outlined"
                                                                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.75rem', bgcolor: alpha(theme.palette.background.default, 0.5) } }}
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}

                                        <Box sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`, display: 'flex', justifyContent: 'flex-end', bgcolor: alpha(theme.palette.background.default, 0.3) }}>
                                            <Button
                                                variant="contained" color="primary" onClick={handleSave}
                                                disabled={saveMutation.isPending || filteredEnrollments.length === 0}
                                                startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                                                sx={{ borderRadius: 2.5, fontWeight: 900, px: 4, py: 1 }}
                                            >
                                                {saveMutation.isPending ? 'Saving...' : 'Confirm registry'}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}

                                {/* TAB 1: Analytics */}
                                {tab === 1 && (
                                    <Box sx={{ p: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                            <AnalyticsIcon color="primary" />
                                            <Typography variant="h6" fontWeight={800}>Attendance Insights</Typography>
                                            {analysis && (
                                                <Chip label={`${analysis.presentRate}% Efficiency`} color={analysis.presentRate >= 80 ? 'success' : 'warning'} sx={{ fontWeight: 800, ml: 'auto' }} />
                                            )}
                                        </Box>

                                        {loadingAnalysis ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}><CircularProgress /></Box>
                                        ) : (
                                            <Grid container spacing={4}>
                                                <Grid size={{ xs: 12, md: 5 }}>
                                                    <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 2, letterSpacing: 1 }}>SITUATION OVERVIEW</Typography>
                                                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                                    {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                                </Pie>
                                                                <RTooltip />
                                                                <Legend verticalAlign="bottom" height={36} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 7 }}>
                                                    <Typography variant="caption" fontWeight={900} color="text.secondary" sx={{ display: 'block', mb: 2, letterSpacing: 1 }}>TEMPORAL TREND (LAST 10 SESSIONS)</Typography>
                                                    <Box sx={{ height: 300 }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={analysis?.trend?.slice(-10) || []} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.1)} />
                                                                <XAxis dataKey="date" tick={{ fontWeight: 600, fontSize: 10 }} tickFormatter={v => dayjs(v).format('MMM D')} />
                                                                <YAxis tick={{ fontWeight: 600, fontSize: 10 }} />
                                                                <RTooltip cursor={{ fill: alpha(theme.palette.primary.main, 0.05) }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                                <Bar dataKey="present" name="Present" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                                                                <Bar dataKey="absent" name="Absent" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        )}
                                    </Box>
                                )}

                                {/* TAB 2: Export */}
                                {tab === 2 && (
                                    <Box sx={{ p: 0 }}>
                                        <DataGrid
                                            rows={exportRows}
                                            columns={exportCols}
                                            autoHeight
                                            slots={{ toolbar: () => <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}><Typography variant="subtitle2" fontWeight={800}>Raw Registry Export ({selectedDate})</Typography></Box> }}
                                            sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.02), fontWeight: 800 } }}
                                        />
                                    </Box>
                                )}
                            </Card>
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
