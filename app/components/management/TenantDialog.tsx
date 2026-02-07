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
    nameAmharic: string;
    code: string;
    description: string;
    status: 'active' | 'inactive';
    // Hierarchy links
    regionId?: string;
    zoneId?: string;
    woredaId?: string;
    kebeleId?: string;
    // School specific
    type?: string;
    ownership?: string;
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
        nameAmharic: '',
        code: '',
        description: '',
        status: 'active',
        type: 'primary',
        ownership: 'government',
    });

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
                    initialData.regionId = user.tenantId;

                    // If we're creating a woreda/school and have a selected parent, use it
                    if (parentId) {
                        if (type === 'woreda' || (type === 'school' && parentType === 'zone')) {
                            initialData.zoneId = parentId;
                            const woredasData = await woredasService.getAll(parentId);
                            setWoredas(woredasData);
                        } else if (type === 'school' && parentType === 'woreda') {
                            initialData.woredaId = parentId;
                            // We need both zone and woreda for school if possible, 
                            // but if only woredaId provided, we just fetch kebeles
                            const kebelesData = await kebelesService.getAll();
                            setKebeles(kebelesData.filter(k => k.woredaId === parentId));
                        }
                    }

                    const zonesData = await zonesService.getAll(user.tenantId);
                    setZones(zonesData);
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

    const handleStatusChange = (e: SelectChangeEvent) => {
        setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' });
    };

    const handleTypeChange = (e: SelectChangeEvent) => {
        setFormData({ ...formData, type: e.target.value });
    };

    const handleOwnershipChange = (e: SelectChangeEvent) => {
        setFormData({ ...formData, ownership: e.target.value });
    };

    const handleFormSubmit = () => {
        onSubmit(formData);
        onClose();
        setFormData({
            name: '',
            nameAmharic: '',
            code: '',
            description: '',
            status: 'active',
        });
    };

    const title = type.charAt(0).toUpperCase() + type.slice(1);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
                    <Grid size={12}>
                        <TextField
                            name="name"
                            label={`${title} Name (English)`}
                            fullWidth
                            required
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            name="nameAmharic"
                            label={`${title} Name (Amharic)`}
                            fullWidth
                            required
                            value={formData.nameAmharic}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={6}>
                        <TextField
                            name="code"
                            label="Code"
                            fullWidth
                            required
                            placeholder="e.g. MKL"
                            value={formData.code}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={6}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={formData.status}
                                label="Status"
                                onChange={handleStatusChange}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={12}>
                        <TextField
                            name="description"
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* Hierarchical Selectors */}
                    {type === 'woreda' && user?.tenantType === 'bureau' && (
                        <Grid size={12}>
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
                                <Grid size={6}>
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
                                <Grid size={6}>
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
                            <Grid size={12}>
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
                            <Grid size={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>School Type</InputLabel>
                                    <Select
                                        value={formData.type || ''}
                                        label="School Type"
                                        onChange={handleTypeChange}
                                    >
                                        <MenuItem value="primary">Primary</MenuItem>
                                        <MenuItem value="secondary">Secondary</MenuItem>
                                        <MenuItem value="preparatory">Preparatory</MenuItem>
                                        <MenuItem value="tvet">TVET</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Ownership</InputLabel>
                                    <Select
                                        value={formData.ownership || ''}
                                        label="Ownership"
                                        onChange={handleOwnershipChange}
                                    >
                                        <MenuItem value="government">Government</MenuItem>
                                        <MenuItem value="private">Private</MenuItem>
                                        <MenuItem value="ngo">NGO</MenuItem>
                                        <MenuItem value="community">Community</MenuItem>
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
