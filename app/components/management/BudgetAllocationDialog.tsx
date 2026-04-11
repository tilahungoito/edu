'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Box,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import { CreateBudgetAllocationDto } from '@/app/lib/api/budget.service';
import { useAuthStore } from '@/app/lib/store/auth-store';

interface BudgetAllocationDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateBudgetAllocationDto) => void;
    loading?: boolean;
}

export function BudgetAllocationDialog({ open, onClose, onSubmit, loading }: BudgetAllocationDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    
    const [formData, setFormData] = useState<Partial<CreateBudgetAllocationDto>>({
        institutionId: '',
        category: 'salaries',
        allocatedAmount: 1000000,
        fiscalYear: 2024,
    });

    const handleSubmit = () => {
        if (!formData.institutionId || !formData.allocatedAmount || !formData.fiscalYear) return;
        
        onSubmit({
            institutionId: formData.institutionId,
            category: formData.category || 'salaries',
            allocatedAmount: formData.allocatedAmount,
            fiscalYear: formData.fiscalYear,
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
            <DialogTitle sx={{ fontWeight: 800 }}>Allocate Institutional Budget</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        label="Institution ID"
                        fullWidth
                        placeholder="Paste target institution ID"
                        value={formData.institutionId}
                        onChange={(e) => setFormData({ ...formData, institutionId: e.target.value })}
                        disabled={loading}
                    />
                    <TextField
                        select
                        label="Category"
                        fullWidth
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={loading}
                    >
                        <MenuItem value="salaries">Salaries</MenuItem>
                        <MenuItem value="operations">Operations</MenuItem>
                        <MenuItem value="infrastructure">Infrastructure</MenuItem>
                        <MenuItem value="supplies">Supplies</MenuItem>
                        <MenuItem value="training">Training</MenuItem>
                    </TextField>
                    <TextField
                        label="Allocated Amount (ETB)"
                        type="number"
                        fullWidth
                        value={formData.allocatedAmount}
                        onChange={(e) => setFormData({ ...formData, allocatedAmount: parseFloat(e.target.value) })}
                        disabled={loading}
                    />
                    <TextField
                        label="Fiscal Year"
                        type="number"
                        fullWidth
                        value={formData.fiscalYear}
                        onChange={(e) => setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })}
                        disabled={loading}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.institutionId}
                    startIcon={loading && <CircularProgress size={16} color="inherit" />}
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                >
                    Create Allocation
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default BudgetAllocationDialog;
