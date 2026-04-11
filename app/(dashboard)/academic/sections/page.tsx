'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
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
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { sectionsService, Section, CreateSectionData, UpdateSectionData } from '@/app/lib/api/sections.service';
import { useRouter } from 'next/navigation';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export default function SectionsPage() {
    const theme = useTheme();
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    
    const [formData, setFormData] = useState<CreateSectionData>({
        name: '',
        institutionId: user?.tenantId || '',
        gradeLevel: undefined,
        program: 'General',
        capacity: 50,
        nextSectionId: null,
    });
    
    const [editSection, setEditSection] = useState<Section | null>(null);
    const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuSection, setMenuSection] = useState<Section | null>(null);

    // Queries
    const { data: sections = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['sections', user?.tenantId],
        queryFn: () => sectionsService.getAll(user?.tenantId || ''),
        enabled: !!user?.tenantId,
    });

    // Real-time synchronization
    useRealTime('STATS_UPDATED', () => {
        queryClient.invalidateQueries({ queryKey: ['sections'] });
    });

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, section: Section) => {
        setAnchorEl(event.currentTarget);
        setMenuSection(section);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuSection(null);
    };

    const filteredSections = useMemo(() => {
        return sections.filter(s => 
            (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.program || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sections, searchQuery]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateSectionData) => sectionsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            toast.success('Section created successfully');
            setOpenCreateDialog(false);
            setFormData({
                name: '',
                institutionId: user?.tenantId || '',
                gradeLevel: undefined,
                program: 'General',
                capacity: 50,
                nextSectionId: null,
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create section');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: UpdateSectionData }) => sectionsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            toast.success('Section updated successfully');
            setOpenEditDialog(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update section');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => sectionsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sections'] });
            toast.success('Section deleted successfully');
            setOpenDeleteDialog(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete section');
        }
    });

    const handleCreateSubmit = () => {
        if (!formData.name || !formData.gradeLevel) {
            toast.error('Name and Grade Level are required');
            return;
        }
        createMutation.mutate({ ...formData, institutionId: user?.tenantId || '' });
    };

    const handleUpdateSubmit = () => {
        if (!editSection) return;
        updateMutation.mutate({ 
            id: editSection.id, 
            data: {
                name: editSection.name,
                gradeLevel: editSection.gradeLevel,
                program: editSection.program,
                capacity: editSection.capacity,
                nextSectionId: editSection.nextSectionId || null,
            } 
        });
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15, gap: 2 }}>
                <CircularProgress size={48} thickness={4} />
                <Typography variant="body1" color="text.secondary" fontWeight={600}>Loading Sections...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Sections & Rosters
                        </Typography>
                        {isFetching && <CircularProgress size={20} thickness={5} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage classroom groups and student assignments
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <IconButton onClick={() => refetch()} disabled={isFetching} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <RefreshIcon />
                    </IconButton>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreateDialog(true)}
                        sx={{ borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none' }}
                    >
                        Create Section
                    </Button>
                </Box>
            </Box>

            {/* Filter Bar */}
            <Paper sx={{ p: 2, mb: 4, borderRadius: 3, display: 'flex', alignItems: 'center', bgcolor: alpha(theme.palette.background.paper, 0.8), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <TextField
                    size="small"
                    placeholder="Search sections..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    InputProps={{ 
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                        sx: { borderRadius: 2.5 }
                    }}
                    sx={{ width: { xs: '100%', sm: 350 } }}
                />
            </Paper>

            {/* Grid */}
            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)'
                },
                gap: 3 
            }}>
                {filteredSections.length === 0 ? (
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 6, border: `1px dashed ${theme.palette.divider}`, bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
                            <GroupsIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
                            <Typography variant="h6" color="text.secondary">No sections found</Typography>
                            <Button variant="text" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)} sx={{ mt: 2 }}>Create First Section</Button>
                        </Paper>
                    </Box>
                ) : (
                    filteredSections.map((section) => (
                        <Card key={section.id} sx={{
                            borderRadius: '24px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                                '& .section-icon': { bgcolor: 'primary.main', color: '#fff' }
                            }
                        }}>
                            <CardContent sx={{ p: 3.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                    <Box className="section-icon" sx={{ p: 1.5, borderRadius: '14px', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', transition: '0.3s' }}>
                                        <GroupsIcon />
                                    </Box>
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, section)}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Typography variant="h6" fontWeight={800} gutterBottom noWrap title={section.name}>
                                    {section.name}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                                    <Chip label={`Grade ${section.gradeLevel}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }} />
                                    <Chip label={section.program || 'General'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary" fontWeight={600}>Capacity</Typography>
                                        <Typography variant="body2" fontWeight={800}>{section._count?.students || 0} / {section.capacity || 50}</Typography>
                                    </Box>
                                    <Box sx={{ height: 6, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ 
                                            width: `${Math.min(100, ((section._count?.students || 0) / (section.capacity || 50)) * 100)}%`, 
                                            height: '100%', 
                                            bgcolor: (section._count?.students || 0) >= (section.capacity || 50) ? 'error.main' : 'primary.main',
                                            borderRadius: 3 
                                        }} />
                                    </Box>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    disableElevation
                                    onClick={() => router.push(`/academic/sections/${section.id}`)}
                                    endIcon={<ArrowForwardIcon />}
                                    sx={{ borderRadius: '16px', py: 1.5, fontWeight: 800, textTransform: 'none' }}
                                >
                                    Manage Roster
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>

            {/* Dialogs */}
            <Dialog open={openCreateDialog} onClose={() => !createMutation.isPending && setOpenCreateDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Create New Section</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField label="Section Name" fullWidth value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. 10-A" />
                    <TextField select label="Grade Level" fullWidth value={formData.gradeLevel || ''} onChange={e => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
                    </TextField>
                    <TextField label="Max Capacity" type="number" fullWidth value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenCreateDialog(false)} disabled={createMutation.isPending}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateSubmit} disabled={createMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700 }}>
                        {createMutation.isPending ? 'Creating...' : 'Create Section'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={() => !updateMutation.isPending && setOpenEditDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Edit Section</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    {editSection && (
                        <>
                            <TextField label="Section Name" fullWidth value={editSection.name} onChange={e => setEditSection({ ...editSection, name: e.target.value })} />
                            <TextField select label="Grade Level" fullWidth value={editSection.gradeLevel || ''} onChange={e => setEditSection({ ...editSection, gradeLevel: Number(e.target.value) })}>
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <MenuItem key={g} value={g}>Grade {g}</MenuItem>)}
                            </TextField>
                            <TextField label="Max Capacity" type="number" fullWidth value={editSection.capacity || 50} onChange={e => setEditSection({ ...editSection, capacity: Number(e.target.value) })} />
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenEditDialog(false)} disabled={updateMutation.isPending}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateSubmit} disabled={updateMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700 }}>
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDeleteDialog} onClose={() => !deleteMutation.isPending && setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Delete Section?</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete <b>{sectionToDelete?.name}</b>? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDeleteDialog(false)} disabled={deleteMutation.isPending}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={() => sectionToDelete && deleteMutation.mutate(sectionToDelete.id)} disabled={deleteMutation.isPending} sx={{ borderRadius: 2, fontWeight: 700 }}>
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: 3, minWidth: 160 } }}>
                <MenuItem onClick={() => { setEditSection(menuSection); setOpenEditDialog(true); handleMenuClose(); }}>
                    <EditIcon sx={{ mr: 1.5, fontSize: 18 }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => { setSectionToDelete(menuSection); setOpenDeleteDialog(true); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} /> Delete
                </MenuItem>
            </Menu>
        </Box>
    );
}
