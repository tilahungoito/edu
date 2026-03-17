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
    Chip,
    IconButton,
    InputAdornment
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { Search, FilterList, Visibility, CheckCircle as ApproveIcon, Cancel as RejectIcon, Close } from '@mui/icons-material';
import { helpRequestsService } from '@/app/lib/api/help-requests.service';
import { HelpRequest, HelpRequestStatus } from '@/app/lib/types/entities';
import { toast } from 'react-hot-toast';

export default function HelpRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<HelpRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
    const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        search: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await helpRequestsService.getAll();
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch help requests:', error);
            toast.error('Failed to load help requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenAction = (request: HelpRequest, type: 'APPROVED' | 'REJECTED') => {
        setSelectedRequest(request);
        setActionType(type);
        setComment('');
    };

    const handleConfirmAction = async () => {
        if (!selectedRequest || !actionType) return;

        try {
            setSubmitting(true);
            await helpRequestsService.updateStatus(selectedRequest.id, {
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
            'PENDING': 'Pending',
            'IN_PROGRESS': 'In Progress',
            'RESOLVED': 'Resolved',
            'CLOSED': 'Closed'
        };
        return labels[status] || status;
    };

    const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        if (status === 'RESOLVED' || status === 'CLOSED') return 'success';
        if (status === 'IN_PROGRESS') return 'info';
        return 'warning';
    };

    const filteredRequests = requests.filter(request => {
        const matchesSearch = request.subject.toLowerCase().includes(filters.search.toLowerCase()) ||
            request.description.toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = !filters.status || request.status === filters.status;
        return matchesSearch && matchesStatus;
    });

    const columns: GridColDef<HelpRequest>[] = [
        {
            field: 'subject',
            headerName: 'Subject',
            flex: 1.5,
            minWidth: 200,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600} sx={{ color: 'text.primary' }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'requesterName',
            headerName: 'Requester',
            width: 180,
            valueGetter: (_, row) => {
                const r = (row as any).requester;
                return r ? `${r.firstName} ${r.lastName}` : '-';
            }
        },
        {
            field: 'priority',
            headerName: 'Priority',
            width: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    color={params.value === 'High' ? 'error' : params.value === 'Medium' ? 'warning' : 'info'}
                    variant="outlined"
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
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
            field: 'actions',
            headerName: 'Actions',
            width: 200,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setSelectedRequest(params.row)}
                        title="View Details"
                    >
                        <Visibility />
                    </IconButton>
                    {params.row.status === 'PENDING' && (
                        <>
                            <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleOpenAction(params.row, 'APPROVED')}
                                title="Process"
                            >
                                <ApproveIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenAction(params.row, 'REJECTED')}
                                title="Reject"
                            >
                                <RejectIcon />
                            </IconButton>
                        </>
                    )}
                </Stack>
            ),
        },
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5 }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                    Help Requests
                </Typography>
                <Typography variant="body1" color="text.secondary" fontWeight={500}>
                    Review and manage support tickets from staff members
                </Typography>
            </Box>

            <DataTable
                rows={filteredRequests}
                columns={columns}
                loading={loading}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-main': {
                        borderRadius: 2,
                        border: 'none',
                        boxShadow: 0,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme => theme.palette.grey[50],
                        fontWeight: 700,
                        borderBottom: '2px solid',
                        borderColor: theme => theme.palette.divider,
                    },
                    '& .MuiDataGrid-row': {
                        borderBottom: '1px solid',
                        borderColor: theme => theme.palette.divider,
                        '&:hover': {
                            backgroundColor: theme => theme.palette.action.hover,
                        },
                    },
                    '& .MuiDataGrid-cell': {
                        border: 'none',
                        py: 1.5,
                    },
                    '& .MuiDataGrid-footerContainer': {
                        borderTop: 'none',
                        backgroundColor: theme => theme.palette.background.paper,
                    },
                }}
            />

            {/* View/Action Dialog */}
            <Dialog open={!!selectedRequest} onClose={() => !submitting && setSelectedRequest(null)} fullWidth maxWidth="sm">
                <DialogTitle>
                    {actionType ? (actionType === 'APPROVED' ? 'Process Request' : 'Reject Request') : 'Request Details'}
                    <IconButton
                        aria-label="close"
                        onClick={() => !submitting && setSelectedRequest(null)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {selectedRequest && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
                            <Typography variant="body1" fontWeight={500} gutterBottom>{selectedRequest.subject}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Description</Typography>
                            <Typography variant="body2" sx={{ backgroundColor: 'action.hover', p: 1.5, borderRadius: 1 }}>
                                {selectedRequest.description}
                            </Typography>

                            {actionType && (
                                <TextField
                                    fullWidth
                                    label="Admin Comments (Optional)"
                                    multiline
                                    rows={3}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    sx={{ mt: 3 }}
                                />
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setSelectedRequest(null)} disabled={submitting}>
                        {actionType ? 'Cancel' : 'Close'}
                    </Button>
                    {actionType && (
                        <Button
                            variant="contained"
                            color={actionType === 'APPROVED' ? 'success' : 'error'}
                            onClick={handleConfirmAction}
                            disabled={submitting}
                        >
                            {submitting ? 'Processing...' : `Confirm ${actionType === 'APPROVED' ? 'Process' : 'Rejection'}`}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
