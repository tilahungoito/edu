'use client';

import { Box, Typography, Grid, Card, CardContent } from '@mui/material';

export default function AcademicDashboard() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Academic Dashboard</Typography>
            <Typography color="text.secondary">Welcome back to your dashboard.</Typography>
        </Box>
    );
}
