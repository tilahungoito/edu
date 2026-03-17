'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Stack, Skeleton } from '@mui/material';
import { AnalyticsChart, KPIGrid } from '@/app/components/analytics';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/app/lib/api/analytics.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';

export default function PerformanceAnalyticsPage() {
    const [scope, setScope] = useState<{ type: string; id: string | null }>({ type: 'SYSTEM', id: null });
    
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
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Performance Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        In-depth analysis of educational performance and trends
                    </Typography>
                </Box>

                <Paper sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', minWidth: 300 }}>
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

            <Grid container spacing={4}>
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
        </Box>
    );
}
