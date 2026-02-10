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
    Checkbox,
    FormControlLabel,
    Link,
    Fade,
    Slide,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
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

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading } = useAuthStore();

    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
    const [error, setError] = useState('');
    const [inputError, setInputError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [loginSuccess, setLoginSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info',
    });

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
    const validateInput = (input: string): boolean => {
        if (!input || input.trim().length === 0) {
            setInputError('Email or username is required');
            return false;
        }
        setInputError('');
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
        const isInputValid = validateInput(emailOrUsername);
        const isPasswordValid = validatePassword(password);

        if (!isInputValid || !isPasswordValid) {
            return;
        }

        // Call backend API via auth store
        const result = await login(emailOrUsername, password);

        if (result.success) {
            // Show success state
            setLoginSuccess(true);
            setSnackbar({ open: true, message: 'Welcome back! Login successful.', severity: 'success' });

            // Redirect after animation
            setTimeout(() => {
                const redirectUrl = searchParams?.get('from') || '/dashboard';
                router.push(redirectUrl);
            }, 1000);
        } else {
            // Display error from backend with better messaging
            const errorMsg = result.error || 'Login failed. Please check your credentials.';
            setError(errorMsg);
            setSnackbar({ open: true, message: errorMsg, severity: 'error' });

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
                    bgcolor: 'background.default',
                    p: 2,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Decoration similar to Hero/Services */}
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
                        <Box sx={{ p: 4, textAlign: 'center' }}>
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
                                Regional Management Portal
                            </Typography>
                        </Box>

                        {/* Form */}
                        <CardContent sx={{ p: 4, pt: 0 }}>
                            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                                {error && (
                                    <Fade in={!!error}>
                                        <Alert
                                            severity="error"
                                            sx={{
                                                mb: 3,
                                                borderRadius: 2,
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
                                    label="Email or Username"
                                    type="text"
                                    value={emailOrUsername}
                                    onChange={(e) => {
                                        setEmailOrUsername(e.target.value);
                                        if (inputError) validateInput(e.target.value);
                                    }}
                                    onBlur={() => validateInput(emailOrUsername)}
                                    error={!!inputError}
                                    helperText={inputError}
                                    required
                                    disabled={isLoading}
                                    sx={{
                                        mb: 3,
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
                                                <LockIcon sx={{ color: 'text.secondary' }} />
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
                                {/* Remember Me & Forgot Password */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                size="small"
                                                disabled={isLoading}
                                                sx={{
                                                    color: 'text.secondary',
                                                    '&.Mui-checked': {
                                                        color: 'secondary.main',
                                                    },
                                                }}
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
                                            color: 'secondary.main',
                                            '&:hover': {
                                                color: 'secondary.dark',
                                            },
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setForgotPasswordOpen(true);
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
                                        py: 1.5,
                                        borderRadius: 2,
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        textTransform: 'none',
                                        bgcolor: 'primary.main', // Using Primary Main (Dark Slate) for strong contrast
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
                        </CardContent>
                    </Card>
                </Slide>

                {/* Forgot Password Dialog */}
                <Dialog
                    open={forgotPasswordOpen}
                    onClose={() => setForgotPasswordOpen(false)}
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            maxWidth: 400
                        }
                    }}
                >
                    <DialogTitle sx={{
                        pb: 1,
                        fontWeight: 700,
                        color: 'primary.main',
                        fontFamily: 'Outfit, sans-serif'
                    }}>
                        Reset Password
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText sx={{ color: 'text.secondary' }}>
                            Please contact your system administrator to reset your password.
                            <br /><br />
                            For security reasons, self-service password reset is currently disabled for this portal.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button
                            onClick={() => setForgotPasswordOpen(false)}
                            variant="contained"
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: 'none',
                                '&:hover': {
                                    boxShadow: 'none',
                                    bgcolor: 'primary.dark'
                                }
                            }}
                        >
                            Understood
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
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
