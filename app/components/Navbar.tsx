'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Link from 'next/link';
import { useAuthStore } from '@/app/lib/store';

const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navItems = [
        { label: 'Home', href: '#' },
        { label: 'Services', href: '#services' },
        { label: 'Statistics', href: '#stats' },
        { label: 'About', href: '#about' },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={scrolled ? 4 : 0}
            sx={{
                bgcolor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                backdropFilter: scrolled ? 'blur(10px)' : 'none',
                transition: 'all 0.3s ease-in-out',
                color: scrolled ? 'primary.main' : 'white',
            }}
        >
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: -0.5,
                            fontSize: { xs: '1.2rem', md: '1.5rem' },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <Box component="span" sx={{ color: scrolled ? 'primary.main' : 'gold' }}>TIGRAY</Box>
                        EDUCATION
                    </Typography>

                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.label}
                                component={Link}
                                href={item.href}
                                sx={{
                                    color: 'inherit',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    '&:hover': { color: 'gold' }
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                        <Button
                            variant={scrolled ? "contained" : "outlined"}
                            component={Link}
                            href={isAuthenticated ? "/dashboard" : "/login"}
                            sx={{
                                ml: 2,
                                borderRadius: '50px',
                                px: 3,
                                borderColor: scrolled ? 'primary.main' : 'white',
                                color: scrolled ? 'white' : 'white',
                                bgcolor: scrolled ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                                '&:hover': {
                                    bgcolor: scrolled ? 'primary.dark' : 'white',
                                    color: scrolled ? 'white' : 'primary.main',
                                }
                            }}
                        >
                            {isAuthenticated ? 'Go to Dashboard' : 'Login Portal'}
                        </Button>
                    </Box>

                    {/* Mobile Menu Icon */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ display: { md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </Container>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
                }}
            >
                <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h6" sx={{ my: 2, fontWeight: 700 }}>
                        TEB Portal
                    </Typography>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.label} disablePadding>
                                <ListItemText
                                    primary={item.label}
                                    sx={{ textAlign: 'center', py: 1 }}
                                />
                            </ListItem>
                        ))}
                        <ListItem disablePadding>
                            <Button
                                fullWidth
                                variant="contained"
                                component={Link}
                                href="/login"
                                sx={{ m: 2 }}
                            >
                                Login Portal
                            </Button>
                        </ListItem>
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default Navbar;
