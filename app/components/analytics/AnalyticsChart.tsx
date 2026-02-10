'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    useTheme,
    alpha,
    Skeleton,
} from '@mui/material';
import {
    MoreVert as MoreIcon,
    Download as DownloadIcon,
    Fullscreen as FullscreenIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

export type ChartType = 'line' | 'bar' | 'pie' | 'area';

interface ChartDataPoint {
    name: string;
    value?: number;
    [key: string]: string | number | undefined;
}

interface AnalyticsChartProps {
    title: string;
    subtitle?: string;
    data: ChartDataPoint[];
    type?: ChartType;
    dataKeys?: string[];
    colors?: string[];
    loading?: boolean;
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    onExport?: () => void;
    onRefresh?: () => void;
}

const DEFAULT_COLORS = [
    '#1565C0', // Blue
    '#2E7D32', // Green
    '#F57C00', // Orange
    '#7B1FA2', // Purple
    '#C62828', // Red
    '#00838F', // Cyan
];

export function AnalyticsChart({
    title,
    subtitle,
    data,
    type = 'line',
    dataKeys = ['value'],
    colors = DEFAULT_COLORS,
    loading = false,
    height = 300,
    showLegend = true,
    showGrid = true,
    onExport,
    onRefresh,
}: AnalyticsChartProps) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <LineChart data={data}>
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={alpha(theme.palette.text.primary, 0.1)}
                                />
                            )}
                            <XAxis
                                dataKey="name"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8,
                                    boxShadow: theme.shadows[3],
                                }}
                            />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <BarChart data={data}>
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={alpha(theme.palette.text.primary, 0.1)}
                                />
                            )}
                            <XAxis
                                dataKey="name"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8,
                                    boxShadow: theme.shadows[3],
                                }}
                            />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={colors[index % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <AreaChart data={data}>
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke={alpha(theme.palette.text.primary, 0.1)}
                                />
                            )}
                            <XAxis
                                dataKey="name"
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8,
                                    boxShadow: theme.shadows[3],
                                }}
                            />
                            {showLegend && <Legend />}
                            {dataKeys.map((key, index) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colors[index % colors.length]}
                                    fill={alpha(colors[index % colors.length], 0.2)}
                                    strokeWidth={2}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={height}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
                                }
                                labelLine={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={colors[index % colors.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme.palette.background.paper,
                                    border: `1px solid ${theme.palette.divider}`,
                                    borderRadius: 8,
                                    boxShadow: theme.shadows[3],
                                }}
                            />
                            {showLegend && <Legend />}
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
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
                <CardHeader
                    title={<Skeleton width="40%" />}
                    subheader={<Skeleton width="20%" />}
                />
                <CardContent>
                    <Skeleton variant="rectangular" height={height} />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            sx={{
                height: '100%',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
        >
            <CardHeader
                title={
                    <Typography variant="h6" fontWeight={600}>
                        {title}
                    </Typography>
                }
                subheader={subtitle}
                action={
                    <Box>
                        <IconButton size="small" onClick={onRefresh}>
                            <RefreshIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={handleMenuOpen}>
                            <MoreIcon fontSize="small" />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => { handleMenuClose(); onExport?.(); }}>
                                <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                                Export
                            </MenuItem>
                            <MenuItem onClick={handleMenuClose}>
                                <FullscreenIcon fontSize="small" sx={{ mr: 1 }} />
                                Fullscreen
                            </MenuItem>
                        </Menu>
                    </Box>
                }
                sx={{ pb: 0 }}
            />
            <CardContent>
                {renderChart()}
            </CardContent>
        </Card>
    );
}

export default AnalyticsChart;
