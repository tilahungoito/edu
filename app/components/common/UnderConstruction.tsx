'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Construction as ConstructionIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface UnderConstructionProps {
    title?: string;
    description?: string;
}

export default function UnderConstruction({
    title = 'Under Construction',
    description = 'This module is currently being developed. Please check back later.'
}: UnderConstructionProps) {
    const router = useRouter();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '70vh',
                textAlign: 'center',
                p: 3
            }}
        >
            <ConstructionIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
                {title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 4 }}>
                {description}
            </Typography>
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
            >
                Go Back
            </Button>
        </Box>
    );
}
