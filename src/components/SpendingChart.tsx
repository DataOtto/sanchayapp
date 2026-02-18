'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTheme, themes } from '@/lib/theme';
import type { MonthlySpending } from '@/types';

interface SpendingChartProps {
  isElectron: boolean;
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SpendingChart({ isElectron }: SpendingChartProps) {
  const [data, setData] = useState<{ month: string; amount: number }[]>([]);
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      loadData();
    } else {
      // Show empty chart for all months
      setData(monthNames.map((name) => ({ month: name, amount: 0 })));
    }
  }, [isElectron]);

  const loadData = async () => {
    try {
      const year = new Date().getFullYear();
      const monthlyData = await window.electronAPI.db.getMonthlySpending({ year });

      const chartData = monthNames.map((name, index) => {
        const monthNum = String(index + 1).padStart(2, '0');
        const found = monthlyData?.find((m: MonthlySpending) => m.month === monthNum);
        return {
          month: name,
          amount: found?.total || 0,
        };
      });

      setData(chartData);
    } catch (error) {
      console.error('Failed to load spending data:', error);
      setData(monthNames.map((name) => ({ month: name, amount: 0 })));
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

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
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={formatCurrency}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
