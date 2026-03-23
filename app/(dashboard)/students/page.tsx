'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    useTheme,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper,
    LinearProgress,
    InputAdornment,
    TextField,
    IconButton,
    Tooltip,
    Skeleton,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import {
    Add as AddIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    FilterAlt as FilterIcon,
    ExpandMore as ExpandMoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ToggleOn as ActivateIcon,
    ToggleOff as DeactivateIcon,
    Visibility as ViewIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { StudentDialog } from '@/app/components/management/StudentDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import studentsService, { Student } from '@/app/lib/api/students.service';
import { usersService } from '@/app/lib/api/users.service';
import { useAuthStore } from '@/app/lib/store';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { toast } from 'react-hot-toast';

export default function StudentsPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedInstitution, setSelectedInstitution] = useState<string>(
        user?.tenantType === 'school' ? (user?.tenantId || '') : ''
    );
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const handleEdit = (u: any) => {
        setSelectedStudent(u);
        setIsDialogOpen(true);
    };

    const { data: students, isLoading, refetch } = useQuery({
        queryKey: ['students', selectedInstitution],
        queryFn: () => studentsService.getAll({ institutionId: selectedInstitution || undefined }),
    });

    useQuery({
        queryKey: ['institutions'],
        queryFn: async () => {
            const data = await institutionsService.getAll();
            setInstitutions(data);
            return data;
        }
    });

    useRealTime('STATS_UPDATED', () => { refetch(); });

    const scopedStudents = useScopedData(students || [], 'student');

    const enrichedStudents = useMemo(() =>
        (scopedStudents || []).map(student => {
            const firstName = student.user?.firstName || '';
            const lastName = student.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || student.user?.username || 'Unknown Student';
            return {
                ...student,
                full_name: fullName,
                display_email: student.user?.email || '',
                institution_name: student.institution?.name || '',
            };
        }), [scopedStudents]);

    const filteredStudents = useMemo(() => {
        let result = enrichedStudents;
        if (selectedGrade !== 'all') result = result.filter(s => String(s.year) === selectedGrade);
        if (selectedProgram !== 'all') result = result.filter(s => s.program === selectedProgram);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(q) ||
                s.program?.toLowerCase().includes(q)
            );
        }
        return [...result].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [enrichedStudents, selectedGrade, selectedProgram, searchQuery]);

    // Group by year (grade level)
    const groupedStudents = useMemo(() => {
        const groups: Record<string, typeof filteredStudents> = {};
        filteredStudents.forEach(student => {
            const key = student.year ? `Grade ${student.year}` : 'Ungraded';
            if (!groups[key]) groups[key] = [];
            groups[key].push(student);
        });
        return Object.entries(groups).sort(([a], [b]) => {
            const numA = parseInt(a.replace('Grade ', '')) || 999;
            const numB = parseInt(b.replace('Grade ', '')) || 999;
            return numA - numB;
        });
    }, [filteredStudents]);

    const programs = useMemo(() => Array.from(new Set(enrichedStudents.map(s => s.program).filter(Boolean))).sort(), [enrichedStudents]);
    const grades = useMemo(() => Array.from(new Set(enrichedStudents.map(s => s.year).filter(y => y != null))).sort((a, b) => Number(a) - Number(b)), [enrichedStudents]);

    const gradeColors: Record<number, string> = {
        1: '#6366f1', 2: '#8b5cf6', 3: '#ec4899', 4: '#f43f5e',
        5: '#f59e0b', 6: '#10b981', 7: '#06b6d4', 8: '#3b82f6',
        9: '#14b8a6', 10: '#84cc16', 11: '#f97316', 12: '#ef4444',
    };
    const getGradeColor = (grade: string) => {
        const num = parseInt(grade.replace('Grade ', ''));
        return gradeColors[num] || theme.palette.primary.main;
    };



    const handleToggleStatus = async (student: any) => {
        try {
            const isActive = student.user?.isActive;
            if (isActive) {
                await usersService.deactivate(student.userId);
                toast.success('Student account deactivated');
            } else {
                await usersService.activate(student.userId);
                toast.success('Student account activated');
            }
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        }
    };

    const handleDelete = async (student: any) => {
        try {
            await studentsService.delete(student.id);
            toast.success('Student deleted successfully');
            refetch();
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete student');
        }
    };

    const promotionConfig: Record<string, { color: string; label: string }> = {
        'PASS':      { color: theme.palette.success.main,  label: 'Promoted' },
        'DETAINED':  { color: theme.palette.error.main,    label: 'Detained' },
        'WITHDRAWN': { color: theme.palette.warning.main,  label: 'Withdrawn' },
        'PENDING':   { color: theme.palette.text.secondary, label: 'Pending' },
    };

    const columns: GridColDef[] = [
        {
            field: 'index',
            headerName: '#',
            width: 60,
            filterable: false,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}>
                    {params.api.getAllRowIds().indexOf(params.id) + 1}
                </Typography>
            )
        },
        {
            field: 'full_name',
            headerName: 'Student',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => {
                const isActive = params.row.user?.isActive;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 600 }}>
                            {params.value?.[0]}
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{params.value}</Typography>
                            {!isActive ? (
                                <Typography variant="caption" color="error.main" fontWeight={600} noWrap sx={{ display: 'block', mt: -0.5 }}>Inactive</Typography>
                            ) : null}
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: 'id',
            headerName: 'ID',
            width: 100,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'text.secondary' }}>
                    #{params.value.slice(0, 6).toUpperCase()}
                </Typography>
            )
        },
        {
            field: 'year',
            headerName: 'Grade',
            width: 100,
            renderCell: (params) => {
                const color = getGradeColor(`Grade ${params.value}`);
                return (
                    <Chip label={`Grade ${params.value}`} size="small" sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 700, fontSize: '11px', height: 22 }} />
                );
            }
        },
        {
            field: 'program',
            headerName: 'Program',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">{params.value || '-'}</Typography>
            )
        },
        {
            field: 'section',
            headerName: 'Section',
            width: 120,
            valueGetter: (_, row) => row.section?.name,
            renderCell: (params) => (
                params.value ? (
                    <Chip 
                        label={params.value} 
                        size="small" 
                        sx={{ 
                            bgcolor: alpha(theme.palette.success.main, 0.1), 
                            color: theme.palette.success.main, 
                            fontWeight: 700, 
                            fontSize: '11px', 
                            height: 22 
                        }} 
                    />
                ) : (
                    <Chip 
                        label="Unassigned" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                            color: 'text.disabled', 
                            fontWeight: 600, 
                            fontSize: '10px', 
                            height: 20 
                        }} 
                    />
                )
            )
        },
        {
            field: 'sem1',
            headerName: 'Sem I',
            width: 90,
            valueGetter: (_, row) => row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester I'))?.finalAverage,
            renderCell: (params) => {
                const s1 = params.value;
                return (
                    <Typography variant="body2" fontWeight={700} color={s1 != null ? (s1 >= 50 ? 'success.main' : 'error.main') : 'text.disabled'}>
                        {s1 != null ? `${s1}%` : '-'}
                    </Typography>
                );
            }
        },
        {
            field: 'sem2',
            headerName: 'Sem II',
            width: 90,
            valueGetter: (_, row) => row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester II'))?.finalAverage,
            renderCell: (params) => {
                const s2 = params.value;
                return (
                    <Typography variant="body2" fontWeight={700} color={s2 != null ? (s2 >= 50 ? 'success.main' : 'error.main') : 'text.disabled'}>
                        {s2 != null ? `${s2}%` : '-'}
                    </Typography>
                );
            }
        },
        {
            field: 'average',
            headerName: 'Average',
            width: 100,
            valueGetter: (_, row) => {
                const s1 = row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester I'))?.finalAverage;
                const s2 = row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester II'))?.finalAverage;
                if (s1 != null && s2 != null) return (s1 + s2) / 2;
                return s1 ?? s2 ?? null;
            },
            renderCell: (params) => {
                const avg = params.value;
                if (avg == null) return <Typography variant="body2" color="text.disabled">-</Typography>;
                return (
                    <Chip label={`${avg.toFixed(1)}%`} size="small"
                        sx={{ bgcolor: alpha(avg >= 50 ? theme.palette.success.main : theme.palette.error.main, 0.1), color: avg >= 50 ? 'success.main' : 'error.main', fontWeight: 800, fontSize: '11px', height: 22 }} />
                );
            }
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            valueGetter: (_, row) => row.academicHistories?.[0]?.promotionStatus || 'PENDING',
            renderCell: (params) => {
                const promoConf = promotionConfig[params.value as string] || promotionConfig['PENDING'];
                return (
                    <Chip label={promoConf.label} size="small"
                        sx={{ bgcolor: alpha(promoConf.color, 0.1), color: promoConf.color, fontWeight: 700, fontSize: '10px', height: 20 }} />
                );
            }
        }
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>

            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>Students Directory</Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage students organized by grade level
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 2.5 }}>Export</Button>
                    <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={() => { setSelectedStudent(null); setIsDialogOpen(true); }} sx={{ borderRadius: 2.5 }}>
                        Register Student
                    </Button>
                </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Students', value: filteredStudents.length, color: 'primary', icon: <PeopleIcon /> },
                    {
                        label: 'Avg. Performance',
                        value: (() => {
                            const avg = filteredStudents.reduce((acc, s) => acc + (s.academicHistories?.[0]?.finalAverage || 0), 0) / (filteredStudents.length || 1);
                            return isNaN(avg) ? '0.0%' : `${avg.toFixed(1)}%`;
                        })(),
                        color: 'success', icon: <TrendingUpIcon />,
                        progress: Number(filteredStudents.reduce((acc, s) => acc + (s.academicHistories?.[0]?.finalAverage || 0), 0) / (filteredStudents.length || 1)) || 0,
                    },
                    { label: 'Promoted', value: filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'PASS').length, color: 'info', icon: <CheckCircleIcon /> },
                    { label: 'Detained', value: filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'DETAINED').length, color: 'error', icon: <ErrorIcon /> },
                ].map(({ label, value, color, icon, progress }: any) => (
                    <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: alpha((theme.palette as any)[color]?.main || theme.palette.primary.main, 0.1), color: `${color}.main`, width: 48, height: 48 }}>
                                {icon}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block' }}>{label}</Typography>
                                {progress !== undefined && (
                                    <LinearProgress variant="determinate" value={progress} color={color} sx={{ height: 5, borderRadius: 3, mt: 0.5 }} />
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filter & Toolbar Bar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                <TextField
                    placeholder="Search by name or program..."
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    sx={{ width: { xs: '100%', sm: 240 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Grade</InputLabel>
                    <Select value={selectedGrade} label="Grade" onChange={e => setSelectedGrade(e.target.value)} sx={{ borderRadius: 2 }}>
                        <MenuItem value="all">All Grades</MenuItem>
                        {grades.map(g => <MenuItem key={String(g)} value={String(g)}>Grade {g}</MenuItem>)}
                    </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Program</InputLabel>
                    <Select value={selectedProgram} label="Program" onChange={e => setSelectedProgram(e.target.value)} sx={{ borderRadius: 2 }}>
                        <MenuItem value="all">All Programs</MenuItem>
                        {programs.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                </FormControl>
                {user?.tenantType !== 'school' && (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Institution</InputLabel>
                        <Select value={selectedInstitution} label="Institution" onChange={e => setSelectedInstitution(e.target.value)} sx={{ borderRadius: 2 }}>
                            <MenuItem value="">All Institutions</MenuItem>
                            {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                )}
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', alignItems: 'center' }}>
                    <Tooltip title="Refresh"><IconButton size="small" onClick={() => refetch()}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                    <Button size="small" variant="outlined" startIcon={<UploadIcon />} sx={{ borderRadius: 2, fontWeight: 600 }}>Import CSV</Button>
                </Box>
            </Paper>

            {/* Grade count info */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                    {filteredStudents.length} students across {groupedStudents.length} grade{groupedStudents.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            <DataTable
                rows={filteredStudents}
                columns={columns}
                loading={isLoading}
                title=""
                subtitle=""
                module="academic"
                allowedRoles={['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR']}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={() => refetch()}
                showDensitySelector={true}
                statusField="user.isActive"
            />

            {/* Edit/Create Dialog */}
            <StudentDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => { refetch(); setIsDialogOpen(false); }}
                student={selectedStudent}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Student"
                message={`Are you sure you want to permanently delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                confirmColor="error"
                onConfirm={() => handleDelete(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
            />
        </Box>
    );
}
