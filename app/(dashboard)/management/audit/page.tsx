'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { DataTable } from '@/app/components/tables';
import { auditService, AuditLog } from '@/app/lib/api/audit.service';
import { useRealTime } from '@/app/lib/hooks/useRealTime';

export default function AuditLogsPage() {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await auditService.getAll();
            setLogs(data.logs);
            setTotal(data.total);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useRealTime('AUDIT_CREATED', () => {
        fetchData();
    });

    const columns: GridColDef<AuditLog>[] = [
        {
            field: 'createdAt',
            headerName: 'Timestamp',
            width: 180,
            valueFormatter: (value) => value ? new Date(value as string).toLocaleString() : '-'
        },
        {
            field: 'action',
            headerName: 'Action',
            width: 120,
            renderCell: (params) => {
                const colors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
                    CREATE: 'success',
                    UPDATE: 'info',
                    DELETE: 'warning',
                    LOGIN: 'primary' as any,
                };
                return <Chip label={params.value} size="small" color={colors[params.value] || 'default'} />;
            }
        },
        { field: 'entity', headerName: 'Entity', width: 130 },
        {
            field: 'user',
            headerName: 'User',
            flex: 1,
            valueGetter: (value, row) => row.user?.username || row.userId || 'System'
        },
        { field: 'ip', headerName: 'IP Address', width: 130 },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Details',
            width: 80,
            getActions: (params) => [
                <Tooltip title="View Details" key="view">
                    <IconButton onClick={() => console.log('Audit Details', params.row)}>
                        <ViewIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            ]
        }
    ];

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    System Audit Logs
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Track all administrative actions and system events
                </Typography>
            </Box>

            <DataTable
                title="Audit Logs"
                subtitle="Recent system activity"
                columns={columns}
                rows={logs}
                loading={loading}
                module="management"
            />
        </Box>
    );
}
