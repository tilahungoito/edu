'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon, Map as MapIcon, People as PeopleIcon } from '@mui/icons-material';

export default function SystemAdminDashboard() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>System Overview</Typography>

            <Grid container spacing={3}>
                {/* Stats */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Regions</Typography>
                            <Typography variant="h3">6</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Users</Typography>
                            <Typography variant="h3">1,240</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Actions */}
                <Grid size={{ xs: 12 }}>
                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Quick Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<AddIcon />}>
                            Create New Region
                        </Button>
                        <Button variant="outlined" startIcon={<PeopleIcon />}>
                            Manage Regional Admins
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
