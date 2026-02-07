'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    SelectChangeEvent,
} from '@mui/material';
import { TenantType } from '@/app/lib/types/permissions';

interface TenantFormData {
    name: string;
    nameAmharic: string;
    code: string;
    description: string;
    status: 'active' | 'inactive';
}

interface TenantDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: TenantFormData) => void;
    type: 'region' | 'zone' | 'woreda' | 'kebele' | 'school';
    parentType?: TenantType;
    parentId?: string;
    parentName?: string;
}

export function TenantDialog({
    open,
    onClose,
    onSubmit,
    type,
    parentName,
}: TenantDialogProps) {
    const [formData, setFormData] = useState<TenantFormData>({
        name: '',
        nameAmharic: '',
        code: '',
        description: '',
        status: 'active',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as keyof TenantFormData]: value
        }));
    };

    const handleStatusChange = (e: SelectChangeEvent) => {
        setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' });
    };

    const handleFormSubmit = () => {
        onSubmit(formData);
        onClose();
        setFormData({
            name: '',
            nameAmharic: '',
            code: '',
            description: '',
            status: 'active',
        });
    };

    const title = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 700 }}>
                Add New {title}
                {parentName && (
                    <Typography variant="body2" color="text.secondary">
                        Under {parentName}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={12}>
                        <TextField
                            name="name"
                            label={`${title} Name (English)`}
                            fullWidth
                            required
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            name="nameAmharic"
                            label={`${title} Name (Amharic)`}
                            fullWidth
                            required
                            value={formData.nameAmharic}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextField
                            name="code"
                            label="Code"
                            fullWidth
                            required
                            placeholder="e.g. MKL"
                            value={formData.code}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Status"
                                onChange={handleStatusChange}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            name="description"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleFormSubmit} variant="contained" color="primary">
                    Create {title}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
