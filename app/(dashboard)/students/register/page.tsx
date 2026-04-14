'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Alert,
    CircularProgress,
    Divider,
    alpha,
    useTheme,
    InputAdornment
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    CheckCircle as CheckCircleIcon,
    Save as SaveIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import studentsService from '@/app/lib/api/students.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const registrationSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
    program: z.string().min(1, 'Please select a program'),
    year: z.string().min(1, 'Please select a grade/year'),
    gender: z.enum(['MALE', 'FEMALE'] as const, 'Please select a gender'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function StudentRegistrationPage() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [registeredStudent, setRegisteredStudent] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            program: '',
            year: '1',
            gender: undefined as any
        }
    });

    const onSubmit = async (data: RegistrationFormData) => {
        if (!user?.tenantId) {
            setError('System Error: Administrator institution ID missing');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await studentsService.create({
                firstName: data.firstName,
                lastName: data.lastName,
                institutionId: user.tenantId,
                program: data.program,
                year: parseInt(data.year),
                gender: data.gender,
            });

            setRegisteredStudent(result);
            setSuccess(true);
            toast.success(`${data.firstName} registered${result?.section ? ` → ${result.section.name}` : ''}!`);
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const studentFirstName = watch('firstName');
    const studentLastName = watch('lastName');

    if (success) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, md: 5 }, textAlign: 'center' }}>
                <Paper sx={{ p: 5, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Registration Successful!
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        <b>{studentFirstName} {studentLastName}</b> has been added to the student directory.
                    </Typography>
                    
                    {registeredStudent?.section ? (
                        <Paper variant="outlined" sx={{ 
                            p: 2.5, 
                            mb: 3, 
                            borderRadius: 3, 
                            bgcolor: alpha(theme.palette.success.main, 0.05),
                            borderColor: theme.palette.success.main,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5
                        }}>
                            <SchoolIcon color="success" />
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>AUTO-ASSIGNED TO</Typography>
                                <Typography variant="body1" fontWeight={800} color="success.dark">
                                    {registeredStudent.section.name}
                                </Typography>
                            </Box>
                        </Paper>
                    ) : (
                        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3, borderColor: 'warning.main', bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                            <Typography variant="body2" color="warning.dark" fontWeight={600}>
                                ⚠️ No section was assigned — no section with matching grade level found.
                            </Typography>
                        </Paper>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Button 
                            variant="outlined"
                            onClick={() => {
                                setSuccess(false);
                                setRegisteredStudent(null);
                                reset();
                            }}
                            sx={{ borderRadius: 2.5, px: 3 }}
                        >
                            Register Another
                        </Button>
                        {registeredStudent?.section && (
                            <Button
                                variant="outlined"
                                color="success"
                                onClick={() => router.push(`/academic/sections/${registeredStudent.section.id}`)}
                                sx={{ borderRadius: 2.5, px: 3 }}
                                startIcon={<SchoolIcon />}
                            >
                                View Section
                            </Button>
                        )}
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            onClick={() => router.push('/students')}
                            sx={{ borderRadius: 2.5, px: 4 }}
                        >
                            Go to Directory
                        </Button>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 650, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                    Register Student
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Quickly add a new student profile. Account credentials will be generated automatically.
                </Typography>
            </Box>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Paper sx={{ p: 4, borderRadius: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6" fontWeight={700}>Student Information</Typography>
                    </Box>
                    
                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                required
                                {...register('firstName')}
                                error={!!errors.firstName}
                                helperText={errors.firstName?.message}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                required
                                {...register('lastName')}
                                error={!!errors.lastName}
                                helperText={errors.lastName?.message}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Gender"
                                required
                                defaultValue=""
                                {...register('gender')}
                                error={!!errors.gender}
                                helperText={errors.gender?.message}
                                slotProps={{ select: { displayEmpty: true } }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
                                <MenuItem value="" disabled>Select Gender</MenuItem>
                                <MenuItem value="MALE">Male</MenuItem>
                                <MenuItem value="FEMALE">Female</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Grade / Year"
                                required
                                defaultValue="1"
                                {...register('year')}
                                error={!!errors.year}
                                helperText={errors.year?.message}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                                    <MenuItem key={g} value={String(g)}>Grade {g}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                select
                                label="Program / Stream"
                                required
                                defaultValue=""
                                {...register('program')}
                                error={!!errors.program}
                                helperText={errors.program?.message}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
                                <MenuItem value="" disabled>Select Program</MenuItem>
                                <MenuItem value="Natural Science">Natural Science</MenuItem>
                                <MenuItem value="Social Science">Social Science</MenuItem>
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Vocational">Vocational</MenuItem>
                            </TextField>
                        </Grid>
                        
                        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
                           <Divider sx={{ mb: 3 }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                <SchoolIcon color="secondary" />
                                <Typography variant="h6" fontWeight={700}>Administrative Context</Typography>
                            </Box>
                            <TextField
                                fullWidth
                                label="Assigned Institution"
                                value={user?.tenantName || 'Detecting...'}
                                disabled
                                helperText="Automatically linked to your school admin unit."
                                sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.05), '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}
                            <Button
                                fullWidth
                                type="submit"
                                variant="contained"
                                color="secondary"
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                sx={{ 
                                    borderRadius: 3, 
                                    py: 1.8, 
                                    fontWeight: 800,
                                    boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.25)}`
                                }}
                            >
                                {loading ? 'Processing...' : 'Complete Registration'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </form>
        </Box>
    );
}
