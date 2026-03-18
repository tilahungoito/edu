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
    Tabs,
    Tab,
    IconButton,
    Menu,
    Divider,
    Autocomplete,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    SwapHoriz as TransferIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    MoreVert as MoreIcon,
    CloudUpload as CloudUploadIcon,
    AttachFile as AttachFileIcon,
    History as HistoryIcon,
} from '@mui/icons-material';
import { DataTable } from '@/app/components/tables';
import { PermissionGate } from '@/app/lib/core';
import { transfersService, CreateTransferRequestDto } from '@/app/lib/api/transfers.service';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { HRTransfer, TransferStatus } from '@/app/lib/types/entities';
import { toast } from 'react-hot-toast';

// Columns defined below
const transferColumns: GridColDef<HRTransfer>[] = [
    {
        field: 'staffName',
        headerName: 'Staff Member',
        flex: 1.2,
        minWidth: 160,
        valueGetter: (_, row) => {
            const r = (row as any).requester;
            return r ? `${r.firstName} ${r.lastName}` : '-';
        }
    },
    {
        field: 'toSchoolName',
        headerName: 'Target Institution',
        width: 160,
        valueGetter: (_, row) => {
            return (row as any).targetInstitution?.name || '-';
        }
    },
    {
        field: 'type',
        headerName: 'Type',
        width: 100,
        renderCell: (params) => {
            const typeColors: Record<string, 'primary' | 'secondary' | 'warning' | 'error'> = {
                permanent: 'primary',
                temporary: 'secondary',
                promotion: 'success' as any,
                disciplinary: 'error',
            };
            return (
                <Chip
                    label={params.value?.charAt(0).toUpperCase() + params.value?.slice(1)}
                    size="small"
                    color={typeColors[params.value as string] || 'default'}
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                />
            );
        }
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 140,
        renderCell: (params) => {
            const statusLabels: Record<string, string> = {
                DRAFT: 'Draft',
                PENDING_SCHOOL: 'Pending School',
                PENDING_WOREDA: 'Pending Woreda',
                PENDING_ZONE: 'Pending Zone',
                PENDING_BUREAU: 'Pending Bureau',
                PENDING_TARGET_SCHOOL: 'Pending Target',
                APPROVED: 'Approved',
                REJECTED: 'Rejected',
                CANCELLED: 'Cancelled',
            };
            const statusColors: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error'> = {
                DRAFT: 'default',
                PENDING_SCHOOL: 'warning',
                PENDING_WOREDA: 'warning',
                PENDING_ZONE: 'warning',
                PENDING_BUREAU: 'warning',
                PENDING_TARGET_SCHOOL: 'info' as any,
                APPROVED: 'success',
                REJECTED: 'error',
                CANCELLED: 'error',
            };
            return (
                <Chip
                    label={statusLabels[params.value as string] || params.value}
                    size="small"
                    color={statusColors[params.value as string] || 'default'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                />
            );
        }
    },
    {
        field: 'requestedAt',
        headerName: 'Requested',
        width: 110,
        valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : '-',
    },
    {
        field: 'attachments',
        headerName: 'Docs',
        width: 70,
        renderCell: (params) => {
            const count = (params.value as string[])?.length || 0;
            if (count === 0) return '-';
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachFileIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">{count}</Typography>
                </Box>
            );
        }
    },
];

const approvalSteps = ['Source School', 'Woreda', 'Zone', 'Bureau'];
const studentApprovalSteps = ['Source School', 'Target School'];

function getActiveStep(status: TransferStatus, isStudent: boolean = false) {
    if (isStudent) {
        const stepMap: Partial<Record<TransferStatus, number>> = {
            PENDING_SCHOOL: 0,
            PENDING_TARGET_SCHOOL: 1,
            APPROVED: 2,
        };
        return stepMap[status] ?? -1;
    }
    const stepMap: Partial<Record<TransferStatus, number>> = {
        DRAFT: -1,
        PENDING_SCHOOL: 0,
        PENDING_WOREDA: 1,
        PENDING_ZONE: 2,
        PENDING_BUREAU: 3,
        PENDING_TARGET_SCHOOL: -1, // Should not happen in staff flow
        APPROVED: 4,
        REJECTED: -1,
        CANCELLED: -1,
    };
    return stepMap[status] ?? -1;
}

// Logic to determine if a user can approve at current status
function canApproveAtStatus(userTenantType: string, userScopeId: string, request: HRTransfer) {
    const status = request.status;
    if (userTenantType === 'school') {
        if (status === 'PENDING_SCHOOL' && userScopeId === (request as any).requester?.scopeId) return true;
        if (status === 'PENDING_TARGET_SCHOOL' && userScopeId === (request as any).targetInstitutionId) return true;
    }
    if (userTenantType === 'woreda' && status === 'PENDING_WOREDA') return true;
    if (userTenantType === 'zone' && status === 'PENDING_ZONE') return true;
    if (userTenantType === 'bureau' && status === 'PENDING_BUREAU') return true;
    return false;
}

// Map level to next status
function getNextStatus(request: HRTransfer): TransferStatus {
    const isStudent = (request as any).requester?.role?.name === 'STUDENT';
    const status = request.status;

    if (isStudent) {
        if (status === 'PENDING_SCHOOL') return 'PENDING_TARGET_SCHOOL';
        return 'APPROVED';
    }

    const nextMap: Partial<Record<TransferStatus, TransferStatus>> = {
        PENDING_SCHOOL: 'PENDING_WOREDA',
        PENDING_WOREDA: 'PENDING_ZONE',
        PENDING_ZONE: 'PENDING_BUREAU',
        PENDING_BUREAU: 'APPROVED',
    };
    return nextMap[status] || 'APPROVED';
}

export default function TransfersPage() {
    const theme = useTheme();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [requests, setRequests] = useState<HRTransfer[]>([]);
    const [pendingRequests, setPendingRequests] = useState<HRTransfer[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [schools, setSchools] = useState<Institution[]>([]);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const canApprove = ['bureau', 'zone', 'woreda', 'school'].includes(user?.tenantType || '') &&
        (user?.roles.some(r => ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN'].includes(r.name)) || false);

    // Form state
    const [formData, setFormData] = useState<CreateTransferRequestDto>({
        targetInstitutionId: '',
        type: 'permanent',
        reason: '',
        effectiveDate: '',
        attachments: [],
    });

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch my requests (always)
            try {
                const myData = await transfersService.getMyRequests();
                setRequests(myData);
            } catch (e) {
                console.error('Failed to fetch my transfers:', e);
            }

            // Fetch pending requests if applicable
            if (canApprove) {
                try {
                    const pendingData = await transfersService.getPendingRequests();
                    setPendingRequests(pendingData);
                } catch (e) {
                    console.warn('User cannot fetch pending requests (ignoring):', e);
                }
            }

            // Fetch institutions for selection
            try {
                const [institutions, historyData] = await Promise.all([
                    institutionsService.getAll({ all: true }),
                    transfersService.getHistory()
                ]);
                setSchools(institutions);
                setHistory(historyData);
            } catch (e) {
                console.error('Failed to fetch institutions/history:', e);
            }

        } catch (error) {
            console.error('Global transfer fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleApprove = async (request: HRTransfer) => {
        try {
            const nextStatus = getNextStatus(request);
            await transfersService.updateStatus(request.id, {
                status: nextStatus,
                comment: 'Approved through dashboard'
            });
            toast.success(`Request approved and moved to ${nextStatus}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve request');
        }
    };

    const handleReject = async (request: HRTransfer) => {
        try {
            await transfersService.updateStatus(request.id, {
                status: 'REJECTED',
                comment: 'Rejected through dashboard'
            });
            toast.error('Request rejected');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject request');
        }
    };

    const handleCancel = async (request: HRTransfer) => {
        if (!window.confirm('Are you sure you want to cancel this request?')) return;
        try {
            await transfersService.cancelRequest(request.id);
            toast.success('Request cancelled');
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to cancel request');
        }
    };

    const handleBulkAction = async (action: 'approve' | 'reject') => {
        if (selectedIds.length === 0) return;
        
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED'; // Simple bulk logic for now
        const confirmMsg = `Are you sure you want to ${action} ${selectedIds.length} requests?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            setLoading(true);
            const result = await transfersService.bulkUpdateStatus({
                requestIds: selectedIds,
                status: status as any,
                comment: `Bulk ${action} via dashboard`
            });
            
            toast.success(`Bulk ${action} complete: ${result.success} succeeded, ${result.failed} failed.`);
            setSelectedIds([]);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || `Failed to perform bulk ${action}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.targetInstitutionId || !formData.reason) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            console.log('[Transfers] Submitting request with data:', formData);
            await transfersService.createRequest(formData);
            console.log('[Transfers] Request created successfully');

            toast.success('Transfer request submitted successfully');
            setOpenDialog(false);
            setFormData({
                targetInstitutionId: '',
                type: 'permanent',
                reason: '',
                effectiveDate: '',
                attachments: [],
            });

            // Refresh counts/list
            await fetchData();
        } catch (error: any) {
            console.error('[Transfers] Submission error:', error);
            const message = error.response?.data?.message || error.message || 'Failed to submit request';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const columnsWithApprovals: GridColDef<HRTransfer>[] = [
        ...transferColumns,
        {
            field: 'approvalActions',
            headerName: 'Approvals',
            width: 150,
            sortable: false,
            renderCell: (params) => {
                const request = params.row as HRTransfer;
                if (!canApproveAtStatus(user?.tenantType || '', user?.tenantId || '', request)) return null;

                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(request)}
                            title="Approve"
                        >
                            <ApproveIcon />
                        </IconButton>
                        <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(request)}
                            title="Reject"
                        >
                            <RejectIcon />
                        </IconButton>
                    </Box>
                );
            }
        },
        {
            field: 'cancelAction',
            headerName: 'Actions',
            width: 100,
            sortable: false,
            renderCell: (params) => {
                const request = params.row as HRTransfer;
                const isOwner = (request as any).requesterId === user?.id;
                const canCancel = isOwner && ['PENDING_SCHOOL', 'PENDING_WOREDA', 'PENDING_ZONE', 'PENDING_BUREAU'].includes(request.status);

                if (!canCancel) return null;

                return (
                    <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancel(request)}
                        title="Cancel Request"
                    >
                        <RejectIcon />
                    </IconButton>
                );
            }
        }
    ];

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            {/* Header section */}
            <Box sx={{
                mb: 5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 2
            }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <TransferIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Staff Transfers
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage and track personnel transfer requests across institutions
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {selectedIds.length > 0 && canApprove && (
                        <>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<RejectIcon />}
                                onClick={() => handleBulkAction('reject')}
                                sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, height: 48 }}
                            >
                                Reject ({selectedIds.length})
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleBulkAction('approve')}
                                sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, height: 48 }}
                            >
                                Approve ({selectedIds.length})
                            </Button>
                        </>
                    )}
                    {activeTab === 0 && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, height: 48 }}
                        >
                            New Transfer Request
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Approval Workflow Visual */}
            <Card sx={{ mb: 4, borderRadius: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Transfer Approval Workflow
                        </Typography>
                        {selectedRequestId && (
                            <Button size="small" onClick={() => setSelectedRequestId(null)}>
                                Reset View
                            </Button>
                        )}
                    </Box>
                    <Stepper
                        alternativeLabel
                        activeStep={(() => {
                            const target = selectedRequestId
                                ? [...requests, ...pendingRequests].find(r => r.id === selectedRequestId)
                                : requests[0] || pendingRequests[0];
                            const isStudent = target ? (target as any)?.requester?.role?.name === 'STUDENT' : user?.roles?.some(r => r.name === 'STUDENT');
                            return target ? getActiveStep(target.status, isStudent) : -1;
                        })()}
                        sx={{ py: 2 }}
                    >
                        {(() => {
                            const target = selectedRequestId
                                ? [...requests, ...pendingRequests].find(r => r.id === selectedRequestId)
                                : requests[0] || pendingRequests[0];
                            const isStudent = target ? (target as any)?.requester?.role?.name === 'STUDENT' : user?.roles?.some(r => r.name === 'STUDENT');
                            const steps = isStudent ? studentApprovalSteps : approvalSteps;
                            return steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label} Approval</StepLabel>
                                </Step>
                            ));
                        })()}
                    </Stepper>
                    {selectedRequestId && (
                        <Typography variant="caption" color="primary" sx={{ display: 'block', textAlign: 'center', mt: 1, fontWeight: 600 }}>
                            Viewing progress for: {(() => {
                                const target = [...requests, ...pendingRequests].find(r => r.id === selectedRequestId);
                                const requester = (target as any)?.requester;
                                return requester ? `${requester.firstName} ${requester.lastName}` : 'Selected Request';
                            })()}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                    <Tab label="My Requests" />
                    {canApprove && <Tab label="Pending Approvals" />}
                    <Tab label="Recent History" />
                </Tabs>
            </Box>

            {activeTab === 0 ? (
                <DataTable
                    title="My Requests"
                    subtitle={`${requests.length} requests submitted by you. Click a row to see progress.`}
                    columns={columnsWithApprovals}
                    rows={requests}
                    loading={loading}
                    module="hr"
                    onView={(row) => setSelectedRequestId(row.id)}
                />
            ) : activeTab === 1 && canApprove ? (
                <DataTable
                    title="Pending Approvals"
                    subtitle={`${pendingRequests.length} requests awaiting your decision. Select multiple for bulk actions.`}
                    columns={columnsWithApprovals}
                    rows={pendingRequests}
                    loading={loading}
                    module="hr"
                    onView={(row) => setSelectedRequestId(row.id)}
                    checkboxSelection
                    onSelectionChange={(ids) => setSelectedIds(ids as string[])}
                />
            ) : (
                <DataTable
                    title="Transfer History"
                    subtitle={`${history.length} completed transfers logged in the system`}
                    columns={[
                        {
                            field: 'user',
                            headerName: 'Personnel',
                            flex: 1.2,
                            valueGetter: (_, row) => row.user ? `${row.user.firstName} ${row.user.lastName}` : '-'
                        },
                        {
                            field: 'fromScopeId',
                            headerName: 'From',
                            flex: 1,
                            valueGetter: (value) => schools.find(s => s.id === value)?.name || value || '-'
                        },
                        {
                            field: 'toScopeId',
                            headerName: 'To',
                            flex: 1,
                            valueGetter: (value) => schools.find(s => s.id === value)?.name || value || '-'
                        },
                        {
                            field: 'reason',
                            headerName: 'Justification',
                            flex: 1.5,
                        },
                        {
                            field: 'createdAt',
                            headerName: 'Executed Date',
                            width: 130,
                            valueFormatter: (value) => value ? new Date(value as string).toLocaleDateString() : '-'
                        },
                        {
                            field: 'snapshot',
                            headerName: 'Snapshot',
                            width: 100,
                            renderCell: (params) => (
                                <IconButton size="small" color="primary" onClick={() => toast.success('Viewing Academic Record Snapshot...')}>
                                    <HistoryIcon fontSize="small" />
                                </IconButton>
                            )
                        }
                    ]}
                    rows={history}
                    loading={loading}
                    module="hr"
                />
            )}

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
                        <Autocomplete
                            id="target-institution-autocomplete"
                            options={schools}
                            getOptionLabel={(option) => option.name}
                            isOptionEqualToValue={(option, value) => option.id === value?.id}
                            renderOption={(props, option) => {
                                const { key, ...optionProps } = props as any;
                                return (
                                    <li key={option.id} {...optionProps}>
                                        {option.name}
                                    </li>
                                );
                            }}
                            value={schools.find(s => s.id === formData.targetInstitutionId) || null}
                            onChange={(_, newValue) => {
                                setFormData({ ...formData, targetInstitutionId: newValue?.id || '' });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Target Institution"
                                    required
                                    placeholder="Search for school..."
                                />
                            )}
                            fullWidth
                            noOptionsText="No institutions found"
                        />
                        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                            <FormControl fullWidth>
                                <InputLabel id="transfer-type-label">Transfer Type</InputLabel>
                                <Select
                                    labelId="transfer-type-label"
                                    id="transfer-type-select"
                                    label="Transfer Type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as string })}
                                >
                                    <MenuItem value="permanent">Permanent</MenuItem>
                                    <MenuItem value="temporary">Temporary</MenuItem>
                                    <MenuItem value="promotion">Promotion</MenuItem>
                                    <MenuItem value="disciplinary">Disciplinary</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Requested Effective Date"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={formData.effectiveDate}
                                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            required
                            label="Reason for Transfer"
                            multiline
                            rows={3}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />

                        {/* File Attachments (Simplified) */}
                        <Box sx={{
                            p: 2,
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            textAlign: 'center'
                        }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{ mb: 1 }}
                            >
                                Upload Supporting Documents
                                <input
                                    type="file"
                                    hidden
                                    multiple
                                    onChange={(e) => {
                                        // Mock upload: just store the filenames for now
                                        const files = Array.from(e.target.files || []);
                                        const fileNames = files.map(f => f.name);
                                        setFormData(prev => ({ 
                                            ...prev, 
                                            attachments: [...(prev.attachments || []), ...fileNames] 
                                        }));
                                        toast.success(`${files.length} files attached.`);
                                    }}
                                />
                            </Button>
                            <Typography variant="caption" display="block" color="text.secondary">
                                (Max 5MB per file: PDF, JPG, PNG)
                            </Typography>
                            {formData.attachments && formData.attachments.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {formData.attachments.map((name, idx) => (
                                        <Chip 
                                            key={idx} 
                                            label={name} 
                                            size="small" 
                                            onDelete={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    attachments: prev.attachments?.filter((_, i) => i !== idx)
                                                }));
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
