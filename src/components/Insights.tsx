'use client';

import { useEffect, useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Award,
  X,
  ChevronRight,
  PiggyBank,
  Target,
  Zap,
} from 'lucide-react';
import { useTheme, themes } from '@/lib/theme';
import type { Transaction, CategorySpending, Insight } from '@/types';

interface InsightsProps {
  isElectron: boolean;
}

interface GeneratedInsight {
  id: string;
  type: 'saving' | 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  impact?: string;
  action?: string;
  data?: Record<string, any>;
}

export function Insights({ isElectron }: InsightsProps) {
  const [insights, setInsights] = useState<GeneratedInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { theme } = useTheme();
  const t = themes[theme];

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      generateInsights();
    } else {
      loadMockInsights();
    }
  }, [isElectron]);

  const generateInsights = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Get last 3 months of data
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];

      const [spending, transactions, subscriptions] = await Promise.all([
        window.electronAPI.db.getSpendingByCategory({ startDate: threeMonthsAgo, endDate: endOfMonth }),
        window.electronAPI.db.getTransactions({ startDate: threeMonthsAgo, endDate: endOfMonth }),
        window.electronAPI.db.getSubscriptions(),
      ]);

      const generated = generateInsightsFromData(spending, transactions, subscriptions);
      setInsights(generated);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      loadMockInsights();
    } finally {
      setLoading(false);
    }
  };

  const generateInsightsFromData = (
    spending: CategorySpending[],
    transactions: Transaction[],
    subscriptions: any[]
  ): GeneratedInsight[] => {
    const insights: GeneratedInsight[] = [];

    // Food spending insight
    const foodSpending = spending.find((s) => s.category === 'Food');
    if (foodSpending && foodSpending.total > 10000) {
      const reduction = Math.round(foodSpending.total * 0.25);
      const yearlySavings = reduction * 12;
      const investedAmount = Math.round(yearlySavings * Math.pow(1.12, 7));

      insights.push({
        id: 'food-savings',
        type: 'saving',
        title: 'Food Delivery Optimization',
        description: `You spent ₹${foodSpending.total.toLocaleString('en-IN')} on food this month. If you reduce food delivery by 25%, you could save ₹${reduction.toLocaleString('en-IN')}/month.`,
        impact: `Invested at 12% returns, this becomes ₹${investedAmount.toLocaleString('en-IN')} in 7 years.`,
        action: 'Try cooking at home twice a week',
      });
    }

    // Subscription optimization
    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
    const totalSubCost = activeSubscriptions.reduce((sum, s) => {
      let monthly = s.amount;
      if (s.billing_cycle === 'yearly') monthly = s.amount / 12;
      if (s.currency === 'USD') monthly *= 83;
      return sum + monthly;
    }, 0);

    if (totalSubCost > 3000) {
      insights.push({
        id: 'subscription-review',
        type: 'warning',
        title: 'High Subscription Costs',
        description: `You're spending ₹${Math.round(totalSubCost).toLocaleString('en-IN')}/month on ${activeSubscriptions.length} subscriptions.`,
        impact: `That's ₹${Math.round(totalSubCost * 12).toLocaleString('en-IN')}/year on recurring services.`,
        action: 'Review and cancel unused subscriptions',
      });
    }

    // Shopping spike detection
    const shoppingSpending = spending.find((s) => s.category === 'Shopping');
    if (shoppingSpending && shoppingSpending.total > 15000) {
      insights.push({
        id: 'shopping-alert',
        type: 'warning',
        title: 'Shopping Spike Detected',
        description: `Your shopping expenses are ₹${shoppingSpending.total.toLocaleString('en-IN')} this period.`,
        impact: 'This is higher than average for most households.',
        action: 'Consider a 30-day no-buy challenge',
      });
    }

    // Investment tip
    const investmentSpending = spending.find((s) => s.category === 'Investment');
    if (!investmentSpending || investmentSpending.total < 5000) {
      insights.push({
        id: 'investment-tip',
        type: 'tip',
        title: 'Start Investing Today',
        description: 'Even small amounts can grow significantly with compound interest.',
        impact: '₹5,000/month at 12% returns = ₹50 lakhs in 20 years.',
        action: 'Set up a SIP in an index fund',
      });
    }

    return insights;
  };

  const loadMockInsights = () => {
    setInsights([
      {
        id: '1',
        type: 'saving',
        title: 'Reduce Food Delivery by 25%',
        description:
          'You spent ₹18,500 on Swiggy & Zomato this month. Cutting back by 25% would save ₹4,625/month.',
        impact:
          'Invested at 12% returns, this becomes ₹6.5 lakhs in 7 years.',
        action: 'Try cooking at home twice a week',
      },
      {
        id: '2',
        type: 'warning',
        title: 'Unused Subscription Detected',
        description:
          'Notion Premium (₹833/month) - No activity in the last 60 days.',
        impact: 'Cancel to save ₹10,000/year',
        action: 'Review subscription',
      },
      {
        id: '3',
        type: 'tip',
        title: 'Emergency Fund Goal',
        description:
          'Based on your expenses, you need ₹2.4L for a 6-month emergency fund.',
        impact:
          'You currently have ₹80,000 saved. You need ₹1.6L more.',
        action: 'Set up auto-transfer of ₹20K/month',
      },
      {
        id: '4',
        type: 'achievement',
        title: 'Great Savings Rate!',
        description:
          'You saved 37% of your income this month - that\'s exceptional!',
        impact:
          'Keep this up and you\'ll reach financial independence faster.',
      },
      {
        id: '5',
        type: 'saving',
        title: 'Insurance Premium Opportunity',
        description:
          'Your term insurance premium is due next month. Annual payment saves 5%.',
        impact: 'Save ₹1,500 by paying annually instead of monthly.',
        action: 'Switch to annual payment',
      },
      {
        id: '6',
        type: 'tip',
        title: 'Tax-Saving Investment',
        description:
          'You can invest up to ₹1.5L in ELSS to save tax under 80C.',
        impact:
          'At 30% tax bracket, this saves ₹45,000 in taxes.',
        action: 'Start ELSS SIP before March',
      },
    ]);
    setLoading(false);
  };

  const handleDismiss = (id: string) => {
    setDismissed(new Set([...dismissed, id]));
  };

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id));

  const getIcon = (type: string) => {
    switch (type) {
      case 'saving':
        return <PiggyBank size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'tip':
        return <Lightbulb size={20} />;
      case 'achievement':
        return <Award size={20} />;
      default:
        return <Zap size={20} />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'saving':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'tip':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'achievement':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-[#2a2a2a] text-white border-[#3a3a3a]';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse" style={{ color: t.textMuted }}>Generating insights...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: t.text }}>
            <Lightbulb className="text-amber-500" />
            Smart Insights
          </h1>
          <p className="text-sm mt-1" style={{ color: t.textMuted }}>
            AI-powered recommendations to optimize your finances
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
            <p className="text-emerald-500 text-2xl font-bold">
              {insights.filter((i) => i.type === 'saving').length}
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>Saving Opportunities</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
            <p className="text-amber-500 text-2xl font-bold">
              {insights.filter((i) => i.type === 'warning').length}
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>Warnings</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
            <p className="text-blue-500 text-2xl font-bold">
              {insights.filter((i) => i.type === 'tip').length}
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>Tips</p>
          </div>
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
            <p className="text-purple-500 text-2xl font-bold">
              {insights.filter((i) => i.type === 'achievement').length}
            </p>
            <p className="text-sm mt-1" style={{ color: t.textMuted }}>Achievements</p>
          </div>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className={`rounded-xl p-5 border ${getColors(insight.type)} animate-fade-in`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white/5">
                  {getIcon(insight.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold" style={{ color: t.text }}>{insight.title}</h3>
                    <button
                      onClick={() => handleDismiss(insight.id)}
                      className="transition-colors"
                      style={{ color: t.textMuted }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <p className="text-sm mt-2" style={{ color: t.textSecondary }}>{insight.description}</p>

                  {insight.impact && (
                    <p className="text-sm mt-3 font-medium flex items-center gap-2" style={{ color: t.text }}>
                      <Target size={14} className="opacity-70" />
                      {insight.impact}
                    </p>
                  )}

                  {insight.action && (
                    <button className="mt-4 flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all" style={{ color: t.text }}>
                      {insight.action}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {visibleInsights.length === 0 && (
          <div className="text-center py-12" style={{ color: t.textMuted }}>
            <Lightbulb size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm mt-1">
              No new insights at the moment. Check back later.
            </p>
          </div>
        )}

        {/* Pro Tip */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-6 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="text-amber-500" size={24} />
            <h3 className="font-semibold text-lg" style={{ color: t.text }}>Pro Tip: The 50/30/20 Rule</h3>
          </div>
          <p style={{ color: t.textSecondary }}>
            Allocate 50% of income to needs, 30% to wants, and 20% to savings.
            Based on your spending, you're currently at 45/40/15. Try to shift 5% from wants to savings.
          </p>
        </div>
      </div>
    </div>
  );
}
