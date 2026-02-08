'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid2 as Grid,
    CircularProgress,
    Box,
    Typography,
    Alert,
    alpha,
    useTheme,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import paymentsService, { CreatePaymentData } from '@/app/lib/api/payments.service';
import studentsService from '@/app/lib/api/students.service';
import { useAuthStore } from '@/app/lib/store';

interface PaymentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const PaymentDialog = ({ open, onClose, onSuccess }: PaymentDialogProps) => {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    // Form state
    const [formData, setFormData] = useState<CreatePaymentData>({
        studentId: '',
        institutionId: user?.tenantId || '',
        amount: 0,
        currency: 'ETB',
        paymentMethod: 'BANK_TRANSFER',
        reference: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch students to select from
    const { data: students, isLoading: loadingStudents } = useQuery({
        queryKey: ['students'],
        queryFn: () => studentsService.getAll(),
        enabled: open,
    });

    // Reset form when opening/closing
    useEffect(() => {
        if (open) {
            setFormData({
                studentId: '',
                institutionId: user?.tenantId || '',
                amount: 0,
                currency: 'ETB',
                paymentMethod: 'BANK_TRANSFER',
                reference: '',
            });
            setErrors({});
        }
    }, [open, user]);

    const mutation = useMutation({
        mutationFn: (data: CreatePaymentData) => paymentsService.create(data),
        onSuccess: () => {
            onSuccess();
            onClose();
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.studentId) newErrors.studentId = 'Student is required';
        if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
        if (!formData.reference) newErrors.reference = 'Reference/Receipt number is required';
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            mutation.mutate(formData);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    backgroundImage: 'none',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                }
            }}
        >
            <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                    Record New Payment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Register a manual payment or bank transfer record.
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, px: 3 }}>
                <Box sx={{ mt: 1 }}>
                    {mutation.isError && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {(mutation.error as any)?.message || 'Failed to record payment'}
                        </Alert>
                    )}

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                select
                                label="Select Student"
                                name="studentId"
                                fullWidth
                                required
                                value={formData.studentId}
                                onChange={handleChange}
                                error={!!errors.studentId}
                                helperText={errors.studentId}
                                disabled={loadingStudents}
                            >
                                {loadingStudents ? (
                                    <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Loading students...</MenuItem>
                                ) : (
                                    students?.map(s => (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.username} ({s.email})
                                        </MenuItem>
                                    ))
                                )}
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Amount"
                                name="amount"
                                type="number"
                                fullWidth
                                required
                                value={formData.amount}
                                onChange={handleChange}
                                error={!!errors.amount}
                                helperText={errors.amount}
                                InputProps={{
                                    inputProps: { min: 1 }
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select
                                label="Payment Method"
                                name="paymentMethod"
                                fullWidth
                                required
                                value={formData.paymentMethod}
                                onChange={handleChange}
                            >
                                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                                <MenuItem value="CASH">Cash</MenuItem>
                                <MenuItem value="TELEBIRR">Telebirr</MenuItem>
                                <MenuItem value="CHECK">Check</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Reference / Receipt Number"
                                name="reference"
                                fullWidth
                                required
                                value={formData.reference}
                                onChange={handleChange}
                                error={!!errors.reference}
                                helperText={errors.reference}
                                placeholder="e.g., CBE-TRX-12345678"
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 700 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    startIcon={mutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={mutation.isPending}
                    sx={{
                        borderRadius: 2.5,
                        px: 3,
                        fontWeight: 700,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.25)}`
                    }}
                >
                    {mutation.isPending ? 'Processing...' : 'Record Payment'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
