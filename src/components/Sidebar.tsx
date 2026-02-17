'use client';

import { useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Lightbulb,
  Settings,
  RefreshCw,
  Mail,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isConnected: boolean;
  isSyncing: boolean;
  onSync: () => void;
  lastSync?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { id: 'income', label: 'Income', icon: TrendingUp },
  { id: 'insights', label: 'Smart Insights', icon: Lightbulb },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  currentView,
  onViewChange,
  isConnected,
  isSyncing,
  onSync,
  lastSync,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const t = themes[theme];

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <aside
      className="h-screen flex flex-col shrink-0 transition-all duration-300 relative"
      style={{
        width: isCollapsed ? '72px' : '260px',
        background: t.bgSidebar,
        borderRight: `1px solid ${t.border}`,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 70% 0%, rgba(16, 185, 129, 0.03), transparent 50%)',
        }}
      />

      {/* Header - space for traffic lights */}
      <div className="h-[52px] flex items-end pb-3 pl-[78px] pr-4 drag-region relative z-10">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 no-drag">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center relative"
              style={{
                background: t.accentGradient,
                boxShadow: `0 4px 20px ${t.accentGlow}`,
              }}
            >
              <Sparkles size={16} className="text-white" />
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-xl pulse-glow"
                style={{
                  background: t.accentGradient,
                  filter: 'blur(8px)',
                  opacity: 0.4,
                }}
              />
            </div>
            <span
              className="font-semibold text-[15px] tracking-tight"
              style={{ color: t.text }}
            >
              Sanchay
            </span>
          </div>
        )}
      </div>

      {/* Collapse & Theme toggle */}
      <div className="px-3 py-2 flex items-center gap-2 relative z-10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-1 flex items-center justify-center py-2 rounded-xl no-drag transition-all duration-200"
          style={{
            color: t.textMuted,
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = t.bgButton;
            e.currentTarget.style.color = t.textSecondary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = t.textMuted;
          }}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!isCollapsed && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl no-drag transition-all duration-200"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bgButton;
              e.currentTarget.style.color = t.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = t.textMuted;
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
      </div>

      {/* Sync Button */}
      <div className="px-3 pb-4 relative z-10">
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl no-drag transition-all duration-300 relative overflow-hidden group"
          style={{
            background: isConnected
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
              : t.bgButton,
            border: `1px solid ${isConnected ? t.borderAccent : t.border}`,
            opacity: isSyncing ? 0.7 : 1,
          }}
        >
          {/* Shimmer effect on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
              transform: 'translateX(-100%)',
              animation: 'shimmer 2s infinite',
            }}
          />

          {isSyncing ? (
            <RefreshCw size={18} className="animate-spin" style={{ color: t.accentLight }} />
          ) : (
            <div
              className="p-1.5 rounded-lg"
              style={{
                background: isConnected ? t.accentGlow : t.bgInput,
              }}
            >
              <Mail size={16} style={{ color: isConnected ? t.accentLight : t.textMuted }} />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <div
                className="text-sm font-medium"
                style={{ color: isConnected ? t.accentLight : t.textSecondary }}
              >
                {isSyncing ? 'Syncing...' : isConnected ? 'Sync Gmail' : 'Connect Gmail'}
              </div>
              {isConnected && !isSyncing && (
                <div className="text-[11px]" style={{ color: t.textDim }}>
                  Last: {formatLastSync(lastSync)}
                </div>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl no-drag transition-all duration-200 relative group"
              style={{
                background: isActive
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)'
                  : 'transparent',
                color: isActive ? t.text : t.textMuted,
                border: isActive ? `1px solid ${t.borderGlass}` : '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = t.bgButton;
                  e.currentTarget.style.color = t.textSecondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = t.textMuted;
                }
              }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                  style={{
                    background: t.accentGradient,
                    boxShadow: `0 0 12px ${t.accentGlow}`,
                  }}
                />
              )}

              <Icon
                size={18}
                style={{
                  color: isActive ? t.accentLight : undefined,
                  filter: isActive ? `drop-shadow(0 0 6px ${t.accentGlow})` : undefined,
                }}
              />
              {!isCollapsed && (
                <span className="text-[13px] font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme toggle for collapsed state */}
      {isCollapsed && (
        <div className="px-3 pb-2 relative z-10">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center py-2.5 rounded-xl no-drag transition-all duration-200"
            style={{ color: t.textMuted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = t.bgButton;
              e.currentTarget.style.color = t.textSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = t.textMuted;
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div
          className="p-4 relative z-10"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <div className="text-[11px]" style={{ color: t.textDim }}>
            <p className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full status-dot"
                style={{ background: t.accent }}
              />
              <span style={{ color: t.textMuted }}>Your data stays local</span>
            </p>
            <p className="mt-2 flex items-center gap-1.5">
              <span>v1.0.0</span>
              <span style={{ color: t.textDim }}>•</span>
              <span style={{ color: t.accentLight }}>Pro</span>
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
