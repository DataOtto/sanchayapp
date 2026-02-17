'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('sanchay-theme') as Theme;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sanchay-theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

// Stunning Dark Theme with Glassmorphism
export const themes = {
  dark: {
    // Main backgrounds - deep space black with subtle blue undertone
    bg: '#050508',
    bgGradient: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.15), transparent), linear-gradient(180deg, #0a0a0f 0%, #050508 100%)',
    bgSolid: '#0a0a0f',

    // Glass card effects
    bgCard: 'rgba(255, 255, 255, 0.03)',
    bgCardHover: 'rgba(255, 255, 255, 0.06)',
    bgGlass: 'rgba(255, 255, 255, 0.02)',
    bgGlassStrong: 'rgba(255, 255, 255, 0.05)',

    // Sidebar - sleek dark with subtle gradient
    bgSidebar: 'linear-gradient(180deg, rgba(15, 15, 20, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)',
    bgSidebarGlass: 'rgba(12, 12, 18, 0.8)',

    // Input and interactive elements
    bgInput: 'rgba(255, 255, 255, 0.04)',
    bgInputHover: 'rgba(255, 255, 255, 0.08)',
    bgButton: 'rgba(255, 255, 255, 0.06)',
    bgButtonHover: 'rgba(255, 255, 255, 0.1)',

    // Borders - subtle glass edges
    border: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.12)',
    borderGlass: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(16, 185, 129, 0.3)',

    // Text hierarchy
    text: '#ffffff',
    textSecondary: '#b4b4b4',
    textMuted: '#6b6b6b',
    textDim: '#454545',

    // Accent colors - vibrant emerald with glow
    accent: '#10b981',
    accentLight: '#34d399',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',

    // Secondary accents
    purple: '#8b5cf6',
    purpleGlow: 'rgba(139, 92, 246, 0.3)',
    blue: '#3b82f6',
    blueGlow: 'rgba(59, 130, 246, 0.3)',
    amber: '#f59e0b',
    amberGlow: 'rgba(245, 158, 11, 0.3)',
    rose: '#f43f5e',
    roseGlow: 'rgba(244, 63, 94, 0.3)',

    // Shadows and glows
    shadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 8px 40px rgba(0, 0, 0, 0.5)',
    shadowGlow: (color: string) => `0 0 40px ${color}`,
    shadowInner: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',

    // Glass effect
    blur: 'blur(20px)',
    blurStrong: 'blur(40px)',
  },
  light: {
    // Light theme (keeping for reference but focusing on dark)
    bg: '#f8fafc',
    bgGradient: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    bgSolid: '#f8fafc',
    bgCard: 'rgba(255, 255, 255, 0.8)',
    bgCardHover: 'rgba(255, 255, 255, 0.95)',
    bgGlass: 'rgba(255, 255, 255, 0.6)',
    bgGlassStrong: 'rgba(255, 255, 255, 0.8)',
    bgSidebar: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
    bgSidebarGlass: 'rgba(255, 255, 255, 0.9)',
    bgInput: 'rgba(0, 0, 0, 0.03)',
    bgInputHover: 'rgba(0, 0, 0, 0.06)',
    bgButton: 'rgba(0, 0, 0, 0.05)',
    bgButtonHover: 'rgba(0, 0, 0, 0.08)',
    border: 'rgba(0, 0, 0, 0.08)',
    borderHover: 'rgba(0, 0, 0, 0.15)',
    borderGlass: 'rgba(0, 0, 0, 0.06)',
    borderAccent: 'rgba(16, 185, 129, 0.4)',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textDim: '#cbd5e1',
    accent: '#10b981',
    accentLight: '#34d399',
    accentGlow: 'rgba(16, 185, 129, 0.2)',
    accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    purple: '#8b5cf6',
    purpleGlow: 'rgba(139, 92, 246, 0.2)',
    blue: '#3b82f6',
    blueGlow: 'rgba(59, 130, 246, 0.2)',
    amber: '#f59e0b',
    amberGlow: 'rgba(245, 158, 11, 0.2)',
    rose: '#f43f5e',
    roseGlow: 'rgba(244, 63, 94, 0.2)',
    shadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
    shadowLg: '0 8px 40px rgba(0, 0, 0, 0.12)',
    shadowGlow: (color: string) => `0 0 30px ${color}`,
    shadowInner: 'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
    blur: 'blur(16px)',
    blurStrong: 'blur(32px)',
  },
};

export type ThemeColors = typeof themes.dark;
