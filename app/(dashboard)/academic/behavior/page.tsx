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
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Warning as WarningIcon,
    EmojiEvents as AwardsIcon,
    Visibility as ViewIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    Security as PrivateIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/app/components/tables/DataTable';
import { BehaviorDialog } from '@/app/components/classroom/BehaviorDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import classroomService from '@/app/lib/api/classroom.service';
import { useAuthStore } from '@/app/lib/store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';

const BEHAVIOR_CONFIG: Record<string, { color: string; label: string; icon: any }> = {
    'POSITIVE': { color: '#10b981', label: 'Positive', icon: <AwardsIcon /> },
    'WARNING': { color: '#f59e0b', label: 'Warning', icon: <WarningIcon /> },
    'DISCIPLINARY': { color: '#ef4444', label: 'Disciplinary', icon: <WarningIcon /> },
    'CRITICAL': { color: '#7f1d1d', label: 'Critical', icon: <WarningIcon /> },
};

export default function BehaviorPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    const { data: records, isLoading, refetch } = useQuery({
        queryKey: ['behavior-records', user?.tenantId, selectedType],
        queryFn: () => classroomService.getBehaviorByInstitution(
            user?.tenantId || '',
            selectedType === 'all' ? undefined : selectedType
        ),
        enabled: !!user?.tenantId,
    });

    useRealTime('behavior_recorded', () => { refetch(); });
    useRealTime('behavior_deleted', () => { refetch(); });

    const filteredRecords = useMemo(() => {
        if (!records) return [];
        let result = records;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.title.toLowerCase().includes(q) ||
                r.student?.user?.firstName?.toLowerCase().includes(q) ||
                r.student?.user?.lastName?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [records, searchQuery]);

    const stats = useMemo(() => {
        if (!records) return { critical: 0, positive: 0, total: 0 };
        return {
            critical: records.filter(r => r.type === 'CRITICAL').length,
            positive: records.filter(r => r.type === 'POSITIVE').length,
            total: records.length,
        };
    }, [records]);

    const handleDelete = async (record: any) => {
        try {
            await classroomService.deleteBehavior(record.id);
            toast.success('Record deleted');
            refetch();
            setDeleteTarget(null);
        } catch (error: any) {
            toast.error('Failed to delete record');
        }
    };

    const columns: any[] = [
        {
            field: 'student',
            headerName: 'Student',
            flex: 1,
            minWidth: 180,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.primary.main, fontWeight: 700, fontSize: '0.8rem' }}>
                        {params.row.student?.user?.firstName?.[0] || '?'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>
                            {params.row.student?.user?.firstName} {params.row.student?.user?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ID: {params.row.studentId.slice(0, 8)}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 130,
            renderCell: (params: any) => {
                const config = BEHAVIOR_CONFIG[params.value] || BEHAVIOR_CONFIG.WARNING;
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        sx={{
                            bgcolor: alpha(config.color, 0.1),
                            color: config.color,
                            fontWeight: 800,
                            fontSize: '11px',
                            border: `1px solid ${alpha(config.color, 0.2)}`
                        }}
                    />
                );
            }
        },
        {
            field: 'title',
            headerName: 'Observation',
            flex: 1,
            minWidth: 200,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.value}</Typography>
                    {params.row.isPrivate && (
                        <PrivateIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                    )}
                </Box>
            )
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            renderCell: (params: any) => (
                <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                </Typography>
            )
        },
    ];

    return (
        <Box sx={{ p: { xs: 2.5, md: 5 }, maxWidth: '1440px', mx: 'auto' }} className="animate-fade-in">
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { md: 'flex-end' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1, mb: 1 }}>
                        Student Behavior & Wellness
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Comprehensive management of behavioral observations and disciplinary tracking.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => refetch()}
                        sx={{ borderRadius: 2.5, fontWeight: 700 }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => { setSelectedRecord(null); setIsDialogOpen(true); }}
                        sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                    >
                        New Observation
                    </Button>
                </Box>
            </Box>

            {/* Stats Summary */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Observations', value: stats.total, color: 'primary', icon: <AwardsIcon /> },
                    { label: 'Critical Incidents', value: stats.critical, color: 'error', icon: <WarningIcon /> },
                    { label: 'Positive Records', value: stats.positive, color: 'success', icon: <AwardsIcon /> },
                ].map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                bgcolor: alpha((theme.palette as any)[stat.color].main, 0.02),
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2.5
                            }}
                        >
                            <Avatar sx={{ bgcolor: alpha((theme.palette as any)[stat.color].main, 0.1), color: `${stat.color}.main`, width: 56, height: 56 }}>
                                {stat.icon}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight={900}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {stat.label}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap'
                }}
            >
                <TextField
                    placeholder="Search records or students..."
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        sx: { borderRadius: 2 }
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Incident Type</InputLabel>
                    <Select
                        value={selectedType}
                        label="Incident Type"
                        onChange={e => setSelectedType(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="all">All Observation Types</MenuItem>
                        <MenuItem value="POSITIVE">Positive Recognition</MenuItem>
                        <MenuItem value="WARNING">Verbal Warnings</MenuItem>
                        <MenuItem value="DISCIPLINARY">Disciplinary Actions</MenuItem>
                        <MenuItem value="CRITICAL">Critical Incidents</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            <DataTable
                rows={filteredRecords}
                columns={columns}
                loading={isLoading}
                title="Observations Stream"
                subtitle="Live feed of student behavioral records across the institution"
                module="academic"
                allowedRoles={['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'COUNSELOR', 'INSTRUCTOR']}
                onDelete={(row) => setDeleteTarget(row)}
                onView={(row) => { setSelectedRecord(row); setIsDialogOpen(true); }}
            />

            <BehaviorDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => refetch()}
                record={selectedRecord}
            />

            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => handleDelete(deleteTarget)}
                title="Delete Record"
                message="Are you sure you want to delete this behavioral record? This action cannot be undone."
                confirmColor="error"
            />
        </Box>
    );
}
