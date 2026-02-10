'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    MenuItem,
    Checkbox,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    alpha,
    useTheme,
    Alert,
} from '@mui/material';
import {
    TrendingUp as PromotionIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import sectionsService from '@/app/lib/api/sections.service';
import { scheduleConfigService } from '@/app/lib/api/schedules.service';
import promotionsService from '@/app/lib/api/promotions.service';
import { useAuthStore } from '@/app/lib/store';

export default function PromotionDashboard() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const institutionId = user?.tenantId;

    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [promotionStatus, setPromotionStatus] = useState<'PASS' | 'DETAINED' | 'WITHDRAWN'>('PASS');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Queries
    const { data: sections } = useQuery({
        queryKey: ['sections', institutionId],
        queryFn: () => sectionsService.getAll(institutionId || ''),
        enabled: !!institutionId,
    });

    const { data: periods } = useQuery({
        queryKey: ['periods', institutionId],
        queryFn: () => scheduleConfigService.getPeriods(institutionId || ''),
        enabled: !!institutionId,
    });

    const { data: fullSection, isLoading: loadingSection } = useQuery({
        queryKey: ['section', selectedSectionId],
        queryFn: () => sectionsService.getById(selectedSectionId),
        enabled: !!selectedSectionId,
    });

    const selectedSection = fullSection;

    // Mutation
    const promoteMutation = useMutation({
        mutationFn: promotionsService.promote,
        onSuccess: () => {
            setSuccessMessage(`Successfully processed ${selectedStudents.length} students.`);
            setSelectedStudents([]);
            setTimeout(() => setSuccessMessage(null), 5000);
        },
    });

    const handleToggleStudent = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!selectedSection?.students) return;
        if (selectedStudents.length === selectedSection.students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(selectedSection.students.map((s: any) => s.id));
        }
    };

    const handleProcess = () => {
        if (!institutionId || !selectedPeriodId || selectedStudents.length === 0) return;
        promoteMutation.mutate({
            institutionId,
            academicPeriodId: selectedPeriodId,
            studentIds: selectedStudents,
            promotionStatus,
        });
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }} className="animate-fade-in">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <PromotionIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Academic Promotion
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Manage end-of-year student transitions and academic history snapshots.
                    </Typography>
                </Box>
            </Box>

            {successMessage && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{successMessage}</Alert>}

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Typography variant="subtitle1" fontWeight={800}>Promotion Settings</Typography>

                            <TextField
                                select
                                label="Target Academic Period"
                                fullWidth
                                size="small"
                                value={selectedPeriodId}
                                onChange={(e) => setSelectedPeriodId(e.target.value)}
                                helperText="Select the academic period being concluded"
                            >
                                {periods?.length ? (periods as any[]).map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                )) : (
                                    <MenuItem disabled value="">No periods available</MenuItem>
                                )}
                            </TextField>

                            <TextField
                                select
                                label="Select Section"
                                fullWidth
                                size="small"
                                value={selectedSectionId}
                                onChange={(e) => {
                                    setSelectedSectionId(e.target.value);
                                    setSelectedStudents([]);
                                }}
                            >
                                {sections?.length ? (sections as any[]).map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.name} ({s._count?.students || 0} students)</MenuItem>
                                )) : (
                                    <MenuItem disabled value="">No sections available</MenuItem>
                                )}
                            </TextField>

                            <TextField
                                select
                                label="Action"
                                fullWidth
                                size="small"
                                value={promotionStatus}
                                onChange={(e) => setPromotionStatus(e.target.value as any)}
                            >
                                <MenuItem value="PASS">Pass to Next Grade</MenuItem>
                                <MenuItem value="DETAINED">Detain (Repeat Year)</MenuItem>
                                <MenuItem value="WITHDRAWN">Withdraw from Institution</MenuItem>
                            </TextField>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={selectedStudents.length === 0 || !selectedPeriodId || promoteMutation.isPending}
                                onClick={handleProcess}
                                startIcon={<PromotionIcon />}
                                sx={{ py: 1.5, fontWeight: 700, borderRadius: 3, textTransform: 'none', boxShadow: theme.shadows[4] }}
                            >
                                {promoteMutation.isPending ? 'Processing...' : `Process ${selectedStudents.length} Students`}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    {!selectedSectionId ? (
                        <Box sx={{
                            height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                            borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.02)
                        }}>
                            <HistoryIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.3 }} />
                            <Typography color="text.secondary" fontWeight={600}>Select a section to begin student processing</Typography>
                        </Box>
                    ) : (
                        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                            <Table>
                                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                size="small"
                                                indeterminate={selectedStudents.length > 0 && selectedStudents.length < (selectedSection?.students?.length || 0)}
                                                checked={selectedStudents.length > 0 && selectedStudents.length === (selectedSection?.students?.length || 0)}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>Current Year</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800 }}>Impact</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedSection?.students?.map((student: any) => (
                                        <TableRow key={student.id} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedStudents.includes(student.id)}
                                                    onChange={() => handleToggleStudent(student.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontSize: '0.875rem' }}>
                                                        {(student.user?.username || student.username || 'S').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight={700}>
                                                            {student.user?.firstName ? `${student.user.firstName} ${student.user.lastName || ''}` : (student.user?.username || student.username || 'Student')}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">ID: {student.id.substring(0, 8).toUpperCase()}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={600}>Year {student.year}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={promotionStatus === 'PASS' ? `Move to Year ${student.year + 1}` : promotionStatus}
                                                    size="small"
                                                    color={promotionStatus === 'PASS' ? 'success' : promotionStatus === 'DETAINED' ? 'warning' : 'error'}
                                                    variant="soft"
                                                    sx={{ fontWeight: 700 }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
