'use client';

import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Switch, FormControlLabel, Button } from '@mui/material';

export default function SettingsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    System Settings
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Configure regional standards and system behavior
                </Typography>
            </Box>

            <Card sx={{ borderRadius: 3, mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>General Settings</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={3}>
                        <FormControlLabel control={<Switch defaultChecked />} label="Enable hierarchical data isolation" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Allow multi-level transfer approvals" />
                        <FormControlLabel control={<Switch />} label="Strict budget enforcement" />
                        <FormControlLabel control={<Switch defaultChecked />} label="Mobile app access enabled" />
                    </Stack>
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained">Save Changes</Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

import { Stack } from '@mui/material';
