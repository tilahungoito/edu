'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    alpha,
    useTheme,
    MenuItem,
    Grid,
} from '@mui/material';
import { Inventory as InventoryIcon } from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';

interface AssetFormData {
    assetCode: string;
    name: string;
    category: string;
    quantity: number;
    unitValue: number;
    condition: string;
    location: string;
    status: string;
    institutionId: string;
}

interface AssetDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: AssetFormData, id?: string) => Promise<void>;
    editData: any | null;
}

const CATEGORIES = [
    'Electronics',
    'Furniture',
    'Equipment',
    'Vehicles',
    'Books',
    'Science Lab',
    'Office Supplies',
    'Other'
];

const CONDITIONS = [
    { value: 'new', label: 'New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'broken', label: 'Broken' }
];

const STATUSES = [
    { value: 'in stock', label: 'In Stock' },
    { value: 'limited', label: 'Limited' },
    { value: 'out of stock', label: 'Out of Stock' },
    { value: 'disposed', label: 'Disposed' }
];

export function AssetDialog({ open, onClose, onSubmit, editData }: AssetDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const isEdit = !!editData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState<AssetFormData>({
        assetCode: '',
        name: '',
        category: 'Furniture',
        quantity: 1,
        unitValue: 0,
        condition: 'good',
        location: '',
        status: 'in stock',
        institutionId: user?.tenantId || '',
    });
    
    const [errors, setErrors] = useState<Partial<Record<keyof AssetFormData, string>>>({});

    useEffect(() => {
        if (open) {
            if (editData) {
                setFormData({
                    assetCode: editData.assetCode || '',
                    name: editData.name || '',
                    category: editData.category || 'Furniture',
                    quantity: editData.quantity || 1,
                    unitValue: editData.unitValue || 0,
                    condition: editData.condition || 'good',
                    location: editData.location || '',
                    status: editData.status || 'in stock',
                    institutionId: editData.institutionId || user?.tenantId || '',
                });
            } else {
                setFormData({
                    assetCode: '',
                    name: '',
                    category: 'Furniture',
                    quantity: 1,
                    unitValue: 0,
                    condition: 'good',
                    location: '',
                    status: 'in stock',
                    institutionId: user?.tenantId || '',
                });
            }
            setErrors({});
        }
    }, [open, editData, user?.tenantId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let processedValue: string | number = value;
        if (name === 'quantity' || name === 'unitValue') {
            processedValue = value === '' ? 0 : Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
        
        if (errors[name as keyof AssetFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: Partial<Record<keyof AssetFormData, string>> = {};
        if (!formData.name.trim()) newErrors.name = 'Asset name is required';
        if (!formData.assetCode.trim()) newErrors.assetCode = 'Asset code is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData, editData?.id);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={!isSubmitting ? onClose : undefined}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden' }
            }}
        >
            <Box sx={{ 
                p: 3, 
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex' 
                }}>
                    <InventoryIcon />
                </Box>
                <Box>
                    <DialogTitle sx={{ p: 0, fontWeight: 800, fontSize: '1.25rem' }}>
                        {isEdit ? 'Edit Asset' : 'Add New Asset'}
                    </DialogTitle>
                    <Typography variant="body2" color="text.secondary">
                        {isEdit ? 'Update details of the institutional asset' : 'Register a new physical asset'}
                    </Typography>
                </Box>
            </Box>

            <form onSubmit={handleFormSubmit}>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                label="Asset Name"
                                error={!!errors.name}
                                helperText={errors.name}
                                fullWidth
                                autoFocus
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <TextField
                                name="assetCode"
                                value={formData.assetCode}
                                onChange={handleChange}
                                label="Asset Code"
                                error={!!errors.assetCode}
                                helperText={errors.assetCode}
                                sx={{ width: '250px' }}
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                label="Category"
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            >
                                {CATEGORIES.map((cat) => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                label="Location"
                                error={!!errors.location}
                                helperText={errors.location}
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                name="quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={handleChange}
                                label="Quantity"
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <TextField
                                name="unitValue"
                                type="number"
                                value={formData.unitValue}
                                onChange={handleChange}
                                label="Unit Value (ETB)"
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            />
                            <TextField
                                select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                label="Condition"
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            >
                                {CONDITIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                label="Status"
                                fullWidth
                                InputProps={{ sx: { borderRadius: 2 } }}
                            >
                                {STATUSES.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={onClose} disabled={isSubmitting} variant="outlined" sx={{ borderRadius: 2 }}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ borderRadius: 2 }}>
                        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Asset'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
