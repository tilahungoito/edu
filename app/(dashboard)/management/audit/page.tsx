'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    IconButton,
    Pagination,
    CircularProgress,
    alpha,
    useTheme,
    Tooltip,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterListIcon,
    History as HistoryIcon,
    Person as PersonIcon,
    GetApp as GetAppIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { auditService } from '@/app/lib/api/audit.service';

export default function AuditLogsPage() {
    const theme = useTheme();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const limit = 10;

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { logs } = await auditService.getAll({ 
                limit, 
                offset: (page - 1) * limit,
                action: searchTerm || undefined 
            });
            setLogs(logs);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [page, searchTerm]);

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'success';
        if (action.includes('UPDATE')) return 'info';
        if (action.includes('DELETE')) return 'error';
        if (action.includes('LOGIN')) return 'primary';
        return 'default';
    };

    const handleExport = () => {
        auditService.exportToCSV();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary">
                        System Audit Logs
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Monitor administrative actions and data mutations
                    </Typography>
                </Box>
                <IconButton onClick={handleExport} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                    <GetAppIcon />
                </IconButton>
            </Box>

            <Card sx={{ borderRadius: '24px', mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            placeholder="Filter by action (e.g. CREATE, UPDATE)..."
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: '12px' }
                            }}
                        />
                        <IconButton sx={{ bgcolor: alpha(theme.palette.divider, 0.05), borderRadius: '12px' }}>
                            <FilterListIcon />
                        </IconButton>
                    </Box>
                </CardContent>
            </Card>

            <TableContainer component={Paper} sx={{ borderRadius: '24px', boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Entity</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Entity ID</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <CircularProgress size={40} />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                    <Typography color="text.secondary">No audit logs found matching your criteria.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} hover>
                                    <TableCell sx={{ py: 2.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                                                {log.user?.username?.charAt(0) || <PersonIcon sx={{ fontSize: 16 }} />}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700}>{log.user?.username || 'System'}</Typography>
                                                <Typography variant="caption" color="text.secondary">{log.user?.email || 'N/A'}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={log.action} 
                                            size="small" 
                                            color={getActionColor(log.action) as any}
                                            variant="outlined" 
                                            sx={{ fontWeight: 700, borderRadius: '6px' }} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>{log.entity}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                            {log.entityId ? `${log.entityId.substring(0, 8)}...` : 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={JSON.stringify(log.payload, null, 2)} arrow>
                                            <IconButton size="small"><InfoIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination 
                    count={10} // Hardcoded for now, ideal if total is returned
                    page={page} 
                    onChange={(e, p) => setPage(p)} 
                    color="primary" 
                    size="large"
                />
            </Box>
        </Box>
    );
}
