'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Stack, Skeleton, alpha, Drawer, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Switch, FormControlLabel, IconButton, Divider, useTheme } from '@mui/material';
import { Close as CloseIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { AnalyticsChart, KPIGrid } from '@/app/components/analytics';
import { AdvancedPerformanceDashboard } from '@/app/components/analytics/AdvancedPerformanceDashboard';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, StudentDrilldown } from '@/app/lib/api/analytics.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';

export default function PerformanceAnalyticsPage() {
    const [scope, setScope] = useState<{ type: string; id: string | null }>({ type: 'SYSTEM', id: null });
    
    // Drilldown State
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedBucket, setSelectedBucket] = useState<{ index: number; name: string } | null>(null);
    const [showGenderGap, setShowGenderGap] = useState(false);

    // Geographical State
    const [regionId, setRegionId] = useState<string>('');
    const [zoneId, setZoneId] = useState<string>('');
    const [woredaId, setWoredaId] = useState<string>('');
    const [kebeleId, setKebeleId] = useState<string>('');
    const theme = useTheme();

    // Comparison State
    const [comparisonMode, setComparisonMode] = useState(false);
    const [compScope, setCompScope] = useState<{ type: string; id: string | null }>({ type: 'SYSTEM', id: null });
    const [compRegionId, setCompRegionId] = useState<string>('');
    const [compZoneId, setCompZoneId] = useState<string>('');

    // Geographical Data Fetching
    const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: () => regionsService.getAll() });
    const { data: zones } = useQuery({ queryKey: ['zones', regionId], queryFn: () => zonesService.getAll(regionId), enabled: !!regionId });
    const { data: compZones } = useQuery({ queryKey: ['zones', compRegionId], queryFn: () => zonesService.getAll(compRegionId), enabled: !!compRegionId });
    const { data: woredas } = useQuery({ queryKey: ['woredas', zoneId], queryFn: () => woredasService.getAll(zoneId), enabled: !!zoneId });
    const { data: kebeles } = useQuery({ queryKey: ['kebeles', woredaId], queryFn: () => kebelesService.getAll(woredaId), enabled: !!woredaId });

    // Analytics Data Fetching
    const { data: kpis, isLoading: kpisLoading } = useQuery({ 
        queryKey: ['analytics', 'kpis', scope], 
        queryFn: () => analyticsService.getKPIs(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined) 
    });
    const { data: trends, isLoading: trendsLoading } = useQuery({ 
        queryKey: ['analytics', 'trends', scope], 
        queryFn: () => analyticsService.getPerformanceTrends(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined) 
    });
    const { data: subjectPerformance, isLoading: subjectLoading } = useQuery({ 
        queryKey: ['analytics', 'subject', scope], 
        queryFn: () => analyticsService.getSubjectPerformance(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined) 
    });
    const { data: gradeDistribution, isLoading: distributionLoading } = useQuery({ 
        queryKey: ['analytics', 'distribution', scope], 
        queryFn: () => analyticsService.getGradeDistribution(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined) 
    });
    const { data: genderGap, isLoading: genderLoading } = useQuery({
        queryKey: ['analytics', 'gender-gap', scope],
        queryFn: () => analyticsService.getGenderGap(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined),
        enabled: showGenderGap
    });

    // Drilldown Query
    const { data: drilledStudents, isLoading: drilling } = useQuery({
        queryKey: ['analytics', 'drilldown', scope, selectedBucket?.index],
        queryFn: () => analyticsService.getStudentsByBucket(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined, selectedBucket?.index),
        enabled: drawerOpen && selectedBucket !== null
    });

    const handleChartClick = (data: any, index: number) => {
        setSelectedBucket({ index, name: data.name });
        setDrawerOpen(true);
    };

    const handleRegionChange = (id: string) => {
        setRegionId(id);
        setZoneId('');
        setWoredaId('');
        setKebeleId('');
        setScope(id ? { type: 'REGION', id } : { type: 'SYSTEM', id: null });
    };

    const handleZoneChange = (id: string) => {
        setZoneId(id);
        setWoredaId('');
        setKebeleId('');
        setScope(id ? { type: 'ZONE', id } : { type: 'REGION', id: regionId });
    };

    const handleWoredaChange = (id: string) => {
        setWoredaId(id);
        setKebeleId('');
        setScope(id ? { type: 'WOREDA', id } : { type: 'ZONE', id: zoneId });
    };

    const handleKebeleChange = (id: string) => {
        setKebeleId(id);
        setScope(id ? { type: 'KEBELE', id } : { type: 'WOREDA', id: woredaId });
    };

    // Update Comparison Scope
    React.useEffect(() => {
        if (!compRegionId) {
            setCompScope({ type: 'SYSTEM', id: null });
        } else if (!compZoneId) {
            setCompScope({ type: 'REGION', id: compRegionId });
        } else {
            setCompScope({ type: 'ZONE', id: compZoneId });
        }
    }, [compRegionId, compZoneId]);

    return (
        <Box>
            {/* Header and Filters */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        Performance Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        In-depth analysis of educational performance and achievement distributions
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', minWidth: 300, borderRadius: 3, border: '1px solid', borderColor: 'divider', background: (theme) => alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(8px)' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Region</InputLabel>
                        <Select value={regionId} label="Region" onChange={(e) => handleRegionChange(e.target.value)}>
                            <MenuItem value=""><em>All Systems</em></MenuItem>
                            {regions?.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!regionId}>
                        <InputLabel>Zone</InputLabel>
                        <Select value={zoneId} label="Zone" onChange={(e) => handleZoneChange(e.target.value)}>
                            <MenuItem value=""><em>All Zones</em></MenuItem>
                            {zones?.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!zoneId}>
                        <InputLabel>Woreda</InputLabel>
                        <Select value={woredaId} label="Woreda" onChange={(e) => handleWoredaChange(e.target.value)}>
                            <MenuItem value=""><em>All Woredas</em></MenuItem>
                            {woredas?.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!woredaId}>
                        <InputLabel>Kebele</InputLabel>
                        <Select value={kebeleId} label="Kebele" onChange={(e) => handleKebeleChange(e.target.value)}>
                            <MenuItem value=""><em>All Kebeles</em></MenuItem>
                            {kebeles?.map(k => <MenuItem key={k.id} value={k.id}>{k.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Paper>
            </Box>

            {/* Comparison Mode Toggle */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                    control={<Switch checked={comparisonMode} onChange={(e) => setComparisonMode(e.target.checked)} color="primary" />}
                    label={<Typography fontWeight={700}>Enable Side-by-Side Comparison</Typography>}
                />
            </Box>

            {!comparisonMode ? (
                <Box sx={{ mt: 4 }}>
                    <AdvancedPerformanceDashboard 
                        scopeType={scope.type === 'SYSTEM' ? undefined : scope.type} 
                        scopeId={scope.id || undefined} 
                    />
                </Box>
            ) : (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: '1px solid', borderColor: 'primary.main' }}>
                            <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 2 }}>PRIMARY ENTITY</Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Region</InputLabel>
                                    <Select value={regionId} label="Region" onChange={(e) => handleRegionChange(e.target.value)}>
                                        <MenuItem value=""><em>All Systems</em></MenuItem>
                                        {regions?.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth disabled={!regionId}>
                                    <InputLabel>Zone</InputLabel>
                                    <Select value={zoneId} label="Zone" onChange={(e) => handleZoneChange(e.target.value)}>
                                        <MenuItem value=""><em>All Zones</em></MenuItem>
                                        {zones?.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                        <AdvancedPerformanceDashboard 
                            scopeType={scope.type === 'SYSTEM' ? undefined : scope.type} 
                            scopeId={scope.id || undefined}
                            title={`Analysis: ${scope.type === 'SYSTEM' ? 'System' : scope.type}`}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <Box sx={{ p: 2, mb: 2, borderRadius: 3, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: '1px solid', borderColor: 'secondary.main' }}>
                            <Typography variant="subtitle2" fontWeight={800} color="secondary.main" sx={{ mb: 2 }}>COMPARISON ENTITY</Typography>
                            <Stack direction="row" spacing={1}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Region</InputLabel>
                                    <Select value={compRegionId} label="Region" onChange={(e) => setCompRegionId(e.target.value)}>
                                        <MenuItem value=""><em>All Systems</em></MenuItem>
                                        {regions?.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth disabled={!compRegionId}>
                                    <InputLabel>Zone</InputLabel>
                                    <Select value={compZoneId} label="Zone" onChange={(e) => setCompZoneId(e.target.value)}>
                                        <MenuItem value=""><em>All Zones</em></MenuItem>
                                        {compZones?.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                        <AdvancedPerformanceDashboard 
                            scopeType={compScope.type === 'SYSTEM' ? undefined : compScope.type} 
                            scopeId={compScope.id || undefined} 
                            title={`Comparison: ${compScope.type === 'SYSTEM' ? 'System' : compScope.type}`}
                        />
                    </Grid>
                </Grid>
            )}


            {/* Drilldown Drawer */}
            <Drawer 
                anchor="right" 
                open={drawerOpen} 
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 500, md: 650 }, p: 3, borderLeft: '1px solid', borderColor: 'divider' }
                }}
            >
                <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                            Student Drilldown
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Detailed records for {selectedBucket?.name} achievement range
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small" sx={{ bgcolor: 'action.hover' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {drilling ? (
                    <Stack spacing={3}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                        ))}
                    </Stack>
                ) : (
                    <Box>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                                {drilledStudents?.length || 0} Students Found
                            </Typography>
                            <Button startIcon={<FilterIcon />} size="small" variant="outlined">Filter List</Button>
                        </Box>

                        <Table sx={{ minWidth: 400 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Student Information</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Grade/Score</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {drilledStudents?.map((s) => (
                                    <TableRow key={s.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>{s.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">{s.school} • {s.program}</Typography>
                                                <Typography variant="caption" sx={{ color: 'primary.main', opacity: 0.8 }}>{s.email}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={`${s.score}`} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 900,
                                                    fontSize: '0.75rem',
                                                    width: 45,
                                                    bgcolor: (theme) => alpha(gradeDistribution?.find(d => d.range === selectedBucket?.name)?.color || theme.palette.primary.main, 0.15),
                                                    color: (theme) => gradeDistribution?.find(d => d.range === selectedBucket?.name)?.color || theme.palette.primary.main,
                                                    border: '1px solid',
                                                    borderColor: 'currentColor'
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="text" sx={{ fontWeight: 700, textTransform: 'none' }}>Profile</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {drilledStudents?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary" variant="body2">No student data available for this criteria.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                )}
                
                <Box sx={{ mt: 'auto', pt: 4 }}>
                    <Button fullWidth variant="contained" size="large" sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none', boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}` }}>
                        Export Targeted List
                    </Button>
                </Box>
            </Drawer>
        </Box>
    );
}
