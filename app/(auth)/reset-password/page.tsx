'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Container,
    Paper,
    Alert,
} from '@mui/material';
import NextLink from 'next/link';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
            <Paper sx={{ p: 4, width: '100%', borderRadius: 4 }}>
                <Typography variant="h5" fontWeight={800} align="center" gutterBottom>
                    New Password
                </Typography>

                {submitted ? (
                    <Box>
                        <Alert severity="success" sx={{ mb: 3 }}>
                            Your password has been successfully reset.
                        </Alert>
                        <Button
                            fullWidth
                            variant="contained"
                            component={NextLink}
                            href="/auth/login"
                        >
                            Log In Now
                        </Button>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                            Enter your new password below.
                        </Typography>

                        <TextField
                            fullWidth
                            label="New Password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Confirm New Password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={!password || password !== confirmPassword}
                            sx={{ mb: 3, borderRadius: 2 }}
                        >
                            Reset Password
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}
