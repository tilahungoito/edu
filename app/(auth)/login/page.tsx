'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
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
    Checkbox,
    FormControlLabel,
    Link,
    Fade,
    Slide,
    Chip,
    LinearProgress,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    ArrowForward as ArrowForwardIcon,
    CheckCircle as CheckCircleIcon,
    Security as SecurityIcon,
    LockClock as LockClockIcon,
} from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import theme from '@/app/theme/theme';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Check for expired session or redirect params
    useEffect(() => {
        setMounted(true);
        const expired = searchParams?.get('expired');
        const from = searchParams?.get('from');

        if (expired === 'true') {
            setError('Your session has expired. Please login again.');
        } else if (from) {
            setError(`Please login to access ${from}`);
        }
    }, [searchParams]);

    // Auto-focus email field on mount
    useEffect(() => {
        const emailInput = document.getElementById('email-input');
        if (emailInput) {
            emailInput.focus();
        }
    }, [mounted]);

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

    // Password strength indicator (basic)
    const getPasswordStrength = (password: string): number => {
        if (!password) return 0;
        let strength = 0;
        if (password.length >= 6) strength += 25;
        if (password.length >= 10) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 15;
        if (/[^a-zA-Z0-9]/.test(password)) strength += 10;
        return Math.min(strength, 100);
    };

    const passwordStrength = getPasswordStrength(password);
    const getStrengthColor = (strength: number) => {
        if (strength < 40) return 'error';
        if (strength < 70) return 'warning';
        return 'success';
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
            // Show success state
            setLoginSuccess(true);

            // Redirect after animation
            setTimeout(() => {
                const redirectUrl = searchParams?.get('from') || '/dashboard';
                router.push(redirectUrl);
            }, 1000);
        } else {
            // Display error from backend with better messaging
            const errorMsg = result.error || 'Login failed. Please check your credentials.';
            setError(errorMsg);

            // Auto-clear error after 5 seconds
            setTimeout(() => setError(''), 5000);
        }
    };

    // Keyboard shortcut handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSubmit(e as any);
        }
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
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -100,
                        right: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(13, 71, 161, 0.05) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    },
                }}
            >
                <Slide direction="up" in={mounted} timeout={600}>
                    <Card
                        sx={{
                            width: '100%',
                            maxWidth: 500,
                            borderRadius: 5,
                            boxShadow: '0 30px 90px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 1,
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}
                    >
                        {/* Success Overlay */}
                        {loginSuccess && (
                            <Fade in={loginSuccess}>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: alpha(theme.palette.success.main, 0.95),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 10,
                                        flexDirection: 'column',
                                        gap: 2,
                                    }}
                                >
                                    <CheckCircleIcon sx={{ fontSize: 80, color: 'white' }} />
                                    <Typography variant="h5" color="white" fontWeight={700}>
                                        Login Successful!
                                    </Typography>
                                    <Typography variant="body2" color="white">
                                        Redirecting to dashboard...
                                    </Typography>
                                </Box>
                            </Fade>
                        )}

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
                                    background: alpha('#fff', 0.08),
                                    animation: 'pulse 3s ease-in-out infinite',
                                },
                                '@keyframes pulse': {
                                    '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
                                    '50%': { transform: 'scale(1.1)', opacity: 0.4 },
                                },
                            }}
                        >
                            <Box
                                sx={{
                                    width: 90,
                                    height: 90,
                                    borderRadius: 4.5,
                                    backgroundColor: alpha('#fff', 0.15),
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mx: 'auto',
                                    mb: 3,
                                    position: 'relative',
                                    zIndex: 1,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                    border: `2px solid ${alpha('#fff', 0.2)}`,
                                }}
                            >
                                <SchoolIcon sx={{ fontSize: 50, color: 'white' }} />
                            </Box>
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                color="white"
                                sx={{
                                    mb: 1,
                                    textShadow: '0 2px 20px rgba(0,0,0,0.15)',
                                    position: 'relative',
                                    zIndex: 1,
                                    letterSpacing: -0.5,
                                }}
                            >
                                Tigray Education
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: alpha('#fff', 0.95),
                                    fontWeight: 500,
                                    position: 'relative',
                                    zIndex: 1,
                                }}
                            >
                                Regional Management Portal
                            </Typography>

                            {/* Security Badge */}
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                                <Chip
                                    icon={<SecurityIcon sx={{ fontSize: 16, color: 'white !important' }} />}
                                    label="Secure Login"
                                    size="small"
                                    sx={{
                                        bgcolor: alpha('#fff', 0.15),
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                        backdropFilter: 'blur(10px)',
                                        border: `1px solid ${alpha('#fff', 0.2)}`,
                                    }}
                                />
                            </Box>
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
                                Sign in to access your personalized dashboard
                            </Typography>

                            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                                {error && (
                                    <Fade in={!!error}>
                                        <Alert
                                            severity="error"
                                            sx={{
                                                mb: 3,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'error.light',
                                                animation: 'shake 0.5s',
                                                '@keyframes shake': {
                                                    '0%, 100%': { transform: 'translateX(0)' },
                                                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                                                    '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                                                },
                                            }}
                                            onClose={() => setError('')}
                                        >
                                            {error}
                                        </Alert>
                                    </Fade>
                                )}

                                <TextField
                                    id="email-input"
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
                                    disabled={isLoading}
                                    sx={{
                                        mb: 3,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            transition: 'all 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                            },
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
                                    disabled={isLoading}
                                    sx={{
                                        mb: 2,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            transition: 'all 0.3s',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                            },
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
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {/* Password Strength Indicator */}
                                {password && (
                                    <Fade in={!!password}>
                                        <Box sx={{ mb: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Password Strength:
                                                </Typography>
                                                <Typography variant="caption" fontWeight={600} color={`${getStrengthColor(passwordStrength)}.main`}>
                                                    {passwordStrength < 40 ? 'Weak' : passwordStrength < 70 ? 'Medium' : 'Strong'}
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={passwordStrength}
                                                color={getStrengthColor(passwordStrength)}
                                                sx={{
                                                    height: 4,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.grey[300], 0.3),
                                                }}
                                            />
                                        </Box>
                                    </Fade>
                                )}

                                {/* Remember Me & Forgot Password */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                size="small"
                                                disabled={isLoading}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" color="text.secondary">
                                                Remember me
                                            </Typography>
                                        }
                                    />
                                    <Link
                                        href="#"
                                        underline="hover"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'primary.main',
                                            '&:hover': {
                                                color: 'primary.dark',
                                            },
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            alert('Please contact your system administrator to reset your password.');
                                        }}
                                    >
                                        Forgot password?
                                    </Link>
                                </Box>

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={isLoading || loginSuccess}
                                    endIcon={!isLoading && !loginSuccess && <ArrowForwardIcon />}
                                    sx={{
                                        py: 1.8,
                                        borderRadius: 3,
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
                                        textTransform: 'none',
                                        boxShadow: '0 4px 20px rgba(13, 71, 161, 0.25)',
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                                        '&:hover': {
                                            boxShadow: '0 8px 30px rgba(13, 71, 161, 0.35)',
                                            transform: 'translateY(-2px)',
                                        },
                                        '&:active': {
                                            transform: 'translateY(0)',
                                        },
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    {isLoading ? (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CircularProgress size={24} color="inherit" />
                                            <span>Authenticating...</span>
                                        </Box>
                                    ) : loginSuccess ? (
                                        'Success!'
                                    ) : (
                                        'Sign In to Dashboard'
                                    )}
                                </Button>
                            </form>

                            <Divider sx={{ my: 4 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    INFORMATION
                                </Typography>
                            </Divider>

                            {/* Help Text */}
                            <Stack spacing={1.5}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <LockClockIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.2 }} />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            fontSize: '0.875rem',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        Use your official education bureau credentials to access the system.
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    textAlign="center"
                                    sx={{
                                        fontSize: '0.75rem',
                                        opacity: 0.7,
                                        display: 'block',
                                        mt: 2,
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
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                textAlign="center"
                                display="block"
                                sx={{ fontSize: '0.65rem', mt: 0.5, opacity: 0.6 }}
                            >
                                Secured with 256-bit encryption
                            </Typography>
                        </Box>
                    </Card>
                </Slide>
            </Box>
        </ThemeProvider>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        }>
            <LoginForm />
        </Suspense>
    );
}
