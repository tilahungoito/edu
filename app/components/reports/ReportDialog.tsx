import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { reportsService } from '@/app/lib/api/reports.service';

interface ReportDialogProps {
    open: boolean;
    onClose: () => void;
    reportType: {
        id: string;
        title: string;
        description: string;
    } | null;
    scopeId?: string;
    scopeType?: string;
}

export function ReportDialog({ open, onClose, reportType, scopeId, scopeType }: ReportDialogProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (open && reportType) {
            fetchReportData();
        }
    }, [open, reportType, scopeId, scopeType]);

    const fetchReportData = async () => {
        if (!reportType) return;
        setLoading(true);
        try {
            let result;
            switch (reportType.id) {
                case 'enrollment':
                    result = await reportsService.getEnrollmentStats(scopeType, scopeId);
                    break;
                case 'staff':
                    result = await reportsService.getStaffDistribution(scopeType, scopeId);
                    break;
                case 'inventory':
                    result = await reportsService.getInventorySummary(scopeType, scopeId);
                    break;
                case 'budget':
                    result = await reportsService.getBudgetSummary(scopeType, scopeId);
                    break;
            }
            setData(result);
        } catch (err) {
            console.error('Failed to fetch report:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (!data) return <Typography color="text.secondary">No data found for this report.</Typography>;

        switch (reportType?.id) {
            case 'enrollment':
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Enrollment Overview</Typography>
                        <Grid container spacing={2}>
                            {data.kpis?.map((kpi: any, i: number) => (
                                <Grid size={{ xs: 6, md: 3 }} key={i}>
                                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                                        <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                                        <Typography variant="h5" fontWeight={700}>{kpi.value}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                        {/* More detailed table or charts could go here */}
                    </Box>
                );
            case 'staff':
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Staff Distribution Breakdown</Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'action.hover' }}>
                                    <TableRow>
                                        <TableCell>Role</TableCell>
                                        <TableCell align="right">Count</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.distribution?.map((row: any, i: number) => (
                                        <TableRow key={i}>
                                            <TableCell>{row.role}</TableCell>
                                            <TableCell align="right">{row.count}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                                        <TableCell>Total Staff</TableCell>
                                        <TableCell align="right">{data.totalStaff}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2, opacity: 0.9 }}>
                            <Typography variant="subtitle2">Student-to-Teacher Ratio: <strong>{data.studentTeacherRatio}:1</strong></Typography>
                        </Box>
                    </Box>
                );
            // Add other cases as needed
            default:
                return <pre style={{ overflow: 'auto' }}>{JSON.stringify(data, null, 2)}</pre>;
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{reportType?.title}</Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {renderContent()}
            </DialogContent>
            <DialogActions>
                <Button startIcon={<DownloadIcon />}>Export PDF</Button>
                <Button startIcon={<PrintIcon />}>Print</Button>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
}
