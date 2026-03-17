'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import { transfersService } from '@/app/lib/api/transfers.service';
import { HRTransfer, TransferStatus } from '@/app/lib/types/entities';
import { toast } from 'react-hot-toast';

export default function ApprovalsPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<HRTransfer[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<HRTransfer | null>(null);
    const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await transfersService.getPendingRequests();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch approvals:', error);
            toast.error('Failed to load pending approvals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAction = (request: HRTransfer, type: 'APPROVED' | 'REJECTED') => {
        setSelectedRequest(request);
        setActionType(type);
        setComment('');
    };

    const handleConfirmAction = async () => {
        if (!selectedRequest || !actionType) return;

        try {
            setSubmitting(true);
            await transfersService.updateStatus(selectedRequest.id, {
                status: actionType,
                adminComment: comment
            });
            toast.success(`Request ${actionType === 'APPROVED' ? 'processed' : 'rejected'} successfully`);
            setSelectedRequest(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    const formatStatus = (status: string) => {
        const labels: Record<string, string> = {
            'PENDING_SCHOOL': 'Awaiting School',
            'PENDING_WOREDA': 'Awaiting Woreda',
            'PENDING_ZONE': 'Awaiting Zone',
            'PENDING_BUREAU': 'Awaiting Bureau',
            'PENDING_TARGET_SCHOOL': 'Awaiting Target School',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected',
            'CANCELLED': 'Cancelled',
            'DRAFT': 'Draft'
        };
        return labels[status] || status.replace('PENDING_', 'Pending ');
    };

    const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        if (status === 'APPROVED') return 'success';
        if (status === 'REJECTED' || status === 'CANCELLED') return 'error';
        if (status?.startsWith('PENDING')) return 'warning';
        return 'default';
    };

    const columns: GridColDef<HRTransfer>[] = [
        {
            field: 'staffName',
            headerName: 'Staff Member',
            flex: 1.2,
            minWidth: 160,
            valueGetter: (_, row) => {
                const r = (row as any).requester;
                return r ? `${r.firstName} ${r.lastName}` : (row.staffName || '-');
            }
        },
        {
            field: 'targetInstitution',
            headerName: 'Target',
            width: 160,
            valueGetter: (_, row) => (row as any).targetInstitution?.name || (row as any).toSchoolName || '-',
        },
        {
            field: 'status',
            headerName: 'Stage',
            width: 170,
            renderCell: (params) => (
                <Chip
                    label={formatStatus(params.value)}
                    size="small"
                    color={getStatusColor(params.value)}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                />
            )
        },
        {
            field: 'createdAt',
            headerName: 'Submitted On',
            width: 130,
            valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : ''
        },
        {
            field: 'individual_actions',
            headerName: 'Actions',
            width: 250,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => handleOpenAction(params.row, 'APPROVED')}
                    >
                        Proceed
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleOpenAction(params.row, 'REJECTED')}
                    >
                        Reject
                    </Button>
                </Stack>
            ),
        },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                    Transfer Approvals
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Review and process pending personnel transfer requests
                </Typography>
            </Box>

            <DataTable
                title="Transfer Approval Requests"
                rows={requests}
                columns={columns}
                loading={loading}
                onView={() => { }}
                module="hr"
            />

            {/* Comment Dialog */}
            <Dialog open={!!selectedRequest} onClose={() => !submitting && setSelectedRequest(null)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {actionType === 'APPROVED' ? 'Process Transfer Request' : 'Reject Transfer Request'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Target: {(selectedRequest as any)?.targetInstitution?.name || (selectedRequest as any)?.toSchoolName || '-'}
                        </Typography>
                        <TextField
                            fullWidth
                            label="Comments/Remarks"
                            multiline
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            sx={{ mt: 2 }}
                            placeholder="Add any internal remarks or reason for decision..."
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setSelectedRequest(null)} disabled={submitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        color={actionType === 'APPROVED' ? 'success' : 'error'}
                        onClick={handleConfirmAction}
                        disabled={submitting}
                    >
                        {submitting ? 'Processing...' : (actionType === 'APPROVED' ? 'Confirm Proceed' : 'Confirm Rejection')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
