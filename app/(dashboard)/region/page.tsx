'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon, Map as MapIcon, People as PeopleIcon } from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store/auth-store';

export default function RegionalAdminDashboard() {
    const { user } = useAuthStore();

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                Region Dashboard
                {user?.tenantName && <Typography component="span" variant="h4" color="primary">: {user.tenantName}</Typography>}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Zones</Typography>
                            <Typography variant="h3">12</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Quick Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<AddIcon />}>
                            Create New Zone
                        </Button>
                        <Button variant="outlined" startIcon={<PeopleIcon />}>
                            Manage Zone Admins
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
