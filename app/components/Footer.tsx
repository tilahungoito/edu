'use client';

import React from 'react';
import { Box, Container, Grid2 as Grid, Typography, Stack, IconButton, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import Link from 'next/link';

const Footer = () => {
    return (
        <Box sx={{ bgcolor: 'primary.dark', color: 'white', pt: 10, pb: 4 }}>
            <Container maxWidth="lg">
                <Grid container spacing={8}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                            TIGRAY EDUCATION BUREAU
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.7, lineHeight: 1.8, mb: 4 }}>
                            Dedicated to providing quality education and modern management systems for the people of Tigray. Empowering learners and educators through innovation.
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton sx={{ color: 'white', '&:hover': { color: 'gold' } }}><FacebookIcon /></IconButton>
                            <IconButton sx={{ color: 'white', '&:hover': { color: 'gold' } }}><TwitterIcon /></IconButton>
                            <IconButton sx={{ color: 'white', '&:hover': { color: 'gold' } }}><LinkedInIcon /></IconButton>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Quick Links</Typography>
                        <Stack spacing={2}>
                            <Link href="#" className="footer-link">Home</Link>
                            <Link href="#services" className="footer-link">Services</Link>
                            <Link href="#stats" className="footer-link">Statistics</Link>
                            <Link href="#about" className="footer-link">About Us</Link>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, md: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Portals</Typography>
                        <Stack spacing={2}>
                            <Link href="/login" className="footer-link">Student Portal</Link>
                            <Link href="/login" className="footer-link">Staff Portal</Link>
                            <Link href="/login" className="footer-link">Admin Dashboard</Link>
                            <Link href="/login" className="footer-link">Inventory System</Link>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Contact Info</Typography>
                        <Stack spacing={2}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                Mekelle, Tigray, Ethiopia
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                info@tigrayedu.gov.et
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                +251 34 440 XXXX
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.5 }}>
                        © {new Date().getFullYear()} Tigray Education Bureau. All rights reserved.
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.5 }}>
                        Developed for Excellence
                    </Typography>
                </Box>
            </Container>

            <style jsx>{`
                .footer-link {
                    color: rgba(255,255,255,0.7);
                    text-decoration: none;
                    transition: all 0.2s ease;
                    font-size: 0.95rem;
                }
                .footer-link:hover {
                    color: #ffd700;
                    transform: translateX(5px);
                }
            `}</style>
        </Box>
    );
};

export default Footer;
