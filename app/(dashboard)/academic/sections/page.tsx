'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    alpha,
    useTheme,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Add as AddIcon,
    Groups as SectionIcon,
    PersonAdd as AssignIcon,
    School as EnrollIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { GridColDef } from '@mui/x-data-grid';
import { DataTable } from '@/app/components/tables/DataTable';
import { SectionDialog } from '@/app/components/management/SectionDialog';
import { AssignStudentsDialog } from '@/app/components/management/AssignStudentsDialog';
import { BulkEnrollmentDialog } from '@/app/components/management/BulkEnrollmentDialog';
import sectionsService, { Section } from '@/app/lib/api/sections.service';
import { useAuthStore } from '@/app/lib/store';

export default function SectionsPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    // State for Dialogs
    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    const institutionId = user?.tenantId;

    const { data: sections, isLoading, refetch } = useQuery({
        queryKey: ['sections', institutionId],
        queryFn: () => sectionsService.getAll(institutionId as string),
        enabled: !!institutionId,
    });

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'name',
            headerName: 'Section Name',
            flex: 1,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        display: 'flex'
                    }}>
                        <SectionIcon fontSize="small" />
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'studentCount',
            headerName: 'Students',
            width: 150,
            valueGetter: (params, row) => row._count?.students || 0,
            renderCell: (params) => (
                <Chip
                    label={`${params.value} Students`}
                    size="small"
                    variant="soft"
                    color={params.value > 0 ? "success" : "default"}
                    sx={{ fontWeight: 700 }}
                />
            )
        },
        {
            field: 'shortcuts',
            headerName: 'Shortcuts',
            width: 200,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Assign Students">
                        <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                                setSelectedSection(params.row);
                                setIsAssignDialogOpen(true);
                            }}
                        >
                            <AssignIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Bulk Enroll">
                        <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => {
                                setSelectedSection(params.row);
                                setIsBulkDialogOpen(true);
                            }}
                        >
                            <EnrollIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )
        }
    ], [theme]);

    const handleAdd = () => {
        setSelectedSection(null);
        setIsSectionDialogOpen(true);
    };

    const handleEdit = (section: Section) => {
        setSelectedSection(section);
        setIsSectionDialogOpen(true);
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{
                mb: 5,
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', lg: 'flex-end' },
                gap: 3
            }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                        Classroom Sections
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Manage student groups and perform bulk academic operations.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        sx={{ borderRadius: 2.5 }}
                    >
                        Create Section
                    </Button>
                </Box>
            </Box>

            <DataTable
                title="Institutional Sections"
                subtitle="Student grouping and bulk enrollment management"
                columns={columns}
                rows={sections || []}
                loading={isLoading}
                module="sections"
                onAdd={handleAdd}
                onEdit={handleEdit}
                onView={() => { }}
                onDelete={async (section) => {
                    if (section.id) {
                        try {
                            await sectionsService.remove(section.id);
                            refetch();
                        } catch (error) {
                            console.error('Failed to delete section:', error);
                        }
                    }
                }}
                onRefresh={refetch}
                showSearch={true}
            />

            <SectionDialog
                open={isSectionDialogOpen}
                onClose={() => setIsSectionDialogOpen(false)}
                onSuccess={() => refetch()}
                section={selectedSection}
            />

            {selectedSection && (
                <>
                    <AssignStudentsDialog
                        open={isAssignDialogOpen}
                        onClose={() => setIsAssignDialogOpen(false)}
                        onSuccess={() => refetch()}
                        section={selectedSection}
                    />
                    <BulkEnrollmentDialog
                        open={isBulkDialogOpen}
                        onClose={() => setIsBulkDialogOpen(false)}
                        onSuccess={() => refetch()}
                        section={selectedSection}
                    />
                </>
            )}
        </Box>
    );
}
