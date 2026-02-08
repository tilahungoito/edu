'use client';

import React from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import { Security as SecurityIcon, Edit as EditIcon } from '@mui/icons-material';

const roles = [
    { name: 'Bureau Admin', type: 'Regional', users: 5, status: 'System' },
    { name: 'Zone Admin', type: 'Zone', users: 45, status: 'System' },
    { name: 'Woreda Admin', type: 'Woreda', users: 340, status: 'System' },
    { name: 'Kebele Admin', type: 'Kebele', users: 1500, status: 'System' },
    { name: 'School Admin', type: 'School', users: 1200, status: 'System' },
];

export default function RolesPermissionsPage() {
    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Roles & Permissions
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage user roles and define access control policies
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<SecurityIcon />} sx={{ borderRadius: 2 }}>
                    New Role
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Role Name</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Tenant Level</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Active Users</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.name}>
                                <TableCell sx={{ fontWeight: 500 }}>{role.name}</TableCell>
                                <TableCell>{role.type}</TableCell>
                                <TableCell>{role.users}</TableCell>
                                <TableCell><Chip label={role.status} size="small" variant="outlined" /></TableCell>
                                <TableCell align="right">
                                    <Button size="small" startIcon={<EditIcon />}>Permissions</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}
