'use client';

import React, { useState, useEffect } from "react";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useThemeStore } from "@/app/lib/store/theme-store";
import { theme as lightTheme, darkTheme } from "@/app/theme/theme";

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering a consistent theme initially
  const currentTheme = !mounted ? lightTheme : (mode === 'light' ? lightTheme : darkTheme);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
