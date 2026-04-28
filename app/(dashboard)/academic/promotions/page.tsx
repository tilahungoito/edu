'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    TrendingUp as PromotionIcon,
    History as HistoryIcon,
    Groups as GroupsIcon,
    CheckCircle as CheckCircleIcon,
    Science as AnalyzeIcon,
    AutoFixHigh as AutoFixIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import sectionsService from '@/app/lib/api/sections.service';
import { scheduleConfigService } from '@/app/lib/api/schedules.service';
import promotionsService, { PromotionValidationItem } from '@/app/lib/api/promotions.service';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

export default function PromotionDashboard() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const institutionId = user?.tenantId;

    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
    
    // Advanced State: Map of studentId -> overrideStatus
    const [roster, setRoster] = useState<PromotionValidationItem[]>([]);
    const [overrides, setOverrides] = useState<Record<string, 'PASS' | 'DETAINED' | 'WITHDRAWN'>>({});
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    // Reset roster when section changes
    useEffect(() => {
        setRoster([]);
        setOverrides({});
        setSelectedStudents([]);
    }, [selectedSectionId, selectedPeriodId]);

    const handleAnalyze = async () => {
        if (!selectedSectionId || !selectedPeriodId) {
            toast.error('Please select both a section and academic period');
            return;
        }
        
        setIsAnalyzing(true);
        try {
            const results = await promotionsService.getValidationSection(selectedSectionId, selectedPeriodId);
            setRoster(results);
            
            // Automatically select all suggested PASS students by default
            const passingIds = results.filter(r => r.suggestedStatus === 'PASS').map(r => r.studentId);
            setSelectedStudents(passingIds);
            
            toast.success(`Analyzed results for ${results.length} students`);
        } catch (error: any) {
            toast.error('Failed to analyze academic results');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const promoteMutation = useMutation({
        mutationFn: async () => {
            // Group students by status to perform multiple batch promotions
            const groups: Record<string, string[]> = {
                PASS: [],
                DETAINED: [],
                WITHDRAWN: []
            };

            selectedStudents.forEach(id => {
                const item = roster.find(r => r.studentId === id);
                const status = overrides[id] || item?.suggestedStatus || 'PASS';
                groups[status].push(id);
            });

            // Process each group
            for (const [status, ids] of Object.entries(groups)) {
                if (ids.length > 0) {
                    await promotionsService.promote({
                        institutionId: institutionId!,
                        academicPeriodId: selectedPeriodId,
                        studentIds: ids,
                        promotionStatus: status as any,
                    });
                }
            }
        },
        onSuccess: () => {
            toast.success(`Successfully processed promotions.`);
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            setRoster([]);
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
        if (selectedStudents.length === roster.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(roster.map(r => r.studentId));
        }
    };

    const handleStatusOverride = (studentId: string, status: 'PASS' | 'DETAINED' | 'WITHDRAWN') => {
        setOverrides(prev => ({ ...prev, [studentId]: status }));
        // If they were not selected, select them now
        if (!selectedStudents.includes(studentId)) {
            setSelectedStudents(prev => [...prev, studentId]);
        }
    };

    const isProcessing = promoteMutation.isPending;

    const getRowStatus = (item: PromotionValidationItem) => {
        return overrides[item.studentId] || item.suggestedStatus;
    };

    return (
        <Box sx={{ p: { xs: 1.5, md: 2, lg: 3 }, maxWidth: '1600px', mx: 'auto', className: "animate-fade-in" }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>
                        <PromotionIcon fontSize="medium" />
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Academic Promotion
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Evidence-based student transitions with automatic academic assessment.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' },
                gap: 3 
            }}>
                {/* Configuration Panel */}
                <Box>
                    <Card sx={{ 
                        borderRadius: 4, 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        position: { lg: 'sticky' },
                        top: 16,
                        maxHeight: { lg: 'calc(100vh - 32px)' },
                        overflowY: 'auto'
                    }}>
                        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={800}>Promotion Settings</Typography>

                            <TextField
                                select
                                label="Target Period"
                                fullWidth
                                size="small"
                                variant="filled"
                                value={selectedPeriodId}
                                onChange={(e) => setSelectedPeriodId(e.target.value)}
                                disabled={isLoadingPeriods}
                            >
                                {periods.map((p: any) => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                select
                                label="Section"
                                fullWidth
                                size="small"
                                variant="filled"
                                value={selectedSectionId}
                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                disabled={isLoadingSections}
                            >
                                {sections.map(s => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name} ({s._count?.students || 0})
                                    </MenuItem>
                                ))}
                            </TextField>

                            <Button
                                variant="outlined"
                                color="primary"
                                fullWidth
                                size="small"
                                onClick={handleAnalyze}
                                disabled={!selectedSectionId || !selectedPeriodId || isAnalyzing}
                                startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AnalyzeIcon />}
                                sx={{ py: 1, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                            >
                                {isAnalyzing ? 'Analyzing...' : 'Run Assessment'}
                            </Button>

                            <Box sx={{ my: 0.5, borderTop: `1px solid ${theme.palette.divider}` }} />

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={selectedStudents.length === 0 || isProcessing || roster.length === 0}
                                onClick={() => promoteMutation.mutate()}
                                startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                                sx={{ 
                                    py: 1.5, 
                                    fontWeight: 800, 
                                    borderRadius: 3, 
                                    textTransform: 'none',
                                    boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`
                                }}
                            >
                                {isProcessing ? 'Processing...' : `Confirm (${selectedStudents.length})`}
                            </Button>

                            {roster.length > 0 && (
                                <Alert severity="info" sx={{ py: 0, px: 1, borderRadius: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                                    Review results in the roster before confirming.
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {/* Review Roster */}
                <Box>
                    {roster.length === 0 ? (
                        <Paper sx={{
                            height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                            borderRadius: 5, bgcolor: alpha(theme.palette.background.paper, 0.5), p: 4, textAlign: 'center'
                        }}>
                            {isAnalyzing ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <CircularProgress size={40} thickness={4} />
                                    <Typography variant="subtitle1" fontWeight={700}>Gathering Evidence...</Typography>
                                </Box>
                            ) : (
                                <>
                                    <AnalyzeIcon sx={{ fontSize: 60, color: alpha(theme.palette.text.disabled, 0.1), mb: 2 }} />
                                    <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
                                        Roster Review Pending
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400 }}>
                                        Select a section and period, then click <b>Run Assessment</b> to view student performance.
                                    </Typography>
                                </>
                            )}
                        </Paper>
                    ) : (
                        <Box>
                            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={800}>
                                    Academic Roster: {sections.find(s => s.id === selectedSectionId)?.name}
                                </Typography>
                                <Tooltip title="Reset overrides">
                                    <IconButton size="small" onClick={() => setOverrides({})}>
                                        <AutoFixIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            
                            <TableContainer component={Paper} sx={{ 
                                borderRadius: 4, 
                                boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                overflow: 'auto'
                            }}>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    indeterminate={selectedStudents.length > 0 && selectedStudents.length < roster.length}
                                                    checked={selectedStudents.length > 0 && selectedStudents.length === roster.length}
                                                    onChange={handleSelectAll}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 800, py: 1.5 }}>Student</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800 }}>Sem 1</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800 }}>Sem 2</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 800 }}>Annual Avg</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 800 }}>Decision</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {roster.map((item) => {
                                            const status = getRowStatus(item);
                                            return (
                                                <TableRow key={item.studentId} hover>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            size="small"
                                                            checked={selectedStudents.includes(item.studentId)}
                                                            onChange={() => handleToggleStudent(item.studentId)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ 
                                                                width: 32, height: 32, 
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                                color: 'primary.main', fontWeight: 800, fontSize: '0.75rem'
                                                            }}>
                                                                {item.name.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>{item.name}</Typography>
                                                                <Typography variant="caption" color="text.secondary">@{item.username}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={600} color={item.sem1Avg !== null && item.sem1Avg < 50 ? 'error.main' : 'text.primary'}>
                                                            {item.sem1Avg !== null ? `${item.sem1Avg}%` : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={600} color={item.sem2Avg !== null && item.sem2Avg < 50 ? 'error.main' : 'text.primary'}>
                                                            {item.sem2Avg !== null ? `${item.sem2Avg}%` : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {item.cumulativeAvg !== null ? (
                                                            <Chip 
                                                                label={`${item.cumulativeAvg}%`}
                                                                size="small"
                                                                sx={{ 
                                                                    height: 20,
                                                                    fontSize: '0.7rem',
                                                                    fontWeight: 800, 
                                                                    bgcolor: item.cumulativeAvg >= 50 ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                                                    color: item.cumulativeAvg >= 50 ? 'success.dark' : 'error.dark'
                                                                }}
                                                            />
                                                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <TextField
                                                            select
                                                            size="small"
                                                            value={status}
                                                            onChange={(e) => handleStatusOverride(item.studentId, e.target.value as any)}
                                                            SelectProps={{ sx: { py: 0.5, fontSize: '0.7rem' } }}
                                                            InputProps={{ 
                                                                sx: { 
                                                                    borderRadius: 1.5, 
                                                                    fontWeight: 800,
                                                                    width: 100,
                                                                    bgcolor: alpha(
                                                                        status === 'PASS' ? theme.palette.success.main : 
                                                                        status === 'DETAINED' ? theme.palette.warning.main : theme.palette.error.main, 
                                                                        0.1
                                                                    ),
                                                                    color: 
                                                                        status === 'PASS' ? 'success.dark' : 
                                                                        status === 'DETAINED' ? 'warning.dark' : 'error.dark',
                                                                } 
                                                            }}
                                                        >
                                                            <MenuItem value="PASS" sx={{ fontSize: '0.75rem' }}>PASS</MenuItem>
                                                            <MenuItem value="DETAINED" sx={{ fontSize: '0.75rem' }}>DETAIN</MenuItem>
                                                            <MenuItem value="WITHDRAWN" sx={{ fontSize: '0.75rem' }}>WITHDRAW</MenuItem>
                                                        </TextField>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
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
