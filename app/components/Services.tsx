'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Stack } from '@mui/material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const serviceList = [
    {
        title: 'Student Management',
        description: 'Comprehensive portal for tracking enrollment, grades, and academic records across all institutions.',
        icon: <AssignmentIndIcon fontSize="large" />,
        link: '/login'
    },
    {
        title: 'Financial Oversight',
        description: 'Centralized budget management, payment tracking, and resource allocation for schools and bureaus.',
        icon: <AccountBalanceIcon fontSize="large" />,
        link: '/login'
    },
    {
        title: 'Analytics & Reporting',
        description: 'Real-time data visualization and statistical reports to support evidence-based educational policies.',
        icon: <AutoGraphIcon fontSize="large" />,
        link: '/login'
    },
    {
        title: 'Staff & HR Portal',
        description: 'Management system for educator transfers, certifications, and professional development tracking.',
        icon: <BadgeIcon fontSize="large" />,
        link: '/login'
    }
];

const Services = () => {
    return (
        <Box id="services" sx={{ py: 15 }}>
            <Container maxWidth="lg">
                <Stack spacing={3} sx={{ textAlign: 'center', mb: 10 }}>
                    <Typography
                        variant="overline"
                        sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}
                    >
                        Our Digital Services
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{ fontWeight: 900, color: 'primary.dark', fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                    >
                        Integrated Educational <Box component="span" sx={{ color: 'gold' }}>Ecosystem</Box>
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}
                    >
                        Providing modern digital solutions to streamline educational administration and empower stakeholders at all levels of the hierarchy.
                    </Typography>
                </Stack>

                <Grid container spacing={4}>
                    {serviceList.map((service) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={service.title}>
                            <Card
                                elevation={0}
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    borderRadius: 4,
                                    bgcolor: 'white',
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: '0 30px 60px rgba(13, 71, 161, 0.1)',
                                        '& .service-icon': {
                                            transform: 'scale(1.1)',
                                            color: 'gold'
                                        }
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 0 }}>
                                    <Box
                                        className="service-icon"
                                        sx={{
                                            mb: 3,
                                            color: 'primary.main',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {service.icon}
                                    </Box>
                                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'primary.dark' }}>
                                        {service.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '1.1rem' }}>
                                        {service.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ mt: 3, p: 0 }}>
                                    <Button
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            p: 0,
                                            '&:hover': { bgcolor: 'transparent', color: 'primary.dark' }
                                        }}
                                    >
                                        Access Portal
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
};

export default Services;
