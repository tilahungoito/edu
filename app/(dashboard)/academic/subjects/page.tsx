'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Book as BookIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { subjectsService, Subject } from '@/app/lib/api/subjects.service';

export default function SubjectsPage() {
    const theme = useTheme();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState<Partial<Subject>>({ name: '', code: '', description: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const data = await subjectsService.getAll();
            setSubjects(data);
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSave = async () => {
        try {
            if (editingId) {
                await subjectsService.update(editingId, formData);
            } else {
                await subjectsService.create(formData);
            }
            setOpenDialog(false);
            setFormData({ name: '', code: '', description: '' });
            setEditingId(null);
            fetchSubjects();
        } catch (error) {
            console.error('Error saving subject:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        try {
            await subjectsService.remove(id);
            fetchSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                        Subject Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Configure the school curriculum and core learning areas
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', code: '', description: '' });
                        setOpenDialog(true);
                    }}
                    sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700 }}
                >
                    Add Subject
                </Button>
            </Box>

            <Grid container spacing={3}>
                {subjects.map((subject) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={subject.id}>
                        <Card sx={{
                            borderRadius: '24px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.1)}`,
                            }
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: '12px',
                                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                        color: theme.palette.secondary.dark
                                    }}>
                                        <BookIcon />
                                    </Box>
                                    <Box>
                                        <IconButton size="small" onClick={() => {
                                            setEditingId(subject.id);
                                            setFormData(subject);
                                            setOpenDialog(true);
                                        }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(subject.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="h6" fontWeight={800} gutterBottom>
                                    {subject.name}
                                </Typography>
                                <Chip 
                                    label={subject.code} 
                                    size="small" 
                                    sx={{ fontWeight: 800, mb: 2, borderRadius: '8px', bgcolor: alpha(theme.palette.primary.main, 0.05) }} 
                                />
                                <Typography variant="body2" color="text.secondary" sx={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    minHeight: '3em'
                                }}>
                                    {subject.description || 'No description provided for this subject curriculum.'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create/Edit Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Subject Name"
                            placeholder="e.g. Mathematics"
                            fullWidth
                            autoFocus
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            label="Subject Code"
                            placeholder="e.g. MATH-10"
                            fullWidth
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            multiline
                            rows={3}
                            fullWidth
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.name || !formData.code} sx={{ borderRadius: '10px', fontWeight: 700 }}>
                        {editingId ? 'Update Subject' : 'Create Subject'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
