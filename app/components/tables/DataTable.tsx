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
} from '@mui/icons-material';
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
                justifyContent: 'flex-start',
                gap: 2,
            }}
        >

            {/* Right Section - Actions */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                }}
            >
                {/* Search */}
                {showSearch && (
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </InputAdornment>
                            ),
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
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
    onRefresh,
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
    const [rowSelection, setRowSelection] = useState<GridRowSelectionModel>({ type: 'include', ids: new Set() });
    const [paginationModel, setPaginationModel] = useState({
        pageSize: 10,
        page: 0,
    });

    const handleRowSelectionChange = (model: GridRowSelectionModel) => {
        setRowSelection(model);
        if (onSelectionChange) {
            onSelectionChange(Array.from(model.ids).map(id => String(id)));
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
                                label={status ? (typeof status === 'string' ? status.charAt(0).toUpperCase() + status.slice(1) : String(status)) : '-'}
                                size="small"
                                color={(color as any) || 'default'}
                                sx={{ fontWeight: 500 }}
                            />
                        );
                    },
                };
            }
            return col;
        }),
        ...(onView || onEdit || onDelete
            ? [
                {
                    field: 'actions',
                    headerName: 'Actions',
                    width: 100,
                    sortable: false,
                    filterable: false,
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
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
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
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        borderBottom: `2px solid ${theme.palette.divider}`,
                    },
                    '& .MuiDataGrid-row:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    },
                    '& .MuiDataGrid-footerContainer': {
                        borderTop: `1px solid ${theme.palette.divider}`,
                    },
                }}
                autoHeight
            />

            {/* Actions Menu */}
            <Menu
                anchorEl={actionMenuAnchor?.element}
                open={Boolean(actionMenuAnchor)}
                onClose={handleActionClose}
                PaperProps={{
                    sx: { borderRadius: 2, minWidth: 150 },
                }}
            >
                {onView && (
                    <MenuItem
                        onClick={() => {
                            onView(actionMenuAnchor!.row);
                            handleActionClose();
                        }}
                    >
                        <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                        View
                    </MenuItem>
                )}
                {onEdit && (
                    <PermissionGate permission={{ module, action: 'edit' }}>
                        <MenuItem
                            onClick={() => {
                                onEdit(actionMenuAnchor!.row);
                                handleActionClose();
                            }}
                        >
                            <EditIcon fontSize="small" sx={{ mr: 1 }} />
                            Edit
                        </MenuItem>
                    </PermissionGate>
                )}
                {onDelete && (
                    <PermissionGate permission={{ module, action: 'delete' }}>
                        <MenuItem
                            onClick={() => {
                                onDelete(actionMenuAnchor!.row);
                                handleActionClose();
                            }}
                            sx={{ color: 'error.main' }}
                        >
                            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                            Delete
                        </MenuItem>
                    </PermissionGate>
                )}
            </Menu>
        </Card>
    );
}


export default DataTable;
