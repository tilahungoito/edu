'use client';

import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    alpha,
    useTheme,
    Paper,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    LinearProgress,
} from '@mui/material';
import {
    School as SchoolIcon,
    ChildCare as KGIcon,
    MenuBook as PrimaryIcon,
    LocalLibrary as SecondaryIcon,
    Star as PrepIcon,
    Business as AllIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store';
import { AnalyticsChart } from '@/app/components/analytics';

export const SCHOOL_TYPES = [
    { value: 'KG', label: 'Kindergarten', color: '#8b5cf6', icon: <KGIcon /> },
    { value: 'PRIMARY', label: 'Primary', color: '#6366f1', icon: <PrimaryIcon /> },
    { value: 'SECONDARY', label: 'Secondary', color: '#f59e0b', icon: <SecondaryIcon /> },
    { value: 'PREPARATORY', label: 'Preparatory', color: '#ec4899', icon: <PrepIcon /> },
    { value: 'COMBINED', label: 'Combined', color: '#10b981', icon: <AllIcon /> },
];

export default function SchoolTypesReportPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    const { data: schools, isLoading } = useQuery({
        queryKey: ['institutions', 'all'],
        queryFn: () => institutionsService.getAll({ all: true }),
    });

    // Count by type
    const countByType = SCHOOL_TYPES.map(type => {
        const count = (schools || []).filter((s: any) => (s.type || 'PRIMARY') === type.value).length;
        const students = (schools || [])
            .filter((s: any) => (s.type || 'PRIMARY') === type.value)
            .reduce((acc: number, s: any) => acc + (s._count?.students || 0), 0);
        return { ...type, count, students };
    });

    const totalSchools = schools?.length || 0;

    const chartData = countByType.map(t => ({
        name: t.label,
        schools: t.count,
        students: t.students,
    }));

    const schoolList = (schools || []).map((s: any) => ({
        ...s,
        type: s.type || 'PRIMARY',
    }));

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }} gutterBottom>
                    Schools by Type
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Breakdown of institutions by school level — KG, Primary, Secondary, Preparatory
                </Typography>
            </Box>

            {isLoading && <LinearProgress sx={{ borderRadius: 4, mb: 3 }} />}

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.4)}`, borderRadius: '16px', textAlign: 'center', p: 1 }}>
                        <CardContent sx={{ py: 2 }}>
                            <Typography variant="h4" fontWeight={900} color="primary.main">{totalSchools}</Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Total Schools</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                {countByType.map(type => (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={type.value}>
                        <Card elevation={0} sx={{
                            border: `1px solid ${alpha(type.color, 0.4)}`,
                            borderRadius: '16px',
                            textAlign: 'center',
                            p: 1,
                            bgcolor: alpha(type.color, 0.04),
                        }}>
                            <CardContent sx={{ py: 2 }}>
                                <Box sx={{ color: type.color, display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                                    {type.icon}
                                </Box>
                                <Typography variant="h4" fontWeight={900} sx={{ color: type.color }}>
                                    {type.count}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    {type.label}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Chart */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <AnalyticsChart
                        title="Distribution by School Type"
                        subtitle="Number of schools and enrolled students per type"
                        data={chartData}
                        type="bar"
                        dataKeys={['schools', 'students']}
                        height={300}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.4)}`, borderRadius: '16px', p: 3, height: '100%' }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Type Breakdown</Typography>
                        {countByType.map(type => {
                            const pct = totalSchools > 0 ? Math.round((type.count / totalSchools) * 100) : 0;
                            return (
                                <Box key={type.value} sx={{ mb: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ color: type.color, display: 'flex', fontSize: 16 }}>{type.icon}</Box>
                                            <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight={800} sx={{ color: type.color }}>
                                            {type.count} ({pct}%)
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={pct}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: alpha(type.color, 0.1),
                                            '& .MuiLinearProgress-bar': { bgcolor: type.color, borderRadius: 3 },
                                        }}
                                    />
                                    <Typography variant="caption" color="text.secondary">
                                        {type.students.toLocaleString()} total students
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Paper>
                </Grid>
            </Grid>

            {/* School List Table */}
            <Paper elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.4)}`, borderRadius: '16px', overflow: 'hidden' }}>
                <Box sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                    <Typography variant="h6" fontWeight={700}>All Schools</Typography>
                    <Typography variant="body2" color="text.secondary">Full list with their types and enrollment counts</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.action.hover, 0.03) }}>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px', py: 1.5 }}>School Name</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px' }}>Type</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px' }}>Kebele</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px' }} align="right">Students</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px' }} align="right">Teachers</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '12px' }} align="right">Courses</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {schoolList.map((school: any, idx: number) => {
                                const typeInfo = SCHOOL_TYPES.find(t => t.value === school.type) || SCHOOL_TYPES[1];
                                return (
                                    <TableRow key={school.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <SchoolIcon sx={{ fontSize: 16, color: typeInfo.color }} />
                                                <Typography variant="body2" fontWeight={600}>{school.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={typeInfo.label}
                                                size="small"
                                                sx={{ bgcolor: alpha(typeInfo.color, 0.1), color: typeInfo.color, fontWeight: 700, fontSize: '10px', height: 20 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" color="text.secondary">
                                                {school.kebele?.name || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {(school._count?.students || 0).toLocaleString()}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {school._count?.users || 0}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>
                                                {school._count?.courses || 0}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {schoolList.length === 0 && !isLoading && (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                        No schools found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
