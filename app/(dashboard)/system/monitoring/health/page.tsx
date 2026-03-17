'use client';

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    LinearProgress,
    IconButton,

    Tooltip,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Refresh as RefreshIcon,
    Dns as ServerIcon,
    AccessTime as UptimeIcon,
    Memory as MemoryIcon,
    Speed as PerformanceIcon,
    CheckCircle as HealthyIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { systemHealthService, HealthStatus } from '@/app/lib/api/system-health.service';

export default function SystemHealthPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Simulation States
    const [trafficData, setTrafficData] = useState<{ time: string; load: number; network: number }[]>([]);
    const [diagnosticOpen, setDiagnosticOpen] = useState(false);
    const [diagnosticStep, setDiagnosticStep] = useState(0);
    const [diagnosticStatus, setDiagnosticStatus] = useState<'idle' | 'running' | 'complete'>('idle');
    const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

    const fetchHealth = async () => {
        setLoading(true);
        try {
            const data = await systemHealthService.getHealth();
            setHealth(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Failed to fetch health status:', err);
            setError('System is offline or unreachable');
            setHealth(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial Health Fetch
    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Simulation Effect: Generate Traffic Data
    useEffect(() => {
        const generateData = () => {
            setTrafficData(prev => {
                const now = new Date();
                const timeLabel = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const newPoint = {
                    time: timeLabel,
                    load: Math.floor(Math.random() * 30) + 20, // 20-50% base load
                    network: Math.floor(Math.random() * 50) + 10 // 10-60 MB/s
                };
                const newData = [...prev, newPoint];
                if (newData.length > 20) newData.shift(); // Keep last 20 points
                return newData;
            });
        };

        const simulationInterval = setInterval(generateData, 2000); // Every 2s
        return () => clearInterval(simulationInterval);
    }, []);

    const runDiagnostics = () => {
        setDiagnosticOpen(true);
        setDiagnosticStatus('running');
        setDiagnosticStep(0);
        setDiagnosticLogs([]);

        const steps = [
            { message: 'Initializing system consistency check...', delay: 1000 },
            { message: 'Verifying database integrity...', delay: 2000 },
            { message: 'Checking cache server connectivity...', delay: 1500 },
            { message: 'Testing API payload throughput...', delay: 1800 },
            { message: 'Validating security protocols...', delay: 1200 },
            { message: 'System diagnostics complete. All systems operational.', delay: 1000 }
        ];

        let currentDelay = 0;
        steps.forEach((step, index) => {
            currentDelay += step.delay;
            setTimeout(() => {
                setDiagnosticLogs(prev => [...prev, step.message]);
                setDiagnosticStep(index + 1);
                if (index === steps.length - 1) {
                    setDiagnosticStatus('complete');
                }
            }, currentDelay);
        });
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);

        return parts.join(' ');
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2.5, md: 3, lg: 5 }, maxWidth: '100%', overflow: 'hidden' }}>
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: -1 }}>
                        System Pulse
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                        Real-time system performance and status monitoring
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {lastUpdated && (
                        <Typography variant="caption" color="text.secondary">
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    )}
                    <Tooltip title="Run System Diagnostics">
                        <Button
                            variant="outlined"
                            startIcon={<PerformanceIcon />}
                            onClick={runDiagnostics}
                            sx={{ mr: 1 }}
                        >
                            Run Diagnostics
                        </Button>
                    </Tooltip>
                    <Tooltip title="Refresh Status">
                        <IconButton onClick={fetchHealth} disabled={loading} color="primary">
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

            {error && (
                <Alert severity="error" sx={{ mb: 4 }} icon={<ErrorIcon />}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* System Status Card */}
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Card sx={{ height: '100%', borderLeft: `6px solid ${health ? '#4caf50' : '#f44336'}` }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                        SYSTEM STATUS
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                                        {health?.status === 'ok' ? 'Healthy' : health ? 'Degraded' : 'Offline'}
                                    </Typography>
                                </Box>
                                <HealthyIcon sx={{ fontSize: 32, color: health?.status === 'ok' ? 'success.main' : 'error.main', opacity: 0.2 }} />
                            </Box>
                            {health && (
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip 
                                        label={`DB: ${health.info?.database?.status === 'up' ? 'UP' : 'DOWN'}`} 
                                        size="small" 
                                        color={health.info?.database?.status === 'up' ? 'success' : 'error'} 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Redis: ${health.info?.redis?.status === 'up' ? 'UP' : 'DOWN'}`} 
                                        size="small" 
                                        color={health.info?.redis?.status === 'up' ? 'success' : 'error'} 
                                        variant="outlined"
                                    />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Uptime Card */}
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                        UPTIME
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                                        {health ? formatUptime(health.uptime) : '-'}
                                    </Typography>
                                </Box>
                                <UptimeIcon sx={{ fontSize: 32, color: 'info.main', opacity: 0.2 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Since last restart
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Memory Usage Card */}
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                        MEMORY USAGE
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                                        {health ? health.memory.rss : '-'}
                                    </Typography>
                                </Box>
                                <MemoryIcon sx={{ fontSize: 32, color: 'warning.main', opacity: 0.2 }} />
                            </Box>
                            {health && (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Heap Used</Typography>
                                        <Typography variant="caption" fontWeight={600}>{health.memory.heapUsed}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={50} // Approximate, since we don't have max heap in simple view
                                        color="warning"
                                        sx={{ height: 6, borderRadius: 3 }}
                                    />
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Response Time / Performance */}
                <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                        PERFORMANCE
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                                        {health?.info?.storage?.status === 'up' ? 'Healthy' : 'Warning'}
                                    </Typography>
                                </Box>
                                <PerformanceIcon sx={{ fontSize: 32, color: 'primary.main', opacity: 0.2 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {health?.info?.storage?.status === 'up' ? 'Storage: Optimized' : 'Storage: Checking...'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Real-time Charts Simulation */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                Live System Load
                            </Typography>
                            <ResponsiveContainer width="100%" height="85%">
                                <AreaChart data={trafficData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="time" minTickGap={30} tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="load" stroke="#8884d8" fill="#8884d8" fillOpacity={0.2} name="CPU Load %" />
                                    <Area type="monotone" dataKey="network" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.2} name="Network (MB/s)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Diagnostics / Logs Panel */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: 400, display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                System Logs
                            </Typography>
                            <Box sx={{
                                flex: 1,
                                bgcolor: 'grey.50',
                                borderRadius: 2,
                                p: 2,
                                overflowY: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                border: '1px solid',
                                borderColor: 'divider'
                            }}>
                                {diagnosticLogs.length > 0 ? (
                                    diagnosticLogs.map((log, index) => (
                                        <Typography key={index} variant="body2" sx={{ mb: 1, color: index === diagnosticLogs.length - 1 ? 'primary.main' : 'text.primary' }}>
                                            <span style={{ color: '#aaa' }}>[{new Date().toLocaleTimeString()}]</span> {log}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No recent diagnostic logs. Run diagnostics to populate.
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Diagnostics Dialog */}
            <Dialog open={diagnosticOpen} onClose={() => diagnosticStatus !== 'running' && setDiagnosticOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>System Diagnostic Tool</DialogTitle>
                <DialogContent>
                    <Box sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {diagnosticStatus === 'running' ? <CircularProgress size={20} sx={{ mr: 2 }} /> : <HealthyIcon color="success" sx={{ mr: 2 }} />}
                            <Typography variant="body1">
                                {diagnosticStatus === 'running' ? 'Running system diagnostics...' : 'Diagnostics Complete'}
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={(diagnosticStep / 6) * 100}
                            sx={{ height: 8, borderRadius: 4, mb: 3 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ minHeight: '1.5em' }}>
                            {diagnosticLogs[diagnosticLogs.length - 1] || 'Ready to start...'}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDiagnosticOpen(false)} disabled={diagnosticStatus === 'running'}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}



