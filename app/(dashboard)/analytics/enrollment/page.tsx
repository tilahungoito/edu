'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { AnalyticsChart } from '@/app/components/analytics';

const enrollmentData = [
    { name: 'Mekelle', value: 125000 },
    { name: 'Adigrat', value: 85000 },
    { name: 'Axum', value: 78000 },
    { name: 'Shire', value: 62000 },
    { name: 'Wukro', value: 45000 },
    { name: 'Adwa', value: 52000 },
];

export default function EnrollmentAnalyticsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Enrollment Distribution
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Analyze student distribution across zones and regions
                </Typography>
            </Box>

            <Box sx={{ height: 600 }}>
                <AnalyticsChart
                    title="Student Count by Zone"
                    subtitle="2023-2024 Academic Year"
                    data={enrollmentData}
                    type="pie"
                    height={500}
                />
            </Box>
        </Box>
    );
}
