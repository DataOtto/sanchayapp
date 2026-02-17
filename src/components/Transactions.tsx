'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Download,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { Transaction } from '@/types';

interface TransactionsProps {
  isElectron: boolean;
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

export function Transactions({ isElectron }: TransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      loadData();
    } else {
      loadMockData();
    }
  }, [isElectron]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.db.getTransactions({ limit: 100 });
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockTransactions: Transaction[] = [
      { id: '1', date: '2024-01-15', amount: 649, description: 'Netflix Subscription', category: 'Entertainment', type: 'debit', source: 'HDFC' },
      { id: '2', date: '2024-01-15', amount: 150000, description: 'Salary Credited - January', category: 'Salary', type: 'credit', source: 'HDFC' },
      { id: '3', date: '2024-01-14', amount: 1250, description: 'Swiggy Order - Biryani Paradise', category: 'Food', type: 'debit', source: 'ICICI' },
      { id: '4', date: '2024-01-14', amount: 5500, description: 'Amazon - Electronics', category: 'Shopping', type: 'debit', source: 'Axis' },
      { id: '5', date: '2024-01-13', amount: 500, description: 'Uber Ride - Airport', category: 'Transport', type: 'debit', source: 'Paytm' },
      { id: '6', date: '2024-01-13', amount: 2500, description: 'Freelance Payment - Logo Design', category: 'Freelance', type: 'credit', source: 'Razorpay' },
      { id: '7', date: '2024-01-12', amount: 3500, description: 'Electricity Bill', category: 'Utilities', type: 'debit', source: 'HDFC' },
      { id: '8', date: '2024-01-12', amount: 850, description: 'Zomato Order', category: 'Food', type: 'debit', source: 'ICICI' },
      { id: '9', date: '2024-01-11', amount: 15000, description: 'SIP - Axis Bluechip Fund', category: 'Investment', type: 'debit', source: 'HDFC' },
      { id: '10', date: '2024-01-11', amount: 1200, description: 'Amazon Refund', category: 'Refund', type: 'credit', source: 'Amazon' },
      { id: '11', date: '2024-01-10', amount: 8500, description: 'Flipkart - Furniture', category: 'Shopping', type: 'debit', source: 'Axis' },
      { id: '12', date: '2024-01-10', amount: 350, description: 'Ola Ride', category: 'Transport', type: 'debit', source: 'Paytm' },
      { id: '13', date: '2024-01-09', amount: 999, description: 'Hotstar Premium', category: 'Entertainment', type: 'debit', source: 'HDFC' },
      { id: '14', date: '2024-01-09', amount: 2000, description: 'Credit Card Cashback', category: 'Cashback', type: 'credit', source: 'ICICI' },
      { id: '15', date: '2024-01-08', amount: 450, description: 'Dominos Pizza', category: 'Food', type: 'debit', source: 'HDFC' },
    ];
    setTransactions(mockTransactions);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const categories = Array.from(new Set(transactions.map((t) => t.category))).sort();

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.source?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const totalCredit = filteredTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = filteredTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse" style={{ color: t.textMuted }}>Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: t.text }}>Transactions</h1>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>
              {filteredTransactions.length} transactions found
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: t.bgInput, color: t.textSecondary }}
          >
            <Download size={16} />
            Export
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <p className="text-sm" style={{ color: t.textMuted }}>Total Income</p>
            <p className="text-xl font-bold text-emerald-500 mt-1">
              +{formatCurrency(totalCredit)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <p className="text-sm" style={{ color: t.textMuted }}>Total Expense</p>
            <p className="text-xl font-bold text-red-500 mt-1">
              -{formatCurrency(totalDebit)}
            </p>
          </div>
          <div
            className="rounded-xl p-4"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <p className="text-sm" style={{ color: t.textMuted }}>Net Flow</p>
            <p
              className={`text-xl font-bold mt-1 ${
                totalCredit - totalDebit >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {totalCredit - totalDebit >= 0 ? '+' : ''}
              {formatCurrency(totalCredit - totalDebit)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: t.textMuted }}
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
              style={{
                background: t.bgInput,
                border: `1px solid ${t.border}`,
                color: t.text,
              }}
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'credit', 'debit'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: filterType === type ? '#10b981' : t.bgInput,
                  color: filterType === type ? 'white' : t.textMuted,
                }}
              >
                {type === 'all' ? 'All' : type === 'credit' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            style={{
              background: t.bgInput,
              border: `1px solid ${t.border}`,
              color: t.text,
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Transactions List */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
        >
          <div style={{ borderColor: t.border }}>
            {filteredTransactions.map((tx, index) => (
              <div
                key={tx.id}
                className="flex items-center gap-4 p-4 transition-colors"
                style={{
                  borderBottom: index < filteredTransactions.length - 1 ? `1px solid ${t.border}` : 'none',
                  background: 'transparent',
                }}
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
                  <div className="flex items-center gap-2 text-sm mt-0.5" style={{ color: t.textMuted }}>
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span>{tx.source}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="hidden sm:flex items-center gap-1 text-sm" style={{ color: t.textMuted }}>
                  <Calendar size={14} />
                  {formatDate(tx.date)}
                </div>

                {/* Amount */}
                <div
                  className="font-semibold"
                  style={{ color: tx.type === 'credit' ? '#10b981' : t.text }}
                >
                  {tx.type === 'credit' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </div>

                {/* Arrow */}
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
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12" style={{ color: t.textMuted }}>
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
