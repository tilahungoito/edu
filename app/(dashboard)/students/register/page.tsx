'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Stepper,
    Step,
    StepLabel,
    MenuItem,
    Alert,
    CircularProgress,
    Divider
} from '@mui/material';
import {
    Person as PersonIcon,
    School as SchoolIcon,
    CheckCircle as CheckCircleIcon,
    ArrowForward as ArrowForwardIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { authApi } from '@/app/lib/api/api-client';
import { studentsService } from '@/app/lib/api/students.service';
import { useRouter } from 'next/navigation';

const steps = ['Account Information', 'Academic Profile', 'Confirmation'];

export default function StudentRegistrationPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // Account Info
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        confirmPassword: '',

        // Academic Info
        program: '',
        year: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateStep = (step: number) => {
        setError(null);
        if (step === 0) {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.phone || !formData.password) {
                setError('All fields are required');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
        }
        if (step === 1) {
            if (!formData.program || !formData.year) {
                setError('All academic fields are required');
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!user?.tenantId) {
            setError('System Error: Administrator institution ID missing');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Create User Account
            await authApi.register({
                email: formData.email,
                username: formData.username,
                password: formData.password,
                phone: formData.phone,
                roleName: 'STUDENT',
                scopeType: 'INSTITUTION',
                scopeId: user.tenantId
            });

            // 2. Create Student Profile
            // Note: In a real app, you might want to link the created user ID here.
            // The backend implementation of studentsService.create uses email to connect to the user.
            await studentsService.create({
                email: formData.email, // Used to link to user
                username: formData.username,
                phone: formData.phone,
                institutionId: user.tenantId,
                program: formData.program,
                year: parseInt(formData.year)
            });

            setSuccess(true);
            setActiveStep(2);
        } catch (err: any) {
            console.error('Registration failed:', err);
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            username: '',
            phone: '',
            password: '',
            confirmPassword: '',
            program: '',
            year: ''
        });
        setActiveStep(0);
        setSuccess(false);
        setError(null);
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    New Student Registration
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Register a new student and create their system access account.
                </Typography>
            </Box>

            <Paper sx={{ p: 4, borderRadius: 2 }}>
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                helperText="Used for system login"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Phone Number"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="0911223344"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                )}

                {activeStep === 1 && (
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Institution"
                                value={user?.tenantName || 'Unknown Institution'}
                                disabled
                                helperText="Students are automatically registered to your institution"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                select
                                label="Program / Stream"
                                name="program"
                                value={formData.program}
                                onChange={handleChange}
                            >
                                <MenuItem value="Natural Science">Natural Science</MenuItem>
                                <MenuItem value="Social Science">Social Science</MenuItem>
                                <MenuItem value="General">General</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                label="Grade / Year"
                                name="year"
                                type="number"
                                value={formData.year}
                                onChange={handleChange}
                                InputProps={{ inputProps: { min: 1, max: 12 } }}
                            />
                        </Grid>
                    </Grid>
                )}

                {activeStep === 2 && (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
                        <Typography variant="h5" gutterBottom>
                            Registration Successful!
                        </Typography>
                        <Typography color="text.secondary" paragraph>
                            Student account for <strong>{formData.firstName} {formData.lastName}</strong> has been created.
                        </Typography>
                        <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 1, display: 'inline-block' }}>
                            Username: <strong>{formData.username}</strong><br />
                            Email: {formData.email}
                        </Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
                    {activeStep === 2 ? (
                        <Button variant="contained" onClick={handleReset}>
                            Register Another Student
                        </Button>
                    ) : (
                        <>
                            <Button
                                disabled={activeStep === 0 || loading}
                                onClick={handleBack}
                                startIcon={<ArrowBackIcon />}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                onClick={activeStep === steps.length - 2 ? handleSubmit : handleNext}
                                disabled={loading}
                                endIcon={loading ? <CircularProgress size={20} /> : <ArrowForwardIcon />}
                            >
                                {activeStep === steps.length - 2 ? 'Complete Registration' : 'Next'}
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
