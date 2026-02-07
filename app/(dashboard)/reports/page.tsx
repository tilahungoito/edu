'use client';

import React, { useState } from 'react';
import { Box, Typography, Button, Grid2 as Grid, Card, CardContent } from '@mui/material';
import {
    Description as ReportIcon,
    Schedule as ScheduleIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingIcon,
} from '@mui/icons-material';

const reportTypes = [
    { title: 'Annual Enrollment Report', description: 'Comprehensive student data across all zones.', icon: <TrendingIcon color="primary" /> },
    { title: 'Staff Distribution Analysis', description: 'Teacher-to-student ratios and staff demographics.', icon: <AssessmentIcon color="secondary" /> },
    { title: 'Inventory Utilization', description: 'Tracking asset condition and distribution efficiency.', icon: <ReportIcon color="success" /> },
    { title: 'Budget Execution Summary', description: 'Allocated vs. spent budget per administrative level.', icon: <TrendingIcon color="warning" /> },
];

export default function ReportsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Report Generator
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Generate detailed PDF/Excel reports from system data
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {reportTypes.map((report, index) => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
                        <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', '&:hover': { transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, backgroundColor: 'primary.light', display: 'inline-flex', opacity: 0.1 }}>
                                    {report.icon}
                                </Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {report.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {report.description}
                                </Typography>
                                <Button variant="outlined" size="small" fullWidth>
                                    Generate Report
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
