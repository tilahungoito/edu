'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
    Groups as GroupIcon, Search as SearchIcon, TrendingUp as TrendIcon,
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
import toast from 'react-hot-toast';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

// ─── Status toggle row component ─────────────────────────────────────────────
function StatusToggle({
    status, onChange,
}: { status: AttendanceStatus; onChange: (s: AttendanceStatus) => void }) {
    const theme = useTheme();
    const options = [
        { s: 'PRESENT' as const, icon: <PresentIcon sx={{ fontSize: 16 }} />, label: 'Present', short: 'P', color: theme.palette.success.main },
        { s: 'LATE' as const, icon: <LateIcon sx={{ fontSize: 16 }} />, label: 'Late', short: 'L', color: theme.palette.warning.main },
        { s: 'ABSENT' as const, icon: <AbsentIcon sx={{ fontSize: 16 }} />, label: 'Absent', short: 'A', color: theme.palette.error.main },
    ];
    return (
        <Box sx={{ display: 'flex', gap: 0.75 }}>
            {options.map(({ s, icon, label, short, color }) => {
                const active = status === s;
                return (
                    <Button
                        key={s}
                        size="small"
                        onClick={() => onChange(s)}
                        startIcon={icon}
                        sx={{
                            minWidth: 80,
                            height: 34,
                            borderRadius: 1.5,
                            fontWeight: 800,
                            fontSize: 11,
                            gap: 0.4,
                            px: 1.2,
                            color: active ? '#fff' : color,
                            bgcolor: active ? color : alpha(color, 0.07),
                            border: `2px solid ${active ? color : alpha(color, 0.18)}`,
                            transition: 'all 0.15s ease',
                            '& .MuiButton-startIcon': { marginRight: 0.4, marginLeft: 0 },
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
        <Card sx={{ borderRadius: 0, borderLeft: `4px solid ${color}`, height: '100%' }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">{label}</Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ color, mt: 0.25 }}>{value}</Typography>
                        {pct !== null && <Typography variant="caption" color="text.secondary">{pct}% of class</Typography>}
                    </Box>
                    <Box sx={{ p: 1.2, borderRadius: 1, bgcolor: alpha(color, 0.1), color }}>{icon}</Box>
                </Box>
                {pct !== null && (
                    <LinearProgress variant="determinate" value={pct} sx={{
                        mt: 1.5, borderRadius: 0, height: 4,
                        bgcolor: alpha(color, 0.1),
                        '& .MuiLinearProgress-bar': { bgcolor: color },
                    }} />
                )}
            </CardContent>
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>({});
    const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});
    const [tab, setTab] = useState(0);
    const [search, setSearch] = useState('');

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');

    // ─── Courses
    const { data: courses, isLoading: loadingCourses } = useQuery({
        queryKey: ['courses', user?.id],
        queryFn: () => coursesService.getAll({
            instructorId: isInstructor ? user?.id : undefined,
            institutionId: user?.tenantType === 'school' ? user?.tenantId : undefined,
        }),
    });

    // ─── Enrollments (reliable, existing endpoint)
    const { data: enrollments, isLoading: loadingEnrollments, refetch: refetchEnrollments } = useQuery({
        queryKey: ['enrollments-for-attendance', selectedCourseId],
        queryFn: () => enrollmentsService.getByCourse(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // ─── Analysis (always load when course selected)
    const { data: analysis, isLoading: loadingAnalysis } = useQuery({
        queryKey: ['course-analysis', selectedCourseId],
        queryFn: () => attendanceService.getCourseAnalysis(selectedCourseId),
        enabled: !!selectedCourseId,
        retry: 1,
        staleTime: 30_000,
    });

    // Pre-fill all students as PRESENT when enrollments load (new course)
    useEffect(() => {
        if (!enrollments) return;
        setLocalStatus({});
        setLocalRemarks({});
        const next: Record<string, AttendanceStatus> = {};
        enrollments.forEach(e => { next[e.id] = 'PRESENT'; });
        setLocalStatus(next);
    }, [enrollments]);

    // Reset statuses when date changes (different session)
    useEffect(() => {
        if (!enrollments) return;
        const next: Record<string, AttendanceStatus> = {};
        enrollments.forEach(e => { next[e.id] = 'PRESENT'; });
        setLocalStatus(next);
        setLocalRemarks({});
    }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Save mutation
    const saveMutation = useMutation({
        mutationFn: (records: any[]) => attendanceService.markBulkStudent({ records }),
        onSuccess: () => {
            toast.success(`Attendance saved for ${enrollments?.length} students!`);
            queryClient.invalidateQueries({ queryKey: ['course-analysis', selectedCourseId] });
        },
        onError: () => toast.error('Failed to save. Please try again.'),
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

    const selectedCourse = courses?.find(c => c.id === selectedCourseId);

    // Filtered enrollments for search
    const filteredEnrollments = (enrollments ?? []).filter(e => {
        const q = search.toLowerCase();
        const name = `${e.student?.user?.firstName ?? ''} ${e.student?.user?.lastName ?? ''} ${e.student?.user?.username ?? ''}`.toLowerCase();
        return name.includes(q);
    });

    // Live summary
    const total = enrollments?.length ?? 0;
    const presentCount = (enrollments ?? []).filter(e => (localStatus[e.id] ?? 'PRESENT') === 'PRESENT').length;
    const lateCount = (enrollments ?? []).filter(e => localStatus[e.id] === 'LATE').length;
    const absentCount = (enrollments ?? []).filter(e => localStatus[e.id] === 'ABSENT').length;

    const PIE = [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main];
    const pieData = [
        { name: 'Present', value: presentCount },
        { name: 'Late', value: lateCount },
        { name: 'Absent', value: absentCount },
    ].filter(d => d.value > 0);

    // DataGrid rows for export
    const exportRows = (enrollments ?? []).map(e => ({
        id: e.id,
        name: `${e.student?.user?.firstName ?? ''} ${e.student?.user?.lastName ?? ''}`.trim() || e.student?.user?.username,
        username: e.student?.user?.username,
        status: localStatus[e.id] ?? 'PRESENT',
        remarks: localRemarks[e.id] ?? '',
        date: selectedDate,
    }));
    const exportCols: GridColDef[] = [
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'username', headerName: 'Username', flex: 1 },
        { field: 'status', headerName: 'Status', width: 110 },
        { field: 'remarks', headerName: 'Remarks', flex: 2 },
        { field: 'date', headerName: 'Date', width: 120 },
    ];

    return (
        <Box sx={{ p: { xs: 1.5, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                        <CalendarIcon sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5 }}>Attendance Tracker</Typography>
                        <Typography variant="caption" color="text.secondary">Record and analyze student attendance per session</Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* ─── Left: Setup panel ─── */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Card sx={{ borderRadius: 4, boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.06)}`, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, position: 'sticky', top: 16 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <SchoolIcon fontSize="small" color="primary" /> Session Setup
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    select fullWidth label="Course" value={selectedCourseId} size="small"
                                    onChange={e => { setSelectedCourseId(e.target.value); setSearch(''); }}
                                    disabled={loadingCourses}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                >
                                    {loadingCourses
                                        ? <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} />Loading...</MenuItem>
                                        : (courses ?? []).map(c => (
                                            <MenuItem key={c.id} value={c.id}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{c.code}</Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                </TextField>

                                <TextField
                                    fullWidth type="date" label="Date" value={selectedDate} size="small"
                                    onChange={e => setSelectedDate(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />

                                {selectedCourse && (
                                    <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
                                        <Typography variant="caption" fontWeight={800} color="primary" display="block" sx={{ mb: 0.5, textTransform: 'uppercase' }}>Course</Typography>
                                        <Typography variant="body2" fontWeight={700}>{selectedCourse.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Code: {selectedCourse.code} · {selectedCourse.credit} cr</Typography>
                                    </Box>
                                )}

                                {selectedCourseId && (
                                    <>
                                        <Stack direction="row" spacing={1}>
                                            <Button fullWidth size="small" variant="outlined" color="success" onClick={() => markAll('PRESENT')} sx={{ fontWeight: 800, borderRadius: 2 }}>All P</Button>
                                            <Button fullWidth size="small" variant="outlined" color="warning" onClick={() => markAll('LATE')} sx={{ fontWeight: 800, borderRadius: 2 }}>All L</Button>
                                            <Button fullWidth size="small" variant="outlined" color="error" onClick={() => markAll('ABSENT')} sx={{ fontWeight: 800, borderRadius: 2 }}>All A</Button>
                                        </Stack>

                                        <Button
                                            fullWidth variant="contained" color="primary" onClick={handleSave}
                                            disabled={!enrollments?.length || saveMutation.isPending}
                                            startIcon={saveMutation.isPending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
                                            sx={{ borderRadius: 2.5, fontWeight: 800, py: 1.2 }}
                                        >
                                            {saveMutation.isPending ? 'Saving...' : `Save (${total} students)`}
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Live stat cards */}
                    {selectedCourseId && enrollments && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                            <StatCard label="Total" value={total} icon={<GroupIcon />} color={theme.palette.primary.main} />
                            <StatCard label="Present" value={presentCount} total={total} icon={<PresentIcon />} color={theme.palette.success.main} />
                            <StatCard label="Late" value={lateCount} total={total} icon={<LateIcon />} color={theme.palette.warning.main} />
                            <StatCard label="Absent" value={absentCount} total={total} icon={<AbsentIcon />} color={theme.palette.error.main} />
                        </Box>
                    )}
                </Grid>

                {/* ─── Right Panel ─── */}
                <Grid size={{ xs: 12, md: 9 }}>
                    {!selectedCourseId ? (
                        <Box sx={{ height: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: `2px dashed ${alpha(theme.palette.divider, 0.12)}`, bgcolor: alpha(theme.palette.divider, 0.02) }}>
                            <CalendarIcon sx={{ fontSize: 72, color: theme.palette.text.disabled, opacity: 0.2, mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" fontWeight={700}>Select a Course</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Choose a course and date to start recording attendance.</Typography>
                        </Box>
                    ) : (
                        <Box>
                            {/* Tabs */}
                            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
                                <Tab label="📋 Record Attendance" />
                                <Tab label="📊 Analytics" />
                                <Tab label="⬇ Export" />
                            </Tabs>

                            {/* ── TAB 0: Record ─────────────────────────────────────── */}
                            {tab === 0 && (
                                <Card sx={{ borderRadius: 4, boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                                    <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
                                            <Typography variant="subtitle1" fontWeight={800}>
                                                {dayjs(selectedDate).format('dddd, MMMM D YYYY')}
                                                <Chip size="small" label={`${filteredEnrollments.length} students`} sx={{ ml: 1.5, fontWeight: 700 }} color="primary" variant="outlined" />
                                            </Typography>
                                            <TextField
                                                size="small" placeholder="Search student..."
                                                value={search} onChange={e => setSearch(e.target.value)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                                                    sx: { borderRadius: 3, width: 200 },
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    {loadingEnrollments ? (
                                        <Box sx={{ p: 3 }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, mb: 1 }}>
                                                    <Skeleton variant="circular" width={44} height={44} />
                                                    <Box sx={{ flex: 1 }}><Skeleton width={160} /><Skeleton width={100} /></Box>
                                                    <Skeleton variant="rounded" width={130} height={36} />
                                                </Box>
                                            ))}
                                        </Box>
                                    ) : filteredEnrollments.length === 0 ? (
                                        <Box sx={{ p: 6, textAlign: 'center' }}>
                                            <GroupIcon sx={{ fontSize: 56, opacity: 0.2, mb: 1 }} />
                                            <Typography color="text.secondary">No students found{search ? ` for "${search}"` : ' enrolled in this course'}.</Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ '& th': { fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.03), fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.5 } }}>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>Student</TableCell>
                                                        <TableCell align="center">Status</TableCell>
                                                        <TableCell>Remarks</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {filteredEnrollments.map((enrollment, idx) => {
                                                        const status = localStatus[enrollment.id] ?? 'PRESENT';
                                                        const fn = enrollment.student?.user?.firstName ?? '';
                                                        const ln = enrollment.student?.user?.lastName ?? '';
                                                        const un = enrollment.student?.user?.username ?? '';
                                                        const fullName = `${fn} ${ln}`.trim() || un;
                                                        const initials = (fn?.[0] ?? un?.[0] ?? '?').toUpperCase();
                                                        const rowColor = status === 'PRESENT' ? theme.palette.success.main
                                                            : status === 'LATE' ? theme.palette.warning.main
                                                                : theme.palette.error.main;

                                                        return (
                                                            <TableRow key={enrollment.id} sx={{
                                                                borderLeft: `4px solid ${alpha(rowColor, 0.5)}`,
                                                                transition: 'background 0.2s',
                                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                                                            }}>
                                                                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, width: 40 }}>
                                                                    {idx + 1}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                        <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(rowColor, 0.13), color: rowColor, fontWeight: 800, fontSize: 15 }}>
                                                                            {initials}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight={700}>{fullName}</Typography>
                                                                            {un && fullName !== un && <Typography variant="caption" color="text.secondary">@{un}</Typography>}
                                                                        </Box>
                                                                    </Box>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <StatusToggle
                                                                        status={status}
                                                                        onChange={s => handleStatusChange(enrollment.id, s)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    <TextField
                                                                        size="small"
                                                                        placeholder="Add remark..."
                                                                        value={localRemarks[enrollment.id] ?? ''}
                                                                        onChange={e => setLocalRemarks(prev => ({ ...prev, [enrollment.id]: e.target.value }))}
                                                                        variant="standard"
                                                                        InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }}
                                                                        sx={{ minWidth: 130 }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}

                                    {/* Footer save */}
                                    {!loadingEnrollments && enrollments && enrollments.length > 0 && (
                                        <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                variant="contained" color="primary" onClick={handleSave}
                                                disabled={saveMutation.isPending}
                                                startIcon={saveMutation.isPending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon />}
                                                sx={{ borderRadius: 2.5, fontWeight: 800, px: 3 }}
                                            >
                                                {saveMutation.isPending ? 'Saving...' : 'Save Attendance'}
                                            </Button>
                                        </Box>
                                    )}
                                </Card>
                            )}

                            {/* ── TAB 1: Analytics ──────────────────────────────────── */}
                            {tab === 1 && (
                                <Card sx={{ borderRadius: 4, boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`, border: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                            <AnalyticsIcon color="primary" />
                                            <Typography variant="subtitle1" fontWeight={800}>Course Analytics</Typography>
                                            {analysis && analysis.presentRate > 0 && <Chip size="small" label={`${analysis.presentRate}% avg presence`} color={analysis.presentRate >= 75 ? 'success' : 'warning'} sx={{ fontWeight: 700, ml: 'auto' }} />}
                                        </Box>

                                        {loadingAnalysis ? (
                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                {[1, 2].map(i => <Skeleton key={i} variant="rectangular" width="45%" height={220} sx={{ borderRadius: 2 }} />)}
                                            </Box>
                                        ) : (
                                            <Grid container spacing={3}>
                                                <Grid size={{ xs: 12, sm: 5 }}>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={1}>Current Session Distribution</Typography>
                                                    <ResponsiveContainer width="100%" height={220}>
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                                                label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                                                                {pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE[i % PIE.length]} />)}
                                                            </Pie>
                                                            <RTooltip />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 7 }}>
                                                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={1}>Attendance Trend (last 10)</Typography>
                                                    {analysis && analysis.trend && analysis.trend.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height={220}>
                                                            <BarChart data={analysis.trend.slice(-10)} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                                                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => dayjs(d).format('MMM D')} />
                                                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                                                <RTooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                                                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                                                <Bar dataKey="present" name="Present" fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
                                                                <Bar dataKey="late" name="Late" fill={theme.palette.warning.main} radius={[4, 4, 0, 0]} />
                                                                <Bar dataKey="absent" name="Absent" fill={theme.palette.error.main} radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Typography variant="body2" color="text.secondary">No trend data yet.</Typography>
                                                        </Box>
                                                    )}
                                                </Grid>
                                            </Grid>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── TAB 2: Export ─────────────────────────────────────── */}
                            {tab === 2 && (
                                <Card sx={{ borderRadius: 4, boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.05)}`, border: `1px solid ${alpha(theme.palette.divider, 0.08)}`, overflow: 'hidden' }}>
                                    <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}` }}>
                                        <Typography variant="subtitle1" fontWeight={800}>Export Attendance List</Typography>
                                        <Typography variant="caption" color="text.secondary">Use the toolbar below to export to CSV</Typography>
                                    </Box>
                                    <DataGrid
                                        rows={exportRows}
                                        columns={exportCols}
                                        autoHeight
                                        showToolbar
                                        disableRowSelectionOnClick
                                        slotProps={{ toolbar: { csvOptions: { fileName: `attendance-${selectedDate}`, utf8WithBom: true }, printOptions: { disableToolbarButton: true } } }}
                                        sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { bgcolor: alpha(theme.palette.primary.main, 0.03), fontWeight: 800 } }}
                                    />
                                </Card>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
