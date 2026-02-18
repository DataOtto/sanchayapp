'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Briefcase,
  Gift,
  RotateCcw,
  PiggyBank,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTheme, themes } from '@/lib/theme';
import type { Transaction, CategorySpending } from '@/types';

interface IncomeProps {
  isElectron: boolean;
}

const incomeIcons: Record<string, React.ReactNode> = {
  Salary: <Briefcase size={20} />,
  Freelance: <Wallet size={20} />,
  Investment: <TrendingUp size={20} />,
  Refund: <RotateCcw size={20} />,
  Cashback: <Gift size={20} />,
  Interest: <PiggyBank size={20} />,
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export function Income({ isElectron }: IncomeProps) {
  const [incomeData, setIncomeData] = useState<CategorySpending[]>([]);
  const [recentIncome, setRecentIncome] = useState<Transaction[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: string; amount: number }[]>([]);
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

      const [income, transactions] = await Promise.all([
        window.electronAPI.db.getIncomeSummary({ startDate: startOfMonth, endDate: endOfMonth }),
        window.electronAPI.db.getTransactions({ type: 'credit', limit: 20 }),
      ]);

      setIncomeData(income || []);
      setRecentIncome(transactions || []);
    } catch (error) {
      console.error('Failed to load income data:', error);
      setIncomeData([]);
      setRecentIncome([]);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const totalIncome = incomeData.reduce((sum, item) => sum + item.total, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg p-3 shadow-xl"
          style={{
            background: t.bgSolid,
            border: `1px solid ${t.border}`,
          }}
        >
          <p className="text-xs" style={{ color: t.textMuted }}>{label}</p>
          <p className="font-semibold" style={{ color: t.text }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse" style={{ color: t.textMuted }}>Loading income data...</div>
      </div>
    );
  }

  if (incomeData.length === 0 && recentIncome.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <TrendingUp size={48} className="mx-auto mb-4 opacity-50" style={{ color: t.textMuted }} />
          <p className="text-lg font-medium" style={{ color: t.text }}>No income data yet</p>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            Connect Gmail in Settings to sync your financial emails
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: t.text }}>
            <TrendingUp className="text-emerald-500" />
            Income Summary
          </h1>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            Track all your income sources
          </p>
        </div>

        {/* Total Income Card */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: t.textMuted }}>Total Income This Month</p>
              <p className="text-4xl font-bold mt-2" style={{ color: t.text }}>{formatCurrency(totalIncome)}</p>
              <div className="flex items-center gap-2 mt-2 text-emerald-500">
                <TrendingUp size={16} />
                <span className="text-sm">+8.5% vs last month</span>
              </div>
            </div>
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="total"
                  >
                    {incomeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Income Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Category */}
          <div
            className="rounded-xl p-5"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Income by Source</h3>
            <div className="space-y-3">
              {incomeData.map((item, index) => {
                const percentage = ((item.total / totalIncome) * 100).toFixed(1);
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded"
                          style={{ backgroundColor: `${COLORS[index]}20`, color: COLORS[index] }}
                        >
                          {incomeIcons[item.category] || <Wallet size={16} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: t.textSecondary }}>{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold" style={{ color: t.text }}>{formatCurrency(item.total)}</span>
                        <span className="text-sm ml-2" style={{ color: t.textMuted }}>({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: t.bgInput }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trend */}
          <div
            className="rounded-xl p-5"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Monthly Income Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyIncome} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: t.textMuted, fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: t.textMuted, fontSize: 12 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="amount"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Income */}
        <div
          className="rounded-xl p-5"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: t.text }}>Recent Income</h3>
          <div className="space-y-3">
            {recentIncome.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-3 rounded-lg transition-colors"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.bgInput)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: `${COLORS[incomeData.findIndex((i) => i.category === tx.category) % COLORS.length]}20`,
                    color: COLORS[incomeData.findIndex((i) => i.category === tx.category) % COLORS.length],
                  }}
                >
                  {incomeIcons[tx.category] || <Wallet size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: t.text }}>{tx.description}</p>
                  <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span>{tx.source}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-emerald-500">
                    +{formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
