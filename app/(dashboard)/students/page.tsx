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
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
    EmojiEvents as TrophyIcon,
    MilitaryTech as MedalIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { StudentDialog } from '@/app/components/management/StudentDialog';
import { StudentDetailsDialog } from '@/app/components/management/StudentDetailsDialog';
import { ImportStudentsDialog } from '@/app/components/management/ImportStudentsDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import studentsService, { Student } from '@/app/lib/api/students.service';
import { usersService } from '@/app/lib/api/users.service';
import { useAuthStore } from '@/app/lib/store';
import { useScopedData } from '@/app/lib/hooks/useScopedData';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { toast } from 'react-hot-toast';
import { promotionsService } from '@/app/lib/api/promotions.service';

/**
 * Professional Semester Matcher
 * Strictly filters results to the student's CURRENT grade level to ensure
 * data accuracy and prevents historical scores from leaking into the current dashboard.
 */
const findHistoryBySemester = (histories: any[], semesterNum: 1 | 2, currentGrade: number | string) => {
    if (!histories || !Array.isArray(histories)) return null;

    // 1. Accuracy Filter: Only consider records for the student's current grade level
    const gradeRecords = histories.filter(h => String(h.gradeLevel) === String(currentGrade));

    // 2. Recency Filter: Take the most recent record if multiple exist for some reason
    const sorted = [...gradeRecords].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return sorted.find(h => {
        const name = (h.academicPeriod?.name || '').toUpperCase();
        
        // Match Semester II variants
        const isSem2 = (
            name.includes('SEMESTER II') || 
            name.includes('SEM II') || 
            name.includes('TERM II') ||
            name.includes(' II') ||
            name.endsWith('II') ||
            name.includes('SEMESTER 2') ||
            name.includes('SEM 2') ||
            name.endsWith(' 2')
        );

        if (semesterNum === 2) return isSem2;

        // Match Semester I variants (excluding Semester II)
        const isSem1 = (
            name.includes('SEMESTER I') || 
            name.includes('SEM I') || 
            name.includes('TERM I') ||
            name.includes(' I') ||
            name.endsWith('I') ||
            name.includes('SEMESTER 1') ||
            name.includes('SEM 1') ||
            name.endsWith(' 1')
        );

        return isSem1 && !isSem2;
    });
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
    calculated_avg: number | null;
    is_provisional: boolean; // True if average is based on only 1 semester
    performance_cat: string;
    rank: number | null;
    rank_trend: number;
    s1_avg: number | null;
    s2_avg: number | null;
    percentile: number;
    /** The rank stored by the backend after a sync — null if never synced */
    backend_rank: number | null;
    /** The rank from the second-most-recent synced period — used for trend arrows */
    prev_rank: number | null;
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
    const [selectedPerformance, setSelectedPerformance] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [viewTarget, setViewTarget] = useState<any | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
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

    useRealTime('student_registered', () => { refetch(); });
    useRealTime('student_updated', () => { refetch(); });
    useRealTime('student_deleted', () => { refetch(); });
    useRealTime('STATS_UPDATED', () => { refetch(); });

    const scopedStudents = useScopedData(students || [], 'student');

    const enrichedStudents = useMemo(() => {
        // First pass: Basic enrichment — averages, performance tiers, backend rank
        const base = (scopedStudents || []).map(student => {
            const firstName = student.user?.firstName || '';
            const lastName = student.user?.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim() || student.user?.username || 'Unknown Student';

            const s1 = findHistoryBySemester(student.academicHistories || [], 1, student.year)?.finalAverage;
            const s2 = findHistoryBySemester(student.academicHistories || [], 2, student.year)?.finalAverage;
            
            // Professional running average logic
            const avg = (s1 != null && s2 != null) ? (s1 + s2) / 2 : (s1 ?? s2 ?? null);
            const is_provisional = (s1 == null || s2 == null) && avg !== null;

            let performance = 'PROBATION';
            if (avg !== null) {
                if (avg >= 95) performance = 'SUMMA_CUM_LAUDE';
                else if (avg >= 90) performance = 'MAGNA_CUM_LAUDE';
                else if (avg >= 85) performance = 'CUM_LAUDE';
                else if (avg >= 75) performance = 'HONOR_ROLL';
                else if (avg >= 60) performance = 'SATISFACTORY';
                else if (avg >= 50) performance = 'AT_RISK';
                else performance = 'PROBATION';
            }

            // Read backend-synced ranks (most recent first)
            const rankedHistories = [...(student.academicHistories || [])]
                .filter(h => h.rank != null)
                .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            const backend_rank = rankedHistories[0]?.rank ?? null;
            const prev_rank = rankedHistories[1]?.rank ?? null;

            return {
                ...student,
                full_name: fullName,
                display_email: student.user?.email || '',
                institution_name: student.institution?.name || '',
                calculated_avg: avg,
                is_provisional,
                performance_cat: performance,
                backend_rank,
                prev_rank,
                rank: backend_rank, // placeholder; resolved in second pass
                rank_trend: 0,      // placeholder; resolved in second pass
                s1_avg: s1,
                s2_avg: s2
            };
        });

        // Second pass: Compute live section ranks from averages.
        // Group students by section (fallback: grade+program).
        // Rank #1 = highest average within the group.
        // This ensures the rank column is always populated even before a sync.
        const sectionGroups: Record<string, { id: string; avg: number }[]> = {};
        base.forEach(s => {
            if (s.calculated_avg !== null) {
                const key = s.section?.id || `grade_${s.year}_${s.program || 'all'}`;
                if (!sectionGroups[key]) sectionGroups[key] = [];
                sectionGroups[key].push({ id: s.id, avg: s.calculated_avg });
            }
        });

        const computedRanks: Record<string, number> = {};
        Object.values(sectionGroups).forEach(group => {
            // Sort by average descending — highest average = rank #1
            group.sort((a, b) => b.avg - a.avg);
            group.forEach((item, index) => {
                computedRanks[item.id] = index + 1;
            });
        });

        // Third pass: Percentile calculation per grade level
        const gradeGroups: Record<number, number[]> = {};
        base.forEach(s => {
            if (s.calculated_avg !== null) {
                if (!gradeGroups[s.year]) gradeGroups[s.year] = [];
                gradeGroups[s.year].push(s.calculated_avg);
            }
        });
        Object.keys(gradeGroups).forEach(year => {
            gradeGroups[Number(year)].sort((a, b) => a - b);
        });

        return base.map(s => {
            // Prefer backend synced rank; if unavailable fall back to live computed rank
            const effectiveRank: number | null = s.backend_rank ?? (s.calculated_avg !== null ? (computedRanks[s.id] ?? null) : null);
            // Rank trend: backend rank vs previous synced rank (computed rank has no history)
            const rank_trend = (s.backend_rank && s.prev_rank) ? s.prev_rank - s.backend_rank : 0;

            let percentile = 0;
            if (s.calculated_avg !== null && gradeGroups[s.year]) {
                const avgs = gradeGroups[s.year];
                const countBelow = avgs.filter(v => v < s.calculated_avg!).length;
                percentile = (countBelow / avgs.length) * 100;
            }

            return { ...s, rank: effectiveRank, rank_trend, percentile };
        });
    }, [scopedStudents]);

    const filteredStudents = useMemo(() => {
        let result = enrichedStudents;
        if (selectedGrade !== 'all') result = result.filter(s => String(s.year) === selectedGrade);
        if (selectedProgram !== 'all') result = result.filter(s => s.program === selectedProgram);
        if (selectedPerformance !== 'all') result = result.filter(s => s.performance_cat === selectedPerformance);
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.full_name.toLowerCase().includes(q) ||
                s.program?.toLowerCase().includes(q)
            );
        }
        return [...result].sort((a, b) => a.full_name.localeCompare(b.full_name));
    }, [enrichedStudents, selectedGrade, selectedProgram, selectedPerformance, searchQuery]);

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

    const handleExport = () => {
        const headers = ['Rank', 'Name', 'Email', 'Grade', 'Program', 'Section', 'Sem I', 'Sem II', 'Average', 'Standing', 'Status'];
        const data = filteredStudents.map(s => [
            s.rank || '-',
            s.full_name,
            s.display_email,
            s.year,
            s.program || '-',
            s.section?.name || '-',
            findHistoryBySemester(s.academicHistories || [], 1, s.year)?.finalAverage || '-',
            findHistoryBySemester(s.academicHistories || [], 2, s.year)?.finalAverage || '-',
            s.calculated_avg?.toFixed(1) || '-',
            s.performance_cat,
            s.academicHistories?.[0]?.promotionStatus || 'PENDING'
        ]);

        const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `student_directory_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Exporting directory...');
    };

    const handleDelete = async (student: any) => {
        try {
            await studentsService.delete(student.id);
            toast.success('Student deleted successfully');
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete student');
        }
    };

    const promotionConfig: Record<string, { color: string; label: string }> = {
        'PASS': { color: theme.palette.success.main, label: 'Promoted' },
        'DETAINED': { color: theme.palette.error.main, label: 'Detained' },
        'WITHDRAWN': { color: theme.palette.warning.main, label: 'Withdrawn' },
        'PENDING': { color: theme.palette.text.secondary, label: 'Pending' },
    };

    const columns: GridColDef<EnrichedStudent>[] = [
        {
            field: 'rank',
            headerName: 'Section Rank',
            width: 130,
            renderCell: (params) => {
                const val = params.value as number | null;
                const trend = params.row.rank_trend;
                const isSynced = params.row.backend_rank != null;

                if (val === null || val === undefined) {
                    return <Typography variant="caption" color="text.disabled">--</Typography>;
                }

                let badgeColor = theme.palette.primary.main;
                let Icon = null;

                if (val === 1) { badgeColor = '#FFD700'; Icon = TrophyIcon; } // Gold
                else if (val === 2) { badgeColor = '#C0C0C0'; Icon = MedalIcon; } // Silver
                else if (val === 3) { badgeColor = '#CD7F32'; Icon = MedalIcon; } // Bronze

                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip
                            title={
                                isSynced
                                    ? `Official Rank: #${val}${trend !== 0 ? ` · ${trend > 0 ? '↑ Improved' : '↓ Declined'} by ${Math.abs(trend)} positions` : ' · No change since last period'}`
                                    : `Live Computed Rank: #${val} (based on current averages · sync for official rank)`
                            }
                            arrow
                        >
                            <Chip
                                icon={Icon ? <Icon sx={{ fontSize: '14px !important', color: 'inherit' }} /> : undefined}
                                label={`#${val}`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(badgeColor, 0.1),
                                    color: val <= 3 ? badgeColor : 'primary.main',
                                    fontWeight: 900,
                                    fontSize: '12px',
                                    border: `1px solid ${alpha(badgeColor, 0.3)}`,
                                    borderRadius: 1.5,
                                    '& .MuiChip-icon': { color: 'inherit' }
                                }}
                            />
                        </Tooltip>
                        {trend !== 0 && (
                            <Box sx={{ color: trend > 0 ? 'success.main' : 'error.main', display: 'flex', alignItems: 'center', gap: 0.2 }}>
                                {trend > 0 ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
                                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '10px' }}>{Math.abs(trend)}</Typography>
                            </Box>
                        )}
                    </Box>
                );
            }
        },
        {
            field: 'performance_cat',
            headerName: 'Standing',
            width: 170,
            renderCell: (params) => {
                const cat = params.value;
                const config: Record<string, { color: string; label: string; icon?: any }> = {
                    'SUMMA_CUM_LAUDE': { color: '#D4AF37', label: 'Summa Cum Laude', icon: TrophyIcon },
                    'MAGNA_CUM_LAUDE': { color: '#C0C0C0', label: 'Magna Cum Laude', icon: MedalIcon },
                    'CUM_LAUDE': { color: '#CD7F32', label: 'Cum Laude', icon: MedalIcon },
                    'HONOR_ROLL': { color: theme.palette.secondary.main, label: 'Honor Roll', icon: SchoolIcon },
                    'SATISFACTORY': { color: theme.palette.primary.main, label: 'Satisfactory' },
                    'AT_RISK': { color: theme.palette.warning.main, label: 'At Risk' },
                    'PROBATION': { color: theme.palette.error.main, label: 'Probation' },
                };

                const { color, label, icon: Icon } = config[cat] || { color: theme.palette.text.secondary, label: cat };

                return (
                    <Chip
                        icon={Icon ? <Icon sx={{ fontSize: '12px !important', color: 'inherit' }} /> : undefined}
                        label={label}
                        size="small"
                        sx={{
                            bgcolor: alpha(color, 0.1),
                            color: color,
                            fontWeight: 800,
                            fontSize: '10px',
                            height: 22,
                            borderRadius: 1.5,
                            textTransform: 'uppercase',
                            border: `1px solid ${alpha(color, 0.2)}`,
                            '& .MuiChip-icon': { color: 'inherit' }
                        }}
                    />
                );
            }
        },
        {
            field: 'percentile',
            headerName: 'Percentile',
            width: 100,
            renderCell: (params) => {
                const p = params.value || 0;
                const topP = 100 - p;
                let color = theme.palette.text.secondary;
                if (topP <= 5) color = '#D4AF37';
                else if (topP <= 10) color = theme.palette.secondary.main;
                else if (topP <= 25) color = theme.palette.primary.main;

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color, fontSize: '10px', lineHeight: 1 }}>
                            {topP <= 25 ? `TOP ${Math.ceil(topP)}%` : `P${Math.floor(p)}`}
                        </Typography>
                        <LinearProgress
                            variant="determinate"
                            value={p}
                            sx={{
                                width: '80%',
                                height: 4,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.divider, 0.1),
                                '& .MuiLinearProgress-bar': { bgcolor: color }
                            }}
                        />
                    </Box>
                );
            }
        },
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
            valueGetter: (_, row) => findHistoryBySemester(row.academicHistories || [], 1, row.year)?.finalAverage,
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
            valueGetter: (_, row) => findHistoryBySemester(row.academicHistories || [], 2, row.year)?.finalAverage,
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
            field: 'trend',
            headerName: 'Trend',
            width: 80,
            renderCell: (params) => {
                const s1 = findHistoryBySemester(params.row.academicHistories || [], 1, params.row.year)?.finalAverage;
                const s2 = findHistoryBySemester(params.row.academicHistories || [], 2, params.row.year)?.finalAverage;

                if (s1 == null || s2 == null) return null;

                const diff = s2 - s1;
                if (Math.abs(diff) < 1) return <TrendingFlatIcon sx={{ color: 'text.disabled', fontSize: 20 }} />;

                return (
                    <Tooltip title={`${diff > 0 ? 'Improved' : 'Declined'} by ${Math.abs(diff).toFixed(1)}%`} arrow>
                        {diff > 0 ?
                            <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} /> :
                            <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        }
                    </Tooltip>
                );
            }
        },
        {
            field: 'average',
            headerName: 'AVG',
            width: 95,
            valueGetter: (_, row) => row.calculated_avg,
            renderCell: (params) => {
                const avg = params.value;
                const row = params.row;
                if (avg == null) return <Typography variant="body2" color="text.disabled">-</Typography>;

                let color = theme.palette.success.main;
                if (avg < 50) color = theme.palette.error.main;
                else if (avg < 60) color = theme.palette.warning.main;
                else if (avg < 75) color = theme.palette.info.main;

                return (
                    <Tooltip 
                        title={
                            <Box sx={{ p: 1 }}>
                                <Typography variant="caption" fontWeight={800} display="block" gutterBottom>
                                    {row.is_provisional ? 'RUNNING AVERAGE (PROVISIONAL)' : 'FINAL ACADEMIC AVERAGE'}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                                        <Typography variant="caption">Semester I:</Typography>
                                        <Typography variant="caption" fontWeight={700}>{row.s1_avg != null ? `${row.s1_avg.toFixed(1)}%` : 'N/A'}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                                        <Typography variant="caption">Semester II:</Typography>
                                        <Typography variant="caption" fontWeight={700}>{row.s2_avg != null ? `${row.s2_avg.toFixed(1)}%` : 'N/A'}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 0.5, borderColor: alpha('#fff', 0.1) }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                                        <Typography variant="caption">Resulting GPA:</Typography>
                                        <Typography variant="caption" fontWeight={900} color="primary.light">{avg.toFixed(1)}%</Typography>
                                    </Box>
                                    {row.is_provisional && (
                                        <Typography variant="caption" sx={{ mt: 1, color: 'warning.main', fontStyle: 'italic', display: 'block', maxWidth: 180 }}>
                                            * Calculated based on current available data. Sync missing semester for final grade.
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        } 
                        arrow
                    >
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Chip
                                label={`${avg.toFixed(1)}%`}
                                size="small"
                                variant={row.is_provisional ? 'outlined' : 'filled'}
                                sx={{
                                    bgcolor: row.is_provisional ? 'transparent' : alpha(color, 0.1),
                                    color: color,
                                    fontWeight: 900,
                                    fontSize: '11px',
                                    height: 22,
                                    border: `1px solid ${alpha(color, row.is_provisional ? 0.5 : 0.2)}`
                                }}
                            />
                        </Box>
                    </Tooltip>
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
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExport}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<UploadIcon />}
                        onClick={() => setImportDialogOpen(true)}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Import CSV
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => { setSelectedStudent(null); setIsDialogOpen(true); }}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Register Student
                    </Button>
                </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Students', value: filteredStudents.length, color: 'primary', icon: <PeopleIcon /> },
                    {
                        label: 'Mean Average',
                        value: (() => {
                            const studentsWithAvg = filteredStudents.filter(s => s.calculated_avg != null);
                            const avg = studentsWithAvg.reduce((acc, s) => acc + (s.calculated_avg || 0), 0) / (studentsWithAvg.length || 1);
                            return isNaN(avg) ? '0.0%' : `${avg.toFixed(1)}%`;
                        })(),
                        color: 'success', icon: <TrendingUpIcon />,
                        progress: Number(filteredStudents.reduce((acc, s) => acc + (s.calculated_avg || 0), 0) / (filteredStudents.filter(s => s.calculated_avg != null).length || 1)) || 0,
                    },
                    {
                        label: 'Honor Roll',
                        value: (() => {
                            const honorCount = filteredStudents.filter(s => (s.calculated_avg || 0) >= 75).length;
                            const total = filteredStudents.length || 1;
                            return `${((honorCount / total) * 100).toFixed(0)}%`;
                        })(),
                        color: 'secondary',
                        icon: <TrophyIcon />,
                        progress: (filteredStudents.filter(s => (s.calculated_avg || 0) >= 75).length / (filteredStudents.length || 1)) * 100
                    },
                    {
                        label: 'Promotion Rate',
                        value: (() => {
                            const passed = filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'PASS').length;
                            const total = filteredStudents.length || 1;
                            return `${((passed / total) * 100).toFixed(0)}%`;
                        })(),
                        color: 'info',
                        icon: <CheckCircleIcon />,
                        progress: (filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'PASS').length / (filteredStudents.length || 1)) * 100
                    },
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
                        <InputLabel>Academic Standing</InputLabel>
                        <Select
                            value={selectedPerformance}
                            label="Academic Standing"
                            onChange={e => setSelectedPerformance(e.target.value)}
                            sx={{ borderRadius: 2.5, bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="all">All Standings</MenuItem>
                            <MenuItem value="SUMMA_CUM_LAUDE">Summa Cum Laude (95%+)</MenuItem>
                            <MenuItem value="MAGNA_CUM_LAUDE">Magna Cum Laude (90%+)</MenuItem>
                            <MenuItem value="CUM_LAUDE">Cum Laude (85%+)</MenuItem>
                            <MenuItem value="HONOR_ROLL">Honor Roll (75%+)</MenuItem>
                            <MenuItem value="SATISFACTORY">Satisfactory (60-74%)</MenuItem>
                            <MenuItem value="AT_RISK">At Risk (50-59%)</MenuItem>
                            <MenuItem value="PROBATION">Probation (&lt; 50%)</MenuItem>
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
                            onClick={() => setImportDialogOpen(true)}
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
                onView={setViewTarget}
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

            <StudentDetailsDialog
                open={!!viewTarget}
                onClose={() => setViewTarget(null)}
                student={viewTarget}
            />

            <ImportStudentsDialog
                open={importDialogOpen}
                onClose={() => setImportDialogOpen(false)}
                onSuccess={() => refetch()}
                institutionId={selectedInstitution || user?.tenantId || ''}
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
