'use client';

import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
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
                bgcolor: 'primary.dark',
                mt: -8, // Compensate for navbar height if needed, but sticky transparent might handle it
            }}
        >
            {/* Background Image / Overlay */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 70% 30%, rgba(21, 101, 192, 0.8), rgba(13, 71, 161, 1))',
                    zIndex: 1,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to right, rgba(13, 71, 161, 0.9), rgba(0, 0, 0, 0.2))',
                    zIndex: 2,
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3 }}>
                <Stack spacing={4} sx={{ maxWidth: { xs: '100%', md: '700px' } }}>
                    <Box>
                        <Typography
                            component="span"
                            sx={{
                                color: 'gold',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: 2,
                                display: 'block',
                                mb: 2
                            }}
                        >
                            Excellence in Education
                        </Typography>
                        <Typography
                            variant="h1"
                            sx={{
                                color: 'white',
                                fontWeight: 900,
                                fontSize: { xs: '2.5rem', md: '4.5rem' },
                                lineHeight: 1.1,
                                mb: 3,
                                letterSpacing: -1
                            }}
                        >
                            Empowering Tigray's Future Through <Box component="span" sx={{ color: 'gold' }}>Knowledge</Box>
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontWeight: 400,
                                lineHeight: 1.6,
                                mb: 4
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
                                bgcolor: 'white',
                                color: 'primary.main',
                                '&:hover': {
                                    bgcolor: 'gold',
                                    color: 'primary.dark',
                                }
                            }}
                        >
                            Access EMS Portal
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            sx={{
                                borderRadius: '50px',
                                px: 5,
                                py: 2,
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                color: 'white',
                                borderColor: 'white',
                                '&:hover': {
                                    borderColor: 'gold',
                                    color: 'gold',
                                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                                }
                            }}
                        >
                            Explore Statistics
                        </Button>
                    </Stack>
                </Stack>
            </Container>

            {/* Decorative Elements */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -50,
                    right: -50,
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    bgcolor: 'gold',
                    opacity: 0.1,
                    filter: 'blur(80px)',
                    zIndex: 2
                }}
            />
        </Box>
    );
};

export default Hero;
