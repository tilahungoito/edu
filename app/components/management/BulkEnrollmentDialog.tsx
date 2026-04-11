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
    MenuItem,
    Chip
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
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            if (!open) return;
            setFetching(true);
            try {
                const [allCourses, allPeriods] = await Promise.all([
                    coursesService.getAll(),
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

    const filteredCourses = courses.filter(c => 
        (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        c.gradeLevel === section.gradeLevel
    );

    const handleToggle = (id: string) => {
        setSelectedCourseIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedCourseIds.length === filteredCourses.length) {
            setSelectedCourseIds([]);
        } else {
            setSelectedCourseIds(filteredCourses.map(c => c.id));
        }
    };

    const handleSubmit = async () => {
        if (selectedCourseIds.length === 0) {
            setError('Please select at least one course');
            return;
        }

        if (!semester) {
            setError('Please configure or select an Academic Semester to proceed.');
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
                    Available Grade {section.gradeLevel} Courses
                </Typography>
                
                <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search courses..."
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        slotProps={{
                            input: {
                                sx: { borderRadius: '8px' }
                            }
                        } as any}
                    />
                    <Button 
                        size="small" 
                        onClick={handleSelectAll}
                        sx={{ minWidth: '100px', fontWeight: 700 }}
                        variant="outlined"
                    >
                        {selectedCourseIds.length === filteredCourses.length && filteredCourses.length > 0 
                            ? 'Deselect All' 
                            : 'Select All'}
                    </Button>
                </Box>

                <Box sx={{ px: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">
                        {filteredCourses.length} courses found
                    </Typography>
                    <Typography variant="caption" color="primary.main" fontWeight={700}>
                        {selectedCourseIds.length} selected
                    </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />

                {fetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 350, overflow: 'auto' }}>
                        {filteredCourses.map((course) => (
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
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={700}>
                                                {course.name}
                                            </Typography>
                                        </Box>
                                    }
                                    primaryTypographyProps={{ component: 'div' }}
                                    secondary={`${course.code || 'No Code'} | ${course.credit || 0} Credits`}
                                />
                            </ListItem>
                        ))}
                        {filteredCourses.length === 0 && (
                            <Typography variant="body2" sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                No courses matching your search.
                            </Typography>
                        )}
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
