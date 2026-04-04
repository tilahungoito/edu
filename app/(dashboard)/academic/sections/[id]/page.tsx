'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import {
    Box,
    Typography,
    Button,
    Grid,
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
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { sectionsService } from '@/app/lib/api/sections.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { BulkEnrollmentDialog } from '@/app/components/management/BulkEnrollmentDialog';

// Refined Section Detail View with Real-Time Updates
export default function SectionDetailPage() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useParams();
    const user = useAuthStore(state => state.user);
    const [section, setSection] = useState<any>(null);
    const [unassigned, setUnassigned] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openEnrollDialog, setOpenEnrollDialog] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // For the student list actions menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedActionStudent, setSelectedActionStudent] = useState<string | null>(null);

    const fetchData = useCallback(async (isBackground = false) => {
        if (isBackground) setRefreshing(true);
        else setLoading(true);

        try {
            const sectionData = await sectionsService.getById(id as string);
            setSection(sectionData);
            
            if (user?.tenantId) {
                const unassignedData = await sectionsService.getUnassignedStudents(user.tenantId, {
                    year: sectionData.gradeLevel,
                    program: sectionData.program
                });
                setUnassigned(unassignedData);
            }
        } catch (error) {
            console.error('Error fetching section details:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id, user?.tenantId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Polling fallback every 15s
    useEffect(() => {
        const interval = setInterval(() => { fetchData(true); }, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useRealTime('STATS_UPDATED', () => fetchData(true));

    const handleToggleStudent = (studentId: string) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId) 
                : [...prev, studentId]
        );
    };

    const handleAssignStudents = async () => {
        setSaving(true);
        try {
            await sectionsService.assignStudents(id as string, selectedStudents);
            setOpenAddDialog(false);
            setSelectedStudents([]);
            await fetchData();
            // Automatically trigger regional curriculum sync after assigning students
            await handleAutoEnroll();
        } catch (error) {
            console.error('Error assigning students:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, studentId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedActionStudent(studentId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedActionStudent(null);
    };

    const handleAutoEnroll = async () => {
        setSaving(true);
        try {
            const result = await sectionsService.autoEnroll(id as string);
            toast.success(result.message || 'Curriculum synced successfully');
            fetchData();
        } catch (error: any) {
            console.error('Error auto-enrolling students:', error);
            toast.error(error.response?.data?.message || 'Failed to sync curriculum');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveStudent = async () => {
        if (!selectedActionStudent) return;
        
        try {
            await sectionsService.unassignStudent(id as string, selectedActionStudent);
            handleMenuClose();
            fetchData();
        } catch (error) {
            console.error('Error removing student:', error);
        }
    };

    if (loading && !section) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => router.back()} sx={{ bgcolor: alpha(theme.palette.divider, 0.05) }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} color="text.primary">
                            {section?.name}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Roster Management & Student Assignments
                        </Typography>
                    </Box>
                    {refreshing && <CircularProgress size={20} />}
                </Box>
                <IconButton onClick={() => fetchData(true)} disabled={refreshing}>
                    <RefreshIcon />
                </IconButton>
            </Box>

            <Grid container spacing={4}>
                {/* Stats Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: '24px', position: 'sticky', top: 24 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Section Overview</Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Section Details
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Chip label={`Grade ${section?.gradeLevel}`} size="small" sx={{ fontWeight: 800, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }} />
                                        <Chip label={section?.program} size="small" variant="outlined" sx={{ fontWeight: 700, px: 1 }} />
                                    </Box>
                                    <Box sx={{ mt: 1.5 }}>
                                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main', fontWeight: 600 }}>
                                            <BadgeIcon sx={{ fontSize: 14 }} /> Regional Curriculum Managed
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Enrollment Status
                                    </Typography>
                                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                                        <Typography variant="h3" fontWeight={900} color={(section?._count?.students ?? 0) >= (section?.capacity || 50) ? 'error.main' : 'primary.main'}>
                                            {section?._count?.students ?? 0}
                                        </Typography>
                                        <Typography variant="h6" color="text.secondary" sx={{ mb: 0.5 }}>
                                            / {section?.capacity || 50} Students
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mt: 1.5, width: '100%', height: 8, bgcolor: alpha(theme.palette.divider, 0.1), borderRadius: 4, overflow: 'hidden' }}>
                                        <Box sx={{ 
                                            width: `${Math.min(100, ((section?._count?.students ?? 0) / (section?.capacity || 50)) * 100)}%`, 
                                            height: '100%', 
                                            bgcolor: (section?._count?.students ?? 0) >= (section?.capacity || 50) ? 'error.main' : 'primary.main',
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
                                    disabled={(section?._count?.students ?? 0) >= (section?.capacity || 50)}
                                    sx={{ 
                                        borderRadius: '16px', 
                                        py: 2, 
                                        fontWeight: 800, 
                                        mb: 1.5,
                                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
                                    }}
                                >
                                    {(section?._count?.students ?? 0) >= (section?.capacity || 50) ? 'Section Full' : 'Add Students'}
                                </Button>

                                <Divider sx={{ my: 1 }} />
                                
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Curriculum & Enrollment
                                    </Typography>
                                    
                                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="large"
                                                startIcon={<AutoIcon />}
                                                onClick={handleAutoEnroll}
                                                disabled={saving || !section?.gradeLevel}
                                                sx={{ 
                                                    borderRadius: '12px', 
                                                    py: 1.5, 
                                                    fontWeight: 800, 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                    border: `1px dashed ${theme.palette.primary.main}`,
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                        border: `1px dashed ${theme.palette.primary.main}`,
                                                    }
                                                }}
                                            >
                                                Sync Regional Curriculum
                                            </Button>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', px: 1 }}>
                                                Automatically enroll students into all regional courses assigned to Grade {section?.gradeLevel}.
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                color="secondary"
                                                size="large"
                                                startIcon={<SchoolIcon />}
                                                onClick={() => setOpenEnrollDialog(true)}
                                                sx={{ 
                                                    borderRadius: '12px', 
                                                    py: 1.5, 
                                                    fontWeight: 800, 
                                                    borderWidth: 2, 
                                                    '&:hover': { borderWidth: 2 } 
                                                }}
                                            >
                                                Bulk Course Enrollment
                                            </Button>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', px: 1 }}>
                                                Manually select institutional courses to enroll the entire section roster into.
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Student List */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: '24px', overflow: 'hidden', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ 
                                p: 3, 
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                bgcolor: alpha(theme.palette.background.default, 0.5)
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="h6" fontWeight={800}>Current Roster</Typography>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => fetchData(true)} 
                                        disabled={refreshing}
                                        sx={{ 
                                            bgcolor: alpha(theme.palette.action.selected, 0.05),
                                            transition: 'transform 0.5s ease',
                                            '&:hover': { transform: 'rotate(180deg)' }
                                        }}
                                    >
                                        <RefreshIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                                <Chip 
                                    label={`${section?._count?.students ?? 0} / ${section?.capacity || 50} Enrolled`} 
                                    color={(section?._count?.students ?? 0) >= (section?.capacity || 50) ? 'error' : 'success'} 
                                    size="small" 
                                    sx={{ fontWeight: 800, borderRadius: '6px' }} 
                                />
                                </Box>
                            
                            <List sx={{ py: 0 }}>
                                {section?.students?.length === 0 ? (
                                    <Box sx={{ p: 12, textAlign: 'center' }}>
                                        <Box sx={{ 
                                            width: 80, 
                                            height: 80, 
                                            borderRadius: '50%', 
                                            bgcolor: alpha(theme.palette.divider, 0.1), 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            margin: '0 auto 24px'
                                        }}>
                                            <BadgeIcon sx={{ fontSize: 40, color: alpha(theme.palette.text.secondary, 0.3) }} />
                                        </Box>
                                        <Typography variant="h6" color="text.secondary" fontWeight={700}>Empty Roster</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>This section has no students assigned yet.</Typography>
                                        <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={() => setOpenAddDialog(true)}>Assign Students</Button>
                                    </Box>
                                ) : (
                                    section?.students?.map((student: any, index: number) => (
                                        <React.Fragment key={student.id}>
                                            <ListItem 
                                                secondaryAction={
                                                    <IconButton 
                                                        edge="end" 
                                                        onClick={(e) => handleMenuOpen(e, student.id)}
                                                        sx={{ '&:hover': { color: 'error.main' } }}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                }
                                                sx={{ 
                                                    px: 3, 
                                                    py: 2.5,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { 
                                                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                                                        cursor: 'default'
                                                    }
                                                }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ 
                                                        width: 52, 
                                                        height: 52, 
                                                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                                                        color: theme.palette.primary.main, 
                                                        fontWeight: 800,
                                                        fontSize: '1.2rem',
                                                        border: `2px solid ${alpha(theme.palette.primary.main, 0.05)}`
                                                    }}>
                                                        {student.user?.firstName?.charAt(0) || student.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                                                            {student.user?.firstName 
                                                                ? `${student.user.firstName} ${student.user.lastName || ''}`.trim() 
                                                                : student.user?.username || 'Unknown User'
                                                            }
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', fontWeight: 500 }}>
                                                                <EmailIcon sx={{ fontSize: 16 }} /> {student.user?.email}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    sx={{ ml: 1 }}
                                                    secondaryTypographyProps={{ component: 'div' } as any}
                                                />
                                            </ListItem>
                                            {index < section.students.length - 1 && <Divider component="li" sx={{ opacity: 0.6 }} />}
                                        </React.Fragment>
                                    ))
                                )}
                            </List>
                            
                            {/* Student Action Menu */}
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    elevation: 0,
                                    sx: {
                                        overflow: 'visible',
                                        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                                        mt: 1.5,
                                        '& .MuiAvatar-root': {
                                            width: 32,
                                            height: 32,
                                            ml: -0.5,
                                            mr: 1,
                                        },
                                        '&:before': {
                                            content: '""',
                                            display: 'block',
                                            position: 'absolute',
                                            top: 0,
                                            right: 14,
                                            width: 10,
                                            height: 10,
                                            bgcolor: 'background.paper',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            zIndex: 0,
                                        },
                                    },
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={handleRemoveStudent} sx={{ color: 'error.main' }}>
                                    <ListItemIcon>
                                        <PersonRemoveIcon fontSize="small" color="error" />
                                    </ListItemIcon>
                                    Remove from Section
                                </MenuItem>
                            </Menu>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Students Dialog */}
            <Dialog 
                open={openAddDialog} 
                onClose={() => setOpenAddDialog(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px' } }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Assign Students to {section?.name}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Showing students at {user?.tenantName} who are not currently assigned to any section.
                    </Typography>
                    
                    <Box sx={{ maxHeight: '400px', overflow: 'auto', border: `1px solid ${theme.palette.divider}`, borderRadius: '16px' }}>
                        <List>
                            {unassigned.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">All students have been assigned to sections!</Typography>
                                </Box>
                            ) : (
                                unassigned.map((student) => (
                                    <ListItem 
                                        key={student.id} 
                                        disablePadding
                                        secondaryAction={
                                            <Checkbox 
                                                edge="end" 
                                                checked={selectedStudents.includes(student.id)} 
                                                onChange={() => handleToggleStudent(student.id)}
                                            />
                                        }
                                    >
                                        <ListItemButton onClick={() => handleToggleStudent(student.id)} sx={{ px: 3 }}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: alpha(theme.palette.grey[500], 0.1), color: theme.palette.text.primary, fontSize: 14 }}>
                                                    {student.user?.firstName?.charAt(0) || student.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText 
                                                primary={
                                                    student.user?.firstName 
                                                        ? `${student.user.firstName} ${student.user.lastName || ''}`.trim() 
                                                        : student.user?.username || 'Unknown User'
                                                } 
                                                secondary={student.user?.email} 
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenAddDialog(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button 
                        onClick={handleAssignStudents} 
                        variant="contained" 
                        disabled={selectedStudents.length === 0 || saving}
                        startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
                        sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                    >
                        Assign {selectedStudents.length > 0 ? selectedStudents.length : ''} Students
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bulk Enrollment Dialog */}
            {section && (
                <BulkEnrollmentDialog
                    open={openEnrollDialog}
                    onClose={() => setOpenEnrollDialog(false)}
                    onSuccess={fetchData}
                    section={section}
                />
            )}
        </Box>
    );
}