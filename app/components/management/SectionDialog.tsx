'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    CircularProgress,
    Typography,
    Alert,
    alpha,
    useTheme,
    Box,
    MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import sectionsService, { Section } from '@/app/lib/api/sections.service';
import { useAuthStore } from '@/app/lib/store';

interface SectionDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    section?: Section | null;
    institutionId?: string;
}

export function SectionDialog({ open, onClose, onSuccess, section, institutionId }: SectionDialogProps) {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [nextSectionId, setNextSectionId] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const instId = institutionId || section?.institutionId || user?.tenantId;

    const { data: sections } = useQuery({
        queryKey: ['sections', instId],
        queryFn: () => sectionsService.getAll(instId || ''),
        enabled: open && !!instId,
    });

    useEffect(() => {
        if (open) {
            setName(section?.name || '');
            setNextSectionId(section?.nextSectionId || '');
            setError(null);
        }
    }, [open, section]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;

        setLoading(true);
        setError(null);

        try {
            const instId = institutionId || section?.institutionId || user?.tenantId;
            if (!instId) throw new Error('No institution context found');

            if (section) {
                await sectionsService.update(section.id, { name, nextSectionId: nextSectionId || undefined });
            } else {
                await sectionsService.create({ name, institutionId: instId, nextSectionId: nextSectionId || undefined });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.response?.data?.message || 'Failed to save section');
        } finally {
            setLoading(false);
        }
    };

    const isEdit = !!section;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                {isEdit ? 'Update Section' : 'Create New Section'}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isEdit ? 'Modify the name of this classroom group.' : 'Define a new classroom group for students.'}
                </Typography>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ py: 1 }}>
                        <TextField
                            label="Section Name"
                            fullWidth
                            required
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Grade 10A"
                            sx={{ mb: 3 }}
                        />

                        <TextField
                            select
                            label="Next Section (Promotion Path)"
                            fullWidth
                            value={nextSectionId}
                            onChange={(e) => setNextSectionId(e.target.value)}
                            helperText="Where do students go after completing this section?"
                        >
                            <MenuItem value=""><em>None (End of Cycle)</em></MenuItem>
                            {sections?.filter(s => s.id !== section?.id).map((s) => (
                                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !name}
                        sx={{
                            borderRadius: 2.5,
                            px: 4,
                            fontWeight: 700,
                            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (isEdit ? 'Update' : 'Create')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
