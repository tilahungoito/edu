'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Container,
    Paper,
    Link,
    Alert,
} from '@mui/material';
import NextLink from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Paper sx={{ p: 4, width: '100%', borderRadius: 4 }}>
                <Typography variant="h5" fontWeight={800} align="center" gutterBottom>
                    Reset Password
                </Typography>

                {submitted ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            If an account exists for {email}, you will receive a password reset link shortly.
                        </Alert>
                        <Button
                            fullWidth
                            variant="outlined"
                            component={NextLink}
                            href="/auth/login"
                        >
                            Back to Login
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            sx={{ mb: 3, borderRadius: 2 }}
                        >
                            Send Reset Link
                        </Button>

                        <Box textAlign="center">
                            <Link component={NextLink} href="/auth/login" variant="body2" fontWeight={700}>
                                Back to Login
                            </Link>
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}
