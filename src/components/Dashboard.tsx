'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Sparkles,
  Activity,
} from 'lucide-react';
import { SpendingChart } from './SpendingChart';
import { CategoryBreakdown } from './CategoryBreakdown';
import { RecentTransactions } from './RecentTransactions';
import { useTheme, themes } from '@/lib/theme';
import type { Transaction, CategorySpending, BalanceSummary, Subscription } from '@/types';

interface DashboardProps {
  isElectron: boolean;
}

export function Dashboard({ isElectron }: DashboardProps) {
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isElectron]);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [balanceData, spendingData, transactions, subs] = await Promise.all([
        window.electronAPI.db.getTotalBalance(),
        window.electronAPI.db.getSpendingByCategory({ startDate: startOfMonth, endDate: endOfMonth }),
        window.electronAPI.db.getTransactions({ limit: 10 }),
        window.electronAPI.db.getSubscriptions(),
      ]);

      setBalance(balanceData || { total_income: 0, total_expense: 0 });
      setSpending(spendingData || []);
      setRecentTransactions(transactions || []);
      setSubscriptions(subs || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setBalance({ total_income: 0, total_expense: 0 });
      setSpending([]);
      setRecentTransactions([]);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalExpense = balance?.total_expense || 0;
  const totalIncome = balance?.total_income || 0;
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : '0';

  // Calculate subscription totals
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
  const monthlySubTotal = activeSubscriptions.reduce((sum, s) => {
    let monthly = s.amount;
    if (s.billing_cycle === 'yearly') monthly = s.amount / 12;
    if (s.billing_cycle === 'quarterly') monthly = s.amount / 3;
    if (s.billing_cycle === 'weekly') monthly = s.amount * 4;
    if (s.currency === 'USD') monthly *= 83;
    return sum + monthly;
  }, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: `${t.accent} transparent ${t.accent} ${t.accent}` }}
          />
          <span style={{ color: t.textMuted }}>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${t.accentGlow} 0%, transparent 100%)`,
              }}
            >
              <Activity size={20} style={{ color: t.accentLight }} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ color: t.text }}>
              Dashboard
            </h1>
          </div>
          <p className="text-sm" style={{ color: t.textMuted }}>
            Your financial overview for this month
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <SummaryCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            icon={<TrendingUp size={20} />}
            trend="+12%"
            trendUp={true}
            color="emerald"
            theme={theme}
          />
          <SummaryCard
            title="Total Expense"
            value={formatCurrency(totalExpense)}
            icon={<TrendingDown size={20} />}
            trend="+5%"
            trendUp={false}
            color="rose"
            theme={theme}
          />
          <SummaryCard
            title="Net Savings"
            value={formatCurrency(netSavings)}
            icon={<Wallet size={20} />}
            trend={`${savingsRate}% rate`}
            trendUp={netSavings > 0}
            color="blue"
            theme={theme}
          />
          <SummaryCard
            title="Subscriptions"
            value={formatCurrency(Math.round(monthlySubTotal))}
            subtitle="/month"
            icon={<CreditCard size={20} />}
            trend={`${activeSubscriptions.length} active`}
            color="purple"
            theme={theme}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className="rounded-2xl p-6 glass-card glass-card-hover"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-medium" style={{ color: t.text }}>
                Monthly Spending Trend
              </h3>
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: t.accentGlow,
                  color: t.accentLight,
                }}
              >
                2024
              </div>
            </div>
            <SpendingChart isElectron={isElectron} />
          </div>

          <div
            className="rounded-2xl p-6 glass-card glass-card-hover"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-medium" style={{ color: t.text }}>
                Spending by Category
              </h3>
              <div
                className="px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: t.purpleGlow,
                  color: t.purple,
                }}
              >
                This Month
              </div>
            </div>
            <CategoryBreakdown data={spending} />
          </div>
        </div>

        {/* Recent Transactions */}
        <div
          className="rounded-2xl p-6 glass-card glass-card-hover"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-medium" style={{ color: t.text }}>
              Recent Transactions
            </h3>
            <button
              className="text-sm transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{
                color: t.accentLight,
                background: t.accentGlow,
              }}
            >
              <Sparkles size={14} />
              View All
            </button>
          </div>
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: 'emerald' | 'rose' | 'blue' | 'purple';
  theme: 'light' | 'dark';
}

function SummaryCard({ title, value, subtitle, icon, trend, trendUp, color, theme }: SummaryCardProps) {
  const t = themes[theme];

  const colorStyles = {
    emerald: {
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      border: 'rgba(16, 185, 129, 0.2)',
      iconBg: 'rgba(16, 185, 129, 0.15)',
      iconColor: '#34d399',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    rose: {
      gradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(244, 63, 94, 0.05) 100%)',
      border: 'rgba(244, 63, 94, 0.2)',
      iconBg: 'rgba(244, 63, 94, 0.15)',
      iconColor: '#fb7185',
      glow: 'rgba(244, 63, 94, 0.3)',
    },
    blue: {
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
      border: 'rgba(59, 130, 246, 0.2)',
      iconBg: 'rgba(59, 130, 246, 0.15)',
      iconColor: '#60a5fa',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
    purple: {
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
      border: 'rgba(139, 92, 246, 0.2)',
      iconBg: 'rgba(139, 92, 246, 0.15)',
      iconColor: '#a78bfa',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
  };

  const c = colorStyles[color];

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
      style={{
        background: c.gradient,
        border: `1px solid ${c.border}`,
        boxShadow: `0 4px 24px rgba(0, 0, 0, 0.2), 0 0 0 1px ${c.border}`,
      }}
    >
      {/* Subtle shine effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{ background: c.iconColor }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm" style={{ color: t.textMuted }}>{title}</p>
          <p className="text-2xl font-semibold mt-1.5" style={{ color: t.text }}>
            {value}
            {subtitle && (
              <span className="text-sm font-normal ml-1" style={{ color: t.textMuted }}>
                {subtitle}
              </span>
            )}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {trendUp !== undefined && (
                trendUp ? (
                  <ArrowUpRight size={14} style={{ color: colorStyles.emerald.iconColor }} />
                ) : (
                  <ArrowDownRight size={14} style={{ color: colorStyles.rose.iconColor }} />
                )
              )}
              <span
                className="text-xs font-medium"
                style={{
                  color: trendUp === undefined
                    ? t.textMuted
                    : trendUp
                    ? colorStyles.emerald.iconColor
                    : colorStyles.rose.iconColor,
                }}
              >
                {trend}
              </span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl relative"
          style={{
            background: c.iconBg,
            color: c.iconColor,
            boxShadow: `0 0 20px ${c.glow}`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
