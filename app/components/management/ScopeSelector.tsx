import React, { useState, useEffect } from 'react';
import {
    TextField,
    MenuItem,
    CircularProgress,
    Box,
    Typography,
    Grid,
    Alert
} from '@mui/material';
import { regionsService } from '@/app/lib/api/regions.service';
import { zonesService } from '@/app/lib/api/zones.service';
import { woredasService } from '@/app/lib/api/woredas.service';
import { kebelesService } from '@/app/lib/api/kebeles.service';
import { institutionsService } from '@/app/lib/api/institutions.service';
import { Role } from '@/app/lib/types/roles';

interface ScopeSelectorProps {
    targetRole: Role;
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

const SCOPE_MAP: Partial<Record<Role, string>> = {
    'REGIONAL_ADMIN': 'REGION',
    'ZONE_ADMIN': 'ZONE',
    'WOREDA_ADMIN': 'WOREDA',
    'KEBELE_ADMIN': 'KEBELE', // Assuming Kebele usually maps to a school or similar in this context, or maybe just Woreda level? 
    // Wait, Kebele is below Woreda. I need to check if we have a Kebele service.
    // The previous UserDialog had 'KEBELE_ADMIN': 'KEBELE' but no kebeleService.
    // Let's assume for now we use what was there, but I should check if kebele service exists.
    'INSTITUTION_ADMIN': 'INSTITUTION',
};

export function ScopeSelector({
    targetRole,
    value,
    onChange,
    error,
    helperText,
    disabled
}: ScopeSelectorProps) {
    const [scopes, setScopes] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const scopeType = SCOPE_MAP[targetRole];

    useEffect(() => {
        if (!scopeType) {
            setScopes([]);
            return;
        }

        const fetchScopes = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                let data: any[] = [];
                switch (scopeType) {
                    case 'REGION':
                        data = await regionsService.getAll();
                        break;
                    case 'ZONE':
                        data = await zonesService.getAll();
                        break;
                    case 'WOREDA':
                        data = await woredasService.getAll();
                        break;
                    case 'INSTITUTION':
                        data = await institutionsService.getAll();
                        break;
                    case 'KEBELE':
                        data = await kebelesService.getAll();
                        break;
                }
                setScopes(data.map(item => ({ id: item.id, name: item.name })));
            } catch (err) {
                console.error('Error fetching scopes:', err);
                setFetchError('Failed to load options');
            } finally {
                setLoading(false);
            }
        };

        fetchScopes();
    }, [scopeType]);

    if (!scopeType) return null;

    return (
        <Box>
            <TextField
                select
                label={`Select ${scopeType.charAt(0) + scopeType.slice(1).toLowerCase()}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                fullWidth
                required
                disabled={loading || disabled}
                error={error || !!fetchError}
                helperText={fetchError || helperText}
            >
                {loading ? (
                    <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={20} />
                            Loading...
                        </Box>
                    </MenuItem>
                ) : scopes.length > 0 ? (
                    scopes.map((scope) => (
                        <MenuItem key={scope.id} value={scope.id}>
                            {scope.name}
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem disabled>No options available</MenuItem>
                )}
            </TextField>
        </Box>
    );
}
