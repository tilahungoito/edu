'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon, Map as MapIcon, People as PeopleIcon } from '@mui/icons-material';

export default function ZoneAdminDashboard() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Zone Dashboard</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Woredas</Typography>
                            <Typography variant="h3">8</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={12}>
                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Quick Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<AddIcon />}>
                            Create New Woreda
                        </Button>
                        <Button variant="outlined" startIcon={<PeopleIcon />}>
                            Manage Woreda Admins
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
