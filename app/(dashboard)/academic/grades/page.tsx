'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    TextField,
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
    Tooltip,
    IconButton,
    MenuItem,
    ListItemIcon,
    ListItemText,
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
    LockOutlined as LockIcon,
    HourglassEmpty as PendingIcon,
    Send as SendIcon,
    ThumbUp as ApproveIcon,
    PictureAsPdf as PictureAsPdfIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar, getGridNumericOperators, GridFilterOperator, GridColumnMenu } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

import coursesService from '@/app/lib/api/courses.service';
import enrollmentsService from '@/app/lib/api/enrollments.service';
import assessmentsService, { Assessment, AssessmentScore } from '@/app/lib/api/assessments.service';
import { gradesService, GradeBookStatus } from '@/app/lib/api/grades.service';
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

// --- Custom Column Menu ---
function CustomColumnMenu(props: any) {
    const { hideMenu, colDef, assessments, setAssessmentToEdit, setEditAssessmentOpen, isInstructor, isGradebookLocked, ...otherProps } = props;
    
    const assessment = assessments?.find((a: any) => a.id === colDef.field);

    if (assessment && isInstructor && !isGradebookLocked) {
        return (
            <GridColumnMenu
                hideMenu={hideMenu}
                colDef={colDef}
                {...otherProps}
                slots={{
                    ...otherProps.slots,
                    columnMenuEditAssessment: (itemProps: any) => (
                        <MenuItem onClick={(e) => { hideMenu(e); setAssessmentToEdit(assessment); setEditAssessmentOpen(true); }}>
                            <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                            <ListItemText>Manage Assessment</ListItemText>
                        </MenuItem>
                    )
                }}
                slotProps={{
                    ...otherProps.slotProps,
                    columnMenuEditAssessment: { displayOrder: -1 }
                }}
            />
        );
    }

    return <GridColumnMenu hideMenu={hideMenu} colDef={colDef} {...otherProps} />;
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

// --- Grade categorisation matching Ethiopian spec ---
const calculateGradeCategory = (score: number): { letter: string; category: string; } => {
    if (score >= 90) return { letter: 'A+', category: 'Excellent' };
    if (score >= 75) return { letter: 'A',  category: 'Very Good' };
    if (score >= 50) return { letter: 'B',  category: 'Satisfactory' };
    if (score >= 30) return { letter: 'C',  category: 'Needs Improvement' };
    return                  { letter: 'F',  category: 'Fail' };
};

// legacy helper alias used in existing code
const calculateGradeLetter = (score: number) => calculateGradeCategory(score).category;

// Status badge helper
const GradeBookStatusBadge = ({ status }: { status: GradeBookStatus | null }) => {
    const theme = useTheme();
    if (!status || status === 'DRAFT') return (
        <Chip icon={<SchoolIcon />} label="Draft — Enter scores" size="small" color="default" variant="outlined" sx={{ fontWeight: 700 }} />
    );
    if (status === 'PENDING_REVIEW') return (
        <Chip icon={<PendingIcon />} label="Pending Review" size="small" color="warning" sx={{ fontWeight: 700 }} />
    );
    if (status === 'APPROVED') return (
        <Chip icon={<CheckIcon />} label="Approved" size="small" color="success" sx={{ fontWeight: 700 }} />
    );
    if (status === 'LOCKED') return (
        <Chip icon={<LockIcon />} label="Locked" size="small" color="error" sx={{ fontWeight: 700 }} />
    );
    return null;
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
    const [editAssessmentOpen, setEditAssessmentOpen] = useState(false);
    const [assessmentToEdit, setAssessmentToEdit] = useState<Assessment | null>(null);
    const [csvImportOpen, setCsvImportOpen] = useState(false);
    const [importError, setImportError] = useState('');
    const [importSuccess, setImportSuccess] = useState('');
    const [quickFilter, setQuickFilter] = useState<'ALL' | 'Excellent' | 'Very Good' | 'Satisfactory' | 'Needs Improvement' | 'Fail'>('ALL');
    
    const [scoreEdits, setScoreEdits] = useState<Record<string, Record<string, number>>>({}); // [assessmentId][enrollmentId] = score
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [approving, setApproving] = useState(false);

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');
    const isAdmin = user?.roles?.some(r => ['INSTITUTION_ADMIN', 'REGISTRAR', 'SYSTEM_ADMIN'].includes(r.name));
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

    // 5. Fetch GradeBook status
    const { data: gradeBookRows, isLoading: loadingGradeBook } = useQuery({
        queryKey: ['gradebook-status', selectedCourseId],
        queryFn: () => gradesService.getGradeBookStatus(selectedCourseId),
        enabled: !!selectedCourseId,
    });

    // Derive overall GradeBook status for the course
    const courseGradeBookStatus = useMemo((): GradeBookStatus | null => {
        if (!gradeBookRows || gradeBookRows.length === 0) return null;
        // LOCKED > APPROVED > PENDING_REVIEW > DRAFT
        if (gradeBookRows.some(r => r.status === 'LOCKED')) return 'LOCKED';
        if (gradeBookRows.some(r => r.status === 'APPROVED')) return 'APPROVED';
        if (gradeBookRows.some(r => r.status === 'PENDING_REVIEW')) return 'PENDING_REVIEW';
        return 'DRAFT';
    }, [gradeBookRows]);

    const isGradebookLocked = courseGradeBookStatus === 'LOCKED' || courseGradeBookStatus === 'APPROVED';


    const isLoadingGrid = loadingEnrollments || loadingAssessments || loadingScores;

    // Build Rows for DataGrid
    const rows = useMemo(() => {
        if (!enrollments) return [];

        // Sort enrollments alphabetically by name
        const sorted = [...enrollments].sort((a, b) => {
            const nameA = `${a.student?.user?.firstName || ''} ${a.student?.user?.lastName || ''}`.trim() || a.student?.user?.username || '';
            const nameB = `${b.student?.user?.firstName || ''} ${b.student?.user?.lastName || ''}`.trim() || b.student?.user?.username || '';
            return nameA.localeCompare(nameB);
        });

        return sorted.map((e, index) => {
            const name = `${e.student?.user?.firstName || ''} ${e.student?.user?.lastName || ''}`.trim() || e.student?.user?.username || 'Unknown';
            const shortId = e.student?.user?.username || String(e.studentId).substring(0, 6).toUpperCase();

            const row: any = {
                id: e.id,
                no: index + 1,
                studentName: name,
                studentId: shortId,
                rawStudentId: e.studentId, // keep for internal logic
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
            row.letterGrade = calculateGradeCategory(totalWeighted).category;

            return row;
        });
    }, [enrollments, assessments, originalScores, scoreEdits]);

    // Compute Metrics & Filters
    const metrics = useMemo(() => {
        if (!rows.length) return null;
        let sum = 0;
        let max = 0;
        let min = 100;
        let countExcellent = 0, countVeryGood = 0, countSatisfactory = 0, countNeedsImprovement = 0, countFail = 0;
        
        rows.forEach(r => {
            const t = r.totalScore || 0;
            sum += t;
            if (t > max) max = t;
            if (t < min) min = t;
            if (t >= 90) countExcellent++;
            else if (t >= 75) countVeryGood++;
            else if (t >= 50) countSatisfactory++;
            else if (t >= 30) countNeedsImprovement++;
            else countFail++;
        });

        // Standard deviation
        const avg = sum / rows.length;
        const variance = rows.reduce((acc, r) => acc + Math.pow((r.totalScore || 0) - avg, 2), 0) / rows.length;
        const stdDev = Math.sqrt(variance);

        return {
            average: parseFloat(avg.toFixed(1)),
            max: parseFloat(max.toFixed(1)),
            min: rows.length > 0 ? parseFloat(min.toFixed(1)) : 0.0,
            stdDev: parseFloat(stdDev.toFixed(1)),
            countExcellent, countVeryGood, countSatisfactory, countNeedsImprovement, countFail,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        if (quickFilter === 'ALL') return rows;
        return rows.filter(r => r.letterGrade === quickFilter);
    }, [rows, quickFilter]);

    // Build Columns for DataGrid
    const columns = useMemo<GridColDef[]>(() => {
        const cols: GridColDef[] = [
            { field: 'no', headerName: '#', width: 60, align: 'center', headerAlign: 'center' },
            {
                field: 'studentName',
                headerName: 'Student Name',
                width: 220,
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
                width: 130,
                renderCell: (params: GridRenderCellParams) => (
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {params.value}
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
                    isGradebookLocked ? (
                        <Typography variant="body2" fontWeight={700} sx={{ width: '100%', textAlign: 'center' }}>
                            {params.value !== '' && params.value !== undefined ? params.value : '—'}
                        </Typography>
                    ) : (
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
                    )
                ),
                renderHeader: () => (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '13px' }}>{a.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                                Out of {a.maxScore} • {a.weight}%
                            </Typography>
                        </Box>
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
            headerName: 'Category',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params: GridRenderCellParams) => {
                const score = params.row.totalScore || 0;
                const color = score >= 90 ? 'success' :
                              score >= 75 ? 'info' :
                              score >= 50 ? 'warning' :
                              score >= 30 ? 'default' : 'error';
                return (
                    <Chip 
                        label={params.value} 
                        size="small"
                        color={color as any}
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                    />
                );
            }
        });

        return cols;
    }, [assessments, theme, isGradebookLocked, isInstructor]);

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

    // Submit grades for review
    const handleSubmitForReview = async () => {
        if (!window.confirm('Submit all grades for admin review? You can no longer edit them until they are rejected.')) return;
        setSubmitting(true);
        try {
            await gradesService.submitForReview(selectedCourseId);
            toast.success('Grades submitted for review!');
            queryClient.invalidateQueries({ queryKey: ['gradebook-status', selectedCourseId] });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to submit grades');
        } finally {
            setSubmitting(false);
        }
    };

    // Approve and lock grades (Admin/Registrar)
    const handleApproveAndLock = async () => {
        if (!window.confirm('Approve and LOCK all grades? This action cannot be undone.')) return;
        setApproving(true);
        try {
            await gradesService.approveAndLock(selectedCourseId);
            toast.success('Grades approved and locked!');
            queryClient.invalidateQueries({ queryKey: ['gradebook-status', selectedCourseId] });
            queryClient.invalidateQueries({ queryKey: ['assessment-scores-all'] });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to approve grades');
        } finally {
            setApproving(false);
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            Manage assessments, record scores, and compute total grades
                        </Typography>
                        {selectedCourseId && <GradeBookStatusBadge status={courseGradeBookStatus} />}
                    </Box>
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
                            {/* Instructor-only buttons */}
                            {isInstructor && !isGradebookLocked && (
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
                                    {courseGradeBookStatus !== 'PENDING_REVIEW' && (
                                        <Button 
                                            variant="contained" 
                                            startIcon={<SendIcon />}
                                            color="warning"
                                            disabled={submitting || !rows.length}
                                            onClick={handleSubmitForReview}
                                            sx={{ borderRadius: 2, height: 40, fontWeight: 800, px: 3 }}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit for Review'}
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Admin/Registrar: Approve & Lock */}
                            {isAdmin && courseGradeBookStatus === 'PENDING_REVIEW' && (
                                <Button 
                                    variant="contained" 
                                    startIcon={<ApproveIcon />}
                                    color="success"
                                    disabled={approving}
                                    onClick={handleApproveAndLock}
                                    sx={{ borderRadius: 2, height: 40, fontWeight: 800, px: 3, boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.3)}` }}
                                >
                                    {approving ? 'Locking...' : 'Approve & Lock'}
                                </Button>
                            )}

                            {/* Export */}
                            <Button 
                                variant="outlined" 
                                startIcon={<DownloadIcon />}
                                onClick={() => gradesService.exportExcel(selectedCourseId, courses?.find((c: any) => c.id === selectedCourseId)?.name)}
                                sx={{ borderRadius: 2, height: 40, fontWeight: 700 }}
                            >
                                Export Excel
                            </Button>
                            <Button 
                                variant="outlined" 
                                startIcon={<PictureAsPdfIcon />}
                                onClick={() => gradesService.exportPdf(selectedCourseId, courses?.find((c: any) => c.id === selectedCourseId)?.name)}
                                sx={{ borderRadius: 2, height: 40, fontWeight: 700, color: 'error.main', borderColor: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.05), borderColor: 'error.main' } }}
                            >
                                Export PDF
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {importSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{importSuccess}</Alert>}
            {importError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{importError}</Alert>}

            {/* Locked Banner */}
            {isGradebookLocked && (
                <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 2, borderRadius: 2, fontWeight: 700 }}>
                    This gradebook is <strong>{courseGradeBookStatus}</strong>. Grades are read-only and cannot be modified.
                </Alert>
            )}

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
                    <Card elevation={0} sx={{ p: 2, minWidth: 140, borderRadius: 3, border: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                        <Typography variant="overline" color="text.secondary">Std. Deviation</Typography>
                        <Typography variant="h4" fontWeight={800} color="text.secondary">±{metrics.stdDev}%</Typography>
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
                                label={`Excellent • ${metrics.countExcellent} (${Math.round(metrics.countExcellent / rows.length * 100)}%)`} 
                                onClick={() => setQuickFilter('Excellent')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'Excellent' ? 'success.main' : 'transparent', color: quickFilter === 'Excellent' ? 'white' : 'success.main', borderColor: alpha(theme.palette.success.main, 0.5) }} 
                                variant={quickFilter === 'Excellent' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`Very Good • ${metrics.countVeryGood} (${Math.round(metrics.countVeryGood / rows.length * 100)}%)`} 
                                onClick={() => setQuickFilter('Very Good')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'Very Good' ? 'info.main' : 'transparent', color: quickFilter === 'Very Good' ? 'white' : 'info.main', borderColor: alpha(theme.palette.info.main, 0.5) }} 
                                variant={quickFilter === 'Very Good' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`Satisfactory • ${metrics.countSatisfactory} (${Math.round(metrics.countSatisfactory / rows.length * 100)}%)`} 
                                onClick={() => setQuickFilter('Satisfactory')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'Satisfactory' ? 'warning.main' : 'transparent', color: quickFilter === 'Satisfactory' ? 'white' : 'warning.main', borderColor: alpha(theme.palette.warning.main, 0.5) }} 
                                variant={quickFilter === 'Satisfactory' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`Needs Improvement • ${metrics.countNeedsImprovement} (${Math.round(metrics.countNeedsImprovement / rows.length * 100)}%)`} 
                                onClick={() => setQuickFilter('Needs Improvement')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'Needs Improvement' ? 'default' : 'transparent', borderColor: alpha(theme.palette.text.secondary, 0.4) }} 
                                variant={quickFilter === 'Needs Improvement' ? 'filled' : 'outlined'} 
                            />
                            <Chip 
                                label={`Fail • ${metrics.countFail} (${Math.round(metrics.countFail / rows.length * 100)}%)`} 
                                onClick={() => setQuickFilter('Fail')} 
                                sx={{ fontWeight: 700, bgcolor: quickFilter === 'Fail' ? 'error.main' : 'transparent', color: quickFilter === 'Fail' ? 'white' : 'error.main', borderColor: alpha(theme.palette.error.main, 0.5) }} 
                                variant={quickFilter === 'Fail' ? 'filled' : 'outlined'} 
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
                        slots={{ 
                            toolbar: GridToolbar,
                            columnMenu: CustomColumnMenu as any
                        }}
                        slotProps={{
                            columnMenu: {
                                assessments,
                                setAssessmentToEdit,
                                setEditAssessmentOpen,
                                isInstructor,
                                isGradebookLocked
                            } as any
                        }}
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

            {assessmentToEdit && (
                <EditAssessmentDialog
                    open={editAssessmentOpen}
                    onClose={() => setEditAssessmentOpen(false)}
                    assessment={assessmentToEdit}
                    courseId={selectedCourseId}
                />
            )}

            <CsvImportDialog 
                open={csvImportOpen}
                onClose={() => setCsvImportOpen(false)}
                assessments={assessments || []}
                rows={rows || []}
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
                            <Select value={type} label="Type" onChange={(e: any) => setType(e.target.value)}>
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
// EDIT ASSESSMENT DIALOG
// ----------------------------------------------------------------------
function EditAssessmentDialog({ open, onClose, assessment, courseId }: { open: boolean, onClose: () => void, assessment: Assessment, courseId: string }) {
    const queryClient = useQueryClient();
    const [title, setTitle] = useState(assessment.title);
    const [type, setType] = useState(assessment.type);
    const [maxScore, setMaxScore] = useState(assessment.maxScore);
    const [weight, setWeight] = useState(assessment.weight);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (open) {
            setTitle(assessment.title);
            setType(assessment.type);
            setMaxScore(assessment.maxScore);
            setWeight(assessment.weight);
        }
    }, [open, assessment]);

    const handleUpdate = async () => {
        if (!title) return;
        setLoading(true);
        try {
            await assessmentsService.update(assessment.id, {
                title, type: type as any, maxScore, weight
            });
            toast.success('Assessment updated successfully');
            queryClient.invalidateQueries({ queryKey: ['assessments', courseId] });
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to update assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this assessment? All associated scores will be lost!')) return;
        setDeleting(true);
        try {
            await assessmentsService.delete(assessment.id);
            toast.success('Assessment deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['assessments', courseId] });
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to delete assessment');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Edit Assessment</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField fullWidth label="Assessment Title" value={title} onChange={e => setTitle(e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select value={type} label="Type" onChange={(e: any) => setType(e.target.value)}>
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
            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
                <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={handleDelete} 
                    disabled={loading || deleting} 
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2 }}
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Box>
                    <Button onClick={onClose} disabled={loading || deleting} sx={{ borderRadius: 2, mr: 1 }}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={loading || deleting || !title} sx={{ borderRadius: 2 }}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

// ----------------------------------------------------------------------
// CSV IMPORT DIALOG
// ----------------------------------------------------------------------
function CsvImportDialog({ open, onClose, assessments, rows, onImport }: { open: boolean, onClose: () => void, assessments: Assessment[], rows: any[], onImport: (edits: Record<string, Record<string, number>>) => void }) {
    const theme = useTheme();
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleImport = () => {
        if (!file) return;
        setError('');
        
        const processArrayData = (data: string[][]) => {
            if (data.length < 2) {
                setError('The file does not contain enough data (requires headers + 1 row).');
                return;
            }

            console.log('--- IMPORT PARSE LOGS ---');
            
            // 1. Clean headers on row 0
            const headers = data[0].map(h => String(h || '').replace(/^[\uFEFF\u200B]+/, '').trim().toLowerCase());
            console.log('Cleaned Headers:', headers);

            // 2. Map Assessment Titles -> Assessment IDs
            const titleToId = {} as Record<string, string>;
            assessments.forEach(a => titleToId[a.title.trim().toLowerCase()] = a.id);
            console.log('Course Assessments:', titleToId);

            // 3. Find column indices
            let noIndex = -1, idIndex = -1, nameIndex = -1;
            const assessmentIndices: { index: number; id: string }[] = [];

            headers.forEach((h, i) => {
                const cleanH = h.replace(/[^a-z0-9#]/g, ''); // strip spaces, dots
                if (['#', 'no', 'index', 'sn'].includes(cleanH)) noIndex = i;
                else if (['studentid', 'id'].includes(cleanH)) idIndex = i;
                else if (['name', 'student', 'studentname'].includes(cleanH)) nameIndex = i;
                else if (titleToId[h]) {
                    assessmentIndices.push({ index: i, id: titleToId[h] });
                }
            });

            console.log(`Matched ID Columns - #: ${noIndex}, ID: ${idIndex}, Name: ${nameIndex}`);
            console.log(`Matched Assessment Columns:`, assessmentIndices);

            if (headers[0]?.startsWith('pk')) {
                setError('You renamed an Excel file (.xlsx) to .csv by right-clicking it. This corrupts the file! Please rename it back to .xlsx, and then upload it normally. The system accepts .xlsx directly!');
                return;
            }

            if (noIndex === -1 && idIndex === -1 && nameIndex === -1) {
                setError(`Cannot find a student identifier column (#, ID, Name). Headers found: ${headers.join(', ')}`);
                return;
            }

            if (assessmentIndices.length === 0) {
                setError(`No assessment columns matched. Headers found: ${headers.join(', ')}`);
                return;
            }

            const edits: Record<string, Record<string, number>> = {};
            let matchedStudents = 0;

            // 4. Process data rows
            for (let i = 1; i < data.length; i++) {
                const rowText = data[i];
                if (!rowText || rowText.length === 0 || rowText.every(c => !String(c).trim())) continue; // Skip strictly empty rows
                
                const rowNo = noIndex !== -1 ? String(rowText[noIndex] || '').trim() : '';
                const rowId = idIndex !== -1 ? String(rowText[idIndex] || '').trim() : '';
                const rowName = nameIndex !== -1 ? String(rowText[nameIndex] || '').trim() : '';

                let matchedRow = null;

                if (rowNo) matchedRow = rows.find(r => String(r.no) === String(rowNo));
                if (!matchedRow && rowId) {
                    matchedRow = rows.find(r => 
                        String(r.studentId).toLowerCase() === String(rowId).toLowerCase() || 
                        String(r.rawStudentId).toLowerCase().includes(String(rowId).toLowerCase())
                    );
                }
                if (!matchedRow && rowName) {
                    const searchName = String(rowName).toLowerCase();
                    matchedRow = rows.find(r => String(r.studentName).toLowerCase().includes(searchName));
                }

                if (matchedRow) {
                    matchedStudents++;
                    // Map scores
                    assessmentIndices.forEach(col => {
                        const val = String(rowText[col.index] || '').trim();
                        if (val) {
                            const score = parseFloat(val);
                            if (!isNaN(score)) {
                                if (!edits[col.id]) edits[col.id] = {};
                                edits[col.id][matchedRow.id] = score;
                            }
                        }
                    });
                } else {
                    console.log(`Row ${i + 1} unmatched. #=${rowNo}, ID=${rowId}, Name=${rowName}`);
                }
            }

            if (matchedStudents === 0) {
                setError('Students in file did not match any students in the class list.');
                return;
            }

            onImport(edits);
        };

        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const buffer = e.target?.result;
                    const workbook = XLSX.read(buffer, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as string[][];
                    processArrayData(data);
                } catch (err: any) {
                    setError('Failed to parse Excel file: ' + err.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: (results) => {
                    processArrayData(results.data as string[][]);
                },
                error: (err) => setError('Failed to parse CSV: ' + err.message)
            });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Import Grades</DialogTitle>
            <DialogContent>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    Upload a <strong>.CSV</strong> or <strong>.XLSX</strong> (Excel) file in <strong>Wide Format</strong>.
                    <br/><br/>
                    The system will match students using any of these columns: <strong>"#" or "No"</strong>, <strong>"StudentId" or "ID"</strong>, or <strong>"Name"</strong>.
                    Other columns should exactly match the <strong>Assessment Titles</strong>.
                </Alert>

                <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>
                        Example CSV Format:
                    </Typography>
                    <Box component="pre" sx={{ m: 0, fontSize: '0.75rem', overflowX: 'auto', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        #, Name, ID, Quiz 1, Midterm Exam, Final Exam{'\n'}
                        1, John Doe, STD-01, 8.5, 23, 44{'\n'}
                        2, Jane Smith, STD-02, 9, 21, 48
                    </Box>
                </Card>

                <Box sx={{ border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`, borderRadius: 3, p: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <input type="file" accept=".csv, .xlsx, .xls" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} id="csv-upload" />
                    <label htmlFor="csv-upload">
                        <Button variant="outlined" component="span" startIcon={<UploadIcon />} sx={{ borderRadius: 2 }}>
                            {file ? file.name : 'Select CSV or XLSX File'}
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
    const [downloading, setDownloading] = useState(false);

    const { data: transcript, isLoading } = useQuery({
        queryKey: ['transcript', user?.id],
        queryFn: () => gradesService.getTranscript(user?.id || ''),
        enabled: !!user?.id,
    });

    const handleDownloadPdf = async () => {
        if (!user?.id) return;
        setDownloading(true);
        try {
            await gradesService.downloadTranscriptPdf(
                user.id,
                `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.id.substring(0, 8),
            );
        } catch (e) {
            console.error('Failed to download transcript:', e);
        } finally {
            setDownloading(false);
        }
    };

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
                    <Button
                        variant="contained"
                        sx={{ borderRadius: 2 }}
                        startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPdf}
                        disabled={downloading || !transcript}
                    >
                        {downloading ? 'Generating...' : 'Download PDF'}
                    </Button>
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
