'use client';

import React from 'react';
import { Box, Typography, Grid2 as Grid } from '@mui/material';
import { AnalyticsChart, KPIGrid } from '@/app/components/analytics';

const performanceData = [
    { name: '2019', score: 68, enrollment: 380000 },
    { name: '2020', score: 72, enrollment: 395000 },
    { name: '2021', score: 75, enrollment: 410000 },
    { name: '2022', score: 78, enrollment: 425000 },
    { name: '2023', score: 82, enrollment: 447000 },
];

const subjectData = [
    { name: 'Math', value: 85 },
    { name: 'Science', value: 78 },
    { name: 'English', value: 92 },
    { name: 'History', value: 70 },
    { name: 'Amharic', value: 88 },
];

export default function PerformanceAnalyticsPage() {
    const kpis = [
        { label: 'Avg Test Score', value: 78.5, icon: 'TrendingUp', trend: 'up' },
        { label: 'Passing Rate', value: '86%', icon: 'CheckCircle', trend: 'up', color: 'success' },
        { label: 'Dropout Rate', value: '2.4%', icon: 'TrendingDown', trend: 'down', color: 'error' },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Performance Analytics
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    In-depth analysis of regional educational performance
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis as any} loading={false} />
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} lg={8} {...{ item: true, xs: 12, lg: 8 } as any}>
                    <AnalyticsChart
                        title="Academic Trends"
                        subtitle="Average scores vs Enrollment growth"
                        data={performanceData}
                        type="area"
                        dataKeys={['score', 'enrollment']}
                        height={400}
                    />
                </Grid>
                <Grid item xs={12} lg={4} {...{ item: true, xs: 12, lg: 4 } as any}>
                    <AnalyticsChart
                        title="Subject Performance"
                        subtitle="Regional averages by subject"
                        data={subjectData}
                        type="bar"
                        dataKeys={['value']}
                        height={400}
                    />
                </Grid>
            </Grid>
        </Box>
    );
}
