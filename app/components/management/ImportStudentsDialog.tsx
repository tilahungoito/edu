'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    LinearProgress,
    Alert,
    alpha,
    useTheme,
    IconButton,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    Close as CloseIcon,
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import studentsService from '@/app/lib/api/students.service';

interface ImportStudentsDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    institutionId: string;
}

export function ImportStudentsDialog({ open, onClose, onSuccess, institutionId }: ImportStudentsDialogProps) {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setResults(null);
            setProgress(0);
        }
    };

    const downloadTemplate = () => {
        const headers = ['firstName', 'lastName', 'email', 'program', 'year', 'gender'];
        const sample = ['John', 'Doe', 'john.doe@example.com', 'Natural Science', '10', 'MALE'];
        const csvContent = [headers, sample].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "student_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = async () => {
        if (!file) return;

        setIsImporting(true);
        setResults(null);
        setProgress(0);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1).filter(r => r.trim()); // Skip header
            
            let successCount = 0;
            let failedCount = 0;
            const errors: string[] = [];

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const parts = row.split(',').map(s => s.trim());
                if (parts.length < 5) continue;

                const [firstName, lastName, email, program, year, gender] = parts;
                
                try {
                    await studentsService.create({
                        firstName,
                        lastName,
                        email,
                        program,
                        year: parseInt(year) || 1,
                        gender: (gender?.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE') as any,
                        institutionId
                    });
                    successCount++;
                } catch (err: any) {
                    failedCount++;
                    errors.push(`Row ${i + 2}: ${err.response?.data?.message || err.message}`);
                }
                setProgress(Math.round(((i + 1) / rows.length) * 100));
            }

            setResults({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) }); // Limit errors shown
            setIsImporting(false);
            if (successCount > 0) onSuccess();
        };
        reader.readAsText(file);
    };

    const handleClose = () => {
        if (isImporting) return;
        setFile(null);
        setResults(null);
        setProgress(0);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle component="div" sx={{ m: 0, p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" fontWeight={800}>Bulk Import Students</Typography>
                <IconButton onClick={handleClose} disabled={isImporting} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ p: 3 }}>
                {!results && !isImporting && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Upload a CSV file to register multiple students at once. You can download our template to ensure the format is correct.
                        </Typography>
                        <Button 
                            startIcon={<DownloadIcon />} 
                            onClick={downloadTemplate}
                            sx={{ mb: 3, fontWeight: 700 }}
                        >
                            Download CSV Template
                        </Button>

                        <Paper 
                            variant="outlined" 
                            sx={{ 
                                p: 4, 
                                textAlign: 'center', 
                                borderStyle: 'dashed', 
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                cursor: 'pointer',
                                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                            }}
                            onClick={() => document.getElementById('bulk-import-input')?.click()}
                        >
                            <input
                                type="file"
                                id="bulk-import-input"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                            <Typography variant="subtitle1" fontWeight={700}>
                                {file ? file.name : 'Click to select or drag & drop CSV'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Supported format: .CSV (Max 5MB)
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {isImporting && (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography variant="h6" fontWeight={700} gutterBottom>Importing Data...</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Processing student records. Please do not close this window.
                        </Typography>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                        <Typography variant="caption" fontWeight={800} color="primary.main">{progress}% Complete</Typography>
                    </Box>
                )}

                {results && (
                    <Box>
                        <Alert 
                            severity={results.failed === 0 ? "success" : "warning"} 
                            sx={{ mb: 3, borderRadius: 2 }}
                            icon={results.failed === 0 ? <SuccessIcon /> : <InfoIcon />}
                        >
                            <Typography variant="subtitle2" fontWeight={800}>Import Complete</Typography>
                            <Typography variant="body2">
                                {results.success} students imported successfully. {results.failed} records failed.
                            </Typography>
                        </Alert>

                        {results.errors.length > 0 && (
                            <Box>
                                <Typography variant="caption" fontWeight={800} color="error.main" sx={{ textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                    Error Logs (First 10)
                                </Typography>
                                <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', bgcolor: alpha(theme.palette.error.main, 0.02) }}>
                                    <List dense>
                                        {results.errors.map((err, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemIcon sx={{ minWidth: 32 }}><ErrorIcon color="error" sx={{ fontSize: 16 }} /></ListItemIcon>
                                                <ListItemText primary={err} primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                <Button onClick={handleClose} disabled={isImporting} color="inherit" sx={{ fontWeight: 600 }}>
                    {results ? 'Close' : 'Cancel'}
                </Button>
                {!results && (
                    <Button 
                        onClick={handleImport} 
                        variant="contained" 
                        disabled={!file || isImporting}
                        sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
                    >
                        Start Import
                    </Button>
                )}
                {results && (
                     <Button 
                        onClick={() => { setResults(null); setFile(null); }} 
                        variant="outlined" 
                        sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
                    >
                        Import Another
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
