'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Stepper,
    Step,
    StepLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    alpha,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    SwapHoriz as TransferIcon,
} from '@mui/icons-material';
import { DataTable } from '@/app/components/tables';
import { PermissionGate } from '@/app/lib/core';

// Mock transfer data
const mockTransfers = [
    {
        id: 'transfer-001',
        staffName: 'Kidist Gebremichael',
        employeeId: 'EMP-2020-001',
        fromSchoolName: 'Ayder Primary School',
        toSchoolName: 'Hawelti Primary School',
        transferType: 'permanent',
        reason: 'Closer to residence',
        currentStatus: 'pending_woreda',
        requestedAt: new Date('2024-01-10'),
    },
    {
        id: 'transfer-002',
        staffName: 'Almaz Tesfaye',
        employeeId: 'EMP-2015-003',
        fromSchoolName: 'Ayder Secondary School',
        toSchoolName: 'Mekelle Preparatory School',
        transferType: 'promotion',
        reason: 'Department head position',
        currentStatus: 'approved',
        requestedAt: new Date('2024-01-05'),
    },
    {
        id: 'transfer-003',
        staffName: 'Bereket Hailu',
        employeeId: 'EMP-2018-005',
        fromSchoolName: 'Ganta Afeshum Primary School',
        toSchoolName: 'Adigrat Secondary School',
        transferType: 'temporary',
        reason: 'Teacher shortage coverage',
        currentStatus: 'pending_zone',
        requestedAt: new Date('2024-01-15'),
    },
];

const transferColumns: GridColDef[] = [
    { field: 'staffName', headerName: 'Staff Name', flex: 1, minWidth: 180 },
    { field: 'employeeId', headerName: 'Employee ID', width: 130 },
    { field: 'fromSchoolName', headerName: 'From School', width: 180 },
    { field: 'toSchoolName', headerName: 'To School', width: 180 },
    {
        field: 'transferType',
        headerName: 'Type',
        width: 120,
        renderCell: (params) => {
            const typeColors: Record<string, 'primary' | 'secondary' | 'warning' | 'error'> = {
                permanent: 'primary',
                temporary: 'secondary',
                promotion: 'success' as 'primary',
                disciplinary: 'error',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={typeColors[params.value as string] || 'default'}
                    variant="outlined"
                />
            );
        }
    },
    {
        field: 'currentStatus',
        headerName: 'Status',
        width: 150,
        renderCell: (params) => {
            const statusLabels: Record<string, string> = {
                draft: 'Draft',
                pending_school: 'Pending School',
                pending_woreda: 'Pending Woreda',
                pending_zone: 'Pending Zone',
                pending_bureau: 'Pending Bureau',
                approved: 'Approved',
                rejected: 'Rejected',
            };
            const statusColors: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
                draft: 'default',
                pending_school: 'warning',
                pending_woreda: 'warning',
                pending_zone: 'warning',
                pending_bureau: 'warning',
                approved: 'success',
                rejected: 'error',
            };
            return (
                <Chip
                    label={statusLabels[params.value as string] || params.value}
                    size="small"
                    color={statusColors[params.value as string] || 'default'}
                />
            );
        }
    },
    {
        field: 'requestedAt',
        headerName: 'Requested',
        width: 120,
        valueFormatter: ({ value }) => value ? new Date(value).toLocaleDateString() : '-',
    },
];

const approvalSteps = ['School', 'Woreda', 'Zone', 'Bureau'];

export default function TransfersPage() {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const getActiveStep = (status: string) => {
        const stepMap: Record<string, number> = {
            draft: -1,
            pending_school: 0,
            pending_woreda: 1,
            pending_zone: 2,
            pending_bureau: 3,
            approved: 4,
            rejected: -1,
        };
        return stepMap[status] ?? 0;
    };

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Transfer Requests
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage staff transfer requests and approvals
                </Typography>
            </Box>

            {/* Approval Workflow Visual */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Transfer Approval Workflow
                    </Typography>
                    <Stepper alternativeLabel sx={{ py: 2 }}>
                        {approvalSteps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label} Approval</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <DataTable
                title="Transfer Requests"
                subtitle={`${mockTransfers.length} requests`}
                columns={transferColumns}
                rows={mockTransfers}
                loading={loading}
                module="hr"
                onAdd={() => setOpenDialog(true)}
                onView={(transfer) => console.log('View transfer', transfer)}
                onEdit={(transfer) => console.log('Edit transfer', transfer)}
            />

            {/* New Transfer Dialog */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TransferIcon />
                        <Typography variant="h6">New Transfer Request</Typography>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Staff Member</InputLabel>
                            <Select label="Staff Member">
                                <MenuItem value="staff-001">Kidist Gebremichael (EMP-2020-001)</MenuItem>
                                <MenuItem value="staff-002">Yohannes Berhe (EMP-2018-002)</MenuItem>
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                            <FormControl fullWidth>
                                <InputLabel>From School</InputLabel>
                                <Select label="From School">
                                    <MenuItem value="school-001">Ayder Primary School</MenuItem>
                                    <MenuItem value="school-002">Ayder Secondary School</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>To School</InputLabel>
                                <Select label="To School">
                                    <MenuItem value="school-003">Hawelti Primary School</MenuItem>
                                    <MenuItem value="school-004">Mekelle Preparatory School</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                            <FormControl fullWidth>
                                <InputLabel>Transfer Type</InputLabel>
                                <Select label="Transfer Type">
                                    <MenuItem value="permanent">Permanent</MenuItem>
                                    <MenuItem value="temporary">Temporary</MenuItem>
                                    <MenuItem value="promotion">Promotion</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Effective Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            label="Reason for Transfer"
                            multiline
                            rows={3}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button variant="contained" startIcon={<AddIcon />}>
                        Submit Request
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
