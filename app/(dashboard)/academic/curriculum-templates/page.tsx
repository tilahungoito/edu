'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    alpha,
    useTheme,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Tooltip,
    Alert,
    Snackbar,
} from '@mui/material';
import {
    Search as SearchIcon,
    ImportContacts as CourseIcon,
    School as SchoolIcon,
    ContentCopy as CopyIcon,
    Add as AddIcon,
    CheckCircle as DoneIcon,
    AutoAwesome as TemplateIcon,
    Close as CloseIcon,
    Download as ImportIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/app/lib/store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import coursesService from '@/app/lib/api/courses.service';
import subjectsService from '@/app/lib/api/subjects.service';

// ─── Static curriculum templates (shared / system-wide) ───────────────────────
const CURRICULUM_TEMPLATES = [
    {
        id: 'primary-g1-4',
        name: 'Primary School — Grades 1–4',
        type: 'PRIMARY',
        description: 'Core curriculum for lower primary. Covers Amharic, Mathematics, Environmental Science, and Art.',
        subjects: [
            { name: 'Amharic Language', code: 'AM-101', credit: 2 },
            { name: 'Mathematics', code: 'MATH-101', credit: 2 },
            { name: 'Environmental Science', code: 'ENV-101', credit: 1 },
            { name: 'Physical Education', code: 'PE-101', credit: 1 },
            { name: 'Art & Crafts', code: 'ART-101', credit: 1 },
        ],
        color: '#6366f1',
        usedBy: 48,
    },
    {
        id: 'primary-g5-8',
        name: 'Primary School — Grades 5–8',
        type: 'PRIMARY',
        description: 'Upper primary curriculum. Introduces English, Social Studies, and advanced maths.',
        subjects: [
            { name: 'Amharic Language', code: 'AM-201', credit: 2 },
            { name: 'English Language', code: 'ENG-201', credit: 2 },
            { name: 'Mathematics', code: 'MATH-201', credit: 3 },
            { name: 'Natural Science', code: 'NAT-201', credit: 2 },
            { name: 'Social Studies', code: 'SS-201', credit: 2 },
            { name: 'Physical Education', code: 'PE-201', credit: 1 },
        ],
        color: '#10b981',
        usedBy: 62,
    },
    {
        id: 'secondary-g9-10',
        name: 'Secondary School — Grades 9–10',
        type: 'SECONDARY',
        description: 'National lower secondary standard. Includes Physics, Chemistry, Biology, and History.',
        subjects: [
            { name: 'Amharic Language & Literature', code: 'AM-301', credit: 2 },
            { name: 'English Language & Literature', code: 'ENG-301', credit: 2 },
            { name: 'Mathematics', code: 'MATH-301', credit: 3 },
            { name: 'Physics', code: 'PHY-301', credit: 3 },
            { name: 'Chemistry', code: 'CHEM-301', credit: 3 },
            { name: 'Biology', code: 'BIO-301', credit: 3 },
            { name: 'History', code: 'HIS-301', credit: 2 },
            { name: 'Geography', code: 'GEO-301', credit: 2 },
            { name: 'Civics & Ethics', code: 'CIV-301', credit: 1 },
        ],
        color: '#f59e0b',
        usedBy: 91,
    },
    {
        id: 'preparatory-g11-12',
        name: 'Preparatory School — Grades 11–12',
        type: 'PREPARATORY',
        description: 'Natural & Social science streams for national exams.',
        subjects: [
            { name: 'English', code: 'ENG-401', credit: 2 },
            { name: 'Mathematics', code: 'MATH-401', credit: 4 },
            { name: 'Physics', code: 'PHY-401', credit: 3 },
            { name: 'Chemistry', code: 'CHEM-401', credit: 3 },
            { name: 'Biology', code: 'BIO-401', credit: 3 },
            { name: 'Economics', code: 'ECO-401', credit: 2 },
            { name: 'Civics & Ethics', code: 'CIV-401', credit: 1 },
        ],
        color: '#ec4899',
        usedBy: 37,
    },
    {
        id: 'kg',
        name: 'Kindergarten (KG) — Ages 4–6',
        type: 'KG',
        description: 'Play-based foundational learning for early childhood.',
        subjects: [
            { name: 'Language & Communication', code: 'KG-LANG', credit: 1 },
            { name: 'Numeracy Basics', code: 'KG-NUM', credit: 1 },
            { name: 'Art & Creative Play', code: 'KG-ART', credit: 1 },
            { name: 'Music & Movement', code: 'KG-MUS', credit: 1 },
            { name: 'Social Emotional Learning', code: 'KG-SEL', credit: 1 },
        ],
        color: '#8b5cf6',
        usedBy: 22,
    },
];

const TYPE_LABELS: Record<string, { label: string, color: string }> = {
    KG: { label: 'Kindergarten', color: '#8b5cf6' },
    PRIMARY: { label: 'Primary', color: '#6366f1' },
    SECONDARY: { label: 'Secondary', color: '#f59e0b' },
    PREPARATORY: { label: 'Preparatory', color: '#ec4899' },
};

export default function CurriculumTemplatesPage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState('ALL');
    const [previewTemplate, setPreviewTemplate] = useState<typeof CURRICULUM_TEMPLATES[0] | null>(null);
    const [importing, setImporting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const institutionId = user?.tenantId;

    // Get courses already in this school to detect which templates are "already imported"
    const { data: existingCourses } = useQuery({
        queryKey: ['courses', institutionId],
        queryFn: () => coursesService.getAll({ institutionId }),
        enabled: !!institutionId,
    });

    const existingCodes = new Set((existingCourses || []).map(c => c.code));

    const filteredTemplates = CURRICULUM_TEMPLATES.filter(t => {
        const matchType = selectedType === 'ALL' || t.type === selectedType;
        const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    const handleImport = async (template: typeof CURRICULUM_TEMPLATES[0]) => {
        if (!institutionId) return;
        setImporting(true);
        try {
            const newSubjects = template.subjects.filter(s => !existingCodes.has(s.code));
            for (const subj of newSubjects) {
                await coursesService.create({
                    name: subj.name,
                    code: subj.code,
                    credit: subj.credit,
                    institutionId,
                } as any);
            }
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setPreviewTemplate(null);
            setSnackbar({
                open: true,
                message: `✅ Imported ${newSubjects.length} course(s) from "${template.name}".`,
            });
        } catch (e) {
            setSnackbar({ open: true, message: '❌ Failed to import some courses. Please try again.' });
        } finally {
            setImporting(false);
        }
    };

    const isImported = (template: typeof CURRICULUM_TEMPLATES[0]) =>
        template.subjects.every(s => existingCodes.has(s.code));

    const types = ['ALL', 'KG', 'PRIMARY', 'SECONDARY', 'PREPARATORY'];

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, #8b5cf6, #ec4899)`,
                        display: 'flex',
                        color: 'white',
                    }}>
                        <TemplateIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Curriculum Templates
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Shared subject libraries — import into your school with one click
                        </Typography>
                    </Box>
                </Box>

                {user?.roles?.some(r => r.name === 'INSTITUTION_ADMIN') && (
                    <Alert severity="info" icon={<TemplateIcon />} sx={{ mt: 2, borderRadius: 2 }}>
                        <strong>Tip:</strong> Import a template to instantly create all the courses for your school type. You can add custom courses afterwards.
                    </Alert>
                )}
            </Box>

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search templates…"
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                        sx: { borderRadius: 3 }
                    }}
                    sx={{ minWidth: 240 }}
                />
                <Tabs
                    value={selectedType}
                    onChange={(_, v) => setSelectedType(v)}
                    sx={{
                        '& .MuiTab-root': { fontWeight: 700, borderRadius: 2, minHeight: 36, py: 0.5 },
                        '& .MuiTabs-indicator': { borderRadius: 4, height: 3 },
                    }}
                >
                    {types.map(t => (
                        <Tab key={t} value={t} label={t === 'ALL' ? 'All Types' : TYPE_LABELS[t]?.label || t} />
                    ))}
                </Tabs>
            </Box>

            {/* Template Cards */}
            <Grid container spacing={2.5}>
                {filteredTemplates.map(template => {
                    const imported = isImported(template);
                    const typeInfo = TYPE_LABELS[template.type] || { label: template.type, color: '#6366f1' };
                    return (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={template.id}>
                            <Card
                                elevation={0}
                                sx={{
                                    border: `1px solid ${alpha(template.color, imported ? 0.5 : 0.2)}`,
                                    borderRadius: '16px',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        boxShadow: `0 8px 32px ${alpha(template.color, 0.15)}`,
                                        transform: 'translateY(-2px)',
                                    },
                                }}
                            >
                                <CardContent sx={{ flex: 1, p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{
                                            p: 1.5,
                                            borderRadius: '12px',
                                            bgcolor: alpha(template.color, 0.1),
                                            color: template.color,
                                            display: 'flex',
                                        }}>
                                            <SchoolIcon />
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <Chip
                                                label={typeInfo.label}
                                                size="small"
                                                sx={{ bgcolor: alpha(template.color, 0.1), color: template.color, fontWeight: 800, fontSize: '10px' }}
                                            />
                                            {imported && (
                                                <Chip
                                                    label="Imported ✓"
                                                    size="small"
                                                    icon={<DoneIcon style={{ fontSize: 12 }} />}
                                                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 700, fontSize: '10px' }}
                                                />
                                            )}
                                        </Box>
                                    </Box>

                                    <Typography variant="h6" fontWeight={800} gutterBottom sx={{ fontSize: '1rem' }}>
                                        {template.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {template.description}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {template.subjects.slice(0, 4).map(s => (
                                            <Chip
                                                key={s.code}
                                                label={s.name}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '10px',
                                                    height: 20,
                                                    borderColor: alpha(template.color, 0.3),
                                                    color: theme.palette.text.secondary,
                                                    bgcolor: existingCodes.has(s.code) ? alpha(theme.palette.success.main, 0.06) : 'transparent',
                                                }}
                                            />
                                        ))}
                                        {template.subjects.length > 4 && (
                                            <Chip label={`+${template.subjects.length - 4} more`} size="small" sx={{ fontSize: '10px', height: 20 }} />
                                        )}
                                    </Box>

                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: 'block' }}>
                                        Used by {template.usedBy} schools across the region
                                    </Typography>
                                </CardContent>

                                <CardActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setPreviewTemplate(template)}
                                        sx={{ borderRadius: 2, flex: 1 }}
                                    >
                                        Preview
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={imported ? <DoneIcon /> : <ImportIcon />}
                                        disabled={imported || !user?.roles?.some(r => r.name === 'INSTITUTION_ADMIN')}
                                        onClick={() => handleImport(template)}
                                        sx={{
                                            borderRadius: 2,
                                            flex: 1,
                                            bgcolor: imported ? alpha(theme.palette.success.main, 0.1) : template.color,
                                            color: imported ? theme.palette.success.main : 'white',
                                            '&:hover': { bgcolor: imported ? undefined : alpha(template.color, 0.8) },
                                            '&:disabled': { bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main },
                                        }}
                                    >
                                        {imported ? 'Imported' : 'Import'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Preview Dialog */}
            <Dialog
                open={!!previewTemplate}
                onClose={() => setPreviewTemplate(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px' } }}
            >
                {previewTemplate && (
                    <>
                        <DialogTitle sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: alpha(previewTemplate.color, 0.08),
                            pb: 1.5,
                        }}>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>{previewTemplate.name}</Typography>
                                <Chip label={TYPE_LABELS[previewTemplate.type]?.label} size="small"
                                    sx={{ mt: 0.5, bgcolor: alpha(previewTemplate.color, 0.15), color: previewTemplate.color, fontWeight: 700 }}
                                />
                            </Box>
                            <IconButton onClick={() => setPreviewTemplate(null)} size="small"><CloseIcon /></IconButton>
                        </DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
                                {previewTemplate.description}
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                {previewTemplate.subjects.length} Subjects Included:
                            </Typography>
                            <List dense>
                                {previewTemplate.subjects.map(s => (
                                    <ListItem key={s.code} sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        bgcolor: existingCodes.has(s.code)
                                            ? alpha(theme.palette.success.main, 0.07)
                                            : alpha(theme.palette.action.hover, 0.03),
                                        border: `1px solid ${alpha(existingCodes.has(s.code) ? theme.palette.success.main : theme.palette.divider, 0.2)}`,
                                    }}>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            {existingCodes.has(s.code)
                                                ? <DoneIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                                                : <CourseIcon fontSize="small" sx={{ color: previewTemplate.color }} />
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={s.name}
                                            secondary={`Code: ${s.code} • ${s.credit} credit(s)${existingCodes.has(s.code) ? ' — Already in school' : ''}`}
                                            primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                                            secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <Button onClick={() => setPreviewTemplate(null)} sx={{ borderRadius: 2 }}>Close</Button>
                            <Button
                                variant="contained"
                                startIcon={<ImportIcon />}
                                disabled={isImported(previewTemplate) || importing}
                                onClick={() => handleImport(previewTemplate)}
                                sx={{ borderRadius: 2.5, bgcolor: previewTemplate.color, '&:hover': { bgcolor: alpha(previewTemplate.color, 0.85) } }}
                            >
                                {isImported(previewTemplate) ? 'Already Imported' : importing ? 'Importing…' : 'Import All Subjects'}
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(s => ({ ...s, open: false }))}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            />
        </Box>
    );
}
