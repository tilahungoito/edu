'use client';

import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box, IconButton, Drawer, List, ListItem, ListItemText, alpha } from '@mui/material';
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
            position="fixed"
            elevation={0}
            sx={{
                bgcolor: theme => scrolled ? alpha(theme.palette.background.paper, 0.8) : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                color: 'text.primary',
                borderBottom: scrolled ? '1px solid' : 'none',
                borderColor: 'divider',
            }}
        >
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ justifyContent: 'space-between', height: { xs: 64, md: 80 } }}>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 900,
                            letterSpacing: -0.5,
                            fontSize: { xs: '1.2rem', md: '1.5rem' },
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            fontFamily: 'Outfit, sans-serif'
                        }}
                    >
                        <Box component="span" sx={{ color: 'secondary.main' }}>TIGRAY</Box>
                        EDUCATION
                    </Typography>

                    {/* Desktop Menu */}
                    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.label}
                                component={Link}
                                href={item.href}
                                sx={{
                                    color: 'inherit',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.2s',
                                    '&:hover': { color: 'secondary.main', bgcolor: 'transparent' }
                                }}
                            >
                                {item.label}
                            </Button>
                        ))}
                        <Button
                            variant={scrolled ? "contained" : "outlined"}
                            color="secondary"
                            component={Link}
                            href={isAuthenticated ? "/dashboard" : "/login"}
                            sx={{
                                ml: 2,
                                borderRadius: '12px',
                                px: 4,
                                py: 1,
                                fontWeight: 700,
                                textTransform: 'none',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderColor: 'secondary.main',
                                color: scrolled ? 'white' : 'secondary.main',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: theme => theme.shadows[4],
                                    bgcolor: 'secondary.main',
                                    color: 'white',
                                    borderColor: 'secondary.main'
                                }
                            }}
                        >
                            {isAuthenticated ? 'Dashboard' : 'Portal Login'}
                        </Button>
                    </Box>

                    {/* Mobile Menu Icon */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={theme => ({
                            display: { md: 'none' },
                            bgcolor: scrolled ? alpha(theme.palette.primary.main, 0.05) : alpha(theme.palette.primary.main, 0.05)
                        })}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </Container>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: 280,
                        bgcolor: 'background.paper',
                        p: 2
                    },
                }}
            >
                <Box onClick={handleDrawerToggle} sx={{ py: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 4,
                            fontWeight: 800,
                            color: 'primary.main',
                            fontFamily: 'Outfit, sans-serif',
                            px: 2
                        }}
                    >
                        TEB PORTAL
                    </Typography>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                                <Button
                                    fullWidth
                                    component={Link}
                                    href={item.href}
                                    sx={{
                                        justifyContent: 'flex-start',
                                        color: 'text.primary',
                                        fontWeight: 600,
                                        py: 1.5,
                                        px: 2,
                                        borderRadius: '10px',
                                        '&:hover': { bgcolor: 'action.hover', color: 'secondary.main' }
                                    }}
                                >
                                    {item.label}
                                </Button>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ mt: 4, px: 2 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="secondary"
                            component={Link}
                            href="/login"
                            sx={{ py: 2, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
                        >
                            Access Portal
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </AppBar>
    );
};

export default Navbar;
