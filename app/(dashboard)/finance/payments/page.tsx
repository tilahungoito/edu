'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid2 as Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    IconButton,
    useTheme,
    alpha,
    LinearProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Payments as PaymentsIcon,
    ReceiptLong as TransactionIcon,
    TrendingUp as RevenueIcon,
    PendingActions as PendingIcon,
    AccountBalance as BalanceIcon,
    FileDownload as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { GridColDef } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import { DataTable } from '@/app/components/tables/DataTable';
import { PaymentDialog } from '@/app/components/management/PaymentDialog';
import paymentsService, { Payment } from '@/app/lib/api/payments.service';
import { useAuthStore } from '@/app/lib/store';

// Stat Card Component
const StatCard = ({ title, value, icon, color, subtitle }: any) => {
    const theme = useTheme();
    return (
        <Card sx={{
            height: '100%',
            borderRadius: 4,
            boxShadow: `0 8px 24px ${alpha(color, 0.1)}`,
            border: `1px solid ${alpha(color, 0.1)}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(color, 0.1),
                        color: color,
                        display: 'flex'
                    }}>
                        {icon}
                    </Box>
                </Box>
                <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                    {subtitle}
                </Typography>
            </CardContent>
            {/* Decorative element */}
            <Box sx={{
                position: 'absolute', right: -20, bottom: -20,
                width: 100, height: 100, borderRadius: '50%',
                bgcolor: alpha(color, 0.05)
            }} />
        </Card>
    );
};

export default function PaymentsPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Queries
    const { data: payments, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
        queryKey: ['payments', user?.tenantId],
        queryFn: () => user?.tenantId ? paymentsService.getInstitutionPayments(user.tenantId) : Promise.resolve([]),
        enabled: !!user?.tenantId,
    });

    const { data: report, isLoading: loadingReport } = useQuery({
        queryKey: ['financial-report', user?.tenantId],
        queryFn: () => user?.tenantId ? paymentsService.getFinancialReport(user.tenantId) : Promise.resolve(null),
        enabled: !!user?.tenantId,
    });

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 150,
            valueGetter: (params, row) => dayjs(row.createdAt).format('MMM DD, YYYY'),
        },
        {
            field: 'student',
            headerName: 'Student',
            flex: 1,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, fontSize: '0.875rem', fontWeight: 700 }}>
                        {params.row.studentId.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="body2" fontWeight={700}>Student ID: {params.row.studentId.substring(0, 8)}</Typography>
                        <Typography variant="caption" color="text.secondary">Ref: {params.row.reference}</Typography>
                    </Box>
                </Box>
            )
        },
        {
            field: 'amount',
            headerName: 'Amount',
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={800} color="primary">
                    {params.value.toLocaleString()} {params.row.currency}
                </Typography>
            )
        },
        {
            field: 'paymentMethod',
            headerName: 'Method',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value.replace('_', ' ')}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value || 'COMPLETED'}
                    size="small"
                    color={params.value === 'PENDING' ? 'warning' : 'success'}
                    variant="soft"
                    sx={{ fontWeight: 800, borderRadius: '6px' }}
                />
            )
        },
    ], [theme]);

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <PaymentsIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Payments & Finance
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive overview of institution revenue, student payments, and financial status.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="soft"
                        startIcon={<DownloadIcon />}
                        sx={{ borderRadius: 2.5, fontWeight: 700 }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setIsDialogOpen(true)}
                        sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                    >
                        Record Payment
                    </Button>
                </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Total Revenue"
                        value={`${report?.totalRevenue?.toLocaleString() || '0'} ETB`}
                        icon={<RevenueIcon />}
                        color={theme.palette.success.main}
                        subtitle="Total processed payments"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Pending"
                        value={`${report?.pendingAmount?.toLocaleString() || '0'} ETB`}
                        icon={<PendingIcon />}
                        color={theme.palette.warning.main}
                        subtitle="Payments awaiting verification"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Transactions"
                        value={report?.paymentCount || '0'}
                        icon={<TransactionIcon />}
                        color={theme.palette.primary.main}
                        subtitle="Total number of records"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        title="Net Balance"
                        value={`${((report?.totalRevenue || 0) * 0.98).toLocaleString()} ETB`}
                        icon={<BalanceIcon />}
                        color={theme.palette.secondary.main}
                        subtitle="Est. after commissions/fees"
                    />
                </Grid>
            </Grid>

            {/* Main Content */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <DataTable
                        title="Recent Transactions"
                        subtitle="History of all student payments and bank transfers"
                        columns={columns}
                        rows={payments || []}
                        loading={loadingPayments}
                        onAdd={() => setIsDialogOpen(true)}
                        onRefresh={refetchPayments}
                        module="payments"
                        showSearch={true}
                    />
                </Grid>
            </Grid>

            <PaymentDialog
                open={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                    refetchPayments();
                    // Also refetch report
                }}
            />
        </Box>
    );
}
