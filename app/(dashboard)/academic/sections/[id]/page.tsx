'use client';

import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { sectionsService } from '@/app/lib/api/sections.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { BulkEnrollmentDialog } from '@/app/components/management/BulkEnrollmentDialog';

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
    
    // For the student list actions menu
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedActionStudent, setSelectedActionStudent] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const sectionData = await sectionsService.getOne(id as string);
            setSection(sectionData);
            
            if (user?.tenantId) {
                const unassignedData = await sectionsService.getUnassignedStudents(user.tenantId);
                setUnassigned(unassignedData);
            }
        } catch (error) {
            console.error('Error fetching section details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, user?.tenantId]);

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
            fetchData();
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
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                        {section?.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Roster Management & Student Assignments
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Stats Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ borderRadius: '24px', position: 'sticky', top: 24 }}>
                        <CardContent sx={{ p: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Section Overview</Typography>
                            <Divider sx={{ my: 2 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Enrollment Status
                                    </Typography>
                                    <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                                        {section?.students?.length || 0}
                                        <Typography component="span" variant="body1" color="text.secondary" sx={{ ml: 1 }}>Students</Typography>
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                                        Institution
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BadgeIcon fontSize="small" color="primary" /> {user?.tenantName}
                                    </Typography>
                                </Box>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<PersonAddIcon />}
                                    onClick={() => setOpenAddDialog(true)}
                                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, mt: 2 }}
                                >
                                    Add Students to Roster
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<SchoolIcon />}
                                    onClick={() => setOpenEnrollDialog(true)}
                                    sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, mt: 1, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                    Enroll Section in Courses
                                </Button>
                            </Box>
                        </CardContent>

                    </Card>
                </Grid>

                {/* Student List */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ borderRadius: '24px' }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>Current Roster</Typography>
                                <Chip label={`${section?.students?.length || 0} Active`} color="success" size="small" variant="soft" sx={{ fontWeight: 700 }} />
                            </Box>
                            
                            <List sx={{ py: 0 }}>
                                {section?.students?.length === 0 ? (
                                    <Box sx={{ p: 10, textAlign: 'center' }}>
                                        <Typography color="text.secondary">No students assigned to this section yet.</Typography>
                                    </Box>
                                ) : (
                                    section?.students?.map((student: any, index: number) => (
                                        <React.Fragment key={student.id}>
                                            <ListItem 
                                                secondaryAction={
                                                    <IconButton 
                                                        edge="end" 
                                                        onClick={(e) => handleMenuOpen(e, student.id)}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                }
                                                sx={{ px: 3, py: 2 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 700 }}>
                                                        {student.user?.firstName?.charAt(0) || student.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText 
                                                    primary={<Typography fontWeight={700}>
                                                        {student.user?.firstName 
                                                            ? `${student.user.firstName} ${student.user.lastName || ''}`.trim() 
                                                            : student.user?.username || 'Unknown User'
                                                        }
                                                    </Typography>}
                                                    secondary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <EmailIcon sx={{ fontSize: 14 }} /> {student.user?.email}
                                                            </Typography>
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{ component: 'div' } as React.HTMLAttributes<HTMLDivElement>}
                                                />
                                            </ListItem>
                                            {index < section.students.length - 1 && <Divider component="li" />}
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
