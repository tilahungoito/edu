'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Chip,
    Avatar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    useTheme,
    Button,
    Tabs,
    Tab
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables';
import { staffService } from '@/app/lib/api/staff.service';
import { usersService } from '@/app/lib/api/users.service';
import { useAuthStore } from '@/app/lib/store/auth-store';
import { UserDialog } from '@/app/components/management/UserDialog';

const staffColumns: GridColDef[] = [
    {
        field: 'username',
        headerName: 'Username',
        flex: 1,
        minWidth: 150,
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
        field: 'role',
        headerName: 'Role',
        width: 150,
        valueGetter: (value, row) => row.role?.name || '',
        renderCell: (params) => {
            // Simple mapping for role colors
            const role = params.value as string;
            let color: 'default' | 'primary' | 'secondary' | 'warning' | 'error' | 'success' = 'default';
            if (role.includes('ADMIN')) color = 'primary';
            if (role === 'INSTRUCTOR') color = 'success';
            if (role === 'STUDENT') color = 'secondary';

            return (
                <Chip
                    label={role.replace('_', ' ')}
                    size="small"
                    color={color}
                />
            );
        }
    },
    { field: 'scopeType', headerName: 'Scope', width: 100 },
    {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Active' : 'Inactive'}
                color={params.value ? 'success' : 'error'}
                size="small"
            />
        )
    },
];

export default function StaffPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [staff, setStaff] = useState<any[]>([]);
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStaff = async () => {
        setLoading(true);
        try {
            // Fetch all personnel in the current scope
            const data = await staffService.getAllStaff(user?.tenantId || undefined);
            setStaff(data);
        } catch (error) {
            console.error('Failed to fetch staff', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, [user]);

    const tabRoles = [null, 'INSTRUCTOR', 'INSTITUTION_ADMIN', 'REGISTRAR'];

    const filteredStaff = staff.filter(s => {
        const matchesTab = selectedTab === 0 || s.role?.name === tabRoles[selectedTab];
        const matchesSearch =
            s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: -1 }}>
                        Personnel Directory
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage roles, accounts, and institutional assignments for all staff members.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenUserDialog(true)}
                    sx={{ borderRadius: 2.5, px: 3, fontWeight: 700, height: 48 }}
                >
                    Add Personnel
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Tabs
                    value={selectedTab}
                    onChange={(_, v) => setSelectedTab(v)}
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 100 }
                    }}
                >
                    <Tab label="All Personnel" />
                    <Tab label="Instructors" />
                    <Tab label="Administrators" />
                    <Tab label="Registrars" />
                </Tabs>
            </Box>

            <DataTable
                title="Staff Registry"
                subtitle={`${filteredStaff.length} ${tabRoles[selectedTab]?.toLowerCase() || 'personnel'} matching your criteria`}
                columns={staffColumns}
                rows={filteredStaff}
                loading={loading}
                module="hr"
                onEdit={(row) => {
                    // We could implement edit dialog here if needed
                    console.log('Edit staff:', row);
                }}
                onDelete={async (staffMember) => {
                    if (window.confirm(`Are you sure you want to remove ${staffMember.username}?`)) {
                        try {
                            await usersService.remove(staffMember.id);
                            fetchStaff();
                        } catch (error) {
                            console.error('Failed to delete staff member', error);
                        }
                    }
                }}
                checkboxSelection
            />

            <UserDialog
                open={openUserDialog}
                onClose={() => setOpenUserDialog(false)}
                onSuccess={() => fetchStaff()}
            />
        </Box>
    );
}
