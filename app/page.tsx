'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from '@/app/theme/theme';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Services from './components/Services';
import Footer from './components/Footer';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR and initial mount
  if (!mounted) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'white' }}>
        <Navbar />
        <Hero />
        <Stats />
        <Services />
        <Footer />
      </Box>
    </ThemeProvider>
  );
}
