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
    useTheme,
    alpha,
    InputAdornment,
    IconButton,
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon,
    Email as EmailIcon,
    Lock as LockIcon,
} from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAuthStore } from '@/app/lib/store';
import theme from '@/app/theme/theme';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore(state => state.login);
    const isLoading = useAuthStore(state => state.isLoading);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await login(email, password);

        if (success) {
            router.push('/dashboard');
        } else {
            setError('Invalid email or password. Try: bureau@edu.gov.et / demo123');
        }
    };

    // Demo credentials
    const demoUsers = [
        { label: 'Bureau Admin', email: 'bureau@edu.gov.et' },
        { label: 'Zone Admin', email: 'zone@edu.gov.et' },
        { label: 'Woreda Admin', email: 'woreda@edu.gov.et' },
        { label: 'School Admin', email: 'school@edu.gov.et' },
    ];

    const handleDemoLogin = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('demo123');
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
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    p: 2,
                }}
            >
                <Card
                    sx={{
                        width: '100%',
                        maxWidth: 440,
                        borderRadius: 4,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 3,
                                backgroundColor: alpha('#fff', 0.2),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2,
                            }}
                        >
                            <SchoolIcon sx={{ fontSize: 36, color: 'white' }} />
                        </Box>
                        <Typography variant="h5" fontWeight={700} color="white">
                            Tigray Education System
                        </Typography>
                        <Typography variant="body2" sx={{ color: alpha('#fff', 0.8), mt: 0.5 }}>
                            Region-Wide Management Portal
                        </Typography>
                    </Box>

                    {/* Form */}
                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={{ mb: 2.5 }}
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
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                sx={{ mb: 3 }}
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
                                sx={{
                                    py: 1.5,
                                    borderRadius: 2,
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                }}
                            >
                                {isLoading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        {/* Demo Users */}
                        <Box sx={{ mt: 4 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                                sx={{ mb: 2 }}
                            >
                                Demo Accounts (Password: demo123)
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                }}
                            >
                                {demoUsers.map((user) => (
                                    <Button
                                        key={user.email}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleDemoLogin(user.email)}
                                        sx={{
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {user.label}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </ThemeProvider>
    );
}
