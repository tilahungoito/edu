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
    Menu,
    MenuItem,
    Paper,
    InputAdornment,
} from '@mui/material';
import {
    Add as AddIcon,
    Groups as GroupsIcon,
    ArrowForward as ArrowForwardIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { sectionsService } from '@/app/lib/api/sections.service';
import { useRouter } from 'next/navigation';
import { useRealTime } from '@/app/lib/hooks/useRealTime';

export default function SectionsPage() {
    const theme = useTheme();
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', nextSectionId: '', gradeLevel: '', program: 'General' });
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuSectionId, setMenuSectionId] = useState<string | null>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, sectionId: string) => {
        setAnchorEl(event.currentTarget);
        setMenuSectionId(sectionId);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuSectionId(null);
    };

    const filteredSections = sections.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.program || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    useRealTime('STATS_UPDATED', fetchSections);

    const handleCreateSection = async () => {
        try {
            const payload: any = {
                name: newSection.name,
                institutionId: user?.tenantId,
                gradeLevel: newSection.gradeLevel ? Number(newSection.gradeLevel) : undefined,
                program: newSection.program || undefined,
            };
            if (newSection.nextSectionId) {
                payload.nextSectionId = newSection.nextSectionId;
            }
            await sectionsService.create(payload);
            setOpenDialog(false);
            setNewSection({ name: '', nextSectionId: '', gradeLevel: '', program: 'General' });
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

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', alignItems: 'center', border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                <TextField
                    size="small"
                    placeholder="Search sections by name or program..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                    sx={{ width: { xs: '100%', sm: 300 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
            </Paper>

            <Grid container spacing={3}>
                {filteredSections.map((section) => (
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
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, section.id)}>
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Typography variant="h5" fontWeight={700} gutterBottom>
                                    {section.name}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                    {section.gradeLevel && (
                                        <Chip label={`Grade ${section.gradeLevel}`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '10px' }} />
                                    )}
                                    {section.program && (
                                        <Chip label={section.program} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '10px' }} />
                                    )}
                                    {!section.gradeLevel && (
                                        <Chip label="No Grade Tagged" size="small" color="warning" variant="outlined" sx={{ fontWeight: 600, height: 20, fontSize: '10px' }} />
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                    <Chip 
                                        label={`${section._count?.students || 0} / ${section.capacity || 50} Students`} 
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
                            required
                            value={newSection.name}
                            onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Target Grade Level"
                            fullWidth
                            required
                            SelectProps={{ native: true }}
                            value={newSection.gradeLevel}
                            onChange={(e) => setNewSection({ ...newSection, gradeLevel: e.target.value })}
                        >
                            <option value="">Select Grade</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                <option key={g} value={g}>Grade {g}</option>
                            ))}
                        </TextField>
                        <TextField
                            select
                            label="Program/Stream"
                            fullWidth
                            required
                            SelectProps={{ native: true }}
                            value={newSection.program}
                            onChange={(e) => setNewSection({ ...newSection, program: e.target.value })}
                        >
                            <option value="General">General</option>
                            <option value="Natural Science">Natural Science</option>
                            <option value="Social Science">Social Science</option>
                            <option value="Vocational">Vocational</option>
                        </TextField>
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
                    <Button onClick={handleCreateSection} variant="contained" disabled={!newSection.name || !newSection.gradeLevel} sx={{ borderRadius: '10px', fontWeight: 700 }}>
                        Create Section
                    </Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 160, boxShadow: theme.shadows[4] } }}
            >
                <MenuItem onClick={() => { handleMenuClose(); /* handle open edit */ }} sx={{ py: 1.5 }}>
                    <EditIcon sx={{ mr: 2, fontSize: 18, color: 'info.main' }} />
                    <Typography fontWeight={600}>Edit Section</Typography>
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); /* handle open delete */ }} sx={{ py: 1.5, color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 2, fontSize: 18 }} />
                    <Typography fontWeight={600}>Delete Section</Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
}
