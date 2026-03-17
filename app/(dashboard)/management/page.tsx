'use client';

import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import {
    Map as MapIcon,
    LocationCity as LocationCityIcon,
    Business as BusinessIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const managementModules = [
    {
        title: 'Regions',
        description: 'Manage and view regional administrative units.',
        icon: <MapIcon sx={{ fontSize: 36 }} />,
        color: '#10b981',
        href: '/management/regions',
    },
    {
        title: 'Zones',
        description: 'Oversee zone-level administration and data.',
        icon: <LocationCityIcon sx={{ fontSize: 36 }} />,
        color: '#3b82f6',
        href: '/management/zones',
    },
    {
        title: 'Woredas',
        description: 'Manage woreda entities and their configurations.',
        icon: <BusinessIcon sx={{ fontSize: 36 }} />,
        color: '#6366f1',
        href: '/management/woredas',
    },
    {
        title: 'Kebeles',
        description: 'Administer kebele-level information and records.',
        icon: <LocationCityIcon sx={{ fontSize: 36 }} />,
        color: '#f59e0b',
        href: '/management/kebeles',
    },
    {
        title: 'Schools',
        description: 'Manage educational institutions across all territories.',
        icon: <SchoolIcon sx={{ fontSize: 36 }} />,
        color: '#ec4899',
        href: '/management/schools',
    },
    {
        title: 'Users',
        description: 'Manage system users, roles and access control.',
        icon: <ManageAccountsIcon sx={{ fontSize: 36 }} />,
        color: '#8b5cf6',
        href: '/management/users',
    },
];

export default function ManagementPage() {
    const router = useRouter();

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <BusinessIcon sx={{ fontSize: 32, color: '#3b82f6' }} />
                    <Typography variant="h4" fontWeight={700}>
                        Management
                    </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Oversee all administrative entities — regions, zones, woredas, kebeles, schools, and users.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {managementModules.map((mod) => (
                    <Grid item xs={12} sm={6} md={4} key={mod.title} {...{ item: true, xs: 12, sm: 6, md: 4 } as any}>
                        <Card
                            sx={{
                                height: '100%',
                                borderRadius: 3,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                border: '1px solid',
                                borderColor: 'divider',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 12px 40px ${mod.color}22`,
                                    borderColor: mod.color,
                                },
                            }}
                        >
                            <CardActionArea sx={{ height: '100%' }} onClick={() => router.push(mod.href)}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box
                                        sx={{
                                            mb: 2,
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            backgroundColor: `${mod.color}18`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: mod.color,
                                        }}
                                    >
                                        {mod.icon}
                                    </Box>
                                    <Typography variant="h6" fontWeight={700} gutterBottom>
                                        {mod.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {mod.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
