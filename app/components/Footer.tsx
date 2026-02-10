'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, IconButton, Divider, alpha } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Link from 'next/link';

const Footer = () => {
    return (
        <Box sx={{ bgcolor: 'background.default', color: 'text.primary', pt: { xs: 8, md: 10 }, pb: 4, borderTop: '1px solid', borderColor: 'divider' }}>
            <Container maxWidth="lg">
                <Grid container spacing={8}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 900,
                                mb: 3,
                                fontFamily: 'Outfit, sans-serif',
                                letterSpacing: -0.5
                            }}
                        >
                            TIGRAY <Box component="span" sx={{ color: 'secondary.main' }}>EDUCATION</Box> BUREAU
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 4 }}>
                            Dedicated to providing quality education and modern management systems for the people of Tigray. Empowering learners and educators through innovation.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            {[
                                { icon: <FacebookIcon />, label: 'Facebook' },
                                { icon: <TwitterIcon />, label: 'Twitter' },
                                { icon: <LinkedInIcon />, label: 'LinkedIn' }
                            ].map((social) => (
                                <IconButton
                                    key={social.label}
                                    sx={{
                                        color: 'text.secondary',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            color: 'secondary.main',
                                            bgcolor: 'action.hover',
                                            transform: 'translateY(-3px)'
                                        }
                                    }}
                                >
                                    {social.icon}
                                </IconButton>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Outfit, sans-serif' }}>Quick Links</Typography>
                        <Stack spacing={2}>
                            {['Home', 'Services', 'Statistics', 'About Us'].map((label) => (
                                <Box
                                    key={label}
                                    component={Link}
                                    href="#"
                                    sx={{
                                        color: 'text.secondary',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        display: 'block',
                                        '&:hover': {
                                            color: 'secondary.main',
                                            transform: 'translateX(5px)'
                                        }
                                    }}
                                >
                                    {label}
                                </Box>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Outfit, sans-serif' }}>Portals</Typography>
                        <Stack spacing={2}>
                            {['Student Portal', 'Staff Portal', 'Admin Dashboard', 'Inventory System'].map((label) => (
                                <Box
                                    key={label}
                                    component={Link}
                                    href="/login"
                                    sx={{
                                        color: 'text.secondary',
                                        textDecoration: 'none',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                        display: 'block',
                                        '&:hover': {
                                            color: 'secondary.main',
                                            transform: 'translateX(5px)'
                                        }
                                    }}
                                >
                                    {label}
                                </Box>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, fontFamily: 'Outfit, sans-serif' }}>Contact Info</Typography>
                        <Stack spacing={2.5}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                                <Typography variant="body2">Mekelle, Tigray, Ethiopia</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                                <Typography variant="body2">info@tigrayedu.gov.et</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                                <Typography variant="body2">+251 34 440 XXXX</Typography>
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 6, borderColor: 'divider' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        © 2026 Tigray Education Bureau. All rights reserved.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Developed for Excellence
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
