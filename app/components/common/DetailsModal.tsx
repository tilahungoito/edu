'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    Divider,
    Grid,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Close as CloseIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';

interface DetailsModalProps {
    open: boolean;
    title: string;
    data: Record<string, any>;
    onClose: () => void;
}

export function DetailsModal({
    open,
    title,
    data,
    onClose,
}: DetailsModalProps) {
    const theme = useTheme();

    // Filter out internal fields
    const displayData = Object.entries(data).filter(([key]) => {
        const lowerKey = key.toLowerCase();
        return !lowerKey.includes('id') && !lowerKey.includes('at') && lowerKey !== 'password';
    });

    const formatLabel = (label: string) => {
        return label
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (value instanceof Date) return value.toLocaleDateString();
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') {
            if (value.toLocaleDateString) return value.toLocaleDateString();
            return JSON.stringify(value);
        }
        return String(value);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ViewIcon sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                        {title}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: theme.palette.text.secondary }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={2}>
                    {displayData.map(([key, value]) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={key}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                {formatLabel(key)}
                            </Typography>
                            <Typography variant="body1" fontWeight={500}>
                                {formatValue(value)}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{ borderRadius: 2, px: 4, fontWeight: 600 }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
