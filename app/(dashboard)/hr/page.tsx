'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    alpha,
    useTheme,
    Stack,
    IconButton,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import {
    People as PeopleIcon,
    SwapHoriz as TransferIcon,
    PlaylistAddCheck as ApprovalIcon,
    ArrowForward as ArrowIcon,
    TrendingUp as TrendIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { staffService } from '@/app/lib/api/staff.service';
import { transfersService } from '@/app/lib/api/transfers.service';
import { useAuthStore } from '@/app/lib/store/auth-store';

interface StatCardProps {
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
}

const StatCard = ({ title, value, subtext, icon, color, loading }: StatCardProps) => {
    const theme = useTheme();
    return (
        <Card sx={{
            height: '100%',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            '&:hover': {
                boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
                transform: 'translateY(-4px)',
                transition: 'all 0.3s ease-in-out',
            }
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
                    {loading ? '...' : value}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" fontWeight={600} gutterBottom>
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
                    {subtext}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default function HRDashboard() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalStaff: 0,
        pendingApprovals: 0,
        myRequests: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const [staff, pending, myRequests] = await Promise.all([
                    staffService.getAllStaff(user?.tenantId || undefined),
                    transfersService.getPendingRequests(),
                    transfersService.getMyRequests(),
                ]);

                setStats({
                    totalStaff: staff.length,
                    pendingApprovals: pending.length,
                    myRequests: myRequests.length,
                });
            } catch (error) {
                console.error('Failed to fetch HR stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const quickActions = [
        { title: 'Add New Staff', icon: <AddIcon />, path: '/hr/staff', color: theme.palette.primary.main },
        { title: 'Create Transfer', icon: <TransferIcon />, path: '/hr/transfers', color: theme.palette.secondary.main },
        { title: 'View Approvals', icon: <ApprovalIcon />, path: '/hr/approvals', color: theme.palette.success.main },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 } }}>
            {/* Header */}
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1, mb: 1 }}>
                    Human Resources
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Overview of personnel management, transfers, and approval workflows.
                </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Total Active Staff"
                        value={stats.totalStaff}
                        subtext="All personnel in current institution"
                        icon={<PeopleIcon />}
                        color={theme.palette.primary.main}
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="Pending Approvals"
                        value={stats.pendingApprovals}
                        subtext="Awaiting your verification"
                        icon={<ApprovalIcon />}
                        color={theme.palette.warning.main}
                        loading={loading}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard
                        title="My Transfer Requests"
                        value={stats.myRequests}
                        subtext="In progress or completed"
                        icon={<TransferIcon />}
                        color={theme.palette.secondary.main}
                        loading={loading}
                    />
                </Grid>
            </Grid>

            {/* Quick Actions & Recent Activity */}
            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        Quick Actions
                    </Typography>
                    <Stack spacing={2}>
                        {quickActions.map((action, index) => (
                            <Button
                                key={index}
                                component={Link}
                                href={action.path}
                                fullWidth
                                variant="outlined"
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    justifyContent: 'space-between',
                                    border: `1px solid ${alpha(action.color, 0.2)}`,
                                    bgcolor: alpha(action.color, 0.02),
                                    '&:hover': {
                                        bgcolor: alpha(action.color, 0.05),
                                        border: `1px solid ${action.color}`,
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        p: 1,
                                        borderRadius: 2,
                                        bgcolor: alpha(action.color, 0.1),
                                        color: action.color,
                                        display: 'flex'
                                    }}>
                                        {action.icon}
                                    </Box>
                                    <Typography fontWeight={700} color="text.primary">
                                        {action.title}
                                    </Typography>
                                </Box>
                                <ArrowIcon sx={{ opacity: 0.5 }} />
                            </Button>
                        ))}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Card sx={{ borderRadius: 4, height: '100%', border: `1px solid ${theme.palette.divider}` }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                                HR Compliance
                            </Typography>
                            <Stack spacing={3}>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>Staff Profiles Complete</Typography>
                                        <Typography variant="body2" color="primary" fontWeight={700}>92%</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={92} sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>Transfer Turnaround</Typography>
                                        <Typography variant="body2" color="secondary" fontWeight={700}>4.2 Days</Typography>
                                    </Box>
                                    <LinearProgress variant="determinate" value={75} color="secondary" sx={{ height: 8, borderRadius: 4 }} />
                                </Box>
                                <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: `1px dashed ${alpha(theme.palette.info.main, 0.3)}` }}>
                                    <Typography variant="caption" color="info.main" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                                        TIP
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Multi-stage approvals are processed faster when comments are provided.
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
