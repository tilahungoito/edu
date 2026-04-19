'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Warning as WarningIcon,
    EmojiEvents as AwardsIcon,
    Refresh as RefreshIcon,
    Security as PrivateIcon,
    PsychologyAlt as CounselingIcon,
    RemoveRedEye as ObserveIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/app/components/tables/DataTable';
import { BehaviorDialog } from '@/app/components/classroom/BehaviorDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import classroomService from '@/app/lib/api/classroom.service';
import { useAuthStore } from '@/app/lib/store';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';

// ─── Types & Config ───────────────────────────────────────────────────────────

const BEHAVIOR_CONFIG: Record<string, { color: string; label: string }> = {
    POSITIVE: { color: '#10b981', label: 'Positive' },
    WARNING: { color: '#f59e0b', label: 'Warning' },
    DISCIPLINARY: { color: '#ef4444', label: 'Disciplinary' },
    CRITICAL: { color: '#7f1d1d', label: 'Critical' },
    COUNSELING: { color: '#8b5cf6', label: 'Counseling' },
    OBSERVATION: { color: '#3b82f6', label: 'Observation' },
};

// Roles that can write behavior records
const WRITE_ROLES = ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'INSTRUCTOR'];
// Roles that can delete any record (not just their own)
const ADMIN_DELETE_ROLES = ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BehaviorPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    // Derive role helper from store
    const rawRole = user?.roles?.[0]?.name || '';
    const userRole = rawRole.toUpperCase().replace(' ', '_');
    const userId = user?.id || '';

    // Explicit role checks
    const isInstructor = userRole === 'INSTRUCTOR';
    const isRegistrar = userRole === 'REGISTRAR';
    const isInstAdmin = userRole === 'INSTITUTION_ADMIN';
    const isSysAdmin = userRole === 'SYSTEM_ADMIN';

    const isAdminOrHigher = isSysAdmin || isInstAdmin || isRegistrar;
    const canWrite = isAdminOrHigher || isInstructor;

    // State
    const [selectedType, setSelectedType] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

    // ─── Data fetching ────────────────────────────────────────────────────────

    /**
     * INSTRUCTORS use the instructor-scoped endpoint so data is isolated to
     * only records they personally created.
     * ADMINS / REGISTRARS fetch all institution records.
     */
    const { data: records, isLoading, refetch } = useQuery({
        queryKey: ['behavior-records', user?.tenantId, userRole, userId, selectedType],
        queryFn: async () => {
            if (isInstructor) {
                // Fetch all institution records then filter client-side by recordedById
                // This keeps the API surface small — the backend already enforces auth
                const all = await classroomService.getBehaviorByInstitution(
                    user?.tenantId || '',
                    selectedType === 'all' ? undefined : selectedType,
                );
                // Data isolation: instructors only see records they created
                return all.filter(r => (r as any).recordedById === userId);
            }
            return classroomService.getBehaviorByInstitution(
                user?.tenantId || '',
                selectedType === 'all' ? undefined : selectedType,
            );
        },
        enabled: !!user?.tenantId,
    });

    // Real-time updates
    useRealTime('behavior_recorded', () => { refetch(); });
    useRealTime('behavior_updated', () => { refetch(); });
    useRealTime('behavior_deleted', () => { refetch(); });

    // ─── Derived data ─────────────────────────────────────────────────────────

    const filteredRecords = useMemo(() => {
        if (!records) return [];
        if (!searchQuery) return records;
        const q = searchQuery.toLowerCase();
        return records.filter(r =>
            r.title.toLowerCase().includes(q) ||
            r.student?.user?.firstName?.toLowerCase().includes(q) ||
            r.student?.user?.lastName?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q),
        );
    }, [records, searchQuery]);

    const stats = useMemo(() => {
        if (!records) return { critical: 0, positive: 0, warning: 0, total: 0 };
        return {
            total: records.length,
            critical: records.filter(r => r.type === 'CRITICAL').length,
            positive: records.filter(r => r.type === 'POSITIVE').length,
            warning: records.filter(r => r.type === 'WARNING' || r.type === 'DISCIPLINARY').length,
        };
    }, [records]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleDelete = useCallback(async (record: any) => {
        try {
            await classroomService.deleteBehavior(record.id);
            toast.success('Record deleted successfully');
            refetch();
            setDeleteTarget(null);
        } catch {
            toast.error('Failed to delete record');
        }
    }, [refetch]);

    const handleView = useCallback((row: any) => {
        setSelectedRecord(row);
        setIsDialogOpen(true);
    }, []);

    const handleNew = useCallback(() => {
        setSelectedRecord(null);
        setIsDialogOpen(true);
    }, []);

    // Determine if the current user can delete a specific record
    const canDeleteRecord = useCallback((row: any) => {
        if (isAdminOrHigher) return true;
        // Instructors can delete only their own records
        if (isInstructor && (row as any).recordedById === userId) return true;
        return false;
    }, [isAdminOrHigher, isInstructor, userId]);

    // ─── Table columns ────────────────────────────────────────────────────────

    const columns: any[] = useMemo(() => [
        {
            field: 'student',
            headerName: 'Student',
            flex: 1,
            minWidth: 180,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                        width: 32, height: 32,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        fontWeight: 700, fontSize: '0.8rem',
                    }}>
                        {params.row.student?.user?.firstName?.[0] || '?'}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700} lineHeight={1.2}>
                            {params.row.student?.user?.firstName} {params.row.student?.user?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            #{params.row.studentId?.slice(0, 8)}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 140,
            renderCell: (params: any) => {
                const cfg = BEHAVIOR_CONFIG[params.value] || BEHAVIOR_CONFIG.WARNING;
                return (
                    <Chip
                        label={cfg.label}
                        size="small"
                        sx={{
                            bgcolor: alpha(cfg.color, 0.1),
                            color: cfg.color,
                            fontWeight: 800,
                            fontSize: '11px',
                            border: `1px solid ${alpha(cfg.color, 0.25)}`,
                        }}
                    />
                );
            },
        },
        {
            field: 'title',
            headerName: 'Observation',
            flex: 1.5,
            minWidth: 200,
            renderCell: (params: any) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box>
                        <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                            {params.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            maxWidth: 260,
                        }}>
                            {params.row.description}
                        </Typography>
                    </Box>
                    {params.row.isPrivate && (
                        <Tooltip title="Confidential — limited visibility">
                            <PrivateIcon sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }} />
                        </Tooltip>
                    )}
                </Box>
            ),
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 110,
            renderCell: (params: any) => (
                <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                </Typography>
            ),
        },
        // Only show "Recorded By" column for admins — instructors see only their own
        ...(!isInstructor ? [{
            field: 'recordedById',
            headerName: 'Recorded By',
            width: 130,
            renderCell: (params: any) => (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {params.value === userId ? 'You' : `Staff`}
                </Typography>
            ),
        }] : []),
    ], [theme, isInstructor, userId]);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Box sx={{ p: { xs: 2.5, md: 5 }, maxWidth: '1440px', mx: 'auto' }} className="animate-fade-in">

            {/* ── Header ── */}
            <Box sx={{
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { md: 'flex-end' },
                gap: 2,
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1, mb: 0.5 }}>
                        Student Behavior &amp; Wellness
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {isInstructor
                            ? 'Your recorded behavioral observations for students.'
                            : 'Comprehensive management of behavioral observations and disciplinary tracking.'}
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
                    {canWrite && (
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<AddIcon />}
                            onClick={handleNew}
                            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                        >
                            New Observation
                        </Button>
                    )}
                </Box>
            </Box>

            {/* ── Stats ── */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Observations', value: stats.total, color: 'primary', icon: <ObserveIcon /> },
                    { label: 'Critical / Warning', value: stats.warning, color: 'error', icon: <WarningIcon /> },
                    { label: 'Positive Records', value: stats.positive, color: 'success', icon: <AwardsIcon /> },
                ].map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 4 }} key={i}>
                        <Paper elevation={0} sx={{
                            p: 3,
                            borderRadius: 4,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            bgcolor: alpha((theme.palette as any)[stat.color].main, 0.02),
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2.5,
                        }}>
                            <Avatar sx={{
                                bgcolor: alpha((theme.palette as any)[stat.color].main, 0.1),
                                color: `${stat.color}.main`,
                                width: 56, height: 56,
                            }}>
                                {stat.icon}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight={900}>{stat.value}</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={800}
                                    sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    {stat.label}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* ── Filters ── */}
            <Paper elevation={0} sx={{
                p: 2, mb: 3, borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            }}>
                <TextField
                    placeholder="Search by student name, title or description..."
                    size="small"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 320 } }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        sx: { borderRadius: 2 },
                    }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Observation Type</InputLabel>
                    <Select
                        value={selectedType}
                        label="Observation Type"
                        onChange={e => setSelectedType(e.target.value)}
                        sx={{ borderRadius: 2 }}
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="POSITIVE">Positive Recognition</MenuItem>
                        <MenuItem value="WARNING">Verbal Warning</MenuItem>
                        <MenuItem value="DISCIPLINARY">Disciplinary Action</MenuItem>
                        <MenuItem value="CRITICAL">Critical Incident</MenuItem>
                        <MenuItem value="COUNSELING">Counseling Note</MenuItem>
                        <MenuItem value="OBSERVATION">General Observation</MenuItem>
                    </Select>
                </FormControl>
            </Paper>

            {/* ── Data Table ── */}
            <DataTable
                rows={filteredRecords}
                columns={columns}
                loading={isLoading}
                title={isInstructor ? 'My Recorded Observations' : 'Observations Stream'}
                subtitle={
                    isInstructor
                        ? 'Behavioral records you have personally logged'
                        : 'Live feed of behavioral records across the institution'
                }
                module="academic"
                allowedRoles={WRITE_ROLES}
                onDelete={canWrite ? (row) => {
                    if (canDeleteRecord(row)) setDeleteTarget(row);
                    else toast.error("You can only delete records you created.");
                } : undefined}
                onView={handleView}
            />

            {/* ── Behavior Dialog ── */}
            <BehaviorDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => refetch()}
                record={selectedRecord}
                institutionId={user?.tenantId}
                // For instructors: pass their userId so backend can scope student list
                restrictToInstructor={isInstructor ? userId : undefined}
            />

            {/* ── Delete Confirm ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => handleDelete(deleteTarget)}
                title="Delete Behavioral Record"
                message={`Are you sure you want to permanently delete the record "${deleteTarget?.title}"? This cannot be undone.`}
                confirmColor="error"
            />
        </Box>
    );
}
