'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    AvatarGroup,
    Avatar,
    Tooltip,
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
import { toast } from 'react-hot-toast';

export default function SectionsPage() {
    const theme = useTheme();
    const router = useRouter();
    const user = useAuthStore(state => state.user);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', nextSectionId: '', gradeLevel: '', program: 'General', capacity: 50 });
    const [editSection, setEditSection] = useState<any>(null);
    const [sectionToDelete, setSectionToDelete] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuSection, setMenuSection] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, section: any) => {
        setAnchorEl(event.currentTarget);
        setMenuSection(section);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuSection(null);
    };

    const filteredSections = sections.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.program || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchSections = useCallback(async (isBackground = false) => {
        if (!user?.tenantId) return;
        if (isBackground) setRefreshing(true);
        else setLoading(true);
        
        try {
            const data = await sectionsService.getAll(user.tenantId);
            setSections(data);
        } catch (error) {
            console.error('Error fetching sections:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.tenantId]);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    // Polling fallback: refresh every 15s to guarantee visibility even if WS fails
    useEffect(() => {
        const interval = setInterval(() => { fetchSections(true); }, 15000);
        return () => clearInterval(interval);
    }, [fetchSections]);

    useRealTime('STATS_UPDATED', () => fetchSections(true));

    const handleCreateSection = async () => {
        setSaving(true);
        try {
            const payload: any = {
                name: newSection.name,
                institutionId: user?.tenantId,
                gradeLevel: newSection.gradeLevel ? Number(newSection.gradeLevel) : undefined,
                program: newSection.program || undefined,
                capacity: newSection.capacity || 50,
            };
            if (newSection.nextSectionId) {
                payload.nextSectionId = newSection.nextSectionId;
            }
            await sectionsService.create(payload);
            toast.success('Section created successfully');
            setOpenDialog(false);
            setNewSection({ name: '', nextSectionId: '', gradeLevel: '', program: 'General', capacity: 50 });
            fetchSections();
        } catch (error) {
            console.error('Error creating section:', error);
            toast.error('Failed to create section');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSection = async () => {
        if (!editSection) return;
        setSaving(true);
        try {
            await sectionsService.update(editSection.id, {
                name: editSection.name,
                gradeLevel: editSection.gradeLevel ? Number(editSection.gradeLevel) : undefined,
                program: editSection.program,
                capacity: editSection.capacity,
                nextSectionId: editSection.nextSectionId || null,
            });
            toast.success('Section updated successfully');
            setOpenEditDialog(false);
            fetchSections();
        } catch (error) {
            console.error('Error updating section:', error);
            toast.error('Failed to update section');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSection = async () => {
        if (!sectionToDelete) return;
        setSaving(true);
        try {
            await sectionsService.delete(sectionToDelete.id);
            toast.success('Section deleted successfully');
            setOpenDeleteDialog(false);
            fetchSections();
        } catch (error) {
            console.error('Error deleting section:', error);
            toast.error('Failed to delete section');
        } finally {
            setSaving(false);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary">
                            Sections & Rosters
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Manage classroom groups and student assignments
                        </Typography>
                    </Box>
                    {refreshing && <CircularProgress size={20} />}
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
                {filteredSections.length === 0 ? (
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, bgcolor: alpha(theme.palette.background.paper, 0.5), backdropFilter: 'blur(10px)', border: `1px dashed ${theme.palette.divider}` }}>
                            <GroupsIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No sections found</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Try adjusting your search or create a new section group.</Typography>
                            <Button startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>Create First Section</Button>
                        </Paper>
                    </Grid>
                ) : (
                    filteredSections.map((section) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={section.id}>
                            <Card sx={{
                                borderRadius: '24px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'visible',
                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
                                    '& .section-icon': {
                                        transform: 'scale(1.1) rotate(5deg)',
                                        bgcolor: theme.palette.primary.main,
                                        color: '#fff'
                                    }
                                }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                        <Box className="section-icon" sx={{
                                            p: 2,
                                            borderRadius: '16px',
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <GroupsIcon />
                                        </Box>
                                        <Box>
                                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, section)}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                                        {section.name}
                                    </Typography>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                        {section.gradeLevel && (
                                            <Chip 
                                                label={`Grade ${section.gradeLevel}`} 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                    color: theme.palette.primary.main,
                                                    borderRadius: '8px'
                                                }} 
                                            />
                                        )}
                                        {section.program && (
                                            <Chip 
                                                label={section.program} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ fontWeight: 600, color: theme.palette.secondary.main, borderColor: alpha(theme.palette.secondary.main, 0.3) }} 
                                            />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Recent Roster</Typography>
                                            <AvatarGroup max={4} sx={{ 
                                                '& .MuiAvatar-root': { 
                                                    width: 28, 
                                                    height: 28, 
                                                    fontSize: '0.8rem',
                                                    border: `2px solid ${theme.palette.background.paper}`
                                                } 
                                            }}>
                                                {section.students?.map((std: any) => (
                                                    <Tooltip key={std.id} title={`${std.user?.firstName || ''} ${std.user?.lastName || ''}`.trim() || std.user?.username || 'Student'}>
                                                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 700 }}>
                                                            {std.user?.firstName?.charAt(0) || std.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                                        </Avatar>
                                                    </Tooltip>
                                                ))}
                                                {(!section.students || section.students.length === 0) && (
                                                    <Typography variant="caption" color="text.disabled" sx={{ ml: 1 }}>Empty</Typography>
                                                )}
                                            </AvatarGroup>
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Capacity</Typography>
                                            <Typography variant="body2" fontWeight={700} color={
                                                (section._count?.students ?? 0) >= (section.capacity || 50)
                                                    ? 'error.main' : 'text.primary'
                                            }>
                                                {section._count?.students ?? 0} / {section.capacity || 50}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ width: '100%', height: 6, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 3, overflow: 'hidden' }}>
                                            <Box sx={{ 
                                                width: `${Math.min(100, ((section._count?.students ?? 0) / (section.capacity || 50)) * 100)}%`, 
                                                height: '100%', 
                                                bgcolor: (section._count?.students ?? 0) >= (section.capacity || 50) ? 'error.main' : 'primary.main',
                                                borderRadius: 3,
                                                transition: 'width 0.5s ease-in-out'
                                            }} />
                                        </Box>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disableElevation
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={() => router.push(`/academic/sections/${section.id}`)}
                                        sx={{
                                            borderRadius: '14px',
                                            py: 1.5,
                                            fontWeight: 800,
                                            boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                                            '&:hover': { boxShadow: `0 12px 25px ${alpha(theme.palette.primary.main, 0.3)}` }
                                        }}
                                    >
                                        Manage Roster
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
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
                            label="Max Capacity"
                            type="number"
                            fullWidth
                            value={newSection.capacity}
                            onChange={(e) => setNewSection({ ...newSection, capacity: Number(e.target.value) })}
                        />
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
                    <Button onClick={() => setOpenDialog(false)} sx={{ fontWeight: 700 }} disabled={saving}>Cancel</Button>
                    <Button 
                        onClick={handleCreateSection} 
                        variant="contained" 
                        disabled={saving || !newSection.name || !newSection.gradeLevel} 
                        sx={{ borderRadius: '10px', fontWeight: 700, minWidth: 120 }}
                        startIcon={saving && <CircularProgress size={16} color="inherit" />}
                    >
                        {saving ? 'Creating...' : 'Create Section'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Edit Section</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Section Name"
                            fullWidth
                            value={editSection?.name || ''}
                            onChange={(e) => setEditSection({ ...editSection, name: e.target.value })}
                        />
                        <TextField
                            select
                            label="Grade Level"
                            fullWidth
                            SelectProps={{ native: true }}
                            value={editSection?.gradeLevel || ''}
                            onChange={(e) => setEditSection({ ...editSection, gradeLevel: e.target.value })}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
                                <option key={g} value={g}>Grade {g}</option>
                            ))}
                        </TextField>
                        <TextField
                            label="Max Capacity"
                            type="number"
                            fullWidth
                            value={editSection?.capacity || 50}
                            onChange={(e) => setEditSection({ ...editSection, capacity: Number(e.target.value) })}
                        />
                        <TextField
                            select
                            label="Program/Stream"
                            fullWidth
                            SelectProps={{ native: true }}
                            value={editSection?.program || 'General'}
                            onChange={(e) => setEditSection({ ...editSection, program: e.target.value })}
                        >
                            <option value="General">General</option>
                            <option value="Natural Science">Natural Science</option>
                            <option value="Social Science">Social Science</option>
                            <option value="Vocational">Vocational</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenEditDialog(false)} disabled={saving}>Cancel</Button>
                    <Button 
                        onClick={handleUpdateSection} 
                        variant="contained" 
                        disabled={saving}
                        sx={{ borderRadius: '10px', fontWeight: 700, minWidth: 120 }}
                        startIcon={saving && <CircularProgress size={16} color="inherit" />}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: '20px' } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Delete Section?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <b>{sectionToDelete?.name}</b>? 
                        This action cannot be undone and may affect student assignments.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDeleteDialog(false)} disabled={saving}>Cancel</Button>
                    <Button 
                        onClick={handleDeleteSection} 
                        color="error" 
                        variant="contained" 
                        disabled={saving}
                        sx={{ borderRadius: '10px', fontWeight: 700, minWidth: 120 }}
                        startIcon={saving && <CircularProgress size={16} color="inherit" />}
                    >
                        {saving ? 'Deleting...' : 'Delete Section'}
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
                <MenuItem onClick={() => { 
                    setEditSection(menuSection);
                    setOpenEditDialog(true);
                    handleMenuClose(); 
                }} sx={{ py: 1.5 }}>
                    <EditIcon sx={{ mr: 2, fontSize: 18, color: 'info.main' }} />
                    <Typography fontWeight={600}>Edit Section</Typography>
                </MenuItem>
                <MenuItem onClick={() => { 
                    setSectionToDelete(menuSection);
                    setOpenDeleteDialog(true);
                    handleMenuClose(); 
                }} sx={{ py: 1.5, color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 2, fontSize: 18 }} />
                    <Typography fontWeight={600}>Delete Section</Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
}
