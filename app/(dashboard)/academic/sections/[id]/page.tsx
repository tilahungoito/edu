'use client';

import React, { useState, useMemo } from 'react';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemButton,
    ListItemAvatar,
    ListItemText,
    Checkbox,
    Divider,
    CircularProgress,
    alpha,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    LinearProgress,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    PersonAdd as PersonAddIcon,
    MoreVert as MoreVertIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    School as SchoolIcon,
    PersonRemove as PersonRemoveIcon,
    AutoFixHigh as AutoIcon,
    Refresh as RefreshIcon,
    Group as GroupsIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { sectionsService } from '@/app/lib/api/sections.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { BulkEnrollmentDialog } from '@/app/components/management/BulkEnrollmentDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SectionDetailPage() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    
    // For the student list actions menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedActionStudent, setSelectedActionStudent] = useState<string | null>(null);

    // Queries
    const { data: section, isLoading: isLoadingSection, isFetching: isFetchingSection, refetch: refetchSection } = useQuery({
        queryKey: ['section', id],
        queryFn: () => sectionsService.getById(id as string),
        enabled: !!id,
    });

    const { data: unassigned = [], isLoading: isLoadingUnassigned, refetch: refetchUnassigned } = useQuery({
        queryKey: ['unassigned-students', user?.tenantId, section?.gradeLevel],
        queryFn: () => sectionsService.getUnassignedStudents(user?.tenantId || '', {
            year: section?.gradeLevel,
            program: section?.program
        }),
        enabled: !!user?.tenantId && !!section,
    });

    // Real-time synchronization
    useRealTime('STATS_UPDATED', () => {
        queryClient.invalidateQueries({ queryKey: ['section', id] });
        queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
    });

    // Mutations
    const assignMutation = useMutation({
        mutationFn: (studentIds: string[]) => sectionsService.assignStudents(id as string, studentIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['section', id] });
            queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
            toast.success('Students assigned successfully');
            setOpenAddDialog(false);
            setSelectedStudents([]);
            // Auto enrollment is triggered by the backend now, but we can also trigger it manually if needed
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to assign students');
        }
    });

    const unassignMutation = useMutation({
        mutationFn: (studentId: string) => sectionsService.unassignStudent(id as string, studentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['section', id] });
            queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
            toast.success('Student removed successfully');
            handleMenuClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to remove student');
        }
    });

    const autoEnrollMutation = useMutation({
        mutationFn: () => sectionsService.autoEnroll(id as string),
        onSuccess: (result) => {
            toast.success(result.message || 'Curriculum synced successfully');
            queryClient.invalidateQueries({ queryKey: ['section', id] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to sync curriculum');
        }
    });

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, studentId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedActionStudent(studentId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedActionStudent(null);
    };

    if (isLoadingSection) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15, gap: 2 }}>
                <CircularProgress size={48} thickness={4} />
                <Typography variant="body1" color="text.secondary" fontWeight={600}>Loading Section Details...</Typography>
            </Box>
        );
    }

    if (!section) {
        return (
            <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography variant="h5" color="error" fontWeight={700}>Section Not Found</Typography>
                <Button onClick={() => router.back()} sx={{ mt: 2 }}>Go Back</Button>
            </Box>
        );
    }

    const isFull = (section._count?.students ?? 0) >= (section.capacity || 50);

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.divider, 0.05) }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -1.5 }}>
                            {section.name}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Roster Management & Student Assignments
                        </Typography>
                    </Box>
                    {(isFetchingSection || assignMutation.isPending || unassignMutation.isPending) && <CircularProgress size={20} thickness={5} />}
                </Box>
                <IconButton onClick={() => refetchSection()} disabled={isFetchingSection}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '350px 1fr' },
                gap: 4 
            }}>
                {/* Stats Sidebar */}
                <Box>
                    <Card sx={{ borderRadius: '24px', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 10px 40px rgba(0,0,0,0.04)', position: 'sticky', top: 24 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={800} gutterBottom>Section Overview</Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Section Details
                                    </Typography>
                                    <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip label={`Grade ${section.gradeLevel}`} size="small" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }} />
                                        <Chip label={section.program || 'General'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                    </Box>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Enrollment Status
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                        <Typography variant="h3" fontWeight={900} color={isFull ? 'error.main' : 'primary.main'}>
                                            {section._count?.students ?? 0}
                                        </Typography>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                                            / {section.capacity || 50}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1.5, width: '100%', height: 8, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 4, overflow: 'hidden' }}>
                                        <Box sx={{ 
                                            width: `${Math.min(100, ((section._count?.students ?? 0) / (section.capacity || 50)) * 100)}%`, 
                                            height: '100%', 
                                            bgcolor: isFull ? 'error.main' : 'primary.main',
                                            borderRadius: 4,
                                            transition: 'width 0.5s ease-in-out'
                                        }} />
                                    </Box>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setOpenAddDialog(true)}
                                    disabled={isFull || assignMutation.isPending}
                                    sx={{ 
                                        borderRadius: '16px', 
                                        py: 2, 
                                        fontWeight: 800, 
                                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}
                                >
                                    {isFull ? 'Section Full' : 'Assign Students'}
                                </Button>

                                <Divider sx={{ my: 1 }} />
                                
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Curriculum Management
                                    </Typography>
                                    
                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            size="large"
                                            startIcon={autoEnrollMutation.isPending ? <CircularProgress size={18} /> : <AutoIcon />}
                                            onClick={() => autoEnrollMutation.mutate()}
                                            disabled={autoEnrollMutation.isPending || !section.gradeLevel}
                                            sx={{ 
                                                borderRadius: '12px', 
                                                py: 1.5, 
                                                fontWeight: 800, 
                                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                                            }}
                                        >
                                            Sync Regional Curriculum
                                        </Button>

                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            color="secondary"
                                            size="large"
                                            startIcon={<SchoolIcon />}
                                            onClick={() => setOpenEnrollDialog(true)}
                                            sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800 }}
                                        >
                                            Bulk Course Enrollment
                                        </Button>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Student List */}
                <Box>
                    <Card sx={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
                        <Box sx={{ 
                            p: 3, 
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            bgcolor: alpha(theme.palette.primary.main, 0.02)
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" fontWeight={800}>Current Roster</Typography>
                                <Chip 
                                    label={`${section.students?.length || 0} Students`} 
                                    size="small" 
                                    sx={{ fontWeight: 800, borderRadius: '6px', bgcolor: 'primary.main', color: '#fff' }} 
                                />
                            </Box>
                            <IconButton size="small" onClick={() => refetchSection()} disabled={isFetchingSection}>
                                <RefreshIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                        
                        <List sx={{ py: 0 }}>
                            {!section.students || section.students.length === 0 ? (
                                <Box sx={{ p: 12, textAlign: 'center' }}>
                                    <GroupsIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.1), mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary" fontWeight={700}>Empty Roster</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>No students assigned yet.</Typography>
                                    <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setOpenAddDialog(true)}>Assign Now</Button>
                                </Box>
                            ) : (
                                section.students.map((student: any, index: number) => (
                                    <React.Fragment key={student.id}>
                                        <ListItem 
                                            secondaryAction={
                                                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, student.id)}>
                                                    <MoreVertIcon />
                                                </IconButton>
                                            }
                                            sx={{ px: 3, py: 2.5, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.01) } }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ 
                                                    width: 48, 
                                                    height: 48, 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                    color: 'primary.main', 
                                                    fontWeight: 800,
                                                    border: `2px solid ${alpha(theme.palette.primary.main, 0.05)}`
                                                }}>
                                                    {(student.user?.firstName || student.user?.username || 'S').charAt(0).toUpperCase()}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={
                                                    <Typography variant="subtitle1" fontWeight={800}>
                                                        {student.user?.firstName 
                                                            ? `${student.user.firstName} ${student.user.lastName || ''}`.trim() 
                                                            : student.user?.username || 'Unknown User'
                                                        }
                                                    </Typography>
                                                }
                                                primaryTypographyProps={{ component: 'div' }}
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 600 }}>
                                                            <EmailIcon sx={{ fontSize: 14 }} /> {student.user?.email || 'No email'}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                            ID: {student.id.substring(0, 8).toUpperCase()}
                                                        </Typography>
                                                    </Box>
                                                }
                                                secondaryTypographyProps={{ component: 'div' }}
                                            />
                                        </ListItem>
                                        {index < (section.students?.length || 0) - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Card>
                </Box>
            </Box>

            {/* Add Students Dialog */}
            <Dialog open={openAddDialog} onClose={() => !assignMutation.isPending && setOpenAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>Assign Students to {section.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select students to assign to this section. Only showing unassigned students matching this section's grade level.
                    </Typography>
                    
                    {isLoadingUnassigned ? (
                        <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>
                    ) : (
                        <Box sx={{ maxHeight: 400, overflow: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: 3 }}>
                            <List>
                                {unassigned.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">All eligible students are already assigned.</Typography>
                                    </Box>
                                ) : (
                                    unassigned.map((student: any) => (
                                        <ListItem key={student.id} disablePadding secondaryAction={
                                            <Checkbox edge="end" checked={selectedStudents.includes(student.id)} onChange={() => handleToggleStudent(student.id)} />
                                        }>
                                            <ListItemButton onClick={() => handleToggleStudent(student.id)} sx={{ px: 3 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1), color: 'text.primary', fontSize: 14 }}>
                                                        {(student.user?.firstName || student.user?.username || '?').charAt(0).toUpperCase()}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={student.user?.firstName ? `${student.user.firstName} ${student.user.lastName || ''}`.trim() : student.user?.username} 
                                                    secondary={student.user?.email} 
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenAddDialog(false)} disabled={assignMutation.isPending}>Cancel</Button>
                    <Button 
                        onClick={() => assignMutation.mutate(selectedStudents)} 
                        variant="contained" 
                        disabled={selectedStudents.length === 0 || assignMutation.isPending}
                        startIcon={assignMutation.isPending && <CircularProgress size={16} color="inherit" />}
                        sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                    >
                        Assign {selectedStudents.length} Students
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} PaperProps={{ sx: { borderRadius: 3, minWidth: 180, mt: 1.5, boxShadow: theme.shadows[4] } }}>
                <MenuItem onClick={() => selectedActionStudent && unassignMutation.mutate(selectedActionStudent)} sx={{ color: 'error.main', py: 1.5 }}>
                    <ListItemIcon><PersonRemoveIcon fontSize="small" color="error" /></ListItemIcon>
                    <Typography fontWeight={600}>Remove from Section</Typography>
                </MenuItem>
            </Menu>

            {/* Bulk Enrollment Dialog */}
            {section && (
                <BulkEnrollmentDialog
                    open={openEnrollDialog}
                    onClose={() => setOpenEnrollDialog(false)}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['section', id] })}
                    section={section}
                />
            )}
        </Box>
    );
}