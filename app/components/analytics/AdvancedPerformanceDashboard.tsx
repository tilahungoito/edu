'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  useTheme,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { KPIGrid } from './KPICard';
import { AnalyticsChart } from './AnalyticsChart';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import apiClient from '@/app/lib/api/api-client';
import { GRADE_RANGES, GENDER_OPTIONS } from '@/app/lib/constants/analytics';
import { analyticsService } from '@/app/lib/api/analytics.service';
import { toast } from 'react-hot-toast';

interface AdvancedPerformanceDashboardProps {
  scopeType?: string;
  scopeId?: string;
  title?: string;
  subtitle?: string;
  onChartClick?: (data: any, index: number) => void;
}

export function AdvancedPerformanceDashboard({
  scopeType,
  scopeId,
  title = "Advanced Performance Analytics",
  subtitle = "Comprehensive statistical breakdown and hierarchical comparison",
  onChartClick,
}: AdvancedPerformanceDashboardProps) {
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Filters
  const [gradeRange, setGradeRange] = useState('all');
  const [subject, setSubject] = useState('all');
  const [gender, setGender] = useState('all');
  const [comparisonTrends, setComparisonTrends] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  // Hardcoded for simplicity but could be dynamic
  const [subjects] = useState([
    { label: 'All Subjects', value: 'all' },
    { label: 'Mathematics', value: 'Math' },
    { label: 'Science', value: 'Science' },
    { label: 'English', value: 'English' },
    { label: 'History', value: 'History' },
    { label: 'Amharic', value: 'Amharic' },
  ]);

  useEffect(() => {
    fetchData();
  }, [scopeType, scopeId, gradeRange, subject, gender]);

  useEffect(() => {
    if (data?.comparison?.length > 0) {
      fetchComparisonTrends();
    }
  }, [data?.comparison]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (scopeType) params.append('scopeType', scopeType);
      if (scopeId) params.append('scopeId', scopeId);
      if (gradeRange !== 'all') params.append('gradeRange', gradeRange);
      if (subject !== 'all') params.append('subject', subject);
      if (gender !== 'all') params.append('gender', gender);

      const response = await apiClient.get(`/analytics/advanced-performance?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch advanced performance stats:', error);
      toast.error('Failed to load advanced analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonTrends = async () => {
    if (!data?.comparison) return;
    try {
      setTrendLoading(true);
      const entities = data.comparison.slice(0, 5).map((c: any) => ({
        type: getChildScopeType(scopeType),
        id: c.id, // wait, comparison rows need ID. aggregateComparison needs to return it.
        name: c.name
      }));
      // Wait, Backend check: aggregateComparison doesn't return ID.
      // I need to fix AnalyticsService.getAdvancedPerformanceStats to include ID in comparison results.
      // For now, let's assume we fixed it. I will fix it in the next tool call.
      
      const trends = await analyticsService.compareTrends(entities);
      setComparisonTrends(trends);
    } catch (error) {
      console.error('Failed to fetch comparison trends:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  const getChildScopeType = (parentScope?: string) => {
    switch (parentScope) {
      case 'REGION': return 'ZONE';
      case 'ZONE': return 'WOREDA';
      case 'WOREDA': return 'KEBELE';
      case 'KEBELE': return 'INSTITUTION';
      case 'INSTITUTION': return 'COURSE';
      default: return 'REGION';
    }
  };

  const kpis = data ? [
    { label: 'Total Assessed Students', value: data.kpis.totalStudents, icon: 'People', color: 'primary' as const },
    { label: 'Mean Score', value: `${data.kpis.mean}%`, icon: 'TrendingUp', color: 'success' as const },
    { label: 'Highest Score', value: `${data.kpis.max}%`, icon: 'TrendingUp', color: 'info' as const },
    { label: 'Standard Deviation', value: data.kpis.stdDev, icon: 'DateRange', color: 'warning' as const },
  ] : [];

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Entity Name', flex: 1, minWidth: 200 },
    { field: 'totalStudents', headerName: 'Students', width: 130, type: 'number' },
    { 
      field: 'mean', 
      headerName: 'Mean Score', 
      width: 130, 
      type: 'number',
      valueFormatter: (params: any) => `${params.value}%`,
      renderCell: (params: any) => {
        const isHigh = params.value >= 75;
        const isLow = params.value < 50;
        return (
          <Typography fontWeight={600} color={isHigh ? 'success.main' : isLow ? 'error.main' : 'text.primary'}>
            {params.value}%
          </Typography>
        );
      }
    },
    { 
      field: 'passRate', 
      headerName: 'Pass Rate', 
      width: 130, 
      type: 'number',
      valueFormatter: (params: any) => `${params.value}%`,
      renderCell: (params: any) => (
        <Box sx={{
          px: 1, py: 0.5, borderRadius: 1,
          bgcolor: alpha(params.value >= 50 ? theme.palette.success.main : theme.palette.error.main, 0.1),
          color: params.value >= 50 ? theme.palette.success.main : theme.palette.error.main,
          fontWeight: 700,
          fontSize: '0.875rem'
        }}>
          {params.value}%
        </Box>
      )
    },
    { field: 'failRate', headerName: 'Fail Rate', width: 130, type: 'number', valueFormatter: (params: any) => `${params.value}%` },
  ];

  const topPerformer = data?.comparison?.length > 0 ? data.comparison.reduce((prev: any, current: any) => (prev.mean > current.mean) ? prev : current) : null;
  const highestFailure = data?.comparison?.length > 0 ? data.comparison.reduce((prev: any, current: any) => (prev.failRate > current.failRate) ? prev : current) : null;

  return (
    <Box>
      {/* Header & Filters */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>{title}</Typography>
              <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Grade Range</InputLabel>
                <Select
                  value={gradeRange}
                  label="Grade Range"
                  onChange={(e) => setGradeRange(e.target.value)}
                >
                  {GRADE_RANGES.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subject}
                  label="Subject"
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {subjects.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender Filter</InputLabel>
                <Select
                  value={gender}
                  label="Gender Filter"
                  onChange={(e) => setGender(e.target.value)}
                >
                  {GENDER_OPTIONS.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* KPI Section */}
      <Box sx={{ mb: 4 }}>
        <KPIGrid kpis={kpis} loading={loading} columns={4} />
      </Box>

      {/* Visualizations */}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AnalyticsChart
            title="Score Distribution Categories"
            subtitle="Percentage of students per grade band"
            data={data?.distribution?.map((d: any) => ({
              name: d.name,
              value: d.percentage,
              count: d.count
            })) || []}
            type="pie"
            loading={loading}
            height={350}
            colors={data?.distribution?.map((d: any) => d.color) || undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <AnalyticsChart
            title="Distribution by Headcount"
            subtitle="Total number of students in each range"
            data={data?.distribution || []}
            type="bar"
            dataKeys={['count']}
            loading={loading}
            height={350}
            colors={data?.distribution?.map((d: any) => d.color) || undefined}
            showLegend={false}
            onClick={onChartClick}
          />
        </Grid>

        {/* New: Subject Performance Radar (Only if subject level data exists) */}
        {data?.subjects && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalyticsChart
              title="Subject Competency Profile"
              subtitle="Mean scores across core learning areas"
              data={data.subjects}
              type="radar"
              dataKeys={['value']}
              loading={loading}
              height={350}
              colors={[theme.palette.secondary.main]}
            />
          </Grid>
        )}

        {/* New: Multi-Entity Trend Comparison */}
        {comparisonTrends.length > 0 && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <AnalyticsChart
              title="Regional Performance Comparison"
              subtitle="Score trends across top 5 entities"
              data={comparisonTrends}
              type="line"
              dataKeys={Object.keys(comparisonTrends[0] || {}).filter(k => k !== 'month')}
              loading={trendLoading}
              height={350}
            />
          </Grid>
        )}

        {/* Literal Score Ranges Table */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Score Ranges Breakdown
              </Typography>
              {loading ? <Skeleton variant="rectangular" height={200} /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Range</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Students</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.distribution?.map((row: any) => (
                      <TableRow key={row.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.color }} />
                            <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
                            <Typography variant="caption" color="text.secondary">({row.range})</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{row.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hierarchical Comparison Table */}
        <Grid size={{ xs: 12 }}>
          {data?.comparison?.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${theme.palette.success.main}` }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="success.main" fontWeight={700}>Highest Performing Group</Typography>
                    <Typography variant="h5" fontWeight={800}>{topPerformer ? topPerformer.name : 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">{topPerformer ? `Mean Score: ${topPerformer.mean}% | Pass Rate: ${topPerformer.passRate}%` : ''}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${theme.palette.error.main}` }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="error.main" fontWeight={700}>Highest Failure Rate</Typography>
                    <Typography variant="h5" fontWeight={800}>{highestFailure ? highestFailure.name : 'N/A'}</Typography>
                    <Typography variant="body2" color="text.secondary">{highestFailure ? `Fail Rate: ${highestFailure.failRate}% | Mean Score: ${highestFailure.mean}%` : ''}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Hierarchical Entity Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Compare performance metrics across immediately subordinate administrative units.
              </Typography>
              
              {loading ? (
                <Skeleton variant="rectangular" height={400} />
              ) : (
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={data?.comparison?.map((row: any, i: number) => ({ id: i, ...row })) || []}
                    columns={columns}
                    disableRowSelectionOnClick
                    density="comfortable"
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: 'none',
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        backgroundColor: theme.palette.background.paper,
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default AdvancedPerformanceDashboard;
