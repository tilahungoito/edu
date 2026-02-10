'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Paper, Stack, alpha } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ApartmentIcon from '@mui/icons-material/Apartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const statItems = [
    { label: 'Total Schools', value: '2,400+', icon: <ApartmentIcon fontSize="large" />, color: 'secondary.main' },
    { label: 'Active Students', value: '1.2M+', icon: <SchoolIcon fontSize="large" />, color: 'secondary.main' },
    { label: 'Certified Educators', value: '45,000+', icon: <PeopleIcon fontSize="large" />, color: 'secondary.main' },
    { label: 'Literacy Rate', value: '88%', icon: <TrendingUpIcon fontSize="large" />, color: 'secondary.main' },
];

const Stats = () => {
    return (
        <Box id="stats" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
                <Typography
                    variant="h2"
                    sx={{
                        textAlign: 'center',
                        fontWeight: 900,
                        mb: 8,
                        color: 'primary.main',
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontFamily: 'Outfit, sans-serif'
                    }}
                >
                    Impact in <Box component="span" sx={{ color: 'secondary.main' }}>Numbers</Box>
                </Typography>
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
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        borderColor: 'secondary.main',
                                        boxShadow: theme => `0 20px 40px ${alpha(theme.palette.secondary.main, 0.08)}`,
                                        '& .stats-icon': {
                                            bgcolor: 'secondary.main',
                                            color: 'white',
                                            transform: 'scale(1.1) rotate(5deg)'
                                        }
                                    }
                                }}
                            >
                                <Stack alignItems="center" spacing={2.5}>
                                    <Box
                                        className="stats-icon"
                                        sx={{
                                            p: 2,
                                            borderRadius: '16px',
                                            bgcolor: theme => alpha(theme.palette.secondary.main, 0.08),
                                            color: 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Typography
                                        variant="h3"
                                        sx={{
                                            fontWeight: 800,
                                            color: 'primary.main',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    >
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
