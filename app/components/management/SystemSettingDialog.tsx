import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Box,
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
        category: 'GENERAL',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (setting) {
            setFormData({
                key: setting.key,
                value: setting.value.toString(),
                description: setting.description,
                type: setting.type,
                category: setting.category || 'GENERAL',
            });
        } else {
            setFormData({
                key: '',
                value: '',
                description: '',
                type: 'string',
                category: 'GENERAL',
            });
        }
        setError(null);
    }, [setting, open]);

    const handleChange = (field: keyof SystemSetting | 'category', value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation for JSON
        if (formData.type === 'json') {
            try {
                JSON.parse(formData.value || '{}');
            } catch (err) {
                setError('Invalid JSON format');
                setLoading(false);
                return;
            }
        }

        try {
            if (setting) {
                await systemSettingsService.update(setting.key, formData);
            } else {
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

    const renderValueInput = () => {
        switch (formData.type) {
            case 'boolean':
                return (
                    <FormControl fullWidth>
                        <InputLabel>Value</InputLabel>
                        <Select
                            value={formData.value || 'false'}
                            label="Value"
                            onChange={(e) => handleChange('value', e.target.value)}
                        >
                            <MenuItem value="true">True</MenuItem>
                            <MenuItem value="false">False</MenuItem>
                        </Select>
                    </FormControl>
                );
            case 'number':
                return (
                    <TextField
                        fullWidth
                        label="Value"
                        type="number"
                        value={formData.value}
                        onChange={(e) => handleChange('value', e.target.value)}
                        required
                    />
                );
            case 'json':
                return (
                    <TextField
                        fullWidth
                        label="Value (JSON)"
                        value={formData.value}
                        onChange={(e) => handleChange('value', e.target.value)}
                        required
                        multiline
                        minRows={3}
                        maxRows={10}
                        helperText="Ensure valid JSON format"
                        error={!!error && error.includes('JSON')}
                    />
                );
            default:
                return (
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
                );
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            fullWidth
                            label="Key"
                            value={formData.key}
                            onChange={(e) => handleChange('key', e.target.value)}
                            disabled={!!setting}
                            required
                            helperText="Unique identifier for the setting (e.g., SCHOOL_NAME)"
                        />

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
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
                            <Grid size={{ xs: 6 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={formData.category}
                                        label="Category"
                                        onChange={(e) => handleChange('category', e.target.value)}
                                    >
                                        <MenuItem value="GENERAL">General</MenuItem>
                                        <MenuItem value="SECURITY">Security</MenuItem>
                                        <MenuItem value="ACADEMIC">Academic</MenuItem>
                                        <MenuItem value="NOTIFICATIONS">Notifications</MenuItem>
                                        <MenuItem value="UI">Appearance</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {renderValueInput()}

                        <TextField
                            fullWidth
                            label="Description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Describe the purpose of this setting"
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{ px: 4, borderRadius: 2 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : setting ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
