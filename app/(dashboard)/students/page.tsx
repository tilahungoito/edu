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
} from '@mui/material';
import {
    Add as AddIcon,
    Download as DownloadIcon,
    FilterAlt as FilterIcon,
    Upload as UploadIcon,
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import { StudentDialog } from '@/app/components/management/StudentDialog';
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
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>('all');
    const [selectedProgram, setSelectedProgram] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [institutions, setInstitutions] = useState<any[]>([]);

    const { data: students, isLoading, refetch } = useQuery({
        queryKey: ['students', selectedInstitution],
        queryFn: () => studentsService.getAll({ institutionId: selectedInstitution || undefined }),
    });

    // Fetch institutions for filtering
    useQuery({
        queryKey: ['institutions'],
        queryFn: async () => {
            const data = await institutionsService.getAll();
            setInstitutions(data);
            return data;
        }
    });

    // Listen for real-time updates
    useRealTime('STATS_UPDATED', () => {
        refetch();
    });

    // Initialize filter based on user scope
    useState(() => {
        if (user?.tenantType === 'school') {
            setSelectedInstitution(user.tenantId || '');
        }
    });

    const scopedStudents = useScopedData(students || [], 'student');
    const filteredStudents = useMemo(() => {
        let result = (scopedStudents || []).map(student => ({
            ...student,
            display_name: student.user?.username || '',
            display_email: student.user?.email || '',
            institution_name: student.institution?.name || '',
        }));

        if (selectedYear !== 'all') {
            result = result.filter(s => String(s.year) === selectedYear);
        }
        if (selectedProgram !== 'all') {
            result = result.filter(s => s.program === selectedProgram);
        }

        if (searchQuery) {
            const lowSearch = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.display_name.toLowerCase().includes(lowSearch) || 
                s.display_email.toLowerCase().includes(lowSearch) ||
                s.program.toLowerCase().includes(lowSearch)
            );
        }

        return result;
    }, [scopedStudents, selectedYear, selectedProgram, searchQuery]);

    // Extract unique values for filters
    const years = useMemo(() => Array.from(new Set((scopedStudents || []).map(s => String(s.year)))).sort(), [scopedStudents]);
    const programs = useMemo(() => Array.from(new Set((scopedStudents || []).map(s => s.program))).sort(), [scopedStudents]);

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'display_name',
            headerName: 'Student',
            flex: 1.2,
            minWidth: 150,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                        sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            fontSize: '0.875rem',
                            fontWeight: 700
                        }}
                    >
                        {params.row.display_name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {params.row.display_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>
                            {params.row.display_email}
                        </Typography>
                    </Box>
                </Box>
            ),
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
        { field: 'program', headerName: 'Program', width: 130 },
        {
            field: 'year',
            headerName: 'Year',
            width: 80,
            renderCell: (params) => (
                <Chip
                    label={`Y${params.value}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                />
            )
        },
        {
            field: 'phone',
            headerName: 'Phone',
            width: 130,
            valueGetter: (value, row) => row.user?.phone || '-'
        },
        {
            field: 'institution_name',
            headerName: 'Institution',
            flex: 1,
            minWidth: 150,
        },
        {
            field: 'sem1',
            headerName: 'Sem I',
            width: 90,
            renderCell: (params) => {
                const history = params.row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester I'));
                const avg = history?.finalAverage;
                return (
                    <Typography variant="body2" fontWeight={700} color={avg && avg >= 50 ? 'success.main' : 'error.main'}>
                        {avg != null ? `${avg}%` : '-'}
                    </Typography>
                );
            }
        },
        {
            field: 'sem2',
            headerName: 'Sem II',
            width: 90,
            renderCell: (params) => {
                const history = params.row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester II'));
                const avg = history?.finalAverage;
                return (
                    <Typography variant="body2" fontWeight={700} color={avg && avg >= 50 ? 'success.main' : 'error.main'}>
                        {avg != null ? `${avg}%` : '-'}
                    </Typography>
                );
            }
        },
        {
            field: 'average',
            headerName: 'Avg. (%)',
            width: 90,
            renderCell: (params) => {
                const s1 = params.row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester I'))?.finalAverage;
                const s2 = params.row.academicHistories?.find((h: any) => h.academicPeriod?.name.includes('Semester II'))?.finalAverage;
                
                let avg = null;
                if (s1 != null && s2 != null) avg = (s1 + s2) / 2;
                else if (s1 != null) avg = s1;
                else if (s2 != null) avg = s2;

                return (
                    <Typography variant="body2" fontWeight={800} sx={{ 
                        color: avg && avg >= 50 ? 'secondary.main' : 'error.main',
                        bgcolor: avg && avg >= 50 ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        px: 1, borderRadius: 1
                    }}>
                        {avg != null ? `${avg.toFixed(1)}%` : '-'}
                    </Typography>
                );
            }
        },
        {
            field: 'promotionStatus',
            headerName: 'Status',
            width: 140,
            renderCell: (params) => {
                const status = params.row.academicHistories?.[0]?.promotionStatus || 'PENDING';
                const config: Record<string, { color: any, icon: any, label: string }> = {
                    'PASS': { color: 'success', icon: <CheckCircleIcon sx={{ fontSize: 14 }} />, label: 'PROMOTED' },
                    'DETAINED': { color: 'error', icon: <ErrorIcon sx={{ fontSize: 14 }} />, label: 'DETAINED' },
                    'WITHDRAWN': { color: 'warning', icon: <FilterIcon sx={{ fontSize: 14 }} />, label: 'WITHDRAWN' },
                    'PENDING': { color: 'default', icon: <TrendingUpIcon sx={{ fontSize: 14 }} />, label: 'PENDING' }
                };
                const { color, icon, label } = config[status] || config['PENDING'];
                return (
                    <Chip
                        icon={icon}
                        label={label}
                        size="small"
                        color={color}
                        variant="soft"
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                );
            }
        },
    ], [theme]);

    const handleAdd = () => {
        setSelectedStudent(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setIsDialogOpen(true);
    };

    const handleToggleStatus = async (student: Student) => {
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

    const handleDelete = async (student: Student) => {
        try {
            await studentsService.delete(student.id);
            toast.success('Student deleted successfully');
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete student');
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{
                mb: 5,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', lg: 'flex-end' },
                gap: 3
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                        Students Directory
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage and track student information across your {user?.tenantType || 'institution'}.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="soft"
                        startIcon={<DownloadIcon />}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Register Student
                    </Button>
                </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', width: 48, height: 48 }}>
                            <PeopleIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>{filteredStudents.length}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Students</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 48, height: 48 }}>
                            <TrendingUpIcon />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h5" fontWeight={800}>
                                {(() => {
                                    const avg = filteredStudents.reduce((acc, s) => acc + (s.academicHistories?.[0]?.finalAverage || 0), 0) / (filteredStudents.length || 1);
                                    return isNaN(avg) ? '0.0' : avg.toFixed(1);
                                })()}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>Average Performance</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={Number((filteredStudents.reduce((acc, s) => acc + (s.academicHistories?.[0]?.finalAverage || 0), 0) / (filteredStudents.length || 1)) || 0)} 
                                color="success"
                                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1) }}
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', width: 48, height: 48 }}>
                            <CheckCircleIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>
                                {filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'PASS').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Promoted Students</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2.5, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main', width: 48, height: 48 }}>
                            <ErrorIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>
                                {filteredStudents.filter(s => s.academicHistories?.[0]?.promotionStatus === 'DETAINED').length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Detained Students</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Dedicated Filter Bar */}
            <Paper sx={{ 
                p: { xs: 2, md: 3 }, 
                mb: 4, 
                borderRadius: 4, 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center', 
                gap: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
            }}>
                <TextField
                    placeholder="Search by name, email or program..."
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <ViewIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={selectedYear}
                            label="Year"
                            onChange={(e) => setSelectedYear(e.target.value)}
                            sx={{ borderRadius: 2.5 }}
                        >
                            <MenuItem value="all">All Years</MenuItem>
                            {years.map(year => (
                                <MenuItem key={year} value={year}>Year {year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Program</InputLabel>
                        <Select
                            value={selectedProgram}
                            label="Program"
                            onChange={(e) => setSelectedProgram(e.target.value)}
                            sx={{ borderRadius: 2.5 }}
                        >
                            <MenuItem value="all">All Programs</MenuItem>
                            {programs.map(prog => (
                                <MenuItem key={prog} value={prog}>{prog}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {user?.tenantType !== 'school' && (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Institution</InputLabel>
                            <Select
                                value={selectedInstitution}
                                label="Institution"
                                onChange={(e) => setSelectedInstitution(e.target.value)}
                                sx={{ borderRadius: 2.5 }}
                            >
                                <MenuItem value="">All Institutions</MenuItem>
                                {institutions.map(inst => (
                                    <MenuItem key={inst.id} value={inst.id}>{inst.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>
            </Paper>

            <DataTable
                title="All Students"
                subtitle={`Showing ${filteredStudents.length} students`}
                columns={columns}
                rows={filteredStudents}
                loading={isLoading}
                module="students"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={(student: any) => {
                    toast.loading('Generating official report card...', { duration: 2000 });
                    setTimeout(() => {
                        toast.success(`Report card for ${student.user?.username} is ready!`);
                    }, 2000);
                }}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                onRefresh={refetch}
                showSearch={false}
                statusField="isActive"
                toolbarActions={
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="soft"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                            Import CSV
                        </Button>
                    </Box>
                }
            />

            <StudentDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                    refetch();
                }}
                student={selectedStudent}
            />
        </Box>
    );
}

