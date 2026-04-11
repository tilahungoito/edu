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
import { CreateInventoryRequestData } from '@/app/lib/api/inventory-requests.service';
import { useAuthStore } from '@/app/lib/store/auth-store';

interface InventoryRequestDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateInventoryRequestData) => void;
    loading?: boolean;
}

export function InventoryRequestDialog({ open, onClose, onSubmit, loading }: InventoryRequestDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    
    const [formData, setFormData] = useState<Partial<CreateInventoryRequestData>>({
        itemType: '',
        quantity: 1,
        priority: 'medium',
        details: '',
    });

    const handleSubmit = () => {
        if (!formData.itemType || !formData.quantity || !user?.tenantId) return;
        
        onSubmit({
            itemType: formData.itemType,
            quantity: formData.quantity,
            institutionId: user.tenantId,
            priority: formData.priority,
            details: formData.details,
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
            <DialogTitle sx={{ fontWeight: 800 }}>New Inventory Request</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        label="Item Type"
                        fullWidth
                        placeholder="e.g. Laptops, Chairs, Books"
                        value={formData.itemType}
                        onChange={(e) => setFormData({ ...formData, itemType: e.target.value })}
                        disabled={loading}
                    />
                    <TextField
                        label="Quantity"
                        type="number"
                        fullWidth
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        disabled={loading}
                    />
                    <TextField
                        select
                        label="Priority"
                        fullWidth
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        disabled={loading}
                    >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                    </TextField>
                    <TextField
                        label="Details / Justification"
                        multiline
                        rows={3}
                        fullWidth
                        placeholder="Why is this items needed?"
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        disabled={loading}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.itemType}
                    startIcon={loading && <CircularProgress size={16} color="inherit" />}
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                >
                    Submit Request
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default InventoryRequestDialog;
