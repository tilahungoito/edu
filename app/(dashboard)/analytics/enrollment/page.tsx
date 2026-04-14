'use client';

import React, { useState } from 'react';
import { Box, Typography, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Skeleton, alpha } from '@mui/material';
import { AnalyticsChart, KPIGrid } from '@/app/components/analytics';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/app/lib/api/analytics.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { useAuthStore } from '@/app/lib/store';

export default function EnrollmentAnalyticsPage() {
    const user = useAuthStore(state => state.user);
    const [scope, setScope] = useState<{ type: string; id: string | null }>({ type: 'SYSTEM', id: null });
    const [isInitialized, setIsInitialized] = useState(false);
    
    // Geographical State
    const [regionId, setRegionId] = useState<string>('');
    const [zoneId, setZoneId] = useState<string>('');
    const [woredaId, setWoredaId] = useState<string>('');
    const [kebeleId, setKebeleId] = useState<string>('');

    // --- Data Isolation Logic ---
    React.useEffect(() => {
        const initializeScope = async () => {
            if (!user || isInitialized) return;

            const { scopeType, scopeId } = user;
            if (scopeType === 'SYSTEM' || !scopeId) {
                setIsInitialized(true);
                return;
            }

            try {
                // Initialize based on scope level
                if (scopeType === 'REGION') {
                    setRegionId(scopeId);
                    setScope({ type: 'REGION', id: scopeId });
                } 
                else if (scopeType === 'ZONE') {
                    const zone = await zonesService.getById(scopeId);
                    setRegionId(zone.regionId);
                    setZoneId(scopeId);
                    setScope({ type: 'ZONE', id: scopeId });
                }
                else if (scopeType === 'WOREDA') {
                    const woreda = await woredasService.getById(scopeId);
                    const zone = await zonesService.getById(woreda.zoneId);
                    setRegionId(zone.regionId);
                    setZoneId(woreda.zoneId);
                    setWoredaId(scopeId);
                    setScope({ type: 'WOREDA', id: scopeId });
                }
                else if (scopeType === 'KEBELE') {
                    const kebele = await kebelesService.getById(scopeId);
                    const woreda = await woredasService.getById(kebele.woredaId);
                    const zone = await zonesService.getById(woreda.zoneId);
                    setRegionId(zone.regionId);
                    setZoneId(woreda.zoneId);
                    setWoredaId(kebele.woredaId);
                    setKebeleId(scopeId);
                    setScope({ type: 'KEBELE', id: scopeId });
                }
            } catch (error) {
                console.error('Error initializing scope hierarchy:', error);
            } finally {
                setIsInitialized(true);
            }
        };

        initializeScope();
    }, [user, isInitialized]);

    const isLevelRestricted = (level: 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE') => {
        if (!user || user.roles?.some(r => r.name === 'SYSTEM_ADMIN')) return false;
        
        const priority = { 'SYSTEM': 0, 'REGION': 1, 'ZONE': 2, 'WOREDA': 3, 'KEBELE': 4, 'INSTITUTION': 5 };
        const userLevel = priority[user.scopeType as keyof typeof priority] || 0;
        const targetLevel = priority[level];
        
        return userLevel >= targetLevel;
    };

    // Geographical Data Fetching
    const { data: regions } = useQuery({ queryKey: ['regions'], queryFn: () => regionsService.getAll() });
    const { data: zones } = useQuery({ queryKey: ['zones', regionId], queryFn: () => zonesService.getAll(regionId), enabled: !!regionId });
    const { data: woredas } = useQuery({ queryKey: ['woredas', zoneId], queryFn: () => woredasService.getAll(zoneId), enabled: !!zoneId });
    const { data: kebeles } = useQuery({ queryKey: ['kebeles', woredaId], queryFn: () => kebelesService.getAll(woredaId), enabled: !!woredaId });

    // Enrollment Data Fetching
    const { data: stats, isLoading } = useQuery({ 
        queryKey: ['analytics', 'enrollment', scope], 
        queryFn: () => analyticsService.getEnrollmentStats(scope.type === 'SYSTEM' ? undefined : scope.type, scope.id || undefined) 
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
            {/* Header and Filters */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        Enrollment Distribution
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Real-time student population metrics and geographical spread
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', minWidth: 300, borderRadius: 3, border: '1px solid', borderColor: 'divider', background: (theme) => alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(8px)' }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Region</InputLabel>
                        <Select 
                            value={regionId} 
                            label="Region" 
                            onChange={(e) => handleRegionChange(e.target.value)}
                            disabled={isLevelRestricted('REGION')}
                        >
                            <MenuItem value=""><em>All Systems</em></MenuItem>
                            {regions?.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!regionId || isLevelRestricted('ZONE')}>
                        <InputLabel>Zone</InputLabel>
                        <Select 
                            value={zoneId} 
                            label="Zone" 
                            onChange={(e) => handleZoneChange(e.target.value)}
                            disabled={isLevelRestricted('ZONE')}
                        >
                            <MenuItem value=""><em>All Zones</em></MenuItem>
                            {zones?.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!zoneId || isLevelRestricted('WOREDA')}>
                        <InputLabel>Woreda</InputLabel>
                        <Select 
                            value={woredaId} 
                            label="Woreda" 
                            onChange={(e) => handleWoredaChange(e.target.value)}
                            disabled={isLevelRestricted('WOREDA')}
                        >
                            <MenuItem value=""><em>All Woredas</em></MenuItem>
                            {woredas?.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }} disabled={!woredaId || isLevelRestricted('KEBELE')}>
                        <InputLabel>Kebele</InputLabel>
                        <Select 
                            value={kebeleId} 
                            label="Kebele" 
                            onChange={(e) => handleKebeleChange(e.target.value)}
                            disabled={isLevelRestricted('KEBELE')}
                        >
                            <MenuItem value=""><em>All Kebeles</em></MenuItem>
                            {kebeles?.map(k => <MenuItem key={k.id} value={k.id}>{k.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Paper>
            </Box>

            {/* KPIs */}
            <Box sx={{ mb: 4 }}>
                {isLoading ? (
                    <Grid container spacing={3}>
                        {[1, 2, 3, 4].map((i) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <KPIGrid kpis={(stats?.kpis || []) as any} loading={false} />
                )}
            </Box>

            {/* Charts Section */}
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                    ) : (
                        <AnalyticsChart
                            title="Geographical Spread"
                            subtitle={`Student count by ${scope.type === 'SYSTEM' ? 'Region' : 'Zone/Woreda'}`}
                            data={stats?.distribution || []}
                            type="bar"
                            dataKeys={['value']}
                            height={400}
                        />
                    )}
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
                    ) : (
                        <AnalyticsChart
                            title="Academic Programs"
                            subtitle="Distribution of students by program"
                            data={stats?.byProgram || []}
                            type="pie"
                            height={400}
                        />
                    )}
                </Grid>

                <Grid size={{ xs: 12 }}>
                    {isLoading ? (
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                    ) : (
                        <AnalyticsChart
                            title="Enrollment by Academic Year"
                            subtitle="Trends across different grade levels"
                            data={stats?.byYear || []}
                            type="area"
                            dataKeys={['value']}
                            height={300}
                        />
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
