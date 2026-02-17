'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme, themes } from '@/lib/theme';
import type { CategorySpending } from '@/types';

interface CategoryBreakdownProps {
  data: CategorySpending[];
}

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Shopping: '🛍️',
  Transport: '🚗',
  Entertainment: '🎬',
  Bills: '📱',
  Investment: '📈',
  Groceries: '🥬',
  Travel: '✈️',
  EMI: '🏦',
  Insurance: '🛡️',
  Utilities: '💡',
  Other: '📦',
};

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const { theme } = useTheme();
  const t = themes[theme];
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.total / total) * 100).toFixed(1);
      return (
        <div
          className="rounded-lg p-3 shadow-xl"
          style={{
            background: t.bgSolid,
            border: `1px solid ${t.border}`,
          }}
        >
          <p className="font-semibold flex items-center gap-2" style={{ color: t.text }}>
            <span>{categoryIcons[item.category] || '📦'}</span>
            {item.category}
          </p>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            {formatCurrency(item.total)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center" style={{ color: t.textMuted }}>
        No spending data available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      {/* Pie Chart */}
      <div className="w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="total"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {data.slice(0, 6).map((item, index) => {
          const percentage = ((item.total / total) * 100).toFixed(1);
          return (
            <div key={item.category} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm flex-1" style={{ color: t.textSecondary }}>
                {categoryIcons[item.category] || '📦'} {item.category}
              </span>
              <span className="text-sm" style={{ color: t.textMuted }}>{percentage}%</span>
            </div>
          );
        })}
        {data.length > 6 && (
          <p className="text-xs mt-2" style={{ color: t.textMuted }}>
            +{data.length - 6} more categories
          </p>
        )}
      </div>
    </div>
  );
}
