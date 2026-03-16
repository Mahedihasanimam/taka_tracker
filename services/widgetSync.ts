import { theme } from '@/constants/theme';
import { Platform } from 'react-native';

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

const getStatus = (todaySpent: number, dailyBudget: number, totalBudget: number) => {
  if (totalBudget <= 0) {
    return { label: 'No budget', color: theme.colors.accent };
  }

  if (dailyBudget <= 0) {
    return { label: 'Plan ready', color: theme.colors.lightMint };
  }

  if (todaySpent > dailyBudget) {
    return { label: 'Slow down', color: theme.colors.accent };
  }

  if (todaySpent === 0) {
    return { label: 'Fresh start', color: theme.colors.lightMint };
  }

  return { label: 'On track', color: theme.colors.lightSuccess };
};

const buildInsight = (params: {
  todaySpent: number;
  todayIncome: number;
  transactionCount: number;
  dailyBudget: number;
  remainingBudget: number;
  totalBudget: number;
  formatAmount: (amount: number) => string;
}) => {
  const {
    todaySpent,
    todayIncome,
    transactionCount,
    dailyBudget,
    remainingBudget,
    totalBudget,
    formatAmount,
  } = params;

  if (transactionCount === 0) {
    if (totalBudget > 0) {
      return `No activity yet. You still have ${formatAmount(remainingBudget)} left in this month's budget.`;
    }
    return 'No activity yet. Add an expense or income entry from the app.';
  }

  if (todayIncome > 0 && todaySpent === 0) {
    return `Income day. You added ${formatAmount(todayIncome)} and no expenses yet.`;
  }

  if (totalBudget <= 0) {
    return 'Add a budget to get daily pace guidance in this widget.';
  }

  if (dailyBudget > 0 && todaySpent > dailyBudget) {
    return `Today is ${formatAmount(todaySpent - dailyBudget)} above your daily pace.`;
  }

  if (dailyBudget > 0 && todaySpent > 0) {
    return `You are ${formatAmount(Math.max(dailyBudget - todaySpent, 0))} under today's budget pace.`;
  }

  return `You still have ${formatAmount(remainingBudget)} left in this month's budget.`;
};

export const syncBudgetStatusWidget = (params: {
  balanceAmount: number;
  todaySpent: number;
  todayIncome: number;
  transactionCount: number;
  totalSpent: number;
  totalLimit: number;
  formatAmount: (amount: number) => string;
  referenceDate?: Date;
}) => {
  if (Platform.OS !== 'android') {
    return;
  }

  const balanceAmount = Number.isFinite(params.balanceAmount) ? params.balanceAmount : 0;
  const todaySpent = Number.isFinite(params.todaySpent) ? Math.max(0, params.todaySpent) : 0;
  const todayIncome = Number.isFinite(params.todayIncome) ? Math.max(0, params.todayIncome) : 0;
  const transactionCount = Number.isFinite(params.transactionCount)
    ? Math.max(0, Math.trunc(params.transactionCount))
    : 0;
  const totalSpent = Number.isFinite(params.totalSpent) ? Math.max(0, params.totalSpent) : 0;
  const totalLimit = Number.isFinite(params.totalLimit) ? Math.max(0, params.totalLimit) : 0;
  const remainingBudget = Math.max(totalLimit - totalSpent, 0);

  const now = params.referenceDate ?? new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftInMonth = Math.max(daysInMonth - now.getDate() + 1, 1);
  const dailyBudget = totalLimit > 0 ? remainingBudget / daysLeftInMonth : 0;
  const hasData = transactionCount > 0 || totalLimit > 0 || todayIncome > 0 || todaySpent > 0;
  const status = getStatus(todaySpent, dailyBudget, totalLimit);

  const module = require('@/widgets/androidBudgetWidget') as {
    syncAndroidBudgetWidget: (snapshot: {
      title: string;
      subtitle: string;
      heroText: string;
      heroLabel: string;
      status: string;
      statusColor: string;
      insight: string;
      topLeftLabel: string;
      topLeftValue: string;
      topRightLabel: string;
      topRightValue: string;
      bottomLabel: string;
      bottomValue: string;
      hasData: boolean;
    }) => Promise<void>;
  };

  module.syncAndroidBudgetWidget({
    title: 'Money Master',
    subtitle: DAY_LABEL_FORMATTER.format(now),
    heroText: params.formatAmount(balanceAmount),
    heroLabel: 'Available balance',
    status: status.label,
    statusColor: status.color,
    insight: buildInsight({
      todaySpent,
      todayIncome,
      transactionCount,
      dailyBudget,
      remainingBudget,
      totalBudget: totalLimit,
      formatAmount: params.formatAmount,
    }),
    topLeftLabel: 'Spent today',
    topLeftValue: params.formatAmount(todaySpent),
    topRightLabel: totalLimit > 0 ? 'Budget left' : 'Budget',
    topRightValue: totalLimit > 0 ? params.formatAmount(remainingBudget) : 'Not set',
    bottomLabel: todayIncome > 0 ? 'Income today' : 'Entries today',
    bottomValue: todayIncome > 0 ? params.formatAmount(todayIncome) : String(transactionCount),
    hasData,
  }).catch((error) => {
    console.error('Failed to update Android widget snapshot:', error);
  });
};

export const clearBudgetStatusWidget = () => {
  if (Platform.OS !== 'android') {
    return;
  }

  const module = require('@/widgets/androidBudgetWidget') as {
    clearAndroidBudgetWidget: () => Promise<void>;
  };
  module.clearAndroidBudgetWidget().catch((error) => {
    console.error('Failed to clear Android widget snapshot:', error);
  });
};
