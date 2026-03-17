'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Paper,
    Divider,
} from '@mui/material';
import {
    Description as ReportIcon,
    Assessment as AssessmentIcon,
    TrendingUp as TrendingIcon,
    FilterAlt as FilterIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { ReportDialog } from '@/app/components/reports/ReportDialog';

const reportTypes = [
    { id: 'enrollment', title: 'Annual Enrollment Report', description: 'Comprehensive student data across all zones.', icon: <TrendingIcon color="primary" /> },
    { id: 'staff', title: 'Staff Distribution Analysis', description: 'Teacher-to-student ratios and staff demographics.', icon: <AssessmentIcon color="secondary" /> },
    { id: 'inventory', title: 'Inventory Utilization', description: 'Tracking asset condition and distribution efficiency.', icon: <ReportIcon color="success" /> },
    { id: 'budget', title: 'Budget Execution Summary', description: 'Allocated vs. spent budget per administrative level.', icon: <TrendingIcon color="warning" /> },
];

export default function ReportsPage() {
    const { user } = useAuthStore();
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    // Filters
    const [scopeType, setScopeType] = useState(user?.scopeType || 'SYSTEM');
    const [scopeId, setScopeId] = useState(user?.scopeId || '');
    const [period, setPeriod] = useState('2025/26 Semester I');

    const handleGenerate = (report: any) => {
        setSelectedReport(report);
        setDialogOpen(true);
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Report Generator
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Generate detailed PDF/Excel reports from system data
                    </Typography>
                </Box>
                
                <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 3 }}>
                    <FilterIcon color="action" />
                    <TextField
                        select
                        size="small"
                        label="Period"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="2024/25 Semester I">2024/25 Semester I</MenuItem>
                        <MenuItem value="2024/25 Semester II">2024/25 Semester II</MenuItem>
                        <MenuItem value="2025/26 Semester I">2025/26 Semester I</MenuItem>
                    </TextField>
                    
                    <TextField
                        select
                        size="small"
                        label="Scope"
                        value={scopeType}
                        onChange={(e) => setScopeType(e.target.value)}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="SYSTEM">System Wide</MenuItem>
                        <MenuItem value="REGION">Region</MenuItem>
                        <MenuItem value="ZONE">Zone</MenuItem>
                        <MenuItem value="WOREDA">Woreda</MenuItem>
                        <MenuItem value="INSTITUTION">Institution</MenuItem>
                    </TextField>
                </Paper>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
                {reportTypes.map((report, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                        <Card sx={{ 
                            height: '100%', 
                            borderRadius: 3, 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
                            transition: 'all 0.3s',
                            '&:hover': { 
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                            } 
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ 
                                    mb: 2, 
                                    p: 1.5, 
                                    borderRadius: 2, 
                                    backgroundColor: 'primary.light', 
                                    display: 'inline-flex',
                                    color: 'primary.main'
                                }}>
                                    {report.icon}
                                </Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    {report.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    {report.description}
                                </Typography>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    fullWidth
                                    onClick={() => handleGenerate(report)}
                                    startIcon={<SearchIcon />}
                                >
                                    Generate Report
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {selectedReport && (
                <ReportDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    reportType={selectedReport}
                    scopeType={scopeType}
                    scopeId={scopeId}
                />
            )}
        </Box>
    );
}
