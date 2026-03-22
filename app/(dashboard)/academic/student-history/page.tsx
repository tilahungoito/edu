'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    Button,
    Avatar,
    Grid,
    CircularProgress,
    alpha,
    useTheme,
    Divider,
    Paper,
    Chip,
} from '@mui/material';
import {
    History as HistoryIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import promotionsService from '@/app/lib/api/promotions.service';
import studentsService from '@/app/lib/api/students.service';
import gradesService from '@/app/lib/api/grades.service';
import { useAuthStore } from '@/app/lib/store';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

export default function StudentHistoryPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const isStudent = user?.roles?.some(r => r.name === 'STUDENT');

    const [searchId, setSearchId] = useState<string>(isStudent ? user?.id || '' : '');
    const [targetStudentId, setTargetStudentId] = useState<string>(isStudent ? user?.id || '' : '');
    const [downloading, setDownloading] = useState(false);

    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ['student-history', targetStudentId],
        queryFn: () => promotionsService.getHistory(targetStudentId),
        enabled: !!targetStudentId,
    });

    const { data: transcript, isLoading: loadingTranscript } = useQuery({
        queryKey: ['student-transcript', targetStudentId],
        queryFn: () => gradesService.getTranscript(targetStudentId),
        enabled: !!targetStudentId,
    });

    const { data: student, isLoading: loadingStudent } = useQuery({
        queryKey: ['student-details', targetStudentId],
        queryFn: () => studentsService.getById(targetStudentId),
        enabled: !!targetStudentId,
    });

    const handleDownloadTranscript = async () => {
        if (!targetStudentId) return;
        setDownloading(true);
        try {
            await gradesService.downloadTranscriptPdf(targetStudentId, student?.user?.username || 'Student');
            toast.success('Transcript downloaded successfully');
        } catch (err) {
            console.error('Download failed:', err);
            toast.error('Failed to generate transcript');
        } finally {
            setDownloading(false);
        }
    };

    const handleSearch = () => {
        if (searchId) setTargetStudentId(searchId);
    };

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }} className="animate-fade-in">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Academic Timeline
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        View longitudinal progress and historical academic records.
                    </Typography>
                </Box>
                {!isStudent && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            size="small"
                            placeholder="Enter Student ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            sx={{ width: 250, '& .MuiInputBase-root': { borderRadius: 2 } }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                        >
                            Search
                        </Button>
                        {targetStudentId && (
                            <Button
                                variant="outlined"
                                onClick={handleDownloadTranscript}
                                disabled={downloading}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                                {downloading ? <CircularProgress size={20} /> : 'Record (PDF)'}
                            </Button>
                        )}
                    </Box>
                )}
                {isStudent && targetStudentId && (
                    <Button
                        variant="contained"
                        onClick={handleDownloadTranscript}
                        disabled={downloading}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                        {downloading ? <CircularProgress size={20} /> : 'Download Transcript'}
                    </Button>
                )}
            </Box>

            {!targetStudentId ? (
                <Box sx={{
                    height: 400, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 4, bgcolor: alpha(theme.palette.divider, 0.02)
                }}>
                    <SearchIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2, opacity: 0.3 }} />
                    <Typography color="text.secondary" fontWeight={600}>Enter a Student ID to view their timeline</Typography>
                </Box>
            ) : loadingHistory || loadingStudent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <Avatar sx={{
                                        width: 100, height: 100, mx: 'auto', mb: 2,
                                        bgcolor: theme.palette.primary.main, fontSize: '2.5rem',
                                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                                        fontWeight: 800
                                    }}>
                                        {student?.user?.username?.charAt(0).toUpperCase() || '?'}
                                    </Avatar>
                                    <Typography variant="h5" fontWeight={800}>{student?.user?.username || 'Student'}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                                        {student?.id.toUpperCase()}
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 3 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Current Status</Typography>
                                        <Chip label={`Year ${student?.year || 'N/A'}`} size="small" color="secondary" variant="soft" sx={{ fontWeight: 800 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Cumulative GPA</Typography>
                                        <Typography variant="body1" fontWeight={800} color="primary">
                                            {loadingTranscript ? <CircularProgress size={12} /> : (transcript?.gpa?.toFixed(2) || '0.00')}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Total Credits</Typography>
                                        <Typography variant="body2" fontWeight={800}>
                                            {transcript?.results?.reduce((acc: number, r: any) => acc + (r.credits || 0), 0) || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Performance Chart */}
                        {history && history.length > 0 && (
                            <Card sx={{ mt: 2, borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                                <CardContent>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                                        GPA Progress
                                    </Typography>
                                    <Box sx={{ height: 180, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={[...history].reverse()}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.1)} />
                                                <XAxis dataKey="gradeLevel" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    labelFormatter={(label) => `Grade ${label}`}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="finalAverage" 
                                                    stroke={theme.palette.primary.main} 
                                                    strokeWidth={3} 
                                                    dot={{ r: 4, fill: theme.palette.primary.main }} 
                                                    activeDot={{ r: 6 }} 
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box sx={{ position: 'relative', pl: { xs: 2, md: 4 } }}>
                            {/* Vertical Line */}
                            <Box sx={{
                                position: 'absolute', left: { xs: 15, md: 7 }, top: 0, bottom: 0,
                                width: 2, bgcolor: alpha(theme.palette.divider, 0.1),
                                '&::before': {
                                    content: '""', position: 'absolute', top: 0, left: -4,
                                    width: 10, height: 10, borderRadius: '50%', bgcolor: theme.palette.primary.main
                                }
                            }} />

                            {history?.map((entry: any) => (
                                <Box key={entry.id} sx={{ mb: 4, position: 'relative' }}>
                                    {/* Indicator Circle */}
                                    <Box sx={{
                                        position: 'absolute', left: { xs: -25, md: -33 }, top: 0,
                                        width: 16, height: 16, borderRadius: '50%',
                                        bgcolor: 'background.paper', border: `3px solid ${theme.palette.primary.main}`,
                                        zIndex: 1, boxShadow: theme.shadows[2]
                                    }} />

                                    <Paper sx={{
                                        p: 3, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                        '&:hover': { transform: 'translateX(8px)', bgcolor: alpha(theme.palette.primary.main, 0.01), transition: 'all 0.3s ease' }
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="primary" sx={{ lineHeight: 1.2 }}>
                                                    Grade {entry.gradeLevel} - Section {entry.sectionName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                    {entry.academicPeriod?.name || 'Academic Session'}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={entry.promotionStatus}
                                                color={entry.promotionStatus === 'PASS' ? 'success' : 'warning'}
                                                variant="soft"
                                                sx={{ fontWeight: 800, fontSize: '0.75rem' }}
                                            />
                                        </Box>

                                        <Divider sx={{ mb: 2, opacity: 0.5 }} />

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Box sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), p: 1.5, borderRadius: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                                                        Final Mark
                                                    </Typography>
                                                    <Typography variant="subtitle1" fontWeight={800}>
                                                        {entry.finalAverage ? `${entry.finalAverage}%` : 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 6, sm: 4 }}>
                                                <Box sx={{ bgcolor: alpha(theme.palette.action.hover, 0.5), p: 1.5, borderRadius: 2 }}>
                                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>
                                                        Date Archived
                                                    </Typography>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {new Date(entry.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Box>
                            ))}

                            {(!history || history.length === 0) && (
                                <Box sx={{ py: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary" fontWeight={500}>No historical academic records found.</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}
