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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <Footer />
    </Box>
  );
}
