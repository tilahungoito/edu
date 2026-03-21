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

export default function StudentRegistrationPage() {
    const theme = useTheme();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        program: '',
        year: '1',
        gender: '' as 'MALE' | 'FEMALE' | '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) {
            setError('System Error: Administrator institution ID missing');
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.program || !formData.gender) {
            setError('Please fill in all required fields');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await studentsService.create({
                firstName: formData.firstName,
                lastName: formData.lastName,
                institutionId: user.tenantId,
                program: formData.program,
                year: parseInt(formData.year),
                gender: formData.gender as 'MALE' | 'FEMALE',
            });

            setSuccess(true);
            toast.success('Student registered successfully!');
            setTimeout(() => {
                router.push('/students/register');
            }, 2000);
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Box sx={{ maxWidth: 600, mx: 'auto', p: { xs: 2, md: 5 }, textAlign: 'center' }}>
                <Paper sx={{ p: 5, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        Registration Successful!
                    </Typography>
                    <Typography color="text.secondary" paragraph variant="h6">
                        {formData.firstName} {formData.lastName} has been added to the directory.
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={() => router.push('/students')}
                        sx={{ mt: 2, borderRadius: 2.5, px: 4 }}
                    >
                        Go to Directory
                    </Button>
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

            <form onSubmit={handleSubmit}>
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
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Gender"
                                name="gender"
                                required
                                value={formData.gender}
                                onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
                                <MenuItem value="MALE">Male</MenuItem>
                                <MenuItem value="FEMALE">Female</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Grade / Year"
                                name="year"
                                type="number"
                                required
                                value={formData.year}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1, max: 12 } }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                select
                                label="Program / Stream"
                                name="program"
                                required
                                value={formData.program}
                                onChange={handleChange}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            >
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
