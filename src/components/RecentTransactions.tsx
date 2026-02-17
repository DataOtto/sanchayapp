'use client';

import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

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
  Salary: '💰',
  Freelance: '💼',
  Refund: '↩️',
  Cashback: '💵',
  Interest: '🏛️',
  Cash: '💳',
  Transfer: '🔄',
  Other: '📦',
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { theme } = useTheme();
  const t = themes[theme];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: t.textMuted }}>
        <p>No transactions yet</p>
        <p className="text-sm mt-1">Connect Gmail to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-4 p-3 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = t.bgInput)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{ background: t.bgInput }}
          >
            {categoryIcons[tx.category] || '📦'}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate" style={{ color: t.text }}>{tx.description}</p>
            <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
              <span>{tx.category}</span>
              <span>•</span>
              <span>{tx.source}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right">
            <p
              className="font-semibold"
              style={{ color: tx.type === 'credit' ? '#10b981' : t.text }}
            >
              {tx.type === 'credit' ? '+' : '-'}
              {formatCurrency(tx.amount)}
            </p>
            <p className="text-xs" style={{ color: t.textMuted }}>{formatDate(tx.date)}</p>
          </div>

          {/* Arrow indicator */}
          <div
            className={`p-1.5 rounded-full ${
              tx.type === 'credit'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-red-500/10 text-red-500'
            }`}
          >
            {tx.type === 'credit' ? (
              <ArrowDownLeft size={14} />
            ) : (
              <ArrowUpRight size={14} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
