import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    MenuItem,
    Grid2 as Grid,
    Box,
    Chip,
    Autocomplete,
} from '@mui/material';
import { reportsService } from '@/app/lib/api/reports.service';

interface ScheduleReportDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ScheduleReportDialog({ open, onClose, onSuccess }: ScheduleReportDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        reportType: 'enrollment',
        frequency: 'monthly',
        recipients: [] as string[],
        scopeType: 'SYSTEM',
        scopeId: '',
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await reportsService.createScheduledReport(formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Schedule New Report</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                        label="Schedule Name"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Monthly Enrollment Update"
                    />
                    
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Report Type"
                                fullWidth
                                value={formData.reportType}
                                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                            >
                                <MenuItem value="enrollment">Enrollment</MenuItem>
                                <MenuItem value="staff">Staff Distribution</MenuItem>
                                <MenuItem value="inventory">Inventory</MenuItem>
                                <MenuItem value="budget">Budget</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Frequency"
                                fullWidth
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                            >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                                <MenuItem value="quarterly">Quarterly</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>

                    <Autocomplete
                        multiple
                        options={[]}
                        freeSolo
                        value={formData.recipients}
                        onChange={(_, newValue) => setFormData({ ...formData, recipients: newValue })}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip label={option} {...getTagProps({ index })} key={index} size="small" />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Recipients (Emails)"
                                placeholder="Enter email and press Enter"
                                helperText="Press Enter after each email address"
                            />
                        )}
                    />

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                select
                                label="Scope"
                                fullWidth
                                value={formData.scopeType}
                                onChange={(e) => setFormData({ ...formData, scopeType: e.target.value })}
                            >
                                <MenuItem value="SYSTEM">System Wide</MenuItem>
                                <MenuItem value="REGION">Region</MenuItem>
                                <MenuItem value="ZONE">Zone</MenuItem>
                                <MenuItem value="WOREDA">Woreda</MenuItem>
                                <MenuItem value="INSTITUTION">Institution</MenuItem>
                            </TextField>
                        </Grid>
                        {formData.scopeType !== 'SYSTEM' && (
                            <Grid size={{ xs: 6 }}>
                                <TextField
                                    label="Scope ID"
                                    fullWidth
                                    value={formData.scopeId}
                                    onChange={(e) => setFormData({ ...formData, scopeId: e.target.value })}
                                />
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={loading || !formData.name}
                    sx={{ borderRadius: 2 }}
                >
                    {loading ? 'Scheduling...' : 'Schedule Report'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
