'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Chip,
    alpha,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Skeleton,
    Button,
    Card,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    School as SchoolIcon,
    Add as AddIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    PersonAdd as PersonAddIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseDialog } from '@/app/components/management/CourseDialog';
import { ConfirmDialog } from '@/app/components/common/ConfirmDialog';
import { AssignInstructorDialog } from '@/app/components/management/AssignInstructorDialog';
import coursesService, { Course } from '@/app/lib/api/courses.service';
import { useAuthStore } from '@/app/lib/store';
import { toast } from 'react-hot-toast';

export default function CoursesPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});
    const [searchValue, setSearchValue] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
    const [assignTarget, setAssignTarget] = useState<Course | null>(null);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [menuCourse, setMenuCourse] = useState<Course | null>(null);

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');
    const isInstitutionUser = user?.tenantType === 'school';
    
    // Explicit permission flags
    const canManageCurriculum = user?.roles?.some(r => ['SYSTEM_ADMIN', 'REGION_ADMIN', 'REGIONAL_ADMIN'].includes(r.name)) ?? false;
    const canManageTeachers = user?.roles?.some(r => ['SYSTEM_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR'].includes(r.name)) ?? false;

    const { data: courses = [], isLoading, refetch } = useQuery({
        queryKey: ['courses', user?.id],
        queryFn: () => coursesService.getAll(), // Backend handles role-based scoping automatically
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => coursesService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            toast.success('Course deleted successfully');
            setDeleteTarget(null);
        },
        onError: () => {
            toast.error('Failed to delete course');
        }
    });

    // Filter + group by gradeLevel
    const groupedCourses = useMemo(() => {
        const filtered = courses.filter(c =>
            !searchValue ||
            c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
            c.instructor?.username?.toLowerCase().includes(searchValue.toLowerCase())
        );

        const groups: Record<string, Course[]> = {};
        filtered.forEach(course => {
            const key = course.gradeLevel ? `Grade ${course.gradeLevel}` : 'Ungraded';
            if (!groups[key]) groups[key] = [];
            groups[key].push(course);
        });

        // Sort grades numerically
        return Object.entries(groups).sort(([a], [b]) => {
            const numA = parseInt(a.replace('Grade ', '')) || 999;
            const numB = parseInt(b.replace('Grade ', '')) || 999;
            return numA - numB;
        });
    }, [courses, searchValue]);

    const handleToggleGrade = (grade: string) => {
        setExpandedGrades(prev => ({ ...prev, [grade]: !prev[grade] }));
    };

    const handleExpandAll = () => {
        const all: Record<string, boolean> = {};
        groupedCourses.forEach(([grade]) => { all[grade] = true; });
        setExpandedGrades(all);
    };

    const handleCollapseAll = () => setExpandedGrades({});
    
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: Course) => {
        event.stopPropagation();
        event.preventDefault();
        setMenuAnchor(event.currentTarget);
        setMenuCourse(course);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
        setMenuCourse(null);
    };

    const handleAdd = () => {
        setSelectedCourse(null);
        setIsDialogOpen(true);
    };

    const handleEditAction = () => {
        if (menuCourse) {
            setSelectedCourse(menuCourse);
            setIsDialogOpen(true);
        }
        handleMenuClose();
    };

    const handleAssignAction = () => {
        if (menuCourse) {
            setAssignTarget(menuCourse);
        }
        handleMenuClose();
    };

    const handleUnassignAction = async () => {
        if (menuCourse) {
            try {
                await coursesService.assignInstructor(menuCourse.id, null);
                refetch();
                toast.success('Instructor removed successfully');
            } catch (err: any) {
                toast.error('Failed to remove instructor');
            }
        }
        handleMenuClose();
    };

    const handleDeleteAction = () => {
        if (menuCourse) {
            setDeleteTarget(menuCourse);
        }
        handleMenuClose();
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setIsDialogOpen(true);
    };

    const gradeColors: Record<number, string> = {
        1: '#6366f1', 2: '#8b5cf6', 3: '#ec4899', 4: '#f43f5e',
        5: '#f59e0b', 6: '#10b981', 7: '#06b6d4', 8: '#3b82f6',
        9: '#14b8a6', 10: '#84cc16', 11: '#f97316', 12: '#ef4444',
    };
    const getGradeColor = (grade: string) => {
        const num = parseInt(grade.replace('Grade ', ''));
        return gradeColors[num] || theme.palette.primary.main;
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3, lg: 5 }, maxWidth: '100%' }}>

            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -1 }}>
                    Academic Courses
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage curriculum organized by grade level
                </Typography>
            </Box>

            {/* Toolbar Card */}
            <Card sx={{
                borderRadius: 4,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                p: 2,
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
            }}>
                <TextField
                    size="small"
                    placeholder="Search courses..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            )
                        }
                    }}
                    sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto', flexWrap: 'wrap' }}>
                    <Button size="small" variant="text" onClick={handleExpandAll} sx={{ fontWeight: 600, borderRadius: 2 }}>
                        Expand All
                    </Button>
                    <Button size="small" variant="text" onClick={handleCollapseAll} sx={{ fontWeight: 600, borderRadius: 2 }}>
                        Collapse All
                    </Button>
                    <Tooltip title="Refresh">
                        <IconButton size="small" onClick={() => refetch()}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {canManageCurriculum && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={handleAdd}
                            sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                        >
                            Add Course
                        </Button>
                    )}
                </Box>
            </Card>

            {/* Course count chip */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <Typography variant="body2" color="text.secondary">
                    {courses.length} total courses across {groupedCourses.length} grade{groupedCourses.length !== 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Loading skeletons */}
            {isLoading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 3 }} />
                    ))}
                </Box>
            )}

            {/* Empty state */}
            {!isLoading && groupedCourses.length === 0 && (
                <Card sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: `1px dashed ${theme.palette.divider}` }}>
                    <SchoolIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>
                        {searchValue ? 'No courses match your search' : 'No courses yet'}
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                        {searchValue ? 'Try a different keyword' : (canManageCurriculum ? 'Click "Add Course" to create the first one' : 'No curriculum has been published yet')}
                    </Typography>
                </Card>
            )}

            {/* Grade Accordions */}
            {!isLoading && groupedCourses.map(([grade, gradeCourses]) => {
                const color = getGradeColor(grade);
                const isExpanded = expandedGrades[grade] ?? false;

                return (
                    <Accordion
                        key={grade}
                        expanded={isExpanded}
                        onChange={() => handleToggleGrade(grade)}
                        disableGutters
                        elevation={0}
                        sx={{
                            mb: 1.5,
                            borderRadius: '16px !important',
                            border: `1px solid ${isExpanded ? alpha(color, 0.3) : alpha(theme.palette.divider, 0.6)}`,
                            overflow: 'hidden',
                            '&:before': { display: 'none' },
                            transition: 'border-color 0.2s ease',
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: isExpanded ? color : 'text.secondary' }} />}
                            sx={{
                                px: 3,
                                py: 1,
                                bgcolor: isExpanded ? alpha(color, 0.05) : 'background.paper',
                                transition: 'background-color 0.2s ease',
                                '&:hover': { bgcolor: alpha(color, 0.04) },
                                '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 2 },
                            }}
                        >
                            {/* Color dot */}
                            <Box sx={{
                                width: 10, height: 10, borderRadius: '50%',
                                bgcolor: color,
                                flexShrink: 0,
                                boxShadow: `0 0 0 3px ${alpha(color, 0.15)}`,
                            }} />

                            <Typography fontWeight={700} sx={{ color: isExpanded ? color : 'text.primary', fontSize: '0.95rem' }}>
                                {grade}
                            </Typography>

                            <Chip
                                label={`${gradeCourses.length} course${gradeCourses.length !== 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                    bgcolor: alpha(color, 0.1),
                                    color: color,
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    height: 22,
                                    ml: 'auto',
                                    mr: 1,
                                }}
                            />
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 0 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: alpha(color, 0.03) }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', pl: 3 }}>
                                            Course Name
                                        </TableCell>
                                        {isInstitutionUser && (
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                                                Instructor
                                            </TableCell>
                                        )}
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', pr: 3 }}>
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {gradeCourses.map((course, idx) => (
                                        <TableRow
                                            key={course.id}
                                            sx={{
                                                '&:hover': { bgcolor: alpha(color, 0.03) },
                                                '&:last-child td': { border: 0 },
                                                bgcolor: idx % 2 === 0 ? 'transparent' : alpha(theme.palette.action.hover, 0.02),
                                            }}
                                        >
                                            <TableCell sx={{ pl: 3, py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {course.name}
                                                    </Typography>
                                                    {course.regionId && !course.institutionId && (
                                                        <Chip label="Regional Curriculum" size="small" color="secondary" variant="outlined" sx={{ height: 20, fontSize: '10px', fontWeight: 800 }} />
                                                    )}
                                                </Box>
                                            </TableCell>
                                            {isInstitutionUser && (
                                                <TableCell sx={{ py: 1.5 }}>
                                                    {course.instructor ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {course.instructor.username}
                                                        </Typography>
                                                    ) : (
                                                        <Chip
                                                            label="Unassigned"
                                                            size="small"
                                                            variant="outlined"
                                                            color="warning"
                                                            sx={{ height: 20, fontSize: '10px' }}
                                                        />
                                                    )}
                                                </TableCell>
                                            )}
                                            <TableCell align="right" sx={{ pr: 2, py: 1 }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, course)}
                                                    sx={{ 
                                                        color: 'text.secondary',
                                                        bgcolor: alpha(theme.palette.action.hover, 0.05),
                                                        '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.1) }
                                                    }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </AccordionDetails>
                    </Accordion>
                );
            })}

            {/* Create/Edit Dialog */}
            <CourseDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                    refetch();
                    setIsDialogOpen(false);
                }}
                course={selectedCourse}
            />

            {/* Assign Instructor Dialog */}
            <AssignInstructorDialog
                open={!!assignTarget}
                onClose={() => setAssignTarget(null)}
                onSuccess={() => {
                    refetch();
                    setAssignTarget(null);
                    toast.success('Instructor assigned successfully');
                }}
                course={assignTarget}
            />

            {/* Actions Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                elevation={3}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                slotProps={{
                    paper: {
                        sx: {
                            borderRadius: 2,
                            mt: 0.5,
                            minWidth: 180,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.1)}`,
                        }
                    }
                }}
            >
                {/* Instructor Actions (School Roles) */}
                {canManageTeachers && (
                    <MenuItem onClick={handleAssignAction}>
                        <ListItemIcon><PersonAddIcon fontSize="small" color="primary" /></ListItemIcon>
                        <ListItemText 
                            primary={menuCourse?.instructor ? "Edit teacher" : "Assign instructor"} 
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        />
                    </MenuItem>
                )}
                {canManageTeachers && menuCourse?.instructor && (
                    <MenuItem onClick={handleUnassignAction}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primary="Delete instructor" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'error.main' }} />
                    </MenuItem>
                )}

                {/* Curriculum Actions (Regional Roles) */}
                {canManageCurriculum && (
                    <MenuItem onClick={handleEditAction}>
                        <ListItemIcon><EditIcon fontSize="small" color="info" /></ListItemIcon>
                        <ListItemText primary="Edit Course Details" primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                    </MenuItem>
                )}
                {canManageCurriculum && (
                    <MenuItem onClick={handleDeleteAction}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText primary="Delete Entire Course" primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'error.main' }} />
                    </MenuItem>
                )}

                {!canManageTeachers && !canManageCurriculum && (
                    <MenuItem disabled>
                        <ListItemText primary="No actions available" primaryTypographyProps={{ variant: 'body2', color: 'text.disabled' }} />
                    </MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Course"
                message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                confirmColor="error"
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                onClose={() => setDeleteTarget(null)}
            />
        </Box>
    );
}
