'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    LinearProgress,
    useTheme,
    alpha,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { KPIGrid, AnalyticsChart } from '@/app/components/analytics';
import type { KPIData } from '@/app/lib/types';

// Mock budget data
const mockAllocations = [
    {
        id: 'budget-001',
        allocatedToName: 'Mekelle Zone',
        category: 'salaries',
        allocatedAmount: 45000000,
        spentAmount: 38500000,
        remainingAmount: 6500000,
        fiscalYear: 2024,
        status: 'active',
    },
    {
        id: 'budget-002',
        allocatedToName: 'Adigrat Zone',
        category: 'operations',
        allocatedAmount: 12000000,
        spentAmount: 9200000,
        remainingAmount: 2800000,
        fiscalYear: 2024,
        status: 'active',
    },
    {
        id: 'budget-003',
        allocatedToName: 'Axum Zone',
        category: 'infrastructure',
        allocatedAmount: 25000000,
        spentAmount: 18000000,
        remainingAmount: 7000000,
        fiscalYear: 2024,
        status: 'active',
    },
    {
        id: 'budget-004',
        allocatedToName: 'Shire Zone',
        category: 'supplies',
        allocatedAmount: 8000000,
        spentAmount: 7200000,
        remainingAmount: 800000,
        fiscalYear: 2024,
        status: 'active',
    },
];

const budgetKPIs: KPIData[] = [
    { label: 'Total Budget', value: 250000000, trend: 'up', changePercent: 12, icon: 'Budget' },
    { label: 'Allocated', value: 220000000, trend: 'stable', icon: 'People' },
    { label: 'Spent', value: 165000000, trend: 'up', changePercent: 8, icon: 'Badge' },
    { label: 'Remaining', value: 55000000, trend: 'down', changePercent: -15, icon: 'Inventory' },
];

const budgetByCategory = [
    { name: 'Salaries', value: 125000000 },
    { name: 'Operations', value: 45000000 },
    { name: 'Infrastructure', value: 50000000 },
    { name: 'Supplies', value: 20000000 },
    { name: 'Training', value: 10000000 },
];

const budgetColumns: GridColDef[] = [
    { field: 'allocatedToName', headerName: 'Allocated To', flex: 1, minWidth: 150 },
    {
        field: 'category',
        headerName: 'Category',
        width: 130,
        renderCell: (params) => {
            const categoryColors: Record<string, 'primary' | 'secondary' | 'warning' | 'success' | 'error'> = {
                salaries: 'primary',
                operations: 'secondary',
                infrastructure: 'warning',
                supplies: 'success',
                training: 'error',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={categoryColors[params.value as string] || 'default'}
                    variant="outlined"
                />
            );
        }
    },
    {
        field: 'allocatedAmount',
        headerName: 'Allocated',
        width: 140,
        type: 'number',
        valueFormatter: (value) => (value != null ? `${(value as number / 1000000).toFixed(1)}M ETB` : ''),
    },
    {
        field: 'spentAmount',
        headerName: 'Spent',
        width: 130,
        type: 'number',
        valueFormatter: (value) => (value != null ? `${(value as number / 1000000).toFixed(1)}M ETB` : ''),
    },
    {
        field: 'remainingAmount',
        headerName: 'Remaining',
        width: 130,
        type: 'number',
        valueFormatter: (value) => (value != null ? `${(value as number / 1000000).toFixed(1)}M ETB` : ''),
    },
    {
        field: 'utilization',
        headerName: 'Utilization',
        width: 150,
        valueGetter: (value, row) => {
            const percent = (row.spentAmount / row.allocatedAmount) * 100;
            return percent;
        },
        renderCell: (params) => {
            const percent = params.value as number;
            return (
                <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(percent, 100)}
                        sx={{
                            flex: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: alpha(percent > 90 ? '#f44336' : '#4caf50', 0.2),
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: percent > 90 ? '#f44336' : '#4caf50',
                            }
                        }}
                    />
                    <Typography variant="caption" fontWeight={600}>
                        {percent.toFixed(0)}%
                    </Typography>
                </Box>
            );
        }
    },
    { field: 'fiscalYear', headerName: 'Year', width: 80 },
    { field: 'status', headerName: 'Status', width: 100 },
];

export default function BudgetPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [yearFilter, setYearFilter] = useState<number>(2024);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const filteredAllocations = mockAllocations.filter(a => a.fiscalYear === yearFilter);

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Budget Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage budget allocations and track expenditure
                </Typography>
            </Box>

            {/* KPIs */}
            <Box sx={{ mb: 4 }}>
                <KPIGrid kpis={budgetKPIs} loading={loading} columns={4} />
            </Box>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6} {...{ item: true, xs: 12, md: 6 } as any}>
                    <AnalyticsChart
                        title="Budget by Category"
                        subtitle="Distribution of allocated budget"
                        data={budgetByCategory}
                        type="pie"
                        loading={loading}
                        height={300}
                    />
                </Grid>
                <Grid item xs={12} md={6} {...{ item: true, xs: 12, md: 6 } as any}>
                    <AnalyticsChart
                        title="Budget Utilization by Zone"
                        subtitle="Spending vs allocation"
                        data={[
                            { name: 'Mekelle', allocated: 45, spent: 38.5 },
                            { name: 'Adigrat', allocated: 12, spent: 9.2 },
                            { name: 'Axum', allocated: 25, spent: 18 },
                            { name: 'Shire', allocated: 8, spent: 7.2 },
                        ]}
                        type="bar"
                        dataKeys={['allocated', 'spent']}
                        loading={loading}
                        height={300}
                    />
                </Grid>
            </Grid>

            {/* Allocations Table */}
            <DataTable
                title="Budget Allocations"
                subtitle={`${filteredAllocations.length} allocations for FY ${yearFilter}`}
                columns={budgetColumns}
                rows={filteredAllocations}
                loading={loading}
                module="budget"
                onAdd={() => console.log('Add allocation')}
                onEdit={(allocation) => console.log('Edit allocation', allocation)}
                onView={(allocation) => console.log('View allocation', allocation)}
                statusField="status"
                statusColors={{
                    active: 'success',
                    closed: 'default',
                }}
                toolbarActions={
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Fiscal Year</InputLabel>
                        <Select
                            value={yearFilter}
                            label="Fiscal Year"
                            onChange={(e) => setYearFilter(e.target.value as number)}
                        >
                            <MenuItem value={2024}>2024</MenuItem>
                            <MenuItem value={2023}>2023</MenuItem>
                            <MenuItem value={2022}>2022</MenuItem>
                        </Select>
                    </FormControl>
                }
            />
        </Box>
    );
}
