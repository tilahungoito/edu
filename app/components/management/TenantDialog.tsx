'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    SelectChangeEvent,
} from '@mui/material';
import { TenantType } from '@/app/lib/types/permissions';
import { useAuthStore } from '@/app/lib/store';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { regionsService } from '@/app/lib/api/regions.service';

interface TenantFormData {
    name: string;
    description: string;
    // Hierarchy links
    regionId?: string;
    zoneId?: string;
    woredaId?: string;
    kebeleId?: string;
}

interface TenantDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: TenantFormData) => void;
    type: 'region' | 'zone' | 'woreda' | 'kebele' | 'school';
    parentType?: TenantType;
    parentId?: string;
    parentName?: string;
}

export function TenantDialog({
    open,
    onClose,
    onSubmit,
    type,
    parentType,
    parentId,
    parentName,
}: TenantDialogProps) {
    const user = useAuthStore(state => state.user);
    const [formData, setFormData] = useState<TenantFormData>({
        name: '',
        description: '',
    });

    const isSystemAdmin = user?.roles.some(r => r.name === 'SYSTEM_ADMIN');

    const [regions, setRegions] = useState<any[]>([]);
    const [zones, setZones] = useState<any[]>([]);
    const [woredas, setWoredas] = useState<any[]>([]);
    const [kebeles, setKebeles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Context resolution and data fetching
    React.useEffect(() => {
        if (!open || !user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Pre-populate based on user scope
                const initialData = { ...formData };

                if (user.tenantType === 'bureau') {
                    if (user.tenantId) {
                        initialData.regionId = user.tenantId;

                        // If we're creating a woreda/school and have a selected parent, use it
                        if (parentId) {
                            if (type === 'woreda' || (type === 'school' && parentType === 'zone')) {
                                initialData.zoneId = parentId;
                                const woredasData = await woredasService.getAll(parentId);
                                setWoredas(woredasData);
                            } else if (type === 'school' && parentType === 'woreda') {
                                initialData.woredaId = parentId;
                                const kebelesData = await kebelesService.getAll();
                                setKebeles(kebelesData.filter(k => k.woredaId === parentId));
                            }
                        }

                        const zonesData = await zonesService.getAll(user.tenantId);
                        setZones(zonesData);
                    } else {
                        // System Admin/No tenantId - fetch top-level data
                        if (type === 'zone' || type === 'woreda' || type === 'school') {
                            const regionsData = await regionsService.getAll();
                            setRegions(regionsData);
                        }
                    }
                } else if (user.tenantType === 'zone') {
                    initialData.zoneId = user.tenantId;

                    if (parentId && type === 'school' && parentType === 'woreda') {
                        initialData.woredaId = parentId;
                        const kebelesData = await kebelesService.getAll();
                        setKebeles(kebelesData.filter(k => k.woredaId === parentId));
                    }

                    const woredasData = await woredasService.getAll(user.tenantId);
                    setWoredas(woredasData);
                } else if (user.tenantType === 'woreda') {
                    initialData.woredaId = user.tenantId;
                    const kebelesData = await kebelesService.getAll();
                    setKebeles(kebelesData.filter(k => k.woredaId === user.tenantId));
                } else if (user.tenantType === 'kebele') {
                    initialData.kebeleId = user.tenantId;
                    // For kebele admins, we might need the woredaId if the backend requires it for school creation
                    // Assuming user object has it or we can fetch it. For now, just set kebeleId.
                }

                setFormData(prev => ({ ...prev, ...initialData }));
            } catch (error) {
                console.error('Error fetching parent data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [open, type, user]);

    const handleZoneChange = async (zoneId: string) => {
        setFormData(prev => ({ ...prev, zoneId, woredaId: '', kebeleId: '' }));
        try {
            const data = await woredasService.getAll(zoneId);
            setWoredas(data);
        } catch (error) {
            console.error('Error fetching woredas:', error);
        }
    };

    const handleWoredaChange = async (woredaId: string) => {
        setFormData(prev => ({ ...prev, woredaId, kebeleId: '' }));
        try {
            const data = await kebelesService.getAll(); // Filter manually if service doesn't support query param
            setKebeles(data.filter(k => k.woredaId === woredaId));
        } catch (error) {
            console.error('Error fetching kebeles:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name as keyof TenantFormData]: value
        }));
    };

    const handleFormSubmit = () => {
        // Filter data based on backend DTO requirements to prevent 400 errors
        const payload: any = {
            name: formData.name,
        };

        // Helper to check if a string is a valid UUID
        const isUUID = (id?: string) => id && id.length === 36 && id.includes('-');

        // Only include parent links if they are valid UUIDs
        if (type === 'zone') {
            // Only System Admins send regionId; Regional Admins let backend auto-fill it
            if (isSystemAdmin && isUUID(formData.regionId)) {
                payload.regionId = formData.regionId;
            }
        } else if (type === 'woreda') {
            if (isUUID(formData.zoneId)) payload.zoneId = formData.zoneId;
        } else if (type === 'kebele') {
            if (isUUID(formData.woredaId)) payload.woredaId = formData.woredaId;
        } else if (type === 'school') {
            if (isUUID(formData.kebeleId)) payload.kebeleId = formData.kebeleId;
        }

        onSubmit(payload);
        onClose();
        setFormData({
            name: '',
            description: '',
        });
    };

    const title = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontWeight: 700 }}>
                Add New {title}
                {parentName && (
                    <Typography variant="body2" color="text.secondary">
                        Under {parentName}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            name="name"
                            label={`${title} Name (English)`}
                            fullWidth
                            required
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </Grid>

                    {(type === 'school') && (
                        <>
                            {/* School specific inputs removed as per simplified schema */}
                        </>
                    )}

                    {/* Region selector - only for System Admins creating zones */}
                    {type === 'zone' && isSystemAdmin && (
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Parent Region</InputLabel>
                                <Select
                                    value={formData.regionId || ''}
                                    label="Parent Region"
                                    onChange={(e) => setFormData(prev => ({ ...prev, regionId: e.target.value }))}
                                >
                                    {regions.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {type === 'woreda' && user?.tenantType === 'bureau' && (
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth required>
                                <InputLabel>Parent Zone</InputLabel>
                                <Select
                                    value={formData.zoneId || ''}
                                    label="Parent Zone"
                                    onChange={(e) => setFormData(prev => ({ ...prev, zoneId: e.target.value }))}
                                >
                                    {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}

                    {type === 'school' && (
                        <>
                            {user?.tenantType === 'bureau' && (
                                <Grid size={{ xs: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Zone</InputLabel>
                                        <Select
                                            value={formData.zoneId || ''}
                                            label="Zone"
                                            onChange={(e) => handleZoneChange(e.target.value)}
                                        >
                                            {zones.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                            {(user?.tenantType === 'bureau' || user?.tenantType === 'zone') && (
                                <Grid size={{ xs: 6 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Woreda</InputLabel>
                                        <Select
                                            value={formData.woredaId || ''}
                                            label="Woreda"
                                            onChange={(e) => handleWoredaChange(e.target.value)}
                                            disabled={!formData.zoneId && user?.tenantType === 'bureau'}
                                        >
                                            {woredas.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            )}
                            <Grid size={{ xs: 12 }}>
                                <FormControl fullWidth required>
                                    <InputLabel>Kebele</InputLabel>
                                    <Select
                                        value={formData.kebeleId || ''}
                                        label="Kebele"
                                        onChange={(e) => setFormData(prev => ({ ...prev, kebeleId: e.target.value }))}
                                        disabled={!formData.woredaId && user?.tenantType !== 'woreda'}
                                    >
                                        {kebeles.map(k => <MenuItem key={k.id} value={k.id}>{k.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button onClick={handleFormSubmit} variant="contained" color="primary">
                    Create {title}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
