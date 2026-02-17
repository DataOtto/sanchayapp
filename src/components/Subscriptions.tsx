'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { Subscription } from '@/types';

interface SubscriptionsProps {
  isElectron: boolean;
}

const serviceLogo: Record<string, string> = {
  Netflix: '🎬',
  Spotify: '🎵',
  'Amazon Prime': '📦',
  'ChatGPT Plus': '🤖',
  OpenAI: '🤖',
  'YouTube Premium': '▶️',
  'Disney+': '🏰',
  'Disney+ Hotstar': '🏰',
  AWS: '☁️',
  'Google Workspace': '📧',
  'Microsoft 365': '📊',
  Dropbox: '📁',
  Notion: '📝',
  Figma: '🎨',
  GitHub: '💻',
  Vercel: '▲',
  Render: '🚀',
  Railway: '🚂',
  Zerodha: '📈',
  Groww: '🌱',
  'Swiggy One': '🍔',
  'Zomato Pro': '🍕',
};

export function Subscriptions({ isElectron }: SubscriptionsProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
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
      const data = await window.electronAPI.db.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setSubscriptions([
      {
        id: '1',
        name: 'Netflix',
        amount: 649,
        currency: 'INR',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-01',
        category: 'Entertainment',
        status: 'active',
      },
      {
        id: '2',
        name: 'ChatGPT Plus',
        amount: 20,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-01-25',
        category: 'Productivity',
        status: 'active',
      },
      {
        id: '3',
        name: 'Spotify',
        amount: 119,
        currency: 'INR',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-05',
        category: 'Entertainment',
        status: 'active',
      },
      {
        id: '4',
        name: 'AWS',
        amount: 45,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-01',
        category: 'Cloud Services',
        status: 'active',
      },
      {
        id: '5',
        name: 'Amazon Prime',
        amount: 1499,
        currency: 'INR',
        billing_cycle: 'yearly',
        next_billing_date: '2024-06-15',
        category: 'Shopping',
        status: 'active',
      },
      {
        id: '6',
        name: 'GitHub',
        amount: 4,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-10',
        category: 'Development',
        status: 'active',
      },
      {
        id: '7',
        name: 'Notion',
        amount: 10,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-08',
        category: 'Productivity',
        status: 'paused',
      },
      {
        id: '8',
        name: 'Figma',
        amount: 15,
        currency: 'USD',
        billing_cycle: 'monthly',
        next_billing_date: '2024-02-12',
        category: 'Design',
        status: 'active',
      },
    ]);
    setLoading(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'USD') {
      return `$${amount}`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntil = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const totalMonthly = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      let monthly = s.amount;
      if (s.billing_cycle === 'yearly') monthly = s.amount / 12;
      if (s.billing_cycle === 'quarterly') monthly = s.amount / 3;
      if (s.billing_cycle === 'weekly') monthly = s.amount * 4;
      // Convert USD to INR (approximate)
      if (s.currency === 'USD') monthly *= 83;
      return sum + monthly;
    }, 0);

  const upcomingBillings = subscriptions
    .filter((s) => s.status === 'active' && s.next_billing_date)
    .filter((s) => {
      const days = getDaysUntil(s.next_billing_date);
      return days !== null && days <= 7 && days >= 0;
    });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse" style={{ color: t.textMuted }}>Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: t.text }}>Subscriptions</h1>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>
              Track and manage your recurring payments
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <DollarSign size={20} />
              </div>
              <div>
                <p className="text-sm" style={{ color: t.textMuted }}>Monthly Total</p>
                <p className="text-xl font-bold" style={{ color: t.text }}>
                  ₹{Math.round(totalMonthly).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                <RefreshCw size={20} />
              </div>
              <div>
                <p className="text-sm" style={{ color: t.textMuted }}>Active Subscriptions</p>
                <p className="text-xl font-bold" style={{ color: t.text }}>
                  {subscriptions.filter((s) => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: t.bgCard, border: `1px solid ${t.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-sm" style={{ color: t.textMuted }}>Due This Week</p>
                <p className="text-xl font-bold" style={{ color: t.text }}>{upcomingBillings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Billings Alert */}
        {upcomingBillings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-500" size={20} />
              <div>
                <p className="font-medium text-amber-500">Upcoming Billings</p>
                <p className="text-sm mt-1" style={{ color: t.textMuted }}>
                  {upcomingBillings.map((s) => s.name).join(', ')} will renew
                  this week
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: filter === f ? '#10b981' : t.bgInput,
                color: filter === f ? 'white' : t.textMuted,
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Subscriptions List */}
        <div className="grid gap-3">
          {filteredSubscriptions.map((sub) => {
            const daysUntil = getDaysUntil(sub.next_billing_date);

            return (
              <div
                key={sub.id}
                className="rounded-xl p-4 transition-colors"
                style={{
                  background: t.bgCard,
                  border: `1px solid ${t.border}`,
                  opacity: sub.status === 'paused' ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: t.bgInput }}
                  >
                    {serviceLogo[sub.name] || '📦'}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: t.text }}>{sub.name}</p>
                      {sub.status === 'paused' && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-500">
                          Paused
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm mt-1" style={{ color: t.textMuted }}>
                      <span>{sub.category}</span>
                      <span>•</span>
                      <span className="capitalize">{sub.billing_cycle}</span>
                    </div>
                  </div>

                  {/* Next Billing */}
                  {sub.next_billing_date && sub.status === 'active' && (
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm" style={{ color: t.textMuted }}>
                        <Calendar size={14} />
                        <span>
                          {daysUntil !== null && daysUntil <= 7
                            ? daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                              ? 'Tomorrow'
                              : `${daysUntil} days`
                            : new Date(sub.next_billing_date).toLocaleDateString(
                                'en-IN',
                                { day: 'numeric', month: 'short' }
                              )}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="text-right">
                    <p className="font-semibold text-lg" style={{ color: t.text }}>
                      {formatCurrency(sub.amount, sub.currency)}
                    </p>
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      /{sub.billing_cycle === 'monthly' ? 'mo' : sub.billing_cycle === 'yearly' ? 'yr' : sub.billing_cycle}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: t.textMuted }}
                      title={sub.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {sub.status === 'active' ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                    <button
                      className="p-2 rounded-lg transition-colors hover:text-red-500"
                      style={{ color: t.textMuted }}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubscriptions.length === 0 && (
          <div className="text-center py-12" style={{ color: t.textMuted }}>
            <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No subscriptions found</p>
            <p className="text-sm mt-1">
              Connect Gmail to automatically detect your subscriptions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
