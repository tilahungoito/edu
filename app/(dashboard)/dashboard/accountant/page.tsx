'use client';

import React from 'react';
import { Box, Typography, Grid2 as Grid, Button } from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Payment as PaymentIcon,
    AccountBalance as BankIcon,
    PieChart as PieIcon
} from '@mui/icons-material';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import { useAuthStore } from '@/app/lib/store';
import { KPIData } from '@/app/lib/types';

export default function AccountantDashboard() {
    const { user } = useAuthStore();
    const kpis: KPIData[] = [
        {
            label: 'Total Revenue',
            value: 2450800,
            icon: 'AccountBalance',
            trend: 'up',
            change: 15400
        },
        {
            label: 'Pending Payments',
            value: 124500,
            icon: 'Receipt',
            trend: 'down',
            change: -2100
        },
        {
            label: 'Collected Today',
            value: 8500,
            icon: 'Payments',
            trend: 'up',
            change: 1200
        },
        {
            label: 'Budget Utilization',
            value: '72.4%',
            icon: 'TrendingUp',
            trend: 'stable'
        }
    ];

    const revenueData = [
        { name: 'Sep', revenue: 180000, target: 200000 },
        { name: 'Oct', revenue: 210000, target: 200000 },
        { name: 'Nov', revenue: 195000, target: 200000 },
        { name: 'Dec', revenue: 240000, target: 220000 },
        { name: 'Jan', revenue: 220000, target: 220000 },
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                    Finance Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Financial management for {user?.tenantName || 'Institution'}. Account: {user?.firstName}
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={kpis} columns={4} />
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <AnalyticsChart
                        title="Revenue vs Target"
                        subtitle="Monthly financial performance"
                        data={revenueData}
                        type="bar"
                        dataKeys={['revenue', 'target']}
                        height={350}
                    />
                </Grid>
                <Grid size={{ xs: 12, lg: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Financial Actions</Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            startIcon={<PaymentIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Record New Payment
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<ReceiptIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Process Invoices
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<BankIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Reconcile Accounts
                        </Button>
                        <Button
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<PieIcon />}
                            sx={{ py: 1.5 }}
                        >
                            Financial Reports
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
