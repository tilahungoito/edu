'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/lib/store';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/app/theme/theme';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Wait for client-side mount to avoid hydration issues with Zustand persist
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Redirect based on auth status after client mount
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router, mounted]);

  // Show loading state during SSR and initial mount
  if (!mounted) {
    return null; // Or a very simple placeholder that is guaranteed to match
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">
          Loading Education Management System...
        </Typography>
      </Box>
    </ThemeProvider>
  );
}
