'use client';

import { useState } from 'react';
import {
  Shield,
  Sparkles,
  Lock,
  TrendingUp,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Zap,
  Eye,
  Database,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: Sparkles,
    iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    title: 'Welcome to Sanchay',
    subtitle: 'Your Financial Intelligence Layer',
    description: 'Finally see where your money goes — without giving it away to anyone else.',
    visual: 'welcome',
  },
  {
    id: 2,
    icon: Shield,
    iconBg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    title: 'Your Data Stays Yours',
    subtitle: '100% Local. Zero Servers.',
    description: 'Everything is stored on your device. No accounts. No uploads. No tracking. We literally cannot see your data.',
    visual: 'privacy',
  },
  {
    id: 3,
    icon: Zap,
    iconBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    title: 'AI-Powered Insights',
    subtitle: 'Smart Categorization',
    description: 'Automatically categorize transactions, detect subscriptions, and uncover spending patterns — powered by AI that runs on your terms.',
    visual: 'ai',
  },
  {
    id: 4,
    icon: TrendingUp,
    iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    title: 'Complete Financial Clarity',
    subtitle: 'Every Rupee. Every Dollar. Tracked.',
    description: 'Income, expenses, subscriptions, investments — all in one beautiful dashboard. Works with any bank, any country.',
    visual: 'dashboard',
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { theme } = useTheme();
  const t = themes[theme];

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const nextSlide = () => {
    if (isLastSlide) {
      onComplete();
    } else {
      goToSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const IconComponent = slide.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: t.bg }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-float"
          style={{
            top: '-20%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDuration: '8s',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full animate-float"
          style={{
            bottom: '-15%',
            left: '-10%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDuration: '10s',
            animationDelay: '-3s',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full animate-float"
          style={{
            top: '40%',
            left: '30%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDuration: '12s',
            animationDelay: '-5s',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-8">
        <div className="flex flex-col items-center">
          {/* Icon */}
          <div
            className={`relative mb-8 transition-all duration-500 ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
              style={{
                background: slide.iconBg,
                boxShadow: `0 20px 60px ${slide.iconBg.includes('10b981') ? 'rgba(16, 185, 129, 0.4)' : slide.iconBg.includes('8b5cf6') ? 'rgba(139, 92, 246, 0.4)' : slide.iconBg.includes('f59e0b') ? 'rgba(245, 158, 11, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
              }}
            >
              <IconComponent size={40} className="text-white" />
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-3xl animate-pulse"
                style={{
                  background: slide.iconBg,
                  filter: 'blur(20px)',
                  opacity: 0.5,
                }}
              />
            </div>
          </div>

          {/* Text content */}
          <div
            className={`text-center max-w-xl transition-all duration-500 ${isAnimating ? 'translate-y-4 opacity-0' : 'translate-y-0 opacity-100'}`}
          >
            <p
              className="text-sm font-medium uppercase tracking-wider mb-3"
              style={{ color: t.accent }}
            >
              {slide.subtitle}
            </p>
            <h1
              className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
              style={{ color: t.text }}
            >
              {slide.title}
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: t.textSecondary }}
            >
              {slide.description}
            </p>
          </div>

          {/* Visual element based on slide */}
          <div
            className={`mt-12 transition-all duration-500 delay-100 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
          >
            <SlideVisual visual={slide.visual} theme={theme} />
          </div>

          {/* Navigation */}
          <div className="mt-12 flex flex-col items-center gap-8">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="transition-all duration-300"
                  style={{
                    width: currentSlide === index ? '32px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: currentSlide === index ? t.accent : t.border,
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4">
              {currentSlide > 0 && (
                <button
                  onClick={prevSlide}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{
                    background: t.bgCard,
                    color: t.textSecondary,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <ChevronLeft size={18} />
                  Back
                </button>
              )}

              <button
                onClick={nextSlide}
                className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isLastSlide ? "Let's Go" : 'Continue'}
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Skip */}
            {!isLastSlide && (
              <button
                onClick={onComplete}
                className="text-sm transition-colors"
                style={{ color: t.textMuted }}
              >
                Skip intro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideVisual({ visual, theme }: { visual: string; theme: 'light' | 'dark' }) {
  const t = themes[theme];

  if (visual === 'welcome') {
    return (
      <div className="flex items-center gap-4">
        {['Subscriptions', 'Spending', 'Income', 'Insights'].map((item, i) => (
          <div
            key={item}
            className="px-4 py-2 rounded-xl text-sm font-medium animate-fade-in"
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              color: t.textSecondary,
              animationDelay: `${i * 100}ms`,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (visual === 'privacy') {
    return (
      <div
        className="flex items-center gap-6 px-8 py-6 rounded-2xl"
        style={{
          background: t.bgCard,
          border: `1px solid ${t.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <Database size={20} className="text-emerald-500" />
          </div>
          <span style={{ color: t.textSecondary }}>Local SQLite</span>
        </div>
        <div className="w-px h-8" style={{ background: t.border }} />
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Lock size={20} className="text-purple-500" />
          </div>
          <span style={{ color: t.textSecondary }}>Encrypted</span>
        </div>
        <div className="w-px h-8" style={{ background: t.border }} />
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Eye size={20} className="text-blue-500" />
          </div>
          <span style={{ color: t.textSecondary }}>Open Source</span>
        </div>
      </div>
    );
  }

  if (visual === 'ai') {
    return (
      <div className="flex flex-col gap-3">
        {[
          { label: 'Swiggy Order', category: 'Food & Dining', color: '#f59e0b' },
          { label: 'Netflix', category: 'Subscription', color: '#8b5cf6' },
          { label: 'Salary Credit', category: 'Income', color: '#10b981' },
        ].map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-12 px-6 py-3 rounded-xl animate-fade-in"
            style={{
              background: t.bgCard,
              border: `1px solid ${t.border}`,
              animationDelay: `${i * 150}ms`,
            }}
          >
            <span style={{ color: t.text }}>{item.label}</span>
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: item.color }} />
              <span className="text-sm font-medium" style={{ color: item.color }}>
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (visual === 'dashboard') {
    return (
      <div className="flex items-end gap-3">
        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
          <div
            key={i}
            className="w-8 rounded-t-lg animate-fade-in"
            style={{
              height: `${height}px`,
              background: i === 5
                ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                : t.bgCard,
              border: `1px solid ${i === 5 ? '#10b981' : t.border}`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
