'use client';

import React, { useState, useMemo } from 'react';
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
    Autocomplete,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import {
    Add as AddIcon,
    SwapHoriz as TransferIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    CloudUpload as CloudUploadIcon,
    AttachFile as AttachFileIcon,
    History as HistoryIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataTable } from '@/app/components/tables';
import { transfersService, CreateTransferRequestDto } from '@/app/lib/api/transfers.service';
import { institutionsService, Institution } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { HRTransfer, TransferStatus } from '@/app/lib/types/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { toast } from 'react-hot-toast';

// --- Constants & Helpers ---
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
        APPROVED: 4,
    };
    return stepMap[status] ?? -1;
}

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

// --- Main Component ---
export default function TransfersPage() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [formData, setFormData] = useState<CreateTransferRequestDto>({
        targetInstitutionId: '',
        type: 'permanent',
        reason: '',
        effectiveDate: '',
        attachments: [],
    });

    const isPrivileged = ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'INSTITUTION_ADMIN'].some(role => 
        user?.roles?.some(r => r.name === role)
    );

    // --- Queries ---
    const { data: myRequests = [], isLoading: isLoadingMy } = useQuery({
        queryKey: ['transfers', 'my', user?.id],
        queryFn: () => transfersService.getMyRequests(),
        enabled: !!user?.id,
    });

    const { data: pendingRequests = [], isLoading: isLoadingPending } = useQuery({
        queryKey: ['transfers', 'pending', user?.tenantId],
        queryFn: () => transfersService.getPendingRequests(),
        enabled: isPrivileged && !!user?.tenantId,
    });

    const { data: schools = [] } = useQuery({
        queryKey: ['institutions', 'all-minimal'],
        queryFn: () => institutionsService.getAll({ all: true }),
    });

    const { data: history = [], isLoading: isLoadingHistory } = useQuery({
        queryKey: ['transfers', 'history', user?.id],
        queryFn: () => transfersService.getHistory(),
    });

    // --- Real-time Sync ---
    useRealTime('transfer_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['transfers'] });
    });

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (data: CreateTransferRequestDto) => transfersService.createRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            toast.success('Transfer request submitted successfully');
            setOpenDialog(false);
        },
        onError: (error: any) => toast.error(error.message || 'Failed to submit request')
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: any }) => transfersService.updateStatus(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            toast.success('Status updated successfully');
        },
        onError: (error: any) => toast.error(error.message || 'Action failed')
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => transfersService.cancelRequest(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            toast.error('Request cancelled');
        }
    });

    const bulkMutation = useMutation({
        mutationFn: (payload: any) => transfersService.bulkUpdateStatus(payload),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['transfers'] });
            toast.success(`Bulk action complete: ${res.success} succeeded`);
            setSelectedIds([]);
        }
    });

    // --- Column Definitions ---
    const baseColumns: GridColDef<HRTransfer>[] = [
        {
            field: 'staffName',
            headerName: 'Staff Member',
            flex: 1.2,
            minWidth: 160,
            valueGetter: (_, row: any) => row.requester ? `${row.requester.firstName} ${row.requester.lastName}` : '-'
        },
        {
            field: 'targetInstitution',
            headerName: 'Target Institution',
            width: 160,
            valueGetter: (_, row: any) => row.targetInstitution?.name || '-'
        },
        {
            field: 'type',
            headerName: 'Type',
            width: 100,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                />
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 140,
            renderCell: (params) => (
                <Chip
                    label={params.value?.replace(/_/g, ' ')}
                    size="small"
                    color={params.value === 'APPROVED' ? 'success' : params.value === 'REJECTED' ? 'error' : 'warning'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                />
            )
        },
        {
            field: 'createdAt',
            headerName: 'Date',
            width: 110,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString() : '-'
        }
    ];

    const actionsColumn: GridColDef<HRTransfer> = {
        field: 'actions',
        headerName: 'Approvals',
        width: 120,
        sortable: false,
        renderCell: (params) => {
            const request = params.row;
            if (!canApproveAtStatus(user?.tenantType || '', user?.tenantId || '', request)) return null;
            return (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" color="success" onClick={() => statusMutation.mutate({ id: request.id, payload: { status: getNextStatus(request), comment: 'Approved via dashboard' } })}>
                        <ApproveIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => statusMutation.mutate({ id: request.id, payload: { status: 'REJECTED', comment: 'Rejected via dashboard' } })}>
                        <RejectIcon fontSize="small" />
                    </IconButton>
                </Box>
            );
        }
    };

    // --- Render ---
    const isLoading = isLoadingMy || isLoadingPending || isLoadingHistory;
    const selectedRecord = useMemo(() => 
        [...myRequests, ...pendingRequests].find(r => r.id === selectedRequestId), 
    [selectedRequestId, myRequests, pendingRequests]);

    return (
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TransferIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Staff Transfers
                        </Typography>
                        {isLoading && <CircularProgress size={20} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage personnel mobility across institutions and administrative levels.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {selectedIds.length > 0 && (
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => bulkMutation.mutate({ requestIds: selectedIds, status: 'APPROVED', comment: 'Bulk Approved' })}
                            sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                        >
                            Approve ({selectedIds.length})
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, height: 48 }}
                    >
                        New Request
                    </Button>
                </Box>
            </Box>

            {/* Progress Stepper */}
            <Card sx={{ mb: 4, borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 3 }}>
                        Workflow Progress: {selectedRecord ? (selectedRecord as any).requester?.firstName : 'Select a request'}
                    </Typography>
                    <Stepper 
                        alternativeLabel 
                        activeStep={selectedRecord ? getActiveStep(selectedRecord.status) : -1}
                        sx={{ '& .MuiStepLabel-label': { fontWeight: 600 } }}
                    >
                        {approvalSteps.map((label) => (
                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="My Requests" sx={{ fontWeight: 700 }} />
                {isPrivileged && <Tab label="Pending Approvals" sx={{ fontWeight: 700 }} />}
                <Tab label="Recent History" sx={{ fontWeight: 700 }} />
            </Tabs>

            {activeTab === 0 ? (
                <DataTable
                    title="My Transfer Requests"
                    rows={myRequests}
                    columns={baseColumns}
                    loading={isLoadingMy}
                    onView={(row) => setSelectedRequestId(row.id)}
                    module="hr"
                />
            ) : activeTab === 1 ? (
                <DataTable
                    title="Awaiting Approval"
                    rows={pendingRequests}
                    columns={[...baseColumns, actionsColumn]}
                    loading={isLoadingPending}
                    checkboxSelection
                    onSelectionChange={(ids) => setSelectedIds(ids as string[])}
                    onView={(row) => setSelectedRequestId(row.id)}
                    module="hr"
                />
            ) : (
                <DataTable
                    title="Archived Transfers"
                    rows={history}
                    columns={baseColumns}
                    loading={isLoadingHistory}
                    module="hr"
                />
            )}

            {/* Create Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                <DialogTitle sx={{ fontWeight: 800 }}>New Transfer Request</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Autocomplete
                            options={schools}
                            getOptionLabel={(o) => o.name}
                            onChange={(_, v) => setFormData({ ...formData, targetInstitutionId: v?.id || '' })}
                            renderInput={(params) => <TextField {...params} label="Target Institution" required />}
                        />
                        <TextField
                            select
                            label="Type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <MenuItem value="permanent">Permanent</MenuItem>
                            <MenuItem value="temporary">Temporary</MenuItem>
                        </TextField>
                        <TextField
                            label="Reason / Justification"
                            multiline
                            rows={4}
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        />
                        <Button 
                            variant="outlined" 
                            component="label" 
                            startIcon={<CloudUploadIcon />}
                            sx={{ py: 2, borderStyle: 'dashed' }}
                        >
                            Attach Supporting Documents
                            <input type="file" hidden multiple />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={() => createMutation.mutate(formData)}
                        disabled={!formData.targetInstitutionId || createMutation.isPending}
                        sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                    >
                        {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
