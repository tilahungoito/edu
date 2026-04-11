'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import { CreateBudgetRequestDto } from '@/app/lib/api/budget.service';
import { useAuthStore } from '@/app/lib/store/auth-store';

interface BudgetRequestDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateBudgetRequestDto) => void;
    loading?: boolean;
}

export function BudgetRequestDialog({ open, onClose, onSubmit, loading }: BudgetRequestDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    
    const [formData, setFormData] = useState<Partial<CreateBudgetRequestDto>>({
        amount: 50000,
        purpose: '',
    });

    const handleSubmit = () => {
        if (!formData.amount || !formData.purpose) return;
        
        onSubmit({
            amount: formData.amount,
            purpose: formData.purpose,
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 4 }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800 }}>New Budget Request</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        label="Requested Amount (ETB)"
                        type="number"
                        fullWidth
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        disabled={loading}
                    />
                    <TextField
                        label="Purpose / Justification"
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Explain why this budget is needed..."
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        disabled={loading}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.purpose}
                    startIcon={loading && <CircularProgress size={16} color="inherit" />}
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                >
                    Submit Request
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BudgetRequestDialog;
