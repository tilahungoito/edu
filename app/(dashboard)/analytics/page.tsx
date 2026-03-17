'use client';

import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    People as PeopleIcon,
    Analytics as AnalyticsIcon,
    BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const analyticsCards = [
    {
        title: 'Performance Analytics',
        description: 'In-depth analysis of regional educational performance and test scores.',
        icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
        color: '#6366f1',
        href: '/analytics/performance',
    },
    {
        title: 'Enrollment Analytics',
        description: 'Enrollment trends over time across regions, zones, and institutions.',
        icon: <PeopleIcon sx={{ fontSize: 40 }} />,
        color: '#10b981',
        href: '/analytics/enrollment',
    },
];

export default function AnalyticsOverviewPage() {
    const router = useRouter();

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <AnalyticsIcon sx={{ fontSize: 32, color: '#f59e0b' }} />
                    <Typography variant="h4" fontWeight={700}>
                        Analytics
                    </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                    Explore data insights across performance, enrollment, and system-wide metrics.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {analyticsCards.map((card) => (
                    <Grid item xs={12} md={6} key={card.title} {...{ item: true, xs: 12, md: 6 } as any}>
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
                                    boxShadow: `0 12px 40px ${card.color}22`,
                                    borderColor: card.color,
                                },
                            }}
                        >
                            <CardActionArea sx={{ height: '100%' }} onClick={() => router.push(card.href)}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box
                                        sx={{
                                            mb: 2.5,
                                            width: 64,
                                            height: 64,
                                            borderRadius: 2,
                                            backgroundColor: `${card.color}18`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: card.color,
                                        }}
                                    >
                                        {card.icon}
                                    </Box>
                                    <Typography variant="h6" fontWeight={700} gutterBottom>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {card.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}

                {/* Summary stat */}
                <Grid item xs={12} {...{ item: true, xs: 12 } as any}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid', borderColor: 'divider' }}>
                        <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <BarChartIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Analytics Hub
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Select an analytics module above to dive into detailed insights and reports.
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
