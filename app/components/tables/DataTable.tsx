'use client';

import React, { useState } from 'react';
import {
    Box,
    Card,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Chip,
    TextField,
    InputAdornment,
    Divider,
    useTheme,
    alpha,
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRowSelectionModel,
    GridToolbarContainer,
    GridToolbarColumnsButton,
    GridToolbarFilterButton,
    GridToolbarDensitySelector,
    GridToolbarExport,
    GridRenderCellParams,
} from '@mui/x-data-grid';
import {
    Search as SearchIcon,
    Add as AddIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    ToggleOn as ActivateIcon,
    ToggleOff as DeactivateIcon,
} from '@mui/icons-material';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DetailsModal } from '../common/DetailsModal';
import { useAuthStore } from '@/app/lib/store';
import { PermissionGate } from '@/app/lib/core';
import type { ModuleType, ResourceType, Role } from '@/app/lib/types';

interface DataTableProps<T extends { id: string }> {
    title: string;
    subtitle?: string;
    columns: GridColDef[];
    rows: T[];
    loading?: boolean;

    // Permissions
    module: ModuleType;
    resourceType?: ResourceType;
    allowedRoles?: string[] | any[];

    // CRUD Actions
    onAdd?: () => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    onToggleStatus?: (row: T) => void;
    onRefresh?: () => void;

    // Toolbar options
    showSearch?: boolean;
    showExport?: boolean;
    showColumnsButton?: boolean;
    showFilterButton?: boolean;
    showDensitySelector?: boolean;

    // Selection
    checkboxSelection?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;

    // Custom toolbar content
    toolbarActions?: React.ReactNode;

    // Status column configuration
    statusField?: string;
    statusColors?: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'>;

    // Custom row actions in the menu
    renderRowActions?: (row: T, handleClose: () => void) => React.ReactNode;
}

// Custom toolbar component
function CustomToolbar({
    searchValue,
    onSearchChange,
    onRefresh,
    showSearch,
    showExport,
    showColumnsButton,
    showFilterButton,
    showDensitySelector,
    toolbarActions,
}: {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onRefresh?: () => void;
    showSearch?: boolean;
    showExport?: boolean;
    showColumnsButton?: boolean;
    showFilterButton?: boolean;
    showDensitySelector?: boolean;
    toolbarActions?: React.ReactNode;
}) {
    const theme = useTheme();

    return (
        <GridToolbarContainer
            sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                height: 'auto',
                minHeight: 56
            }}
        >

            {/* Right Section - Actions */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    flexGrow: 1
                }}
            >
                {/* Search */}
                {showSearch && (
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }
                        }}
                        sx={{
                            width: { xs: '100%', md: 220 },
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            },
                        }}
                    />
                )}

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                {/* MUI X Toolbar Controls */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {showColumnsButton && <GridToolbarColumnsButton />}
                    {showFilterButton && <GridToolbarFilterButton />}
                    {showDensitySelector && <GridToolbarDensitySelector />}
                    {showExport && <GridToolbarExport />}
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                {/* Custom Actions */}
                {toolbarActions}

                {/* Refresh */}
                <IconButton size="small" onClick={onRefresh}>
                    <RefreshIcon />
                </IconButton>
            </Box>
        </GridToolbarContainer>
    );
}

interface TableHeaderProps {
    title: string;
    subtitle?: string;
    onAdd?: () => void;
    module: ModuleType;
    resourceType?: ResourceType;
    allowedRoles?: string[] | any[];
}

function TableHeader({
    title,
    subtitle,
    onAdd,
    module,
    resourceType,
    allowedRoles,
}: TableHeaderProps) {
    const theme = useTheme();
    return (
        <Box sx={{
            p: { xs: 2, sm: 3 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2
        }}>
            <Box>
                <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body1" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {onAdd && (
                <PermissionGate
                    permission={{ module, action: 'create', resourceType }}
                    allowedRoles={allowedRoles}
                >
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                        sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 700,
                            px: 3,
                            py: 1,
                            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.24)}`,
                            '&:hover': {
                                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.32)}`,
                            }
                        }}
                    >
                        Add New
                    </Button>
                </PermissionGate>
            )}
        </Box>
    );
}

export function DataTable<T extends { id: string }>({
    title,
    subtitle,
    columns,
    rows,
    loading = false,
    module,
    onAdd,
    onEdit,
    onDelete,
    onView,
    onToggleStatus,
    onRefresh,
    renderRowActions,
    showSearch = true,
    showExport = true,
    showColumnsButton = true,
    showFilterButton = true,
    showDensitySelector = true,
    checkboxSelection = false,
    onSelectionChange,
    toolbarActions,
    statusField,
    statusColors = {},
    resourceType,
    allowedRoles,
}: DataTableProps<T>) {
    const theme = useTheme();
    const [searchValue, setSearchValue] = useState('');
    const [rowSelection, setRowSelection] = useState<GridRowSelectionModel>([]);
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10,
        page: 0,
    });

    // Modal states
    const [confirmation, setConfirmation] = useState<{
        open: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        confirmColor: 'error' | 'warning' | 'primary' | 'success';
        action: 'delete' | 'toggleStatus' | null;
        row: T | null;
    }>({
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        confirmColor: 'primary',
        action: null,
        row: null,
    });

    const [detailsModal, setDetailsModal] = useState<{ open: boolean; row: T | null }>({
        open: false,
        row: null,
    });

    const handleRowSelectionChange = (model: GridRowSelectionModel) => {
        setRowSelection(model);
        if (onSelectionChange) {
            onSelectionChange(model.map(id => String(id)));
        }
    };
    const [actionMenuAnchor, setActionMenuAnchor] = useState<{
        element: HTMLElement;
        row: T;
    } | null>(null);

    // Filter rows by search value
    const filteredRows = rows.filter((row) => {
        if (!searchValue) return true;
        const searchLower = searchValue.toLowerCase();
        return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchLower)
        );
    });

    // Handle action menu
    const handleActionClick = (event: React.MouseEvent<HTMLElement>, row: T) => {
        setActionMenuAnchor({ element: event.currentTarget, row });
    };

    const handleActionClose = () => {
        setActionMenuAnchor(null);
    };

    const handleConfirm = () => {
        if (!confirmation.row || !confirmation.action) return;

        if (confirmation.action === 'delete' && onDelete) {
            onDelete(confirmation.row);
        } else if (confirmation.action === 'toggleStatus' && onToggleStatus) {
            onToggleStatus(confirmation.row);
        }

        setConfirmation(prev => ({ ...prev, open: false, row: null, action: null }));
    };

    // Add actions column if actions are provided
    const columnsWithActions: GridColDef[] = [
        ...columns.map((col) => {
            // Handle status field with chips
            if (col.field === statusField) {
                return {
                    ...col,
                    renderCell: (params: GridRenderCellParams) => {
                        const status = params.value;
                        const color = status ? statusColors[status as string] : 'default';
                        return (
                            <Chip
                                label={status ? (typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : (status ? 'Active' : 'Inactive')) : '-'}
                                size="small"
                                color={(color as any) || (status === true ? 'success' : status === false ? 'error' : 'default')}
                                variant="soft"
                                sx={{ fontWeight: 700, borderRadius: '6px' }}
                            />
                        );
                    },
                };
            }
            return col;
        }),
        ...(onView || onEdit || onDelete || onToggleStatus
            ? [
                {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 80,
                    sortable: false,
                    filterable: false,
                    align: 'right',
                    renderCell: (params: GridRenderCellParams) => (
                        <IconButton
                            size="small"
                            onClick={(e) => handleActionClick(e, params.row as T)}
                        >
                            <MoreIcon />
                        </IconButton>
                    ),
                } as GridColDef,
            ]
            : []),
    ];

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                overflow: 'hidden',
            }}
        >
            <TableHeader
                title={title}
                subtitle={subtitle}
                onAdd={onAdd}
                module={module}
                resourceType={resourceType}
                allowedRoles={allowedRoles}
            />
            <DataGrid
                rows={filteredRows || []}
                columns={columnsWithActions}
                loading={loading}
                checkboxSelection={checkboxSelection}
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                rowSelectionModel={rowSelection}
                onRowSelectionModelChange={handleRowSelectionChange}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                    },
                }}
                slots={{
                    toolbar: CustomToolbar as any,
                }}
                slotProps={{
                    toolbar: {
                        searchValue,
                        onSearchChange: setSearchValue,
                        onRefresh,
                        showSearch,
                        showExport,
                        showColumnsButton,
                        showFilterButton,
                        showDensitySelector,
                        toolbarActions,
                    } as any,
                }}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                        py: 2,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        borderBottom: `2.5px solid ${alpha(theme.palette.divider, 0.8)}`,
                        fontWeight: 800,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 700,
                        color: theme.palette.text.secondary,
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    },
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    },
                    '& .MuiDataGrid-footerContainer': {
                        borderTop: `1px solid ${theme.palette.divider}`,
                    },
                    minHeight: 400,
                }}
                autoHeight
            />

            {/* Actions Menu */}
            <Menu
                anchorEl={actionMenuAnchor?.element}
                open={Boolean(actionMenuAnchor)}
                onClose={handleActionClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: { 
                        borderRadius: 3, 
                        minWidth: 180,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        mt: 1,
                        p: 0.5
                    },
                }}
            >
                {onView && (
                    <MenuItem
                        sx={{ borderRadius: 1.5, py: 1 }}
                        onClick={() => {
                            setDetailsModal({ open: true, row: actionMenuAnchor!.row });
                            handleActionClose();
                        }}
                    >
                        <ViewIcon fontSize="small" sx={{ mr: 1.5, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight={600}>View Details</Typography>
                    </MenuItem>
                )}
                {onEdit && (
                    <PermissionGate permission={{ module, action: 'edit' }}>
                        <MenuItem
                            sx={{ borderRadius: 1.5, py: 1 }}
                            onClick={() => {
                                onEdit(actionMenuAnchor!.row);
                                handleActionClose();
                            }}
                        >
                            <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'info.main' }} />
                            <Typography variant="body2" fontWeight={600}>Edit Record</Typography>
                        </MenuItem>
                    </PermissionGate>
                )}
                
                {onToggleStatus && actionMenuAnchor && (
                    <PermissionGate permission={{ module, action: 'edit' }}>
                        <MenuItem
                            sx={{ borderRadius: 1.5, py: 1 }}
                            onClick={() => {
                                const row = actionMenuAnchor.row;
                                const isActive = (row as any).isActive || (row as any).user?.isActive;
                                setConfirmation({
                                    open: true,
                                    title: isActive ? 'Deactivate Account' : 'Activate Account',
                                    message: `Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this record? This will ${isActive ? 'restrict' : 'restore'} their access.`,
                                    confirmLabel: isActive ? 'Deactivate' : 'Activate',
                                    confirmColor: isActive ? 'warning' : 'success',
                                    action: 'toggleStatus',
                                    row: row,
                                });
                                handleActionClose();
                            }}
                        >
                            {(actionMenuAnchor.row as any).isActive || (actionMenuAnchor.row as any).user?.isActive ? (
                                <DeactivateIcon fontSize="small" sx={{ mr: 1.5, color: 'warning.main' }} />
                            ) : (
                                <ActivateIcon fontSize="small" sx={{ mr: 1.5, color: 'success.main' }} />
                            )}
                            <Typography variant="body2" fontWeight={600}>
                                {(actionMenuAnchor.row as any).isActive || (actionMenuAnchor.row as any).user?.isActive ? 'Deactivate' : 'Activate'}
                            </Typography>
                        </MenuItem>
                    </PermissionGate>
                )}

                {(onView || onEdit || onToggleStatus) && onDelete && <Divider sx={{ my: 0.5 }} />}

                {onDelete && (
                    <PermissionGate permission={{ module, action: 'delete' }}>
                        <MenuItem
                            sx={{ borderRadius: 1.5, py: 1, color: 'error.main' }}
                            onClick={() => {
                                setConfirmation({
                                    open: true,
                                    title: `Delete ${title?.slice(0, -1) || 'Item'}`,
                                    message: `Are you sure you want to delete this ${title?.toLowerCase().slice(0, -1) || 'item'}? This action cannot be undone.`,
                                    confirmLabel: 'Delete',
                                    confirmColor: 'error',
                                    action: 'delete',
                                    row: actionMenuAnchor!.row,
                                });
                                handleActionClose();
                            }}
                        >
                            <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} />
                            <Typography variant="body2" fontWeight={600}>Delete Permanent</Typography>
                        </MenuItem>
                    </PermissionGate>
                )}
                {renderRowActions && actionMenuAnchor && renderRowActions(actionMenuAnchor.row, handleActionClose)}
            </Menu>

            {/* Universal Confirmation Dialog */}
            <ConfirmDialog
                open={confirmation.open}
                title={confirmation.title}
                message={confirmation.message}
                confirmLabel={confirmation.confirmLabel}
                confirmColor={confirmation.confirmColor}
                onConfirm={handleConfirm}
                onClose={() => setConfirmation(prev => ({ ...prev, open: false, row: null, action: null }))}
            />

            {detailsModal.row && (
                <DetailsModal
                    open={detailsModal.open}
                    title={`${title.slice(0, -1)} Details`}
                    data={detailsModal.row}
                    onClose={() => setDetailsModal({ open: false, row: null })}
                />
            )}
        </Card>
    );
}

export default DataTable;

