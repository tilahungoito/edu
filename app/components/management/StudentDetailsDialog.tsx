'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Avatar,
    Chip,
    Divider,
    Paper,
    alpha,
    useTheme,
    IconButton,
} from '@mui/material';
import {
    Close as CloseIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';

interface StudentDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    student: any; // Using any for enriched properties
}

export function StudentDetailsDialog({ open, onClose, student }: StudentDetailsDialogProps) {
    const theme = useTheme();

    if (!student) return null;

    const fullName = `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim() || student.user?.username;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle component="div" sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={800}>Academic Profile</Typography>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 0 }}>
                {/* Header Section */}
                <Box sx={{ p: 4, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid size={{xs:2}}>
                            <Avatar sx={{ width: 100, height: 100, fontSize: '2.5rem', bgcolor: 'primary.main', fontWeight: 700 }}>
                                {fullName?.[0]}
                            </Avatar>
                        </Grid>
                        <Grid size={{xs:10}}>
                            <Typography variant="h4" fontWeight={900} gutterBottom>{fullName}</Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label={`Grade ${student.year}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.secondary.main, 0.1), color: 'secondary.main' }} />
                                <Chip label={student.program} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                <Chip label={student.section?.name || 'Unassigned'} size="small" sx={{ fontWeight: 700, bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }} />
                                <Chip label={student.user?.isActive ? 'Active' : 'Inactive'} color={student.user?.isActive ? 'success' : 'error'} size="small" sx={{ fontWeight: 700 }} />
                            </Box>
                        </Grid>
                        <Grid size={{xs:2}}>
                           {student.rank && (
                               <Paper elevation={0} sx={{ p: 2, textAlign: 'center', borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: 'background.paper' }}>
                                   <Typography variant="caption" color="text.secondary" fontWeight={800} display="block">RANK</Typography>
                                   <Typography variant="h4" fontWeight={900} color="primary.main">#{student.rank}</Typography>
                                   <Typography variant="caption" fontWeight={700} sx={{ color: student.rank_trend > 0 ? 'success.main' : student.rank_trend < 0 ? 'error.main' : 'text.disabled' }}>
                                       {student.rank_trend > 0 ? `↑ ${student.rank_trend}` : student.rank_trend < 0 ? `↓ ${Math.abs(student.rank_trend)}` : 'Steady'}
                                   </Typography>
                               </Paper>
                           )}
                        </Grid>
                    </Grid>
                </Box>

                <Grid container spacing={0}>
                    {/* Left Column: Personal Info & Contact */}
                    <Grid size={{xs:12, md:4}} sx={{ borderRight: { md: `1px solid ${theme.palette.divider}` }, p: 4 }}>
                        <Typography variant="overline" color="text.disabled" fontWeight={800} gutterBottom display="block">Contact Information</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <EmailIcon color="disabled" fontSize="small" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>{student.user?.email || 'N/A'}</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <PhoneIcon color="disabled" fontSize="small" />
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">Phone Number</Typography>
                                    <Typography variant="body2" fontWeight={600}>{student.user?.phone || 'N/A'}</Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Typography variant="overline" color="text.disabled" fontWeight={800} gutterBottom display="block">Institutional Details</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                             <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Institution</Typography>
                                <Typography variant="body2" fontWeight={600}>{student.institution?.name || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">Student ID</Typography>
                                <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>#{student.id.slice(0, 8).toUpperCase()}</Typography>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Performance & History */}
                    <Grid size={{xs:12, md:8}} sx={{ p: 4 }}>
                        <Typography variant="overline" color="text.disabled" fontWeight={800} gutterBottom display="block">Academic Performance</Typography>
                        <Grid container spacing={2} sx={{ mb: 4 }}>
                            <Grid size ={{xs:6, sm:4}}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, borderRadius: 3 }}>
                                    <Typography variant="caption" color="info.main" fontWeight={800} display="block">AVERAGE</Typography>
                                    <Typography variant="h5" fontWeight={900}>{student.calculated_avg?.toFixed(1) || '0.0'}%</Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{xs:6, sm:4}}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`, borderRadius: 3 }}>
                                    <Typography variant="caption" color="warning.main" fontWeight={800} display="block">PERCENTILE</Typography>
                                    <Typography variant="h5" fontWeight={900}>P{Math.floor(student.percentile || 0)}</Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{xs:12, sm:4}}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05), border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`, borderRadius: 3 }}>
                                    <Typography variant="caption" color="secondary.main" fontWeight={800} display="block">STANDING</Typography>
                                    <Typography variant="subtitle1" fontWeight={900} noWrap>{student.performance_cat?.replace(/_/g, ' ')}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        <Typography variant="overline" color="text.disabled" fontWeight={800} gutterBottom display="block">Academic History</Typography>
                        <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: theme.palette.action.hover }}>
                                    <tr>
                                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>Period</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>Average</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>Rank</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 700 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(student.academicHistories || []).length > 0 ? (
                                        [...student.academicHistories].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((h: any) => (
                                            <tr key={h.id} style={{ borderTop: `1px solid ${theme.palette.divider}` }}>
                                                <td style={{ padding: '12px' }}>
                                                    <Typography variant="body2" fontWeight={600}>{h.academicPeriod?.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">Grade {h.gradeLevel}</Typography>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <Typography variant="body2" fontWeight={700}>{h.finalAverage?.toFixed(1) || '-'}%</Typography>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <Typography variant="body2" fontWeight={700}>{h.rank ? `#${h.rank}` : '-'}</Typography>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                                    <Chip 
                                                        label={h.promotionStatus} 
                                                        size="small" 
                                                        color={h.promotionStatus === 'PASS' ? 'success' : h.promotionStatus === 'DETAINED' ? 'error' : 'default'}
                                                        sx={{ fontWeight: 800, fontSize: '10px' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center' }}>
                                                <Typography variant="body2" color="text.disabled">No academic history records found.</Typography>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}>Close Record</Button>
            </DialogActions>
        </Dialog>
    );
}
