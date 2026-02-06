'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    alpha,
    InputAdornment,
    IconButton,
    Divider,
    Stack,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import theme from '@/app/theme/theme';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Validation helpers
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const validatePassword = (password: string): boolean => {
        if (!password) {
            setPasswordError('Password is required');
            return false;
        }
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate inputs
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Call backend API via auth store
        const result = await login(email, password);

        if (result.success) {
            // Redirect to dashboard on success
            router.push('/dashboard');
        } else {
            // Display error from backend
            setError(result.error || 'Login failed. Please try again.');
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.15)} 100%)`,
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at 30% 50%, rgba(13, 71, 161, 0.08) 0%, transparent 50%)',
                        pointerEvents: 'none',
                    },
                }}
            >
                <Card
                    sx={{
                        width: '100%',
                        maxWidth: 480,
                        borderRadius: 5,
                        boxShadow: '0 30px 90px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            p: 5,
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: -50,
                                right: -50,
                                width: 200,
                                height: 200,
                                borderRadius: '50%',
                                background: alpha('#fff', 0.05),
                            },
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 4,
                                backgroundColor: alpha('#fff', 0.15),
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                                position: 'relative',
                                zIndex: 1,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                            }}
                        >
                            <SchoolIcon sx={{ fontSize: 44, color: 'white' }} />
                        </Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                            color="white"
                            sx={{
                                mb: 1,
                                textShadow: '0 2px 20px rgba(0,0,0,0.1)',
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            Tigray Education
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: alpha('#fff', 0.9),
                                fontWeight: 500,
                                position: 'relative',
                                zIndex: 1,
                            }}
                        >
                            Regional Management Portal
                        </Typography>
                    </Box>

                    {/* Form */}
                    <CardContent sx={{ p: 5 }}>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            color="primary.dark"
                            sx={{ mb: 1, textAlign: 'center' }}
                        >
                            Welcome Back
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 4, textAlign: 'center' }}
                        >
                            Sign in to access your dashboard
                        </Typography>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: 'error.light',
                                    }}
                                >
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) validateEmail(e.target.value);
                                }}
                                onBlur={() => validateEmail(email)}
                                error={!!emailError}
                                helperText={emailError}
                                required
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon sx={{ color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (passwordError) validatePassword(e.target.value);
                                }}
                                onBlur={() => validatePassword(password)}
                                error={!!passwordError}
                                helperText={passwordError}
                                required
                                sx={{
                                    mb: 4,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 3,
                                    }
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                tabIndex={-1}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                endIcon={!isLoading && <ArrowForwardIcon />}
                                sx={{
                                    py: 1.8,
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    fontSize: '1.05rem',
                                    textTransform: 'none',
                                    boxShadow: '0 4px 20px rgba(13, 71, 161, 0.25)',
                                    '&:hover': {
                                        boxShadow: '0 8px 30px rgba(13, 71, 161, 0.35)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={26} color="inherit" />
                                ) : (
                                    'Sign In to Dashboard'
                                )}
                            </Button>
                        </form>

                        <Divider sx={{ my: 4 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                OR
                            </Typography>
                        </Divider>

                        {/* Help Text */}
                        <Stack spacing={1.5}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                                sx={{
                                    fontSize: '0.875rem',
                                    lineHeight: 1.6,
                                }}
                            >
                                Use your official education bureau credentials to access the system.
                            </Typography>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                textAlign="center"
                                sx={{
                                    fontSize: '0.75rem',
                                    opacity: 0.7,
                                }}
                            >
                                For assistance, contact your system administrator
                            </Typography>
                        </Stack>
                    </CardContent>

                    {/* Footer */}
                    <Box
                        sx={{
                            px: 5,
                            py: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            textAlign="center"
                            display="block"
                            sx={{ fontSize: '0.7rem' }}
                        >
                            © {new Date().getFullYear()} Tigray Education Bureau. All rights reserved.
                        </Typography>
                    </Box>
                </Card>
            </Box>
        </ThemeProvider>
    );
}
