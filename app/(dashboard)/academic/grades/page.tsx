'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
    MenuItem,
    Button,
    Chip,
    Avatar,
    CircularProgress,
    alpha,
    useTheme,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import {
    Assessment as GradesIcon,
    Save as SaveIcon,
    Add as AddIcon,
    UploadFile as UploadIcon,
    Info as InfoIcon,
    CheckCircle as CheckIcon,
    Download as DownloadIcon,
    School as SchoolIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar, getGridNumericOperators, GridFilterOperator } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';

import coursesService from '@/app/lib/api/courses.service';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import assessmentsService, { Assessment, AssessmentScore } from '@/app/lib/api/assessments.service';
import { gradesService } from '@/app/lib/api/grades.service';
import { useAuthStore } from '@/app/lib/store';

const ASSESSMENT_TYPES = ['QUIZ', 'ASSIGNMENT', 'HOMEWORK', 'PRACTICAL', 'CLASS_PARTICIPATION', 'MIDTERM_EXAM', 'FINAL_EXAM'];

// --- Custom Numeric Filter (Between) ---
function BetweenFilterInput(props: any) {
    const { item, applyValue, focusElementRef } = props;
    const min = item.value?.[0] ?? '';
    const max = item.value?.[1] ?? '';

    return (
        <Box sx={{ display: 'flex', gap: 1, p: 1, minWidth: 200 }}>
            <TextField 
                size="small" 
                placeholder="Min" 
                type="number" 
                value={min} 
                onChange={(e) => applyValue({ ...item, value: [e.target.value, max] })} 
                inputRef={focusElementRef} 
            />
            <TextField 
                size="small" 
                placeholder="Max" 
                type="number" 
                value={max} 
                onChange={(e) => applyValue({ ...item, value: [min, e.target.value] })} 
            />
        </Box>
    );
}

const customNumericOperators: GridFilterOperator<any, number, any>[] = [
    ...(getGridNumericOperators() as any),
    {
        label: 'Between',
        value: 'between',
        getApplyFilterFn: (filterItem) => {
            if (!Array.isArray(filterItem.value) || filterItem.value.length !== 2) {
                return null;
            }
            const minStr = filterItem.value[0];
            const maxStr = filterItem.value[1];
            if (minStr == null || minStr === '' || maxStr == null || maxStr === '') {
                return null;
            }
            const min = Number(minStr);
            const max = Number(maxStr);
            return (value: any) => {
                if (value == null) return false;
                return Number(value) >= min && Number(value) <= max;
            };
        },
        InputComponent: BetweenFilterInput,
    }
];

// --- Helper Functions ---
const calculateGradeLetter = (totalScore: number) => {
    if (totalScore >= 90) return 'A+';
    if (totalScore >= 85) return 'A';
    if (totalScore >= 80) return 'A-';
    if (totalScore >= 75) return 'B+';
    if (totalScore >= 70) return 'B';
    if (totalScore >= 65) return 'B-';
    if (totalScore >= 60) return 'C+';
    if (totalScore >= 50) return 'C';
    if (totalScore >= 40) return 'D';
    return 'F';
};

// Local component to prevent focus loss during inline editing
function ScoreInputCell({ initialValue, maxScore, onChangeCommit }: { initialValue: string | number, maxScore: number, onChangeCommit: (val: number | null) => void }) {
    const [val, setVal] = useState(initialValue);

    useEffect(() => {
        setVal(initialValue);
    }, [initialValue]);

    return (
        <Box sx={{ p: 0.5, width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
            <TextField
                variant="outlined"
                size="small"
                placeholder="-"
                value={val === '' || val === null ? '' : val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={() => {
                    let str = String(val);
                    if (str === '') {
                        onChangeCommit(null);
                        return;
                    }
                    let parsed = parseFloat(str);
                    if (!isNaN(parsed)) {
                        parsed = Math.min(Math.max(parsed, 0), maxScore);
                        setVal(parsed);
                        onChangeCommit(parsed);
                    } else {
                        setVal('');
                        onChangeCommit(null);
                    }
                }}
                sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 1.5 },
                    '& .MuiInputBase-input': { textAlign: 'center', p: '6px 8px', fontWeight: 700 }
                }}
            />
        </Box>
    );
}

export default function GradesPage() {
    const user = useAuthStore(state => state.user);
    const isStudent = user?.roles?.some(r => r.name === 'STUDENT');

    if (isStudent) {
        return <StudentTranscriptView />;
    }
    return <InstructorGradebookView />;
}

// ----------------------------------------------------------------------
// INSTRUCTOR GRADEBOOK VIEW (ADVANCED DATAGRID)
// ----------------------------------------------------------------------
function InstructorGradebookView() {
    const theme = useTheme();
    const queryClient = useQueryClient();
    const user = useAuthStore(state => state.user);
    
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [createAssessmentOpen, setCreateAssessmentOpen] = useState(false);
    const [csvImportOpen, setCsvImportOpen] = useState(false);
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState('');
    const [quickFilter, setQuickFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'F'>('ALL');
    
    const [scoreEdits, setScoreEdits] = useState<Record<string, Record<string, number>>>({}); // [assessmentId][enrollmentId] = score
    const [saving, setSaving] = useState(false);

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');
    const institutionId = user?.tenantType === 'school' ? user?.tenantId : undefined;

    // 1. Fetch Courses
    const { data: courses, isLoading: loadingCourses } = useQuery({
        queryKey: ['courses', user?.id],
        queryFn: () => coursesService.getAll({
            instructorId: isInstructor ? user?.id : undefined,
            institutionId
        }),
    });

    // Reset filter when course changes
    useEffect(() => {
        setQuickFilter('ALL');
    }, [selectedCourseId]);

    // 2. Fetch Enrollments (Rows)
    const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
        queryKey: ['enrollments', selectedCourseId],
        queryFn: () => enrollmentsService.getByCourse(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // 3. Fetch Assessments (Columns)
    const { data: assessments, isLoading: loadingAssessments } = useQuery({
        queryKey: ['assessments', selectedCourseId],
        queryFn: () => assessmentsService.getByCourse(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // 4. Fetch Scores for all assessments
    const { data: allScoresArray, isLoading: loadingScores } = useQuery({
        queryKey: ['assessment-scores-all', selectedCourseId, assessments?.map(a => a.id)],
        queryFn: async () => {
            if (!assessments) return [];
            const results = await Promise.all(
                assessments.map(a => assessmentsService.getScoresByAssessment(a.id).then(scores => ({ assessmentId: a.id, scores })))
            );
            return results;
        },
        enabled: !!selectedCourseId && !!assessments,
    });

    // Build the matrix of original scores
    const originalScores = useMemo(() => {
        const matrix: Record<string, Record<string, number>> = {};
        allScoresArray?.forEach(({ assessmentId, scores }) => {
            matrix[assessmentId] = {};
            scores.forEach(s => {
                matrix[assessmentId][s.enrollmentId] = s.score;
            });
        });
        return matrix;
    }, [allScoresArray]);

    const isLoadingGrid = loadingEnrollments || loadingAssessments || loadingScores;

    // Build Rows for DataGrid
    const rows = useMemo(() => {
        if (!enrollments) return [];
        return enrollments.map(e => {
            const row: any = {
                id: e.id,
                studentName: e.student?.user?.username || 'Unknown',
                studentId: e.studentId,
            };

            let totalWeighted = 0;

            // Add assessment columns and calculate total
            assessments?.forEach(a => {
                const origScore = originalScores[a.id]?.[e.id];
                const editedScore = scoreEdits[a.id]?.[e.id];
                const finalScore = editedScore !== undefined ? editedScore : origScore;
                
                row[a.id] = finalScore ?? '';

                if (finalScore !== undefined && typeof finalScore === 'number') {
                    // weight is percentage (e.g. 10 for 10%)
                    const weightFactor = a.weight / 100;
                    // convert score to percentage of maxScore, then apply weight
                    const percentage = (finalScore / a.maxScore) * 100;
                    totalWeighted += (percentage * weightFactor);
                }
            });

            row.totalScore = totalWeighted;
            row.letterGrade = calculateGradeLetter(totalWeighted);

            return row;
        });
    }, [enrollments, assessments, originalScores, scoreEdits]);

    // Compute Metrics & Filters
    const metrics = useMemo(() => {
        if (!rows.length) return null;
        let sum = 0;
        let max = 0;
        let min = 100;
        let countA = 0, countB = 0, countC = 0, countF = 0;
        
        rows.forEach(r => {
            const t = r.totalScore || 0;
            sum += t;
            if (t > max) max = t;
            if (t < min) min = t;
            if (t >= 85) countA++;
            else if (t >= 70) countB++;
            else if (t >= 50) countC++;
            else countF++;
        });

        return {
            average: parseFloat((sum / rows.length).toFixed(1)),
            max: parseFloat(max.toFixed(1)),
            min: rows.length > 0 ? parseFloat(min.toFixed(1)) : 0.0,
            countA, countB, countC, countF
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (quickFilter === 'ALL') return rows;
        return rows.filter(r => {
            const t = r.totalScore || 0;
            if (quickFilter === 'A') return t >= 85;
            if (quickFilter === 'B') return t >= 70 && t < 85;
            if (quickFilter === 'C') return t >= 50 && t < 70;
            if (quickFilter === 'F') return t < 50;
            return true;
        });
    }, [rows, quickFilter]);

    // Build Columns for DataGrid
    const columns = useMemo<GridColDef[]>(() => {
        const cols: GridColDef[] = [
            {
                field: 'studentName',
                headerName: 'Student Name',
                width: 200,
                renderCell: (params: GridRenderCellParams) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '12px', bgcolor: theme.palette.primary.main }}>
                            {String(params.value).charAt(0)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
                    </Box>
                )
            },
            {
                field: 'studentId',
                headerName: 'Student ID',
                width: 150,
                renderCell: (params: GridRenderCellParams) => (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {String(params.value).substring(0, 13).toUpperCase()}
                    </Typography>
                )
            }
        ];

        // Dynamic columns for assessments
        assessments?.forEach(a => {
            cols.push({
                field: a.id,
                headerName: `${a.title} (${a.weight}%)`,
                width: 140,
                sortable: false,
                type: 'number',
                filterOperators: customNumericOperators as any,
                renderCell: (params: GridRenderCellParams) => (
                    <ScoreInputCell 
                        initialValue={params.value as any} 
                        maxScore={a.maxScore} 
                        onChangeCommit={(newVal) => {
                            setScoreEdits(prev => ({ 
                                ...prev, 
                                [a.id]: { ...(prev[a.id] || {}), [params.id as string]: newVal === null ? null! : newVal } 
                            }));
                        }} 
                    />
                ),
                renderHeader: () => (
                    <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '13px' }}>{a.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            Out of {a.maxScore} • {a.weight}%
                        </Typography>
                    </Box>
                ),
            });
        });

        // Computed columns
        cols.push({
            field: 'totalScore',
            headerName: 'Total (100%)',
            width: 110,
            type: 'number',
            filterOperators: customNumericOperators as any,
            valueFormatter: (value: number) => value.toFixed(1) + '%',
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" fontWeight={800} color={params.value >= 50 ? 'success.main' : 'error.main'}>
                    {Number(params.value).toFixed(1)}%
                </Typography>
            )
        });

        cols.push({
            field: 'letterGrade',
            headerName: 'Grade',
            width: 80,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => (
                <Chip 
                    label={params.value} 
                    size="small"
                    sx={{
                        fontWeight: 800,
                        bgcolor: ['A+','A','A-'].includes(params.value) ? alpha(theme.palette.success.main, 0.1) : 
                                 ['B+','B','B-'].includes(params.value) ? alpha(theme.palette.info.main, 0.1) :
                                 ['C+','C'].includes(params.value) ? alpha(theme.palette.warning.main, 0.1) :
                                 alpha(theme.palette.error.main, 0.1),
                        color: ['A+','A','A-'].includes(params.value) ? theme.palette.success.main : 
                               ['B+','B','B-'].includes(params.value) ? theme.palette.info.main :
                               ['C+','C'].includes(params.value) ? theme.palette.warning.main :
                               theme.palette.error.main,
                    }}
                />
            )
        });

        return cols;
    }, [assessments, theme]);

    // No processRowUpdate needed since we use controlled TextFields in renderCell
    const processRowUpdate = (newRow: any) => newRow;

    // Save All Changes
    const handleSave = async () => {
        setSaving(true);
        try {
            const promises: Promise<any>[] = [];
            
            for (const [assessmentId, enrollmentScores] of Object.entries(scoreEdits)) {
                const bulkData = [] as any[];
                for (const [enrollmentId, score] of Object.entries(enrollmentScores)) {
                    if (score !== undefined && score !== null && String(score) !== '') {
                        bulkData.push({ enrollmentId, score: Number(score) });
                    }
                }
                
                if (bulkData.length > 0) {
                    promises.push(assessmentsService.bulkRecordScores(assessmentId, { scores: bulkData }));
                }
            }
            
            await Promise.all(promises);
            setScoreEdits({});
            queryClient.invalidateQueries({ queryKey: ['assessment-scores-all'] });
            setImportSuccess('All grades saved successfully!');
            setTimeout(() => setImportSuccess(''), 4000);
        } catch (e) {
            setImportError('Failed to save grades.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header & Actions */}
            <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', xl: 'flex-end' }, gap: 2 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: 'flex' }}>
                            <GradesIcon />
                        </Box>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Professional Gradebook
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Manage assessments, record scores, and compute total grades
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                    <TextField
                        select
                        size="small"
                        label="Select Course"
                        value={selectedCourseId}
                        onChange={(e) => {
                            setSelectedCourseId(e.target.value);
                            setScoreEdits({});
                        }}
                        sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: 'background.paper' } }}
                    >
                        {!courses || courses.length === 0 ? (
                            <MenuItem value="" disabled><em>No courses assigned</em></MenuItem>
                        ) : (
                            courses.map((c: any) => (
                                <MenuItem key={c.id} value={c.id}>
                                    <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>({c.code})</Typography>
                                </MenuItem>
                            ))
                        )}
                    </TextField>

                    {selectedCourseId && (
                        <>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />} 
                                onClick={() => setCreateAssessmentOpen(true)}
                                sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                            >
                                New Assessment
                            </Button>
                            <Button 
                                variant="outlined" 
                                startIcon={<UploadIcon />} 
                                onClick={() => setCsvImportOpen(true)}
                                sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                            >
                                Import CSV
                            </Button>
                            <Button 
                                variant="contained" 
                                startIcon={<SaveIcon />}
                                disabled={Object.keys(scoreEdits).length === 0 || saving}
                                onClick={handleSave}
                                color="success"
                                sx={{ borderRadius: 2, height: 40, fontWeight: 800, px: 3, boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.25)}` }}
                            >
                                {saving ? 'Saving...' : 'Save Grades'}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {importSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{importSuccess}</Alert>}
            {importError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{importError}</Alert>}

            {/* Metrics & Quick Filters */}
            {selectedCourseId && metrics && rows.length > 0 && (
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Card elevation={0} sx={{ p: 2, minWidth: 140, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                        <Typography variant="overline" color="text.secondary">Class Average</Typography>
                        <Typography variant="h4" fontWeight={800} color={metrics.average >= 50 ? 'success.main' : 'error.main'}>{metrics.average}%</Typography>
                    </Card>
                    <Card elevation={0} sx={{ p: 2, minWidth: 140, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                        <Typography variant="overline" color="text.secondary">Highest Score</Typography>
                        <Typography variant="h4" fontWeight={800} color="primary.main">{metrics.max}%</Typography>
                    </Card>
                    <Card elevation={0} sx={{ p: 2, minWidth: 140, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                        <Typography variant="overline" color="text.secondary">Lowest Score</Typography>
                        <Typography variant="h4" fontWeight={800} color="error.main">{metrics.min}%</Typography>
                    </Card>
                    
                    <Box sx={{ flex: 1 }} />
                    
                    <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1 }}>Grade Distribution Filter</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip 
                                label={`All (${rows.length})`} 
                                onClick={() => setQuickFilter('ALL')} 
                                color={quickFilter === 'ALL' ? 'primary' : 'default'} 
                                variant={quickFilter === 'ALL' ? 'filled' : 'outlined'} 
                                sx={{ fontWeight: 700 }}
                            />
                            <Chip 
                                label={`A (>= 85%) • ${metrics.countA}`} 
                                onClick={() => setQuickFilter('A')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'A' ? 'success.main' : 'transparent', color: quickFilter === 'A' ? 'white' : 'success.main', borderColor: alpha(theme.palette.success.main, 0.5) }} 
                                variant={quickFilter === 'A' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`B (70 - 84%) • ${metrics.countB}`} 
                                onClick={() => setQuickFilter('B')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'B' ? 'info.main' : 'transparent', color: quickFilter === 'B' ? 'white' : 'info.main', borderColor: alpha(theme.palette.info.main, 0.5) }} 
                                variant={quickFilter === 'B' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`C (50 - 69%) • ${metrics.countC}`} 
                                onClick={() => setQuickFilter('C')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'C' ? 'warning.main' : 'transparent', color: quickFilter === 'C' ? 'white' : 'warning.main', borderColor: alpha(theme.palette.warning.main, 0.5) }} 
                                variant={quickFilter === 'C' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`Fail (< 50%) • ${metrics.countF}`} 
                                onClick={() => setQuickFilter('F')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'F' ? 'error.main' : 'transparent', color: quickFilter === 'F' ? 'white' : 'error.main', borderColor: alpha(theme.palette.error.main, 0.5) }} 
                                variant={quickFilter === 'F' ? 'filled' : 'outlined'} 
                            />
                        </Box>
                    </Card>
                </Box>
            )}

            {/* DataGrid Area */}
            <Card elevation={0} sx={{ flex: 1, minHeight: 600, border: `1px solid ${alpha(theme.palette.divider, 0.3)}`, borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedCourseId ? (
                    <Box sx={{ m: 'auto', textAlign: 'center', p: 4 }}>
                        <SchoolIcon sx={{ fontSize: 64, color: alpha(theme.palette.text.secondary, 0.2), mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" fontWeight={700}>Select a course to begin grading</Typography>
                    </Box>
                ) : (
                    <DataGrid
                        rows={filteredRows}
                        columns={columns}
                        loading={isLoadingGrid}
                        processRowUpdate={processRowUpdate}
                        onProcessRowUpdateError={(error) => console.error(error)}
                        slots={{ toolbar: GridToolbar }}
                        disableRowSelectionOnClick
                        density="comfortable"
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-columnHeaders': {
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                            },
                            '& .MuiDataGrid-cell': {
                                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            },
                            '& .MuiDataGrid-cell--editable': {
                                bgcolor: alpha(theme.palette.action.hover, 0.05),
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                },
                            }
                        }}
                    />
                )}
            </Card>

            {/* Dialogs */}
            <CreateAssessmentDialog 
                open={createAssessmentOpen} 
                onClose={() => setCreateAssessmentOpen(false)} 
                courseId={selectedCourseId}
                institutionId={institutionId || ''}
            />

            <CsvImportDialog 
                open={csvImportOpen}
                onClose={() => setCsvImportOpen(false)}
                assessments={assessments || []}
                enrollments={enrollments || []}
                onImport={(edits) => {
                    setScoreEdits(prev => {
                        const next = { ...prev };
                        for (const [aId, aEdits] of Object.entries(edits)) {
                            if (!next[aId]) next[aId] = {};
                            next[aId] = { ...next[aId], ...aEdits };
                        }
                        return next;
                    });
                    setImportSuccess('CSV parsed successfully. Review changes and click "Save Changes".');
                    setCsvImportOpen(false);
                }}
            />
        </Box>
    );
}

// ----------------------------------------------------------------------
// NEW ASSESSMENT DIALOG
// ----------------------------------------------------------------------
function CreateAssessmentDialog({ open, onClose, courseId, institutionId }: { open: boolean, onClose: () => void, courseId: string, institutionId: string }) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [type, setType] = useState('QUIZ');
    const [maxScore, setMaxScore] = useState(10);
    const [weight, setWeight] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!title || !courseId) return;
        setLoading(true);
        try {
            await assessmentsService.create({
                title, type: type as any, maxScore, weight, courseId, institutionId: institutionId || undefined
            } as any);
            queryClient.invalidateQueries({ queryKey: ['assessments', courseId] });
            onClose();
            setTitle('');
        } catch (e) {
            console.error('Failed to create assessment:', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Create New Assessment</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField fullWidth label="Assessment Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Midterm Exam" />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={type} label="Type" onChange={e => setType(e.target.value as string)}>
                                {ASSESSMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField fullWidth type="number" label="Max Score" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} helperText="Raw max score (e.g. 100)" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField fullWidth type="number" label="Weight (%)" value={weight} onChange={e => setWeight(Number(e.target.value))} helperText="Contribution to final grade" />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} sx={{ borderRadius: 2 }}>Cancel</Button>
                <Button variant="contained" onClick={handleCreate} disabled={loading || !title} sx={{ borderRadius: 2 }}>
                    {loading ? 'Creating...' : 'Create Assessment'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ----------------------------------------------------------------------
// CSV IMPORT DIALOG
// ----------------------------------------------------------------------
function CsvImportDialog({ open, onClose, assessments, enrollments, onImport }: { open: boolean, onClose: () => void, assessments: Assessment[], enrollments: any[], onImport: (edits: Record<string, Record<string, number>>) => void }) {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleImport = () => {
        if (!file) return;
        setError('');
        
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const edits: Record<string, Record<string, number>> = {};
                
                // Map Assessment Titles -> Assessment IDs
                const titleToId = {} as Record<string, string>;
                assessments.forEach(a => titleToId[a.title.trim().toLowerCase()] = a.id);

                let matchedStudents = 0;

                results.data.forEach((row: any) => {
                    // Match Student by ID
                    const studentId = row['StudentId'] || row['student_id'] || row['StudentID'] || row['ID'];
                    if (!studentId) return;

                    // Find enrollment for student
                    const enrollment = enrollments.find(e => String(e.studentId).toLowerCase().includes(String(studentId).toLowerCase()));
                    if (!enrollment) return;
                    matchedStudents++;

                    // Check columns against assessment titles
                    Object.keys(row).forEach(colName => {
                        const normalizedCol = colName.trim().toLowerCase();
                        if (titleToId[normalizedCol]) {
                            const aId = titleToId[normalizedCol];
                            const score = parseFloat(row[colName]);
                            if (!isNaN(score)) {
                                if (!edits[aId]) edits[aId] = {};
                                edits[aId][enrollment.id] = score;
                            }
                        }
                    });
                });

                if (matchedStudents === 0) {
                    setError('No students matched. Make sure your CSV has a "StudentId" column matching the IDs in the system.');
                    return;
                }
                onImport(edits);
            },
            error: (err) => {
                setError('Failed to parse CSV: ' + err.message);
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Import Grades via CSV</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Upload a CSV file in <strong>Wide Format</strong>.
                    <br/><br/>
                    1. Must contain a column named <strong>StudentId</strong>.<br/>
                    2. Add columns corresponding exactly to the <strong>Assessment Titles</strong> you created.<br/>
                    <br/>
                    <em>Example:</em><br/>
                    <code>StudentId, Quiz 1, Midterm Exam</code><br/>
                    <code>STD-001, 8.5, 45</code>
                </Alert>

                <Box sx={{ border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 3, p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="csv-upload" />
                    <label htmlFor="csv-upload">
                        <Button variant="outlined" component="span" startIcon={<UploadIcon />} sx={{ borderRadius: 2 }}>
                            {file ? file.name : 'Select CSV File'}
                        </Button>
                    </label>
                </Box>
                {error && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>{error}</Typography>}
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} sx={{ borderRadius: 2 }}>Cancel</Button>
                <Button variant="contained" onClick={handleImport} disabled={!file} sx={{ borderRadius: 2 }}>Import Data</Button>
            </DialogActions>
        </Dialog>
    );
}

// ----------------------------------------------------------------------
// STUDENT TRANSCRIPT VIEW (UNCHANGED)
// ----------------------------------------------------------------------
function StudentTranscriptView() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);

    const { data: transcript, isLoading } = useQuery({
        queryKey: ['transcript', user?.id],
        queryFn: () => gradesService.getTranscript(user?.id || ''),
        enabled: !!user?.id,
    });

    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            My Transcript
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Overall academic performance and full course history.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" sx={{ borderRadius: 2 }} startIcon={<DownloadIcon />}>Download PDF</Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <CardContent>
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: theme.palette.primary.main, fontSize: '2rem' }}>
                                    {user?.firstName?.charAt(0)}
                                </Avatar>
                                <Typography variant="h6" fontWeight={800}>{user?.firstName} {user?.lastName}</Typography>
                                <Typography variant="body2" color="text.secondary">Student ID: {user?.id.substring(0, 13).toUpperCase()}</Typography>
                            </Box>
                            <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04), p: 2, borderRadius: 3, textAlign: 'center' }}>
                                <Typography variant="overline" color="text.secondary" fontWeight={800}>Cumulative GPA</Typography>
                                <Typography variant="h3" color="primary" fontWeight={900}>{transcript?.gpa?.toFixed(2) || '0.00'}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ borderRadius: 4, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                        <CardContent sx={{ p: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                                        <th style={{ padding: 16 }}>Course</th>
                                        <th style={{ padding: 16 }}>Credits</th>
                                        <th style={{ padding: 16 }}>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transcript?.results?.map((result, index) => (
                                        <tr key={index} style={{ borderBottom: index < (transcript.results?.length ?? 0) - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none' }}>
                                            <td style={{ padding: 16 }}>
                                                <Typography variant="subtitle2" fontWeight={700}>{result.courseName}</Typography>
                                                <Typography variant="caption" color="text.secondary">{result.courseCode}</Typography>
                                            </td>
                                            <td style={{ padding: 16 }}>{result.credits}</td>
                                            <td style={{ padding: 16 }}>
                                                <Typography variant="body2" fontWeight={800} color="secondary">{result.grade}</Typography>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
