import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
} from '@mui/material';
import { SystemSetting, systemSettingsService } from '@/app/lib/api/system-settings.service';

interface SystemSettingDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    setting?: SystemSetting;
}

export function SystemSettingDialog({ open, onClose, onSuccess, setting }: SystemSettingDialogProps) {
    const [formData, setFormData] = useState<Partial<SystemSetting>>({
        key: '',
        value: '',
        description: '',
        type: 'string',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (setting) {
            setFormData({
                key: setting.key,
                value: setting.value,
                description: setting.description,
                type: setting.type,
            });
        } else {
            setFormData({
                key: '',
                value: '',
                description: '',
                type: 'string',
            });
        }
        setError(null);
    }, [setting, open]);

    const handleChange = (field: keyof SystemSetting, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (setting) {
                // Update
                await systemSettingsService.update(setting.key, formData);
            } else {
                // Create
                await systemSettingsService.create(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{setting ? 'Edit Setting' : 'Add New Setting'}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Key"
                                value={formData.key}
                                onChange={(e) => handleChange('key', e.target.value)}
                                disabled={!!setting} // Key cannot be changed after creation usually
                                required
                                helperText="Unique identifier for the setting (e.g., SCHOOL_NAME)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Value"
                                value={formData.value}
                                onChange={(e) => handleChange('value', e.target.value)}
                                required
                                multiline
                                minRows={1}
                                maxRows={4}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={formData.type}
                                    label="Type"
                                    onChange={(e) => handleChange('type', e.target.value)}
                                >
                                    <MenuItem value="string">String</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                    <MenuItem value="boolean">Boolean</MenuItem>
                                    <MenuItem value="json">JSON</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : setting ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
