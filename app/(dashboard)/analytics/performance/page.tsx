'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Stack, Skeleton, alpha, Dialog, DialogTitle, DialogContent, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, Switch, FormControlLabel } from '@mui/material';
import { AnalyticsChart, KPIGrid } from '@/app/components/analytics';
import { useQuery } from '@tanstack/react-query';
import { analyticsService, StudentDrilldown } from '@/app/lib/api/analytics.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';

export default function PerformanceAnalyticsPage() {
    const [scope, setScope] = useState<{ type: string; id: string | null }>({ type: 'SYSTEM', id: null });
    
    // Drilldown State
    const [drilldownOpen, setDrilldownOpen] = useState(false);
    const [selectedBucket, setSelectedBucket] = useState<{ index: number; name: string } | null>(null);
    const [showGenderGap, setShowGenderGap] = useState(false);

    // Geographical State
    const [regionId, setRegionId] = useState<string>('');
    const [zoneId, setZoneId] = useState<string>('');
    const [woredaId, setWoredaId] = useState<string>('');
    const [kebeleId, setKebeleId] = useState<string>('');

    // Geographical Data Fetching
    const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: () => regionsService.getAll() });
    const { data: zones } = useQuery({ queryKey: ['zones', regionId], queryFn: () => zonesService.getAll(regionId), enabled: !!regionId });
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
        enabled: drilldownOpen && selectedBucket !== null
    });

    const handleChartClick = (data: any, index: number) => {
        setSelectedBucket({ index, name: data.name });
        setDrilldownOpen(true);
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

            {/* KPIs */}
            <Box sx={{ mb: 4 }}>
                {kpisLoading ? (
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <KPIGrid kpis={(kpis || []) as any} loading={false} />
                )}
            </Box>

            {/* Distribution Charts */}
            <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <FormControlLabel
                            control={<Switch checked={showGenderGap} onChange={(e) => setShowGenderGap(e.target.checked)} />}
                            label={<Typography variant="body2" fontWeight={600}>Compare by Gender</Typography>}
                        />
                    </Box>
                    {distributionLoading || (showGenderGap && genderLoading) ? (
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                    ) : (
                        <AnalyticsChart
                            title={showGenderGap ? "Gender Performance Gap" : "Grade Distribution"}
                            subtitle={showGenderGap ? "Achievement levels split by Male vs Female" : "Click any bar to see the students in that range"}
                            data={showGenderGap ? 
                                genderGap?.ranges.map((r, i) => ({ 
                                    name: r, 
                                    Male: genderGap.series[0].data[i], 
                                    Female: genderGap.series[1].data[i] 
                                })) || [] :
                                gradeDistribution?.map(d => ({ name: d.range, count: d.count })) || []
                            }
                            type="bar"
                            dataKeys={showGenderGap ? ['Male', 'Female'] : ['count']}
                            colors={showGenderGap ? [genderGap?.series[0].color || '#1565C0', genderGap?.series[1].color || '#C2185B'] : gradeDistribution?.map(d => d.color) || []}
                            height={400}
                            onClick={showGenderGap ? undefined : handleChartClick}
                        />
                    )}
                </Grid>

                {/* Second Row Charts */}
                <Grid size={{ xs: 12, lg: 7 }}>
                    {trendsLoading ? (
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                    ) : (
                        <AnalyticsChart
                            title="Academic Trends"
                            subtitle="Average scores vs Enrollment growth"
                            data={trends || []}
                            type="area"
                            dataKeys={['score', 'enrollment']}
                            height={400}
                        />
                    )}
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    {subjectLoading ? (
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
                    ) : (
                        <AnalyticsChart
                            title="Subject Performance"
                            subtitle="Regional averages by subject"
                            data={subjectPerformance || []}
                            type="bar"
                            dataKeys={['value']}
                            height={400}
                        />
                    )}
                </Grid>
            </Grid>

            {/* Drilldown Dialog */}
            <Dialog open={drilldownOpen} onClose={() => setDrilldownOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight={700}>
                            Students in {selectedBucket?.name} Range
                        </Typography>
                        <Button onClick={() => setDrilldownOpen(false)} color="inherit">Close</Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {drilling ? (
                        <Stack spacing={2} sx={{ py: 2 }}>
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="rectangular" height={40} />)}
                        </Stack>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>School</TableCell>
                                    <TableCell align="center">Score</TableCell>
                                    <TableCell>Program</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {drilledStudents?.map((s) => (
                                    <TableRow key={s.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                                        </TableCell>
                                        <TableCell>{s.school}</TableCell>
                                        <TableCell align="center">
                                            <Chip 
                                                label={s.score} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    bgcolor: (theme) => alpha(gradeDistribution?.find(d => d.range === selectedBucket?.name)?.color || theme.palette.primary.main, 0.1),
                                                    color: (theme) => gradeDistribution?.find(d => d.range === selectedBucket?.name)?.color || theme.palette.primary.main
                                                }} 
                                            />
                                        </TableCell>
                                        <TableCell>{s.program}</TableCell>
                                    </TableRow>
                                ))}
                                {drilledStudents?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography color="text.secondary">No students found in this range.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}
