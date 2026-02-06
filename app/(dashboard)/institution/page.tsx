'use client';

import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon, Map as MapIcon, People as PeopleIcon, School as SchoolIcon } from '@mui/icons-material';

export default function InstitutionAdminDashboard() {
    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Institution Dashboard</Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Students</Typography>
                            <Typography variant="h3">540</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>Total Staff</Typography>
                            <Typography variant="h3">32</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>Quick Actions</Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" startIcon={<PeopleIcon />}>
                            Manage Staff (Registrar/Instructors)
                        </Button>
                        <Button variant="outlined" startIcon={<SchoolIcon />}>
                            Manage Students
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
