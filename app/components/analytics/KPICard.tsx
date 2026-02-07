'use client';

import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    useTheme,
    alpha,
    Skeleton,
} from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    Map as MapIcon,
    LocationCity as LocationCityIcon,
    Badge as BadgeIcon,
    Groups as GroupsIcon,
    Inventory2 as InventoryIcon,
    AccountBalance as BudgetIcon,
} from '@mui/icons-material';
import type { KPIData } from '@/app/lib/types';

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
    People: <PeopleIcon />,
    School: <SchoolIcon />,
    Map: <MapIcon />,
    LocationCity: <LocationCityIcon />,
    Badge: <BadgeIcon />,
    Groups: <GroupsIcon />,
    Inventory: <InventoryIcon />,
    Budget: <BudgetIcon />,
};

interface KPICardProps {
    data: KPIData;
    loading?: boolean;
    onClick?: () => void;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
}

export function KPICard({
    data,
    loading = false,
    onClick,
    color = 'primary',
}: KPICardProps) {
    const theme = useTheme();

    const colorMap = {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        success: theme.palette.success.main,
        warning: theme.palette.warning.main,
        error: theme.palette.error.main,
        info: theme.palette.info?.main || theme.palette.primary.main,
    };

    const mainColor = colorMap[color];

    const getTrendIcon = () => {
        switch (data.trend) {
            case 'up':
                return <TrendingUpIcon sx={{ fontSize: 16 }} />;
            case 'down':
                return <TrendingDownIcon sx={{ fontSize: 16 }} />;
            default:
                return <TrendingFlatIcon sx={{ fontSize: 16 }} />;
        }
    };

    const getTrendColor = () => {
        if (data.trend === 'up') return theme.palette.success.main;
        if (data.trend === 'down') return theme.palette.error.main;
        return theme.palette.text.secondary;
    };

    const formatValue = (value: number | string) => {
        if (typeof value === 'string') return value;
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
        return value.toLocaleString();
    };

    if (loading) {
        return (
            <Card
                sx={{
                    height: '100%',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton variant="text" width="60%" sx={{ mt: 2 }} />
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="text" width="30%" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            onClick={onClick}
            sx={{
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                border: `1px solid ${alpha(mainColor, 0.1)}`,
                '&:hover': onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 30px ${alpha(mainColor, 0.2)}`,
                    borderColor: alpha(mainColor, 0.3),
                } : {},
            }}
        >
            <CardContent sx={{ p: 3 }}>
                {/* Icon */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(mainColor, 0.12),
                        color: mainColor,
                        mb: 2,
                    }}
                >
                    {data.icon ? iconMap[data.icon] || <PeopleIcon /> : <PeopleIcon />}
                </Box>

                {/* Label */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                    sx={{ mb: 0.5 }}
                >
                    {data.label}
                </Typography>

                {/* Value */}
                <Typography
                    variant="h4"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ mb: 1 }}
                >
                    {formatValue(data.value)}
                </Typography>

                {/* Trend */}
                {data.changePercent !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                                px: 0.75,
                                py: 0.25,
                                borderRadius: 1,
                                backgroundColor: alpha(getTrendColor(), 0.12),
                                color: getTrendColor(),
                            }}
                        >
                            {getTrendIcon()}
                            <Typography variant="caption" fontWeight={600}>
                                {data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            vs last period
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}

interface KPIGridProps {
    kpis: KPIData[];
    loading?: boolean;
    columns?: 2 | 3 | 4 | 6;
}

export function KPIGrid({ kpis, loading = false, columns = 4 }: KPIGridProps) {
    const colors: Array<'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = [
        'primary', 'secondary', 'success', 'warning', 'info', 'error'
    ];

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: 'repeat(1, 1fr)',
                    sm: 'repeat(2, 1fr)',
                    md: `repeat(${Math.min(columns, 3)}, 1fr)`,
                    lg: `repeat(${columns}, 1fr)`,
                },
                gap: 3,
            }}
        >
            {kpis.map((kpi, index) => (
                <KPICard
                    key={kpi.label}
                    data={kpi}
                    loading={loading}
                    color={colors[index % colors.length]}
                />
            ))}
        </Box>
    );
}

export default KPICard;
