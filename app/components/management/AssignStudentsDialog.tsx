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
    InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import sectionsService, { Section } from '@/app/lib/api/sections.service';
import studentsService from '@/app/lib/api/students.service';

interface AssignStudentsDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    section: Section;
}

export function AssignStudentsDialog({ open, onClose, onSuccess, section }: AssignStudentsDialogProps) {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!open) return;
            setFetching(true);
            try {
                // Get all students for this institution
                const allStudents = await studentsService.getAll({
                    institutionId: section.institutionId
                });

                // Filter out students already in other sections if needed, 
                // but usually we allow moving.
                setStudents(allStudents);

                // Pre-select students already in this section
                const existingIds = allStudents
                    .filter((s: any) => s.sectionId === section.id)
                    .map((s: any) => s.id);
                setSelectedIds(existingIds);
            } catch (err: any) {
                console.error('Failed to fetch students:', err);
                setError('Failed to load students');
            } finally {
                setFetching(false);
            }
        };

        fetchStudents();
    }, [open, section]);

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await sectionsService.assignStudents(section.id, selectedIds);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Assignment error:', err);
            setError(err.response?.data?.message || 'Failed to assign students');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        `${s.user?.firstName} ${s.user?.lastName} ${s.user?.username}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
                Assign Students to {section.name}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Select students to include in this classroom group.
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />

                {fetching ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress size={32} />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredStudents.map((student) => (
                            <ListItem
                                key={student.id}
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
                                    checked={selectedIds.includes(student.id)}
                                    tabIndex={-1}
                                    disableRipple
                                    onClick={() => handleToggle(student.id)}
                                />
                                <ListItemText
                                    primary={`${student.user?.firstName} ${student.user?.lastName}`}
                                    secondary={`${student.user?.username} | ${student.program}`}
                                />
                            </ListItem>
                        ))}
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
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Assignment'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
