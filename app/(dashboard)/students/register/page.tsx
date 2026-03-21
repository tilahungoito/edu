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
        sem1Average: '',
        sem2Average: '',
        promotionStatus: 'PENDING'
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
                academicHistory: {
                    sem1Average: formData.sem1Average !== '' ? Number(formData.sem1Average) : undefined,
                    sem2Average: formData.sem2Average !== '' ? Number(formData.sem2Average) : undefined,
                    promotionStatus: formData.promotionStatus || 'PENDING'
                }
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
        <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                    Register Student
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Quickly add a new student profile. Account credentials will be generated automatically.
                </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
                <Grid container spacing={4}>
                    {/* Left Column: Personal & Academic */}
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper sx={{ p: 4, borderRadius: 4, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                                <PersonIcon color="primary" />
                                <Typography variant="h6" fontWeight={700}>Basic Information</Typography>
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
                            </Grid>

                            <Divider sx={{ my: 4 }} />

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                                <SchoolIcon color="secondary" />
                                <Typography variant="h6" fontWeight={700}>Academic Context</Typography>
                            </Box>
                            
                            <TextField
                                fullWidth
                                label="Assigned Institution"
                                value={user?.tenantName || 'Detecting...'}
                                disabled
                                helperText="Students are automatically linked to your administrative unit."
                                sx={{ bgcolor: alpha(theme.palette.action.disabledBackground, 0.05), '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                            />
                        </Paper>
                    </Grid>

                    {/* Right Column: Initial Performance & Actions */}
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper sx={{ p: 4, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                                <AssignmentIcon sx={{ color: 'secondary.main' }} />
                                <Typography variant="h6" fontWeight={700}>Initial Grades (Optional)</Typography>
                            </Box>

                            <Grid container spacing={2.5}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Sem I Avg (%)"
                                        name="sem1Average"
                                        type="number"
                                        value={formData.sem1Average}
                                        onChange={handleChange}
                                        InputProps={{ 
                                            inputProps: { min: 0, max: 100 },
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        fullWidth
                                        label="Sem II Avg (%)"
                                        name="sem2Average"
                                        type="number"
                                        value={formData.sem2Average}
                                        onChange={handleChange}
                                        InputProps={{ 
                                            inputProps: { min: 0, max: 100 },
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        fullWidth
                                        select
                                        label="Initial Status"
                                        name="promotionStatus"
                                        value={formData.promotionStatus}
                                        onChange={handleChange}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                                    >
                                        <MenuItem value="PENDING">Pending Assessment</MenuItem>
                                        <MenuItem value="PASS">Pre-Promoted</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 'auto', pt: 4 }}>
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
                                    {loading ? 'Processing...' : 'Register Student'}
                                </Button>
                                <Button
                                    fullWidth
                                    variant="text"
                                    onClick={() => router.push('/students')}
                                    sx={{ mt: 1.5, fontWeight: 600, color: 'text.secondary' }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </form>
        </Box>
    );
}
