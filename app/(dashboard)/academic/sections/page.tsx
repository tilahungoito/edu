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
    Groups as GroupsIcon,
    ArrowForward as ArrowForwardIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { sectionsService } from '@/app/lib/api/sections.service';
import { useRouter } from 'next/navigation';

export default function SectionsPage() {
    const theme = useTheme();
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', nextSectionId: '' });

    const fetchSections = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const data = await sectionsService.getAll(user.tenantId);
            setSections(data);
        } catch (error) {
            console.error('Error fetching sections:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSections();
    }, [user?.tenantId]);

    const handleCreateSection = async () => {
        try {
            const payload: any = {
                name: newSection.name,
                institutionId: user?.tenantId
            };
            if (newSection.nextSectionId) {
                payload.nextSectionId = newSection.nextSectionId;
            }
            await sectionsService.create(payload);
            setOpenDialog(false);
            setNewSection({ name: '', nextSectionId: '' });
            fetchSections();
        } catch (error) {
            console.error('Error creating section:', error);
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
                        Sections & Rosters
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage classroom groups and student assignments
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700 }}
                >
                    Create New Section
                </Button>
            </Box>

            <Grid container spacing={3}>
                {sections.map((section) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={section.id}>
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
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main
                                    }}>
                                        <GroupsIcon />
                                    </Box>
                                    <Box>
                                        <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error"><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    {section.name}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Chip 
                                        label={`${section._count?.students || 0} Students`} 
                                        size="small" 
                                        sx={{ fontWeight: 600, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.dark }} 
                                    />
                                    {section.nextSection && (
                                        <Chip 
                                            label={`Next: ${section.nextSection.name}`} 
                                            size="small" 
                                            variant="outlined"
                                        />
                                    )}
                                </Box>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => router.push(`/academic/sections/${section.id}`)}
                                    sx={{
                                        borderRadius: '12px',
                                        py: 1.2,
                                        fontWeight: 700,
                                        borderWidth: '2px',
                                        '&:hover': { borderWidth: '2px' }
                                    }}
                                >
                                    Manage Roster
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Create New Section</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Section Name"
                            placeholder="e.g. Grade 10-A"
                            fullWidth
                            autoFocus
                            value={newSection.name}
                            onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Promotion Path (Optional)"
                            fullWidth
                            SelectProps={{ native: true }}
                            value={newSection.nextSectionId}
                            onChange={(e) => setNewSection({ ...newSection, nextSectionId: e.target.value })}
                        >
                            <option value="">None</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button onClick={handleCreateSection} variant="contained" disabled={!newSection.name} sx={{ borderRadius: '10px', fontWeight: 700 }}>
                        Create Section
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
