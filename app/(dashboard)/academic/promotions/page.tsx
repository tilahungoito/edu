'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
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
    CircularProgress,
    LinearProgress,
} from '@mui/material';
import {
    TrendingUp as PromotionIcon,
    History as HistoryIcon,
    Groups as GroupsIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sectionsService from '@/app/lib/api/sections.service';
import { scheduleConfigService } from '@/app/lib/api/schedules.service';
import promotionsService from '@/app/lib/api/promotions.service';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

export default function PromotionDashboard() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const institutionId = user?.tenantId;

    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [promotionStatus, setPromotionStatus] = useState<'PASS' | 'DETAINED' | 'WITHDRAWN'>('PASS');

    // Queries
    const { data: sections = [], isLoading: isLoadingSections } = useQuery({
        queryKey: ['sections', institutionId],
        queryFn: () => sectionsService.getAll(institutionId || ''),
        enabled: !!institutionId,
    });

    const { data: periods = [], isLoading: isLoadingPeriods } = useQuery({
        queryKey: ['periods', institutionId],
        queryFn: () => scheduleConfigService.getPeriods(institutionId || ''),
        enabled: !!institutionId,
    });

    const { data: fullSection, isLoading: isLoadingSection } = useQuery({
        queryKey: ['section', selectedSectionId],
        queryFn: () => sectionsService.getById(selectedSectionId),
        enabled: !!selectedSectionId,
    });

    // Mutations
    const promoteMutation = useMutation({
        mutationFn: promotionsService.promote,
        onSuccess: (data) => {
            toast.success(`Successfully processed ${selectedStudents.length} students.`);
            queryClient.invalidateQueries({ queryKey: ['section', selectedSectionId] });
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            setSelectedStudents([]);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process promotions');
        }
    });

    const handleToggleStudent = (id: string) => {
        setSelectedStudents(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!fullSection?.students) return;
        if (selectedStudents.length === fullSection.students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(fullSection.students.map((s: any) => s.id));
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

    const isProcessing = promoteMutation.isPending;

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                        <PromotionIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Academic Promotion
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Manage end-of-year student transitions and academic history snapshots.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', lg: '350px 1fr' },
                gap: 4 
            }}>
                {/* Configuration Panel */}
                <Box>
                    <Card sx={{ 
                        borderRadius: 5, 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                        position: 'sticky',
                        top: 24
                    }}>
                        <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                            <Typography variant="h6" fontWeight={800}>Promotion Settings</Typography>

                            <TextField
                                select
                                label="Target Academic Period"
                                fullWidth
                                variant="filled"
                                value={selectedPeriodId}
                                onChange={(e) => setSelectedPeriodId(e.target.value)}
                                helperText="Select the academic period being concluded"
                                disabled={isLoadingPeriods}
                            >
                                {periods.map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                                {periods.length === 0 && <MenuItem disabled>No periods available</MenuItem>}
                            </TextField>

                            <TextField
                                select
                                label="Select Section"
                                fullWidth
                                variant="filled"
                                value={selectedSectionId}
                                onChange={(e) => {
                                    setSelectedSectionId(e.target.value);
                                    setSelectedStudents([]);
                                }}
                                disabled={isLoadingSections}
                            >
                                {sections.map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name} ({s._count?.students || 0} students)
                                    </MenuItem>
                                ))}
                                {sections.length === 0 && <MenuItem disabled>No sections available</MenuItem>}
                            </TextField>

                            <TextField
                                select
                                label="Promotion Status"
                                fullWidth
                                variant="filled"
                                value={promotionStatus}
                                onChange={(e) => setPromotionStatus(e.target.value as any)}
                            >
                                <MenuItem value="PASS" sx={{ color: 'success.main', fontWeight: 600 }}>Pass to Next Grade</MenuItem>
                                <MenuItem value="DETAINED" sx={{ color: 'warning.main', fontWeight: 600 }}>Detain (Repeat Year)</MenuItem>
                                <MenuItem value="WITHDRAWN" sx={{ color: 'error.main', fontWeight: 600 }}>Withdraw from Institution</MenuItem>
                            </TextField>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={selectedStudents.length === 0 || !selectedPeriodId || isProcessing}
                                onClick={handleProcess}
                                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <PromotionIcon />}
                                sx={{ 
                                    py: 2, 
                                    fontWeight: 800, 
                                    borderRadius: 3.5, 
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.25)}`
                                }}
                            >
                                {isProcessing ? 'Processing...' : `Promote ${selectedStudents.length} Students`}
                            </Button>

                            {selectedStudents.length > 0 && !isProcessing && (
                                <Alert severity="info" sx={{ borderRadius: 3, fontWeight: 500 }}>
                                    Batch processing will create academic history records for all selected students.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Student Selection Roster */}
                <Box>
                    {!selectedSectionId ? (
                        <Paper sx={{
                            height: '100%', minHeight: 500, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                            borderRadius: 6, bgcolor: alpha(theme.palette.background.paper, 0.5), p: 4, textAlign: 'center'
                        }}>
                            <GroupsIcon sx={{ fontSize: 80, color: alpha(theme.palette.text.disabled, 0.1), mb: 3 }} />
                            <Typography variant="h5" fontWeight={700} color="text.secondary" gutterBottom>
                                No Section Selected
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                                Please select a section from the configuration panel to view and process students for promotion.
                            </Typography>
                        </Paper>
                    ) : (
                        <Box>
                            {isLoadingSection && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
                            
                            <TableContainer component={Paper} sx={{ 
                                borderRadius: 5, 
                                boxShadow: '0 10px 40px rgba(0,0,0,0.04)', 
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                overflow: 'hidden'
                            }}>
                                <Table>
                                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < (fullSection?.students?.length || 0)}
                                                    checked={selectedStudents.length > 0 && selectedStudents.length === (fullSection?.students?.length || 0)}
                                                    onChange={handleSelectAll}
                                                    disabled={isProcessing}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Student Details</TableCell>
                                            <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Current Grade</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Promotion Impact</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {fullSection?.students?.map((student: any) => (
                                            <TableRow key={student.id} sx={{ 
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) },
                                                transition: '0.2s'
                                            }}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        size="small"
                                                        checked={selectedStudents.includes(student.id)}
                                                        onChange={() => handleToggleStudent(student.id)}
                                                        disabled={isProcessing}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ 
                                                            width: 40, 
                                                            height: 40, 
                                                            bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                            color: 'primary.main',
                                                            fontSize: '1rem',
                                                            fontWeight: 800
                                                        }}>
                                                            {(student.user?.firstName || student.username || 'S').charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body1" fontWeight={700}>
                                                                {student.user?.firstName ? `${student.user.firstName} ${student.user.lastName || ''}` : (student.user?.username || student.username || 'Student')}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                                ID: {student.id.substring(0, 8).toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        label={`Grade ${student.year || student.gradeLevel || '?'}`} 
                                                        size="small" 
                                                        sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: alpha(theme.palette.divider, 0.1) }} 
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                        {promotionStatus === 'PASS' && (
                                                            <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                PROMOTING TO GRADE {(student.year || 0) + 1}
                                                            </Typography>
                                                        )}
                                                        <Chip
                                                            label={promotionStatus}
                                                            size="small"
                                                            color={
                                                                promotionStatus === 'PASS' ? 'success' : 
                                                                promotionStatus === 'DETAINED' ? 'warning' : 'error'
                                                            }
                                                            sx={{ fontWeight: 800, borderRadius: 1.5 }}
                                                        />
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!fullSection?.students || fullSection.students.length === 0) && !isLoadingSection && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                                    <Typography variant="body2" color="text.secondary">This section is currently empty.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
