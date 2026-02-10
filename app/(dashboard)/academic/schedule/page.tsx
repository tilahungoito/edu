'use client';

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    IconButton,
    Card,
    CardContent,
    alpha,
    useTheme,
    Tooltip,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    CalendarToday as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Room as RoomIcon,
    Person as InstructorIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { schedulesService, scheduleConfigService } from '@/app/lib/api/schedules.service';
import { useAuthStore } from '@/app/lib/store';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS = {
    MONDAY: 'Monday',
    TUESDAY: 'Tuesday',
    WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday',
    FRIDAY: 'Friday',
    SATURDAY: 'Saturday',
    SUNDAY: 'Sunday'
};

export default function AcademicSchedulePage() {
    const theme = useTheme();
    const user = useAuthStore(state => state.user);
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');

    // Queries
    const { data: periods } = useQuery({
        queryKey: ['periods', user?.tenantId],
        queryFn: () => scheduleConfigService.getPeriods(user?.tenantId || ''),
        enabled: !!user?.tenantId,
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms', user?.tenantId],
        queryFn: () => scheduleConfigService.getRooms(user?.tenantId || ''),
        enabled: !!user?.tenantId,
    });

    const { data: timeSlots } = useQuery({
        queryKey: ['timeslots', user?.tenantId],
        queryFn: () => scheduleConfigService.getTimeSlots(user?.tenantId || ''),
        enabled: !!user?.tenantId,
    });

    const isInstructor = user?.roles?.some(r => r.name === 'INSTRUCTOR');

    const { data: schedules, isLoading } = useQuery({
        queryKey: ['schedules', user?.tenantId, selectedPeriod, user?.id],
        queryFn: () => schedulesService.getAll(user?.tenantId || '', {
            periodId: selectedPeriod || undefined,
            instructorId: isInstructor ? user?.id : undefined
        }),
        enabled: !!user?.tenantId,
    });

    // Organize schedules into a matrix [day][timeSlot]
    const scheduleMatrix = useMemo(() => {
        const matrix: Record<string, Record<string, any>> = {};
        DAYS.forEach(day => {
            matrix[day] = {};
        });

        schedules?.forEach(s => {
            if (matrix[s.day]) {
                matrix[s.day][s.timeSlotId] = s;
            }
        });
        return matrix;
    }, [schedules]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
                        <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -1 }}>
                            Academic Schedule
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        Weekly class timetable and room assignments.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Academic Period</InputLabel>
                        <Select
                            value={selectedPeriod}
                            label="Academic Period"
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            sx={{ borderRadius: 2.5 }}
                        >
                            <MenuItem value="">Current Active</MenuItem>
                            {periods?.map((p: any) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {user?.roles?.some(r => r.name === 'INSTITUTION_ADMIN') && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ borderRadius: 2.5 }}
                        >
                            Add Session
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper sx={{
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(8px)',
                width: '100%' // Ensure paper doesn't overflow parent
            }}>
                <Box sx={{
                    overflowX: 'auto',
                    width: '100%',
                    '&::-webkit-scrollbar': { height: 6 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: alpha(theme.palette.primary.main, 0.2), borderRadius: 3 }
                }}>
                    <Box sx={{ minWidth: { xs: 800, lg: '100%' } }}>
                        {/* Header Row */}
                        <Grid container sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Grid size={1.5} sx={{ p: 2, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                <Typography variant="subtitle2" fontWeight={800} color="primary">TIME SLOT</Typography>
                            </Grid>
                            {DAYS.map(day => (
                                <Grid size={1.5} key={day} sx={{ p: 2, textAlign: 'center', borderRight: day !== 'SUNDAY' ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                    <Typography variant="subtitle2" fontWeight={800}>{(DAY_LABELS as any)[day]}</Typography>
                                </Grid>
                            ))}
                        </Grid>

                        {/* Schedule Rows */}
                        {timeSlots?.map((slot: any) => (
                            <Grid container key={slot.id} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                                <Grid size={1.5} sx={{ p: 2, borderRight: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                    <Typography variant="body2" fontWeight={700}>{slot.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{slot.startTime} - {slot.endTime}</Typography>
                                </Grid>
                                {DAYS.map(day => {
                                    const session = scheduleMatrix[day][slot.id];
                                    return (
                                        <Grid size={1.5} key={day} sx={{ p: 1, borderRight: day !== 'SUNDAY' ? `1px solid ${theme.palette.divider}` : 'none' }}>
                                            {session ? (
                                                <Card sx={{
                                                    height: '100%',
                                                    borderRadius: 3,
                                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}>
                                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                        <Typography variant="subtitle2" fontWeight={800} color="primary.main" noWrap>
                                                            {session.course.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                            <RoomIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="caption" color="text.secondary">{session.room.name}</Typography>
                                                        </Box>
                                                        {!isInstructor && session.instructor && (
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <InstructorIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {session.instructor.firstName} {session.instructor.lastName}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ) : (
                                                <Box sx={{ height: '100%', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                                </Box>
                                            )}
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ))}
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', gap: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.2), border: `1px solid ${theme.palette.primary.main}` }} />
                    <Typography variant="caption" color="text.secondary">Scheduled Session</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '2px', border: `1px solid ${theme.palette.divider}` }} />
                    <Typography variant="caption" color="text.secondary">Available Slot</Typography>
                </Box>
            </Box>
        </Box>
    );
}
