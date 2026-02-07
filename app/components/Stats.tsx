'use client';

import React from 'react';
import { Box, Container, Grid2 as Grid, Typography, Paper, Stack } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const statItems = [
    { label: 'Total Schools', value: '2,400+', icon: <ApartmentIcon fontSize="large" />, color: '#1565c0' },
    { label: 'Active Students', value: '1.2M+', icon: <SchoolIcon fontSize="large" />, color: '#ffd700' },
    { label: 'Certified Educators', value: '45,000+', icon: <PeopleIcon fontSize="large" />, color: '#1565c0' },
    { label: 'Literacy Rate', value: '88%', icon: <TrendingUpIcon fontSize="large" />, color: '#ffd700' },
];

const Stats = () => {
    return (
        <Box id="stats" sx={{ py: 12, bgcolor: '#f8f9fa' }}>
            <Container maxWidth="lg">
                <Grid container spacing={4}>
                    {statItems.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.label}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    borderRadius: 4,
                                    textAlign: 'center',
                                    transition: 'transform 0.3s ease',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    '&:hover': {
                                        transform: 'translateY(-10px)',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                                    }
                                }}
                            >
                                <Stack alignItems="center" spacing={2}>
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderRadius: '50%',
                                            bgcolor: `${item.color}15`,
                                            color: item.color,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                                        {item.value}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        {item.label}
                                    </Typography>
                                </Stack>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Stats;
