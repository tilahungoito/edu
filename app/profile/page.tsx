'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Avatar,
    Grid2 as Grid,
    TextField,
    Button,
    Divider,
    Tab,
    Tabs,
    Alert,
    Snackbar,
    CircularProgress,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Person as PersonIcon,
    Security as SecurityIcon,
    Badge as BadgeIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { usersService } from '@/app/lib/api/users.service';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            aria-labelledby={`profile-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export default function ProfilePage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fullUser, setFullUser] = useState<any>(null);
    const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                const data = await usersService.getMe();
                setFullUser(data);
                // The backend sends a single name or firstName/lastName depending on implementation
                // Based on auth-store, it's firstName/lastName
                setProfileData({
                    firstName: (data as any).firstName || '',
                    lastName: (data as any).lastName || '',
                    phone: data.phone || '',
                    email: data.email || '',
                });
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await usersService.updateProfile(profileData);
            setNotification({ open: true, message: 'Profile updated successfully!', severity: 'success' });
        } catch (error) {
            setNotification({ open: true, message: 'Failed to update profile.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setNotification({ open: true, message: 'New passwords do not match!', severity: 'error' });
            return;
        }

        setLoading(true);
        try {
            await usersService.changePassword({
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setNotification({ open: true, message: 'Password changed successfully!', severity: 'success' });
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Failed to change password.';
            setNotification({ open: true, message: msg, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !fullUser) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
            {/* Header / Hero Section */}
            <Card sx={{
                mb: 4,
                position: 'relative',
                overflow: 'visible',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.dark, 0.1)} 100%)`,
                borderRadius: '24px',
            }}>
                <CardContent sx={{ pt: 6, pb: 4, px: 4 }}>
                    <Grid container spacing={4} alignItems="center">
                        <Grid size="auto">
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    bgcolor: theme.palette.primary.main,
                                    fontSize: '3rem',
                                    fontWeight: 700,
                                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                                    border: '4px solid white',
                                }}
                            >
                                {user?.firstName?.charAt(0)}
                            </Avatar>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                <Typography variant="h4" fontWeight={800} color="text.primary">
                                    {user?.firstName} {user?.lastName}
                                </Typography>
                                {user?.roles && user.roles.length > 0 && (
                                    <Alert
                                        icon={<BadgeIcon fontSize="small" />}
                                        severity="info"
                                        sx={{
                                            borderRadius: '12px',
                                            py: 0,
                                            fontWeight: 700,
                                            '& .MuiAlert-message': { py: 0.5 }
                                        }}
                                    >
                                        {user.roles[0].name}
                                    </Alert>
                                )}
                            </Box>
                            <Typography variant="body1" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BadgeIcon sx={{ fontSize: 18 }} /> {user?.tenantName} ({user?.tenantType.toUpperCase()})
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Profile Content */}
            <Card sx={{ borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{
                        '& .MuiTab-root': { fontWeight: 600, py: 2.5 }
                    }}>
                        <Tab icon={<PersonIcon />} iconPosition="start" label="Personal Information" />
                        <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
                    </Tabs>
                </Box>

                <CardContent sx={{ p: 4 }}>
                    <TabPanel value={tabValue} index={0}>
                        <form onSubmit={handleUpdateProfile}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="firstName"
                                        label="First Name"
                                        fullWidth
                                        value={profileData.firstName}
                                        onChange={handleProfileChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="lastName"
                                        label="Last Name"
                                        fullWidth
                                        value={profileData.lastName}
                                        onChange={handleProfileChange}
                                        variant="outlined"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="email"
                                        label="Email Address"
                                        fullWidth
                                        disabled
                                        value={profileData.email}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: <EmailIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="phone"
                                        label="Phone Number"
                                        fullWidth
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: <PhoneIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />
                                        }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                                            sx={{ borderRadius: '12px', px: 4 }}
                                        >
                                            Save Changes
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </TabPanel>

                    <TabPanel value={tabValue} index={1}>
                        <Box sx={{ maxWidth: 500 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                Change Password
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                                Ensure your account is using a long, random password to stay secure.
                            </Typography>

                            <form onSubmit={handleUpdatePassword}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <TextField
                                        type="password"
                                        name="oldPassword"
                                        label="Current Password"
                                        fullWidth
                                        required
                                        value={passwordData.oldPassword}
                                        onChange={handlePasswordChange}
                                    />
                                    <Divider />
                                    <TextField
                                        type="password"
                                        name="newPassword"
                                        label="New Password"
                                        fullWidth
                                        required
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                    />
                                    <TextField
                                        type="password"
                                        name="confirmPassword"
                                        label="Confirm New Password"
                                        fullWidth
                                        required
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                    />
                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            color="primary"
                                            size="large"
                                            disabled={loading}
                                            startIcon={loading ? <CircularProgress size={20} /> : <SecurityIcon />}
                                            sx={{ borderRadius: '12px', px: 4 }}
                                        >
                                            Update Password
                                        </Button>
                                    </Box>
                                </Box>
                            </form>
                        </Box>
                    </TabPanel>
                </CardContent>
            </Card>

            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={() => setNotification({ ...notification, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} variant="filled">
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
