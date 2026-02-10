'use client';

import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActions, Button, Stack, alpha } from '@mui/material';
import Link from 'next/link';
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
        <Box id="services" sx={{ py: { xs: 10, md: 15 }, bgcolor: 'background.default' }}>
            <Container maxWidth="lg">
                <Stack spacing={2} sx={{ textAlign: 'center', mb: 10 }}>
                    <Typography
                        variant="overline"
                        sx={{ color: 'secondary.main', fontWeight: 800, letterSpacing: 3 }}
                    >
                        Our Digital Services
                    </Typography>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 900,
                            color: 'primary.main',
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            fontFamily: 'Outfit, sans-serif'
                        }}
                    >
                        Integrated Educational <Box component="span" sx={{ color: 'secondary.main' }}>Ecosystem</Box>
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', lineHeight: 1.7, fontWeight: 400 }}
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
                                    bgcolor: 'background.paper',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    '&:hover': {
                                        borderColor: 'secondary.main',
                                        transform: 'translateY(-8px)',
                                        boxShadow: theme => `0 20px 40px ${alpha(theme.palette.secondary.main, 0.08)}`,
                                        '& .service-icon': {
                                            bgcolor: 'secondary.main',
                                            color: 'white',
                                            transform: 'scale(1.1) rotate(5deg)'
                                        }
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 0, flexGrow: 1 }}>
                                    <Box
                                        className="service-icon"
                                        sx={{
                                            mb: 4,
                                            width: 64,
                                            height: 64,
                                            borderRadius: '16px',
                                            bgcolor: theme => alpha(theme.palette.secondary.main, 0.08),
                                            color: 'secondary.main',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        {service.icon}
                                    </Box>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 800,
                                            mb: 2,
                                            color: 'primary.main',
                                            fontFamily: 'Outfit, sans-serif'
                                        }}
                                    >
                                        {service.title}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '1.05rem' }}>
                                        {service.description}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ mt: 4, p: 0 }}>
                                    <Button
                                        component={Link}
                                        href={service.link}
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            px: 0,
                                            color: 'secondary.main',
                                            '&:hover': { bgcolor: 'transparent', color: 'secondary.dark', '& .MuiButton-endIcon': { transform: 'translateX(4px)' } },
                                            transition: 'all 0.2s',
                                            '& .MuiButton-endIcon': { transition: 'transform 0.2s' }
                                        }}
                                    >
                                        Access Exploration
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
