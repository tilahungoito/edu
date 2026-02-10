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
} from '@mui/icons-material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    width: '100%',
                    maxWidth: 400,
                },
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: alpha(theme.palette[confirmColor].main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {confirmColor === 'error' ? (
                            <DeleteIcon sx={{ color: theme.palette[confirmColor].main }} />
                        ) : (
                            <WarningIcon sx={{ color: theme.palette[confirmColor].main }} />
                        )}
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
            <DialogContent sx={{ px: 3, py: 2 }}>
                <Typography color="text.secondary">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmColor}
                    disabled={loading}
                    autoFocus
                    sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
