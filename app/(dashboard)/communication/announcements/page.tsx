'use client';

import React, { useState, useEffect } from 'react';
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
import { useRealTime } from '@/app/lib/hooks/useRealTime';
import { format } from 'date-fns';
import { Autocomplete } from '@mui/material';
import { toast } from 'react-hot-toast';

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

    // Queries
    const { data: announcements = [], isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => announcementsService.getAll(),
    });

    const { data: unreadData } = useQuery({
        queryKey: ['announcements', 'unread-count'],
        queryFn: () => announcementsService.getUnreadCount(),
    });

    // Real-time synchronization
    useRealTime('announcement_created', () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
        toast.info('New announcement received');
    });

    useRealTime('announcement_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
    });

    useRealTime('announcement_deleted', () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: announcementsService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            toast.success('Announcement published successfully');
            setCreateDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to publish announcement');
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: announcementsService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['announcements'] });
            queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
        },
    });

    useEffect(() => {
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

        if (createDialogOpen) fetchOptions();
    }, [formData.targetScope, createDialogOpen]);

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
        <Box sx={{ p: { xs: 2.5, md: 3, lg: 5 }, className: "animate-fade-in" }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1.5 }}>
                            Announcements
                        </Typography>
                        {isLoading && <CircularProgress size={20} />}
                    </Box>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Stay updated with critical information and organizational notifications
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Badge badgeContent={unreadData?.unreadCount || 0} color="error" overlap="circular">
                        <Box sx={{ p: 1, bgcolor: alpha(theme => theme.palette.error.main, 0.1), borderRadius: '12px' }}>
                            <NotificationsIcon color="error" />
                        </Box>
                    </Badge>
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setCreateDialogOpen(true)}
                            sx={{ borderRadius: '12px', px: 3, py: 1.2, fontWeight: 700 }}
                        >
                            New Announcement
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Announcements List */}
            <Box sx={{ display: 'grid', gap: 2.5 }}>
                {announcements.map((announcement) => {
                    const PriorityIcon = PRIORITY_CONFIG[announcement.priority].icon;
                    const priorityColor = PRIORITY_CONFIG[announcement.priority].color;

                    return (
                        <Card
                            key={announcement.id}
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderLeft: `6px solid ${priorityColor}`,
                                backgroundColor: announcement.isRead ? 'background.paper' : alpha(priorityColor, 0.03),
                                borderRadius: '16px',
                                border: '1px solid',
                                borderColor: announcement.isRead ? 'divider' : alpha(priorityColor, 0.1),
                                '&:hover': {
                                    transform: 'translateX(4px)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                    borderColor: priorityColor,
                                },
                            }}
                            onClick={() => handleViewAnnouncement(announcement)}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                                    <Box
                                        sx={{
                                            width: 52,
                                            height: 52,
                                            borderRadius: '14px',
                                            bgcolor: alpha(priorityColor, 0.1),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <PriorityIcon sx={{ color: priorityColor, fontSize: 28 }} />
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
                                            <Typography variant="h6" fontWeight={700} sx={{ flex: 1, color: 'text.primary' }}>
                                                {announcement.title}
                                            </Typography>
                                            <Chip
                                                label={PRIORITY_CONFIG[announcement.priority].label}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(priorityColor, 0.1),
                                                    color: priorityColor,
                                                    fontWeight: 800,
                                                    fontSize: '0.7rem',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            {!announcement.isRead && (
                                                <Chip label="NEW" size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                                            )}
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: 1.6,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {announcement.content}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 3, mt: 2.5, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">Author:</Typography>
                                                {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Typography component="span" variant="caption" fontWeight={700} color="text.primary">Published:</Typography>
                                                {format(new Date(announcement.createdAt), 'MMM d, yyyy · p')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}

                {announcements.length === 0 && !isLoading && (
                    <Card sx={{ p: 10, textAlign: 'center', borderRadius: '24px', border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                        <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6" color="text.secondary" fontWeight={600}>
                            Your inbox is empty
                        </Typography>
                        <Typography variant="body2" color="text.disabled">
                            Important announcements will appear here when published
                        </Typography>
                    </Card>
                )}
            </Box>

            {/* Create Dialog */}
            <Dialog 
                open={createDialogOpen} 
                onClose={() => setCreateDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                <DialogTitle sx={{ px: 4, pt: 4, pb: 1, fontWeight: 800 }}>Create New Announcement</DialogTitle>
                <DialogContent sx={{ px: 4 }}>
                    <Box sx={{ display: 'grid', gap: 3, pt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            variant="outlined"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <TextField
                            label="Content"
                            fullWidth
                            multiline
                            rows={4}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Priority</InputLabel>
                                <Select
                                    value={formData.priority}
                                    label="Priority"
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                    sx={{ borderRadius: '12px' }}
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
                                    sx={{ borderRadius: '12px' }}
                                >
                                    <MenuItem value="SYSTEM">System-Wide</MenuItem>
                                    <MenuItem value="REGION">Region</MenuItem>
                                    <MenuItem value="ZONE">Zone</MenuItem>
                                    <MenuItem value="WOREDA">Woreda</MenuItem>
                                    <MenuItem value="KEBELE">Kebele</MenuItem>
                                    <MenuItem value="INSTITUTION">Institution</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

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
                                        label={`Select Target ${formData.targetScope.toLowerCase()}`}
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                <DialogActions sx={{ px: 4, pb: 4 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={
                            !formData.title ||
                            !formData.content ||
                            (formData.targetScope !== 'SYSTEM' && !formData.targetId) ||
                            createMutation.isPending
                        }
                        sx={{ borderRadius: '10px', px: 4, fontWeight: 700 }}
                    >
                        {createMutation.isPending ? <CircularProgress size={20} /> : 'Publish'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Dialog */}
            <Dialog 
                open={viewDialogOpen} 
                onClose={() => setViewDialogOpen(false)} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
            >
                {selectedAnnouncement && (
                    <>
                        <DialogTitle sx={{ bgcolor: alpha(PRIORITY_CONFIG[selectedAnnouncement.priority].color, 0.05), p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <Typography variant="h5" fontWeight={800}>{selectedAnnouncement.title}</Typography>
                                    <Chip
                                        label={PRIORITY_CONFIG[selectedAnnouncement.priority].label}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(PRIORITY_CONFIG[selectedAnnouncement.priority].color, 0.2),
                                            color: PRIORITY_CONFIG[selectedAnnouncement.priority].color,
                                            fontWeight: 800,
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    ID: {selectedAnnouncement.id.substring(0, 8).toUpperCase()}
                                </Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent sx={{ p: 4 }}>
                            <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '1.1rem', whiteSpace: 'pre-wrap' }}>
                                {selectedAnnouncement.content}
                            </Typography>
                            <Box sx={{ mt: 5, p: 3, bgcolor: 'action.hover', borderRadius: '16px', display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>AUTHOR</Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {selectedAnnouncement.createdBy.firstName} {selectedAnnouncement.createdBy.lastName}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>PUBLISHED ON</Typography>
                                    <Typography variant="subtitle2" fontWeight={700}>
                                        {format(new Date(selectedAnnouncement.createdAt), 'PPP')}
                                    </Typography>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 4, bgcolor: 'action.hover' }}>
                            <Button variant="contained" onClick={() => setViewDialogOpen(false)} sx={{ borderRadius: '10px', px: 4, fontWeight: 700 }}>
                                Dismiss
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Box>
    );
}
