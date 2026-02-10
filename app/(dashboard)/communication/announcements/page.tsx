'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    alpha,
    Badge,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Notifications as NotificationsIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import announcementsService, { type Announcement, type CreateAnnouncementDto } from '@/app/lib/api/announcements.service';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { useAuthStore } from '@/app/lib/store';
import { format } from 'date-fns';
import { Autocomplete } from '@mui/material';

const PRIORITY_CONFIG = {
    INFO: { color: '#3b82f6', icon: InfoIcon, label: 'Info' },
    IMPORTANT: { color: '#f59e0b', icon: WarningIcon, label: 'Important' },
    URGENT: { color: '#ef4444', icon: ErrorIcon, label: 'Urgent' },
};

export default function AnnouncementsPage() {
    const user = useAuthStore((state) => state.user);
    const queryClient = useQueryClient();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [targetOptions, setTargetOptions] = useState<{ id: string; name: string }[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    const [formData, setFormData] = useState<CreateAnnouncementDto>({
        title: '',
        content: '',
        priority: 'INFO',
        targetScope: (user?.scopeType as any) || 'INSTITUTION',
        targetId: user?.scopeId || undefined,
    });

    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => announcementsService.getAll(),
    });

    const { data: unreadData } = useQuery({
        queryKey: ['announcements', 'unread-count'],
        queryFn: () => announcementsService.getUnreadCount(),
        refetchInterval: 30000, // Poll every 30s
    });

    const createMutation = useMutation({
        mutationFn: announcementsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            setCreateDialogOpen(false);
            resetForm();
        },
    });

    const markAsReadMutation = useMutation({
        mutationFn: announcementsService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
        },
    });

    React.useEffect(() => {
        const fetchOptions = async () => {
            if (formData.targetScope === 'SYSTEM') {
                setTargetOptions([]);
                setFormData(prev => ({ ...prev, targetId: undefined }));
                return;
            }

            setIsLoadingOptions(true);
            try {
                let options: { id: string; name: string }[] = [];
                switch (formData.targetScope) {
                    case 'REGION':
                        const regions = await regionsService.getAll();
                        options = regions.map(r => ({ id: r.id, name: r.name }));
                        break;
                    case 'ZONE':
                        const zones = await zonesService.getAll();
                        options = zones.map(z => ({ id: z.id, name: z.name }));
                        break;
                    case 'WOREDA':
                        const woredas = await woredasService.getAll();
                        options = woredas.map(w => ({ id: w.id, name: w.name }));
                        break;
                    case 'KEBELE':
                        const kebeles = await kebelesService.getAll();
                        options = kebeles.map(k => ({ id: k.id, name: k.name }));
                        break;
                    case 'INSTITUTION':
                        const institutions = await institutionsService.getAll();
                        options = institutions.map(i => ({ id: i.id, name: i.name }));
                        break;
                }
                setTargetOptions(options);
            } catch (error) {
                console.error('Failed to fetch targeting options', error);
            } finally {
                setIsLoadingOptions(false);
            }
        };

        fetchOptions();
    }, [formData.targetScope]);

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            priority: 'INFO',
            targetScope: user?.scopeType || 'INSTITUTION',
            targetId: user?.scopeId,
        });
    };

    const handleViewAnnouncement = async (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        setViewDialogOpen(true);

        if (!announcement.isRead) {
            await markAsReadMutation.mutateAsync(announcement.id);
        }
    };

    const handleSubmit = () => {
        createMutation.mutate(formData);
    };

    const canCreate = user?.roles?.some(r =>
        ['SYSTEM_ADMIN', 'REGIONAL_ADMIN', 'ZONE_ADMIN', 'WOREDA_ADMIN', 'KEBELE_ADMIN', 'INSTITUTION_ADMIN'].includes(r.name)
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                        <Badge badgeContent={unreadData?.unreadCount || 0} color="error" sx={{ mr: 2 }}>
                            <NotificationsIcon fontSize="large" />
                        </Badge>
                        Announcements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Stay updated with important notifications
                    </Typography>
                </Box>
                {canCreate && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ borderRadius: 2 }}
                    >
                        New Announcement
                    </Button>
                )}
            </Box>

            {/* Announcements List */}
            <Box sx={{ display: 'grid', gap: 2 }}>
                {announcements.map((announcement) => {
                    const PriorityIcon = PRIORITY_CONFIG[announcement.priority].icon;
                    const priorityColor = PRIORITY_CONFIG[announcement.priority].color;

                    return (
                        <Card
                            key={announcement.id}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                borderLeft: `4px solid ${priorityColor}`,
                                backgroundColor: announcement.isRead ? 'transparent' : alpha(priorityColor, 0.05),
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 4,
                                },
                            }}
                            onClick={() => handleViewAnnouncement(announcement)}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 2,
                                            bgcolor: alpha(priorityColor, 0.1),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PriorityIcon sx={{ color: priorityColor }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                                                {announcement.title}
                                            </Typography>
                                            <Chip
                                                label={PRIORITY_CONFIG[announcement.priority].label}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(priorityColor, 0.1),
                                                    color: priorityColor,
                                                    fontWeight: 700,
                                                }}
                                            />
                                            {!announcement.isRead && (
                                                <Chip label="New" size="small" color="error" />
                                            )}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {announcement.content}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>From:</strong> {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                <strong>Date:</strong> {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}

                {announcements.length === 0 && !isLoading && (
                    <Card sx={{ p: 8, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No announcements yet
                        </Typography>
                    </Card>
                )}
            </Box>

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Content"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select
                                value={formData.priority}
                                label="Priority"
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                            >
                                <MenuItem value="INFO">Info</MenuItem>
                                <MenuItem value="IMPORTANT">Important</MenuItem>
                                <MenuItem value="URGENT">Urgent</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Target Scope</InputLabel>
                            <Select
                                value={formData.targetScope}
                                label="Target Scope"
                                onChange={(e) => setFormData({ ...formData, targetScope: e.target.value as any })}
                            >
                                <MenuItem value="SYSTEM">System-Wide</MenuItem>
                                <MenuItem value="REGION">Region</MenuItem>
                                <MenuItem value="ZONE">Zone</MenuItem>
                                <MenuItem value="WOREDA">Woreda</MenuItem>
                                <MenuItem value="KEBELE">Kebele</MenuItem>
                                <MenuItem value="INSTITUTION">Institution</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.targetScope !== 'SYSTEM' && (
                            <Autocomplete
                                options={targetOptions}
                                getOptionLabel={(option) => option.name}
                                loading={isLoadingOptions}
                                value={targetOptions.find(opt => opt.id === formData.targetId) || null}
                                onChange={(_, newValue) => {
                                    setFormData({ ...formData, targetId: newValue?.id });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label={`Select ${formData.targetScope.toLowerCase()}`}
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {isLoadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={
                            !formData.title ||
                            !formData.content ||
                            (formData.targetScope !== 'SYSTEM' && !formData.targetId)
                        }
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
                {selectedAnnouncement && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {selectedAnnouncement.title}
                                <Chip
                                    label={PRIORITY_CONFIG[selectedAnnouncement.priority].label}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(PRIORITY_CONFIG[selectedAnnouncement.priority].color, 0.1),
                                        color: PRIORITY_CONFIG[selectedAnnouncement.priority].color,
                                    }}
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body1" paragraph>
                                {selectedAnnouncement.content}
                            </Typography>
                            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    <strong>From:</strong> {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    <strong>Date:</strong> {format(new Date(selectedAnnouncement.createdAt), 'PPP')}
                                </Typography>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
