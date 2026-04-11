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
} from '@mui/material';
import { MenuBook as MenuBookIcon } from '@mui/icons-material';

interface SubjectFormData {
    name: string;
    code: string;
    description: string;
}

interface SubjectDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: SubjectFormData, id?: string) => Promise<void>;
    editData: any | null;
}

export function SubjectDialog({ open, onClose, onSubmit, editData }: SubjectDialogProps) {
    const theme = useTheme();
    const isEdit = !!editData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState<SubjectFormData>({
        name: '',
        code: '',
        description: '',
    });
    
    // For simple client side validation
    const [errors, setErrors] = useState<Partial<Record<keyof SubjectFormData, string>>>({});

    useEffect(() => {
        if (open) {
            if (editData) {
                setFormData({
                    name: editData.name || '',
                    code: editData.code || '',
                    description: editData.description || '',
                });
            } else {
                setFormData({
                    name: '',
                    code: '',
                    description: '',
                });
            }
            setErrors({});
        }
    }, [open, editData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error as user types
        if (errors[name as keyof SubjectFormData]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const newErrors: Partial<Record<keyof SubjectFormData, string>> = {};
        if (!formData.name.trim()) newErrors.name = 'Subject name is required';
        if (!formData.code.trim()) newErrors.code = 'Subject code is required';
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData, editData?.id);
            // Form clearing is handled by the parent components when closing the dialog
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={!isSubmitting ? onClose : undefined}
            maxWidth="sm"
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
                    <MenuBookIcon />
                </Box>
                <Box>
                    <DialogTitle sx={{ p: 0, fontWeight: 800, fontSize: '1.25rem' }}>
                        {isEdit ? 'Edit Subject' : 'Add New Subject'}
                    </DialogTitle>
                    <Typography variant="body2" color="text.secondary">
                        {isEdit ? 'Update the details of the existing subject block' : 'Create a new core subject for the curriculum'}
                    </Typography>
                </Box>
            </Box>

            <form onSubmit={handleFormSubmit}>
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            label="Subject Name"
                            placeholder="e.g. Advanced Mathematics"
                            error={!!errors.name}
                            helperText={errors.name}
                            fullWidth
                            autoFocus
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />

                        <TextField
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            label="Subject Code"
                            placeholder="e.g. MATH-401"
                            error={!!errors.code}
                            helperText={errors.code}
                            fullWidth
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />

                        <TextField
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            label="Description (Optional)"
                            placeholder="Brief description of the subject..."
                            multiline
                            rows={3}
                            fullWidth
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button 
                        onClick={onClose} 
                        disabled={isSubmitting} 
                        variant="outlined" 
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        variant="contained" 
                        disabled={isSubmitting}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Subject'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
