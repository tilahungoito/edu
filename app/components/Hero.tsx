'use client';

import React from 'react';
import { Box, Typography, Button, Container, Stack, alpha, Grid } from '@mui/material';
import Link from 'next/link';

const Hero = () => {
    return (
        <Box
            sx={{
                position: 'relative',
                minHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                bgcolor: 'background.default',
                pt: { xs: 12, md: 16 }, // Add padding to clear fixed navbar
            }}
        >
            {/* Background Gradient */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 70% 30%, rgba(37, 99, 235, 0.05), rgba(248, 250, 252, 1))',
                    zIndex: 1,
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
                <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={4} sx={{ maxWidth: '600px' }}>
                            <Box>
                                <Typography
                                    component="span"
                                    sx={{
                                        color: 'secondary.main',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: 3,
                                        display: 'block',
                                        mb: 3
                                    }}
                                >
                                    Excellence in Education
                                </Typography>
                                <Typography
                                    variant="h1"
                                    sx={{
                                        color: 'primary.main',
                                        fontWeight: 900,
                                        fontSize: { xs: '2.5rem', md: '4.5rem' },
                                        lineHeight: 1.1,
                                        mb: 3,
                                        letterSpacing: -1,
                                        fontFamily: 'Outfit, sans-serif'
                                    }}
                                >
                                    Empowering Tigray's Future Through <Box component="span" sx={{ color: 'secondary.main' }}>Knowledge</Box>
                                </Typography>
                                <Typography
                                    variant="h5"
                                    sx={{
                                        color: 'text.secondary',
                                        fontWeight: 400,
                                        lineHeight: 1.6,
                                        mb: 4,
                                        maxWidth: '600px'
                                    }}
                                >
                                    The official digital gateway for the Tigray Education Bureau. Managing schools, students, and educators with modern technology for a brighter tomorrow.
                                </Typography>
                            </Box>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    component={Link}
                                    href="/login"
                                    sx={{
                                        borderRadius: '50px',
                                        px: 5,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        boxShadow: theme => `0 10px 20px -5px ${alpha(theme.palette.primary.main, 0.3)}`
                                    }}
                                >
                                    Access EMS Portal
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    color="secondary"
                                    sx={{
                                        borderRadius: '50px',
                                        px: 5,
                                        py: 2,
                                        fontSize: '1.1rem',
                                        fontWeight: 700,
                                        borderWidth: 2,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderWidth: 2,
                                            bgcolor: 'secondary.light',
                                            color: 'white',
                                            borderColor: 'secondary.light'
                                        }
                                    }}
                                >
                                    Explore Statistics
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: 'auto',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                animation: 'float 6s ease-in-out infinite',
                                '@keyframes float': {
                                    '0%': { transform: 'translateY(0px)' },
                                    '50%': { transform: 'translateY(-20px)' },
                                    '100%': { transform: 'translateY(0px)' }
                                }
                            }}
                        >
                            <Box
                                component="img"
                                src="./tigray.png"
                                alt="Modern Education Illustration"
                                sx={{
                                    width: '100%',
                                    maxWidth: '600px',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.1))',
                                    borderRadius: 4
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* Decorative Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -50,
                    right: -50,
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    opacity: 0.05,
                    filter: 'blur(80px)',
                    zIndex: 2
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: '10%',
                    right: '5%',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    opacity: 0.03,
                    filter: 'blur(60px)',
                    zIndex: 2
                }}
            />
        </Box>
    );
};

export default Hero;
