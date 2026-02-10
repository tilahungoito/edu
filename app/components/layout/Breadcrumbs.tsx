'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Breadcrumbs as MuiBreadcrumbs,
    Typography,
    Box,
    useTheme,
    alpha,
} from '@mui/material';
import {
    NavigateNext as NavigateNextIcon,
    Home as HomeIcon,
} from '@mui/icons-material';
import { useTenant } from '@/app/lib/core';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    performance: 'Performance',
    enrollment: 'Enrollment',
    management: 'Management',
    zones: 'Zones',
    woredas: 'Woredas',
    schools: 'Schools',
    users: 'Users',
    hr: 'Human Resources',
    staff: 'Staff',
    transfers: 'Transfers',
    approvals: 'Approvals',
    inventory: 'Inventory',
    assets: 'Assets',
    supplies: 'Supplies',
    requests: 'Requests',
    budget: 'Budget',
    allocations: 'Allocations',
    expenditure: 'Expenditure',
    reports: 'Reports',
    settings: 'Settings',
    roles: 'Roles & Permissions',
};

export function Breadcrumbs() {
    const theme = useTheme();
    const pathname = usePathname();

    // Generate breadcrumbs from pathname
    const pathSegments = pathname.split('/').filter(Boolean);

    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'Home', href: '/dashboard', icon: <HomeIcon sx={{ fontSize: 18 }} /> },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;

        breadcrumbs.push({
            label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
            href: isLast ? undefined : currentPath,
        });
    });

    return (
        <Box sx={{ mb: 3 }}>
            <MuiBreadcrumbs
                separator={
                    <NavigateNextIcon
                        sx={{
                            fontSize: 18,
                            color: theme.palette.text.disabled
                        }}
                    />
                }
                sx={{
                    '& .MuiBreadcrumbs-ol': {
                        alignItems: 'center',
                    },
                }}
            >
                {breadcrumbs.map((crumb, index) => {
                    const isLast = index === breadcrumbs.length - 1;

                    if (isLast) {
                        return (
                            <Typography
                                key={index}
                                variant="body2"
                                color="text.primary"
                                fontWeight={600}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                                {crumb.icon}
                                {crumb.label}
                            </Typography>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={crumb.href || '#'}
                            style={{ textDecoration: 'none' }}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                        color: theme.palette.primary.main,
                                    },
                                }}
                            >
                                {crumb.icon}
                                {crumb.label}
                            </Typography>
                        </Link>
                    );
                })}
            </MuiBreadcrumbs>
        </Box>
    );
}

export default Breadcrumbs;
