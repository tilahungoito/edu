'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TextField,
    Button,
    Chip,
    IconButton,
    Collapse,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Grid,
    Card,
    CardContent,
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import { auditService } from '@/app/lib/api/audit.service';
import type { AuditLog, AuditLogFilter } from '@/app/lib/types/entities';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Filter state
    const [filters, setFilters] = useState<AuditLogFilter>({
        limit: 25,
        offset: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('');
    const [entityFilter, setEntityFilter] = useState<string>('');

    // Load audit logs
    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await auditService.getAll({
                ...filters,
                limit: rowsPerPage,
                offset: page * rowsPerPage,
            });
            setLogs(result.logs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, [page, rowsPerPage, filters]);

    const handlePageChange = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleApplyFilters = () => {
        setFilters({
            ...filters,
            action: actionFilter || undefined,
            entity: entityFilter || undefined,
        });
        setPage(0);
    };

    const handleClearFilters = () => {
        setActionFilter('');
        setEntityFilter('');
        setSearchTerm('');
        setFilters({ limit: rowsPerPage, offset: 0 });
        setPage(0);
    };

    const handleExportCSV = async () => {
        try {
            await auditService.exportToCSV(filters);
        } catch (err) {
            setError('Failed to export CSV');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    // Filtered logs based on search term
    const filteredLogs = logs.filter(log => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            log.action.toLowerCase().includes(term) ||
            log.entity.toLowerCase().includes(term) ||
            log.user?.username.toLowerCase().includes(term) ||
            log.user?.email.toLowerCase().includes(term) ||
            (log.entityId && log.entityId.toLowerCase().includes(term))
        );
    });

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Audit Logs
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Monitor all system activities and track user actions
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={loadLogs} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        Filters
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                    >
                        Export CSV
                    </Button>
                </Box>
            </Box>

            {/* Search Bar */}
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        placeholder="Search by action, entity, user, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                    />
                </CardContent>
            </Card>

            {/* Advanced Filters */}
            <Collapse in={showFilters}>
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Action Type</InputLabel>
                                    <Select
                                        value={actionFilter}
                                        label="Action Type"
                                        onChange={(e) => setActionFilter(e.target.value)}
                                    >
                                        <MenuItem value="">All Actions</MenuItem>
                                        <MenuItem value="CREATE">Create</MenuItem>
                                        <MenuItem value="UPDATE">Update</MenuItem>
                                        <MenuItem value="DELETE">Delete</MenuItem>
                                        <MenuItem value="LOGIN">Login</MenuItem>
                                        <MenuItem value="LOGOUT">Logout</MenuItem>
                                        <MenuItem value="EXPORT">Export</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Entity Type</InputLabel>
                                    <Select
                                        value={entityFilter}
                                        label="Entity Type"
                                        onChange={(e) => setEntityFilter(e.target.value)}
                                    >
                                        <MenuItem value="">All Entities</MenuItem>
                                        <MenuItem value="User">User</MenuItem>
                                        <MenuItem value="School">School</MenuItem>
                                        <MenuItem value="Zone">Zone</MenuItem>
                                        <MenuItem value="Woreda">Woreda</MenuItem>
                                        <MenuItem value="Student">Student</MenuItem>
                                        <MenuItem value="Staff">Staff</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button variant="contained" onClick={handleApplyFilters} fullWidth>
                                    Apply
                                </Button>
                                <Button variant="outlined" onClick={handleClearFilters} fullWidth>
                                    Clear
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Collapse>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                            <TableCell width={50}></TableCell>
                            <TableCell><strong>Timestamp</strong></TableCell>
                            <TableCell><strong>User</strong></TableCell>
                            <TableCell><strong>Action</strong></TableCell>
                            <TableCell><strong>Entity</strong></TableCell>
                            <TableCell><strong>Entity ID</strong></TableCell>
                            <TableCell><strong>IP Address</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">
                                        No audit logs found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => (
                                <React.Fragment key={log.id}>
                                    <TableRow hover>
                                        <TableCell>
                                            <IconButton size="small" onClick={() => toggleExpand(log.id)}>
                                                {expandedRow === log.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(log.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {log.user?.username || 'System'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.user?.email || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.action}
                                                size="small"
                                                color={
                                                    log.action.includes('DELETE') ? 'error' :
                                                        log.action.includes('CREATE') ? 'success' :
                                                            log.action.includes('UPDATE') ? 'warning' :
                                                                'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{log.entity}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {log.entityId || 'N/A'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{log.ip || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={7} sx={{ py: 0, borderBottom: expandedRow === log.id ? 1 : 0 }}>
                                            <Collapse in={expandedRow === log.id} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                                                    <Typography variant="subtitle2" gutterBottom>
                                                        <strong>Details</strong>
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                                        <strong>User Agent:</strong> {log.userAgent || 'N/A'}
                                                    </Typography>
                                                    {log.payload && (
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="body2" gutterBottom>
                                                                <strong>Payload:</strong>
                                                            </Typography>
                                                            <Paper variant="outlined" sx={{ p: 1, backgroundColor: 'white' }}>
                                                                <pre style={{ margin: 0, fontSize: '0.75rem', overflow: 'auto' }}>
                                                                    {JSON.stringify(log.payload, null, 2)}
                                                                </pre>
                                                            </Paper>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={logs.length}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                />
            </TableContainer>
        </Box>
    );
}
