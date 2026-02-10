'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Checkbox,
    CircularProgress,
    Typography,
    Alert,
    alpha,
    useTheme,
    Box,
    TextField,
    Divider,
    MenuItem
} from '@mui/material';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import coursesService from '@/app/lib/api/courses.service';
import { Section } from '@/app/lib/api/sections.service';
import { scheduleConfigService } from '@/app/lib/api/schedules.service';

interface BulkEnrollmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    section: Section;
}

export function BulkEnrollmentDialog({ open, onClose, onSuccess, section }: BulkEnrollmentDialogProps) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [semester, setSemester] = useState('');
    const [periods, setPeriods] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!open) return;
            setFetching(true);
            try {
                const [allCourses, allPeriods] = await Promise.all([
                    coursesService.getAll({ institutionId: section.institutionId }),
                    scheduleConfigService.getPeriods(section.institutionId)
                ]);
                setCourses(allCourses);
                setPeriods(allPeriods);

                // Set default semester if periods exist
                const activePeriod = allPeriods.find((p: any) => p.isActive);
                if (activePeriod) {
                    setSemester(activePeriod.name);
                } else if (allPeriods.length > 0) {
                    setSemester(allPeriods[0].name);
                }
            } catch (err: any) {
                console.error('Failed to fetch initial data:', err);
                setError('Failed to load initial data');
            } finally {
                setFetching(false);
            }
        };

        fetchInitialData();
    }, [open, section]);

    const handleToggle = (id: string) => {
        setSelectedCourseIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        if (selectedCourseIds.length === 0) {
            setError('Please select at least one course');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await enrollmentsService.bulkEnroll({
                sectionId: section.id,
                courseIds: selectedCourseIds,
                semester: semester
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Bulk enrollment error:', err);
            setError(err.response?.data?.message || 'Failed to perform bulk enrollment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                Bulk Enrollment: {section.name}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Enroll all students in this section into the selected courses.
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    select
                    label="Academic Semester"
                    fullWidth
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    sx={{ mb: 3 }}
                >
                    {periods.map((period) => (
                        <MenuItem key={period.id} value={period.name}>
                            {period.name} {period.isActive && '(Active)'}
                        </MenuItem>
                    ))}
                    {periods.length === 0 && <MenuItem disabled>No academic periods configured</MenuItem>}
                </TextField>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom color="primary">
                    Select Courses
                </Typography>
                <Divider sx={{ mb: 1 }} />

                {fetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {courses.map((course) => (
                            <ListItem
                                key={course.id}
                                disablePadding
                                dense
                                sx={{
                                    borderRadius: 1.5,
                                    mb: 0.5,
                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                                }}
                            >
                                <Checkbox
                                    edge="start"
                                    checked={selectedCourseIds.includes(course.id)}
                                    tabIndex={-1}
                                    disableRipple
                                    onClick={() => handleToggle(course.id)}
                                />
                                <ListItemText
                                    primary={course.name}
                                    secondary={`${course.code} | ${course.credits} Credits`}
                                />
                            </ListItem>
                        ))}
                        {courses.length === 0 && <Typography variant="body2" sx={{ p: 2 }}>No courses available.</Typography>}
                    </List>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                <Button onClick={onClose} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || fetching}
                    sx={{
                        borderRadius: 2.5,
                        px: 4,
                        fontWeight: 700,
                        boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`
                    }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : `Enroll Students`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
