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
    alpha,
    useTheme,
} from '@mui/material';
import {
    Warning as WarningIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    Info as InfoIcon,
    CheckCircle as SuccessIcon,
} from '@mui/icons-material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    onConfirm: () => void;
    onClose: () => void;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'error',
    onConfirm,
    onClose,
    loading = false,
}: ConfirmDialogProps) {
    const theme = useTheme();

    const getIcon = () => {
        switch (confirmColor) {
            case 'error':
                return <DeleteIcon sx={{ color: theme.palette.error.main }} />;
            case 'warning':
                return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
            case 'success':
                return <SuccessIcon sx={{ color: theme.palette.success.main }} />;
            case 'info':
            case 'primary':
                return <InfoIcon sx={{ color: theme.palette.primary.main }} />;
            default:
                return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: 400,
                    boxShadow: 24,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        backgroundColor: alpha(theme.palette[confirmColor === 'primary' ? 'primary' : confirmColor].main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {getIcon()}
                    </Box>
                    <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                        {title}
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ 
                        color: theme.palette.text.secondary,
                        '&:hover': { backgroundColor: alpha(theme.palette.text.secondary, 0.05) }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2 }}>
                <Typography color="text.secondary" variant="body1" component="div" lineHeight={1.6}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1.5 }}>
                <Button
                    onClick={onClose}
                    variant="text"
                    color="inherit"
                    sx={{ 
                        borderRadius: 2.5, 
                        px: 3, 
                        fontWeight: 700,
                        textTransform: 'none',
                        color: 'text.secondary'
                    }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmColor}
                    disabled={loading}
                    autoFocus
                    sx={{ 
                        borderRadius: 2.5, 
                        px: 4, 
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: `0 8px 16px ${alpha(theme.palette[confirmColor === 'primary' ? 'primary' : confirmColor].main, 0.2)}`,
                    }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

