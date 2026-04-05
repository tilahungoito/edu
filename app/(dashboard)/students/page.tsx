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
    Divider,
    CircularProgress,
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
import { promotionsService } from '@/app/lib/api/promotions.service';

// Flexible matcher for semester results — always check II before I
// because 'Semester II' contains 'Semester I' as a substring.
const findHistoryBySemester = (histories: any[], semesterNum: 1 | 2) => {
    if (!histories || !Array.isArray(histories)) return null;
    const roman = semesterNum === 1 ? 'I' : 'II';
    const digit = semesterNum.toString();
    
    // Hardened regex: Matches Semester, Sem, S, Term, T, or even standalone I/II or 1/2
    // Negative lookahead (?![A-Za-z\d]) prevents partial matches (e.g. 'I' matching inside 'II')
    const regex = new RegExp(`(Semester|Sem|S|Term|T)?[.\\s-]*(${roman}|${digit})(?![A-Za-z\\d])`, 'i');
    
    // Sort by most recent first to ensure we get the latest academic history
    return [...histories]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .find(h => regex.test(h.academicPeriod?.name || ''));
};

const SyncResultsDialog = ({ open, onClose, institutionId, onSynced }: any) => {
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const { data: periods } = useQuery({
        queryKey: ['academic-periods', institutionId],
        queryFn: () => institutionsService.getAcademicPeriods(institutionId),
        enabled: !!institutionId && open
    });

    const handleSync = async () => {
        if (!selectedPeriod) return toast.error('Please select an academic period');
        setIsSyncing(true);
        try {
            await promotionsService.syncResults(institutionId, selectedPeriod);
            toast.success('Directory synchronized with latest grades');
            onSynced();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <ConfirmDialog
            open={open}
            title="Sync Semester Results"
            confirmLabel={isSyncing ? "Syncing..." : "Sync Now"}
            confirmColor="primary"
            onConfirm={handleSync}
            onClose={onClose}
            message={
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        This will recalculate the semester averages for all students based on their 
                        <strong> Approved & Locked</strong> gradebooks in the selected period.
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Target Academic Period</InputLabel>
                        <Select 
                            value={selectedPeriod} 
                            label="Target Academic Period" 
                            onChange={e => setSelectedPeriod(e.target.value)}
                        >
                            {(periods || []).map((p: any) => (
                                <MenuItem key={p.id} value={p.id}>{p.name} {p.isActive ? '(Active)' : ''}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            }
        />
    );
};

type EnrichedStudent = Student & {
    full_name: string;
    display_email: string;
    institution_name: string;
};


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
    const [syncDialogOpen, setSyncDialogOpen] = useState(false);

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

    const columns: GridColDef<EnrichedStudent>[] = [
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
            valueGetter: (_, row) => findHistoryBySemester(row.academicHistories || [], 1)?.finalAverage,
            renderCell: (params) => {
                const s1 = params.value;
                return (
                    <Tooltip title={s1 != null ? `Total verified average for Semester I: ${Math.round(s1)}%` : 'No finalized results for Sem I'} arrow>
                        <Typography variant="body2" fontWeight={800} color={s1 != null ? (s1 >= 50 ? 'success.main' : 'error.main') : 'text.disabled'}>
                            {s1 != null ? `${Math.round(s1)}%` : '-'}
                        </Typography>
                    </Tooltip>
                );
            }
        },
        {
            field: 'sem2',
            headerName: 'Sem II',
            width: 90,
            valueGetter: (_, row) => findHistoryBySemester(row.academicHistories || [], 2)?.finalAverage,
            renderCell: (params) => {
                const s2 = params.value;
                return (
                    <Tooltip title={s2 != null ? `Total verified average for Semester II: ${Math.round(s2)}%` : 'No finalized results for Sem II'} arrow>
                        <Typography variant="body2" fontWeight={800} color={s2 != null ? (s2 >= 50 ? 'success.main' : 'error.main') : 'text.disabled'}>
                            {s2 != null ? `${Math.round(s2)}%` : '-'}
                        </Typography>
                    </Tooltip>
                );
            }
        },

        {
            field: 'average',
            headerName: 'AVG',
            width: 95,
            valueGetter: (_, row) => {
                const s1 = findHistoryBySemester(row.academicHistories || [], 1)?.finalAverage;
                const s2 = findHistoryBySemester(row.academicHistories || [], 2)?.finalAverage;
                if (s1 != null && s2 != null) return (s1 + s2) / 2;
                return s1 ?? s2 ?? null;
            },
            renderCell: (params) => {
                const avg = params.value;
                if (avg == null) return <Typography variant="body2" color="text.disabled">-</Typography>;
                return (
                    <Chip 
                        label={`${avg.toFixed(1)}%`} 
                        size="small"
                        sx={{ 
                            bgcolor: alpha(avg >= 50 ? theme.palette.success.main : theme.palette.error.main, 0.1), 
                            color: avg >= 50 ? 'success.main' : 'error.main', 
                            fontWeight: 900, 
                            fontSize: '11px', 
                            height: 22,
                            border: `1px solid ${alpha(avg >= 50 ? theme.palette.success.main : theme.palette.error.main, 0.2)}`
                        }} 
                    />
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
                    <Tooltip title={`Academic standing for the current period: ${promoConf.label}`} arrow>
                        <Chip 
                            label={promoConf.label} 
                            size="small"
                            sx={{ 
                                bgcolor: alpha(promoConf.color, 0.1), 
                                color: promoConf.color, 
                                fontWeight: 800, 
                                fontSize: '10px', 
                                height: 20, 
                                textTransform: 'uppercase'
                            }} 
                        />
                    </Tooltip>
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
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2.5, 
                                borderRadius: 4, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.05)}`,
                                    transform: 'translateY(-4px)'
                                }
                            }}
                        >
                            <Avatar sx={{ bgcolor: alpha((theme.palette as any)[color]?.main || theme.palette.primary.main, 0.1), color: `${color}.main`, width: 52, height: 52 }}>
                                {React.cloneElement(icon as React.ReactElement<any>, { sx: { fontSize: 28 } })}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -1 }}>{value}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Typography>
                                {progress !== undefined && (
                                    <LinearProgress variant="determinate" value={progress} color={color} sx={{ height: 6, borderRadius: 3, mt: 1, bgcolor: alpha(theme.palette.divider, 0.1) }} />
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filter & Toolbar Bar */}
            <Box sx={{ mb: 3 }}>
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 2, 
                        borderRadius: 3, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        flexWrap: 'wrap', 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        bgcolor: alpha(theme.palette.background.default, 0.5)
                    }}
                >
                    <TextField
                        placeholder="Search students..."
                        size="small"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        slotProps={{ 
                            input: { 
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                                sx: { borderRadius: 2.5, bgcolor: 'background.paper' }
                            } 
                        }}
                        sx={{ width: { xs: '100%', sm: 300 } }}
                    />
                    
                    <Divider orientation="vertical" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Grade</InputLabel>
                        <Select value={selectedGrade} label="Grade" onChange={e => setSelectedGrade(e.target.value)} sx={{ borderRadius: 2.5, bgcolor: 'background.paper' }}>
                            <MenuItem value="all">All Grades</MenuItem>
                            {grades.map(g => <MenuItem key={String(g)} value={String(g)}>Grade {g}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Program</InputLabel>
                        <Select value={selectedProgram} label="Program" onChange={e => setSelectedProgram(e.target.value)} sx={{ borderRadius: 2.5, bgcolor: 'background.paper' }}>
                            <MenuItem value="all">All Programs</MenuItem>
                            {programs.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                        </Select>
                    </FormControl>

                    {user?.tenantType !== 'school' && (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Institution</InputLabel>
                            <Select value={selectedInstitution} label="Institution" onChange={e => setSelectedInstitution(e.target.value)} sx={{ borderRadius: 2.5, bgcolor: 'background.paper' }}>
                                <MenuItem value="">All Institutions</MenuItem>
                                {institutions.map(i => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, ml: 'auto', alignItems: 'center' }}>
                        <Tooltip title="Sync Results">
                            <IconButton 
                                size="small" 
                                onClick={() => setSyncDialogOpen(true)}
                                sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.05), color: 'secondary.main', ml: 1 }}
                            >
                                <TrendingUpIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh Data">
                            <IconButton 
                                size="small" 
                                onClick={() => refetch()}
                                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), color: 'primary.main', ml: 1 }}
                            >
                                <RefreshIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>

                        <Button 
                            variant="contained" 
                            startIcon={<UploadIcon />} 
                            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, boxShadow: 'none' }}
                        >
                            Import
                        </Button>
                    </Box>
                </Paper>

                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', mr: 1 }}>
                        Quick Filters:
                    </Typography>
                    <Chip 
                        label="All" 
                        size="small" 
                        onClick={() => setSelectedGrade('all')}
                        variant={selectedGrade === 'all' ? 'filled' : 'outlined'}
                        color={selectedGrade === 'all' ? 'primary' : 'default'}
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                    {grades.slice(0, 6).map(g => (
                        <Chip 
                            key={String(g)}
                            label={`G${g}`} 
                            size="small" 
                            onClick={() => setSelectedGrade(String(g))}
                            variant={selectedGrade === String(g) ? 'filled' : 'outlined'}
                            color={selectedGrade === String(g) ? 'primary' : 'default'}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        />
                    ))}
                    {isLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                </Box>
            </Box>

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

            <SyncResultsDialog
                open={syncDialogOpen}
                onClose={() => setSyncDialogOpen(false)}
                institutionId={selectedInstitution || user?.tenantId}
                onSynced={() => refetch()}
            />
        </Box>

    );
}
