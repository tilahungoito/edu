'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Link,
    Alert,
    InputAdornment,
    Fade,
    Slide,
    alpha,
    ThemeProvider,
    CssBaseline,
} from '@mui/material';
import NextLink from 'next/link';
import {
    School as SchoolIcon,
    Email as EmailIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import theme from '@/app/theme/theme';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    if (!mounted) return null;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Decoration */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 70% 30%, rgba(37, 99, 235, 0.05), rgba(248, 250, 252, 1))',
                        zIndex: 0,
                    }}
                />

                <Slide direction="up" in={mounted} timeout={600}>
                    <Card
                        elevation={0}
                        sx={{
                            width: '100%',
                            maxWidth: 500,
                            borderRadius: 4,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            zIndex: 1,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: theme => `0 20px 40px ${alpha(theme.palette.secondary.main, 0.08)}`,
                            '&:hover': {
                                borderColor: 'secondary.main',
                                transform: 'translateY(-4px)',
                            }
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ p: 4, pb: 2, textAlign: 'center' }}>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '20px',
                                    bgcolor: theme => alpha(theme.palette.secondary.main, 0.08),
                                    color: 'secondary.main',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        transform: 'scale(1.1) rotate(5deg)',
                                        bgcolor: 'secondary.main',
                                        color: 'white',
                                    }
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 40 }} />
                            </Box>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontWeight: 800,
                                    mb: 1,
                                    color: 'primary.main',
                                    fontFamily: 'Outfit, sans-serif'
                                }}
                            >
                                Tigray Education
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500,
                                }}
                            >
                                Reset Password
                            </Typography>
                        </Box>

                        <CardContent sx={{ p: 4, pt: 2 }}>
                            {submitted ? (
                                <Fade in={submitted}>
                                    <Box textAlign="center">
                                        <Alert
                                            severity="success"
                                            sx={{
                                                mb: 4,
                                                borderRadius: 2,
                                                textAlign: 'left'
                                            }}
                                        >
                                            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                                        </Alert>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            size="large"
                                            component={NextLink}
                                            href="/login"
                                            sx={{
                                                py: 1.5,
                                                borderRadius: 2,
                                                fontWeight: 700,
                                                borderColor: 'secondary.main',
                                                color: 'secondary.main',
                                                textTransform: 'none',
                                                '&:hover': {
                                                    borderColor: 'secondary.dark',
                                                    bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                                }
                                            }}
                                        >
                                            Back to Login
                                        </Button>
                                    </Box>
                                </Fade>
                            ) : (
                                <Box component="form" onSubmit={handleSubmit}>
                                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4, px: 2 }}>
                                        Enter your email address and we'll send you a link to reset your password.
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        sx={{
                                            mb: 4,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '&:hover fieldset': {
                                                    borderColor: 'secondary.main',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: 'secondary.main',
                                                }
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EmailIcon sx={{ color: 'text.secondary' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Button
                                        fullWidth
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        sx={{
                                            mb: 3,
                                            py: 1.5,
                                            borderRadius: 2,
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            boxShadow: theme => `0 10px 20px -5px ${alpha(theme.palette.primary.main, 0.3)}`,
                                            '&:hover': {
                                                bgcolor: 'primary.dark',
                                                boxShadow: theme => `0 15px 30px -5px ${alpha(theme.palette.primary.main, 0.4)}`,
                                                transform: 'translateY(-2px)',
                                            },
                                            '&:active': {
                                                transform: 'translateY(0)',
                                            },
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        Send Reset Link
                                    </Button>

                                    <Box textAlign="center">
                                        <Link
                                            component={NextLink}
                                            href="/login"
                                            underline="hover"
                                            sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: 'secondary.main',
                                                '&:hover': {
                                                    color: 'secondary.dark',
                                                },
                                            }}
                                        >
                                            Back to Login
                                        </Link>
                                    </Box>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Slide>
            </Box>
        </ThemeProvider>
    );
}
