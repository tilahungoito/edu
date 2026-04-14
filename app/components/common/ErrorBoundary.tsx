'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Card, CardContent, alpha } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error bound by ErrorBoundary:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Card sx={{ 
                    borderRadius: 3, 
                    border: '1px dashed error.main', 
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
                    minHeight: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3
                }}>
                    <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: '50%', 
                            bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                            color: 'error.main'
                        }}>
                            <WarningAmberIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="error.main" gutterBottom>
                                {this.props.fallbackMessage || "Failed to load component"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {this.state.error?.message || "An unexpected rendering error occurred"}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
