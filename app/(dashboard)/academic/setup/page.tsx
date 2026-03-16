'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Button,
    Paper,
    Chip,
    alpha,
    useTheme,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Divider,
    LinearProgress,
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    Groups as SectionIcon,
    ImportContacts as CourseIcon,
    PersonAdd as AssignIcon,
    CheckCircle as DoneIcon,
    ArrowForward as NextIcon,
    ArrowBack as BackIcon,
    Add as AddIcon,
    School as SchoolIcon,
    AutoAwesome as MagicIcon,
    ContentCopy as TemplateIcon,
    Warning as WarnIcon,
    Rocket as LaunchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { SectionDialog } from '@/app/components/management/SectionDialog';
import { CourseDialog } from '@/app/components/management/CourseDialog';
import { CourseTransferDialog } from '@/app/components/management/CourseTransferDialog';
import sectionsService, { Section } from '@/app/lib/api/sections.service';
import coursesService, { Course } from '@/app/lib/api/courses.service';
import { useAuthStore } from '@/app/lib/store';
import Link from 'next/link';

const STEPS = [
    {
        label: 'Create Sections',
        sublabel: 'Define classroom groups (e.g. Grade 9A, Grade 10B)',
        icon: <SectionIcon />,
        color: '#6366f1',
    },
    {
        label: 'Add Courses',
        sublabel: 'Set up the curriculum your school offers',
        icon: <CourseIcon />,
        color: '#10b981',
    },
    {
        label: 'Assign Instructors',
        sublabel: 'Connect teachers to their courses',
        icon: <AssignIcon />,
        color: '#f59e0b',
    },
    {
        label: 'Ready!',
        sublabel: 'Everything is set — teachers can start',
        icon: <LaunchIcon />,
        color: '#ec4899',
    },
];

export default function SchoolSetupPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [activeStep, setActiveStep] = useState(0);

    // Dialog states
    const [sectionDialog, setSectionDialog] = useState(false);
    const [courseDialog, setCourseDialog] = useState(false);
    const [assignDialog, setAssignDialog] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const institutionId = user?.tenantId;

    const { data: sections, refetch: refetchSections } = useQuery({
        queryKey: ['sections', institutionId],
        queryFn: () => sectionsService.getAll(institutionId as string),
        enabled: !!institutionId,
    });

    const { data: courses, refetch: refetchCourses } = useQuery({
        queryKey: ['courses', institutionId],
        queryFn: () => coursesService.getAll({ institutionId }),
        enabled: !!institutionId,
    });

    const assignedCourses = courses?.filter(c => c.instructorId) || [];
    const unassignedCourses = courses?.filter(c => !c.instructorId) || [];

    const stepProgress = [
        sections?.length || 0,
        courses?.length || 0,
        assignedCourses.length,
    ];
    const overallProgress = Math.min(
        ((sections?.length ? 1 : 0) + (courses?.length ? 1 : 0) + (assignedCourses.length > 0 ? 1 : 0)) / 3 * 100,
        100
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: 'auto' }}>

            {/* Header */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        display: 'flex',
                        color: 'white',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    }}>
                        <SchoolIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            School Setup Hub
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Before teachers can start, complete these three steps
                        </Typography>
                    </Box>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                            SETUP PROGRESS
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="primary.main">
                            {Math.round(overallProgress)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={overallProgress}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Step Cards (Horizontal Overview) */}
            <Grid container spacing={2} sx={{ mb: 5 }}>
                {STEPS.slice(0, 3).map((step, idx) => {
                    const count = stepProgress[idx];
                    const isDone = count > 0;
                    return (
                        <Grid size={{ xs: 12, sm: 4 }} key={idx}>
                            <Card
                                elevation={0}
                                onClick={() => setActiveStep(idx)}
                                sx={{
                                    border: `2px solid ${activeStep === idx ? step.color : alpha(theme.palette.divider, 0.5)}`,
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    bgcolor: activeStep === idx ? alpha(step.color, 0.04) : 'background.paper',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${alpha(step.color, 0.15)}` },
                                }}
                            >
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Box sx={{
                                            p: 1,
                                            borderRadius: '10px',
                                            bgcolor: alpha(step.color, 0.12),
                                            color: step.color,
                                            display: 'flex',
                                        }}>
                                            {step.icon}
                                        </Box>
                                        {isDone ? (
                                            <Chip
                                                label={`${count} Created`}
                                                size="small"
                                                sx={{ bgcolor: alpha(step.color, 0.1), color: step.color, fontWeight: 800, fontSize: '11px' }}
                                            />
                                        ) : (
                                            <Chip label="Not started" size="small" variant="outlined" sx={{ fontSize: '11px', color: 'text.disabled' }} />
                                        )}
                                    </Box>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        Step {idx + 1}: {step.label}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {step.sublabel}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Active Step Content */}
            <Paper elevation={0} sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: '20px',
                overflow: 'hidden',
            }}>
                {/* Step Header */}
                <Box sx={{
                    p: 3,
                    background: `linear-gradient(135deg, ${alpha(STEPS[activeStep]?.color || theme.palette.primary.main, 0.08)}, transparent)`,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            bgcolor: alpha(STEPS[activeStep]?.color || theme.palette.primary.main, 0.15),
                            color: STEPS[activeStep]?.color || theme.palette.primary.main,
                            display: 'flex',
                        }}>
                            {STEPS[activeStep]?.icon}
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>
                                {STEPS[activeStep]?.label}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {STEPS[activeStep]?.sublabel}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            startIcon={<BackIcon />}
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep(p => p - 1)}
                            sx={{ borderRadius: 2 }}
                        >
                            Back
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            endIcon={<NextIcon />}
                            disabled={activeStep >= 3}
                            onClick={() => setActiveStep(p => p + 1)}
                            sx={{ borderRadius: 2 }}
                        >
                            Next
                        </Button>
                    </Box>
                </Box>

                {/* Step 0: Sections */}
                {activeStep === 0 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                                Sections group your students into classrooms. Create one per grade-level class (e.g., <strong>Grade 9A</strong>, <strong>Grade 9B</strong>).
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setSectionDialog(true)}
                                sx={{ borderRadius: 2.5, whiteSpace: 'nowrap', ml: 2 }}
                            >
                                New Section
                            </Button>
                        </Box>

                        {sections && sections.length > 0 ? (
                            <Grid container spacing={1.5}>
                                {sections.map(section => (
                                    <Grid size={{ xs: 6, sm: 4, md: 3 }} key={section.id}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                            bgcolor: alpha(theme.palette.primary.main, 0.04),
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                        }}>
                                            <DoneIcon sx={{ color: theme.palette.success.main, fontSize: 18 }} />
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight={700}>{section.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {section._count?.students || 0} students
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                ))}
                                <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                                    <Box
                                        onClick={() => setSectionDialog(true)}
                                        sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            cursor: 'pointer',
                                            color: 'text.secondary',
                                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                        }}
                                    >
                                        <AddIcon fontSize="small" />
                                        <Typography variant="body2" fontWeight={600}>Add more</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        ) : (
                            <Box sx={{
                                textAlign: 'center',
                                py: 6,
                                px: 3,
                                bgcolor: alpha(theme.palette.warning.main, 0.04),
                                borderRadius: '16px',
                                border: `2px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
                            }}>
                                <WarnIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 1 }} />
                                <Typography variant="h6" fontWeight={700} color="warning.main">No sections yet</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Create sections before enrolling students or assigning courses.
                                </Typography>
                                <Button variant="contained" color="warning" startIcon={<AddIcon />} onClick={() => setSectionDialog(true)} sx={{ borderRadius: 2.5 }}>
                                    Create First Section
                                </Button>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button component={Link} href="/academic/sections" variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                                    Full Sections Page →
                                </Button>
                                <Button component={Link} href="/students" variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                                    Manage Students →
                                </Button>
                            </Box>
                            <Button variant="contained" endIcon={<NextIcon />} onClick={() => setActiveStep(1)} sx={{ borderRadius: 2.5 }}>
                                Next: Add Courses
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Step 1: Courses */}
                {activeStep === 1 && (
                    <Box sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                                Add courses for this academic year. You can also import from the <strong>curriculum template</strong>.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<TemplateIcon />}
                                    component={Link}
                                    href="/academic/curriculum-templates"
                                    sx={{ borderRadius: 2.5, whiteSpace: 'nowrap' }}
                                >
                                    Use Template
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setCourseDialog(true)}
                                    sx={{ borderRadius: 2.5, whiteSpace: 'nowrap' }}
                                >
                                    New Course
                                </Button>
                            </Box>
                        </Box>

                        {courses && courses.length > 0 ? (
                            <Grid container spacing={1.5}>
                                {courses.map(course => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={course.id}>
                                        <Box sx={{
                                            p: 2,
                                            borderRadius: '12px',
                                            border: `1px solid ${alpha(course.instructorId ? theme.palette.success.main : theme.palette.warning.main, 0.3)}`,
                                            bgcolor: alpha(course.instructorId ? theme.palette.success.main : theme.palette.warning.main, 0.04),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <CourseIcon sx={{ color: course.instructorId ? theme.palette.success.main : theme.palette.warning.main, fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{course.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {course.credit} credit(s) • {course.instructorId ? (course as any).instructor?.username || 'Assigned' : 'No instructor'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {!course.instructorId && (
                                                <Chip
                                                    label="Assign"
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => { setSelectedCourse(course); setAssignDialog(true); }}
                                                    sx={{ cursor: 'pointer', fontWeight: 700, fontSize: '11px' }}
                                                />
                                            )}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Box sx={{
                                textAlign: 'center',
                                py: 6,
                                px: 3,
                                bgcolor: alpha(theme.palette.success.main, 0.04),
                                borderRadius: '16px',
                                border: `2px dashed ${alpha(theme.palette.success.main, 0.3)}`,
                            }}>
                                <CourseIcon sx={{ fontSize: 48, color: theme.palette.success.main, mb: 1 }} />
                                <Typography variant="h6" fontWeight={700} color="success.main">No courses yet</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Add courses manually or use a shared curriculum template.
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button variant="outlined" startIcon={<TemplateIcon />} component={Link} href="/academic/curriculum-templates" sx={{ borderRadius: 2.5 }}>
                                        Browse Templates
                                    </Button>
                                    <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => setCourseDialog(true)} sx={{ borderRadius: 2.5 }}>
                                        Create Course
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button variant="outlined" startIcon={<BackIcon />} onClick={() => setActiveStep(0)} sx={{ borderRadius: 2 }}>
                                Back
                            </Button>
                            <Button variant="contained" endIcon={<NextIcon />} onClick={() => setActiveStep(2)} sx={{ borderRadius: 2.5 }}>
                                Next: Assign Instructors
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Step 2: Assign Instructors */}
                {activeStep === 2 && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Each course needs an assigned instructor before students can attend. {unassignedCourses.length > 0 && (
                                <Typography component="span" color="warning.main" fontWeight={700}>
                                    {unassignedCourses.length} course(s) still need an instructor.
                                </Typography>
                            )}
                        </Typography>

                        {unassignedCourses.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'warning.main' }}>
                                    ⚠️ Unassigned Courses
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {unassignedCourses.map(course => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={course.id}>
                                            <Box sx={{
                                                p: 2,
                                                borderRadius: '12px',
                                                border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                                                bgcolor: alpha(theme.palette.warning.main, 0.05),
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{course.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{course.credit} credit(s)</Typography>
                                                </Box>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="warning"
                                                    startIcon={<AssignIcon />}
                                                    onClick={() => { setSelectedCourse(course); setAssignDialog(true); }}
                                                    sx={{ borderRadius: 2, fontSize: '12px' }}
                                                >
                                                    Assign
                                                </Button>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {assignedCourses.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'success.main' }}>
                                    ✅ Assigned ({assignedCourses.length})
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {assignedCourses.map(course => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={course.id}>
                                            <Box sx={{
                                                p: 2,
                                                borderRadius: '12px',
                                                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                                bgcolor: alpha(theme.palette.success.main, 0.04),
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                            }}>
                                                <DoneIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>{course.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {(course as any).instructor?.username || 'Instructor assigned'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button variant="outlined" startIcon={<BackIcon />} onClick={() => setActiveStep(1)} sx={{ borderRadius: 2 }}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                endIcon={<LaunchIcon />}
                                onClick={() => setActiveStep(3)}
                                disabled={unassignedCourses.length > 0 && assignedCourses.length === 0}
                                sx={{ borderRadius: 2.5 }}
                            >
                                Finish Setup
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Step 3: Done */}
                {activeStep === 3 && (
                    <Box sx={{ p: 5, textAlign: 'center' }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 3,
                        }}>
                            <DoneIcon sx={{ fontSize: 48, color: theme.palette.success.main }} />
                        </Box>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            School is Ready! 🎉
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
                            You have <strong>{sections?.length || 0} sections</strong>, <strong>{courses?.length || 0} courses</strong>, and <strong>{assignedCourses.length} assigned instructors</strong>. Instructors can now record attendance, grades, and assessments.
                        </Typography>
                        <Grid container spacing={2} sx={{ maxWidth: 560, mx: 'auto' }}>
                            {[
                                { label: 'Staff Management', href: '/hr/staff', icon: '👥' },
                                { label: 'Student Registration', href: '/students/register', icon: '🎓' },
                                { label: 'Academic Periods', href: '/academic/config/periods', icon: '📅' },
                                { label: 'Curriculum Templates', href: '/academic/curriculum-templates', icon: '📚' },
                            ].map(link => (
                                <Grid size={{ xs: 6 }} key={link.href}>
                                    <Button
                                        component={Link}
                                        href={link.href}
                                        variant="outlined"
                                        fullWidth
                                        sx={{ borderRadius: 2.5, py: 1.5, fontWeight: 700, gap: 1 }}
                                    >
                                        {link.icon} {link.label}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}
            </Paper>

            {/* Dialogs */}
            <SectionDialog
                open={sectionDialog}
                onClose={() => setSectionDialog(false)}
                onSuccess={() => { refetchSections(); setSectionDialog(false); }}
                section={null}
            />
            <CourseDialog
                open={courseDialog}
                onClose={() => setCourseDialog(false)}
                onSuccess={() => { refetchCourses(); setCourseDialog(false); }}
                course={null}
            />
            <CourseTransferDialog
                open={assignDialog}
                onClose={() => setAssignDialog(false)}
                onSuccess={() => { refetchCourses(); setAssignDialog(false); }}
                course={selectedCourse}
            />
        </Box>
    );
}
