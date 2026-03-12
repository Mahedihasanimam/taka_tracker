import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { getTransactions } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CalendarRange, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

type PeriodKey = 'week' | 'month' | 'year';

type Txn = {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

type Bucket = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const onlyDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!onlyDateMatch) return null;

  const [, y, m, d] = onlyDateMatch;
  const fallback = new Date(Number(y), Number(m) - 1, Number(d));
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatBucketKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const groupForPeriod = (transactions: Txn[], period: PeriodKey): Bucket[] => {
  const now = new Date();

  if (period === 'year') {
    const buckets: Bucket[] = Array.from({ length: 12 }, (_, index) => ({
      key: `${now.getFullYear()}-${index}`,
      label: new Date(now.getFullYear(), index, 1).toLocaleDateString('en-US', { month: 'short' }),
      income: 0,
      expense: 0,
    }));

    transactions.forEach((txn) => {
      const txnDate = parseDate(txn.date);
      if (!txnDate || txnDate.getFullYear() !== now.getFullYear()) return;
      const month = txnDate.getMonth();
      if (txn.type === 'income') buckets[month].income += Number(txn.amount) || 0;
      if (txn.type === 'expense') buckets[month].expense += Number(txn.amount) || 0;
    });

    return buckets;
  }

  if (period === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const buckets: Bucket[] = Array.from({ length: totalDays }, (_, idx) => {
      const day = idx + 1;
      const date = new Date(year, month, day);
      return {
        key: formatBucketKey(date),
        label: day % 5 === 0 || day === 1 || day === totalDays ? String(day) : '',
        income: 0,
        expense: 0,
      };
    });

    const bucketMap = new Map(buckets.map((bucket, index) => [bucket.key, index]));
    transactions.forEach((txn) => {
      const txnDate = parseDate(txn.date);
      if (!txnDate || txnDate.getFullYear() !== year || txnDate.getMonth() !== month) return;
      const index = bucketMap.get(formatBucketKey(txnDate));
      if (index === undefined) return;
      if (txn.type === 'income') buckets[index].income += Number(txn.amount) || 0;
      if (txn.type === 'expense') buckets[index].expense += Number(txn.amount) || 0;
    });

    return buckets;
  }

  const endDate = startOfDay(now);
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 6);

  const buckets: Bucket[] = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + idx);
    return {
      key: formatBucketKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
      income: 0,
      expense: 0,
    };
  });

  const bucketMap = new Map(buckets.map((bucket, index) => [bucket.key, index]));
  transactions.forEach((txn) => {
    const txnDate = parseDate(txn.date);
    if (!txnDate) return;
    const normalized = startOfDay(txnDate);
    if (normalized < startDate || normalized > endDate) return;
    const index = bucketMap.get(formatBucketKey(normalized));
    if (index === undefined) return;
    if (txn.type === 'income') buckets[index].income += Number(txn.amount) || 0;
    if (txn.type === 'expense') buckets[index].expense += Number(txn.amount) || 0;
  });

  return buckets;
};

const AnalyticsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = (await getTransactions(user?.id, { all: true })) as Txn[];
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setTransactions([]);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const buckets = useMemo(() => groupForPeriod(transactions, period), [transactions, period]);

  const totals = useMemo(() => {
    return buckets.reduce(
      (acc, bucket) => {
        acc.income += bucket.income;
        acc.expense += bucket.expense;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [buckets]);

  const trendData = useMemo(
    () =>
      buckets.map((bucket) => ({
        value: Math.round(bucket.expense),
        label: bucket.label,
      })),
    [buckets],
  );

  const categoryBreakdown = useMemo(() => {
    const now = new Date();

    const inRange = (date: Date) => {
      if (period === 'year') return date.getFullYear() === now.getFullYear();
      if (period === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      const end = startOfDay(now);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const normalized = startOfDay(date);
      return normalized >= start && normalized <= end;
    };

    const grouped = transactions.reduce<Record<string, number>>((acc, txn) => {
      if (txn.type !== 'expense') return acc;
      const txnDate = parseDate(txn.date);
      if (!txnDate || !inRange(txnDate)) return acc;
      const key = txn.category || 'Other';
      acc[key] = (acc[key] || 0) + (Number(txn.amount) || 0);
      return acc;
    }, {});

    const palette = ['#0F766E', '#3F3A8A', '#F59E0B', '#EF4444', '#0EA5E9', '#4E9F98'];

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        color: palette[index % palette.length],
      }));
  }, [transactions, period]);

  return (
    <View style={tw`flex-1 bg-[#EEF2F7]`}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#102A43', '#0F766E', '#4E9F98']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[tw`absolute`, { width: 900, height: 900, left: -250, top: -720, borderRadius: 9999 }]}
      />

      <SafeAreaView style={tw`flex-1 mt-3`}>
        <View style={tw`px-5 pt-6 pb-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={tw`w-11 h-11 rounded-full bg-white/20 items-center justify-center`}
            >
              <ArrowLeft color="#fff" size={20} />
            </TouchableOpacity>

            <View style={tw`items-center`}>
              <Text style={tw`text-white/70 text-xs uppercase tracking-widest`}>Premium Insights</Text>
              <Text style={tw`text-white text-[22px] font-bold`}>Analytics</Text>
            </View>

            <View style={tw`w-11 h-11 rounded-full bg-white/20 items-center justify-center`}>
              <CalendarRange color="#fff" size={18} />
            </View>
          </View>

          <View style={tw`mt-6 bg-white/15 border border-white/20 rounded-2xl p-1 flex-row`}>
            {PERIODS.map((item) => {
              const active = period === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setPeriod(item.key)}
                  style={[
                    tw`flex-1 py-3 rounded-xl items-center`,
                    active && { backgroundColor: 'rgba(255,255,255,0.95)' },
                  ]}
                >
                  <Text style={[tw`font-semibold`, { color: active ? '#102A43' : '#ffffff' }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`px-5 pb-32 pt-2`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        >
          <View style={tw`bg-white rounded-3xl p-5 shadow-xl mb-4 border border-slate-100`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={tw`text-slate-800 text-lg font-bold`}>Expense Trend</Text>
              <View style={tw`flex-row items-center bg-teal-50 px-3 py-1 rounded-full`}>
                <TrendingUp size={14} color={theme.colors.primary} />
                <Text style={tw`text-teal-700 text-xs font-semibold ml-1`}>Live period</Text>
              </View>
            </View>

            <LineChart
              areaChart
              data={trendData.length > 0 ? trendData : [{ value: 0, label: '' }]}
              startFillColor="rgba(15,118,110,0.22)"
              endFillColor="rgba(15,118,110,0.02)"
              startOpacity={0.9}
              endOpacity={0.1}
              color={theme.colors.primary}
              thickness={3}
              hideDataPoints={false}
              dataPointsColor={theme.colors.primary}
              yAxisColor="transparent"
              xAxisColor="transparent"
              noOfSections={4}
              yAxisTextStyle={{ color: '#64748B', fontSize: 11 }}
              xAxisLabelTextStyle={{ color: '#64748B', fontSize: 11 }}
              spacing={period === 'year' ? 16 : period === 'month' ? 10 : 36}
              initialSpacing={period === 'week' ? 14 : 8}
              maxValue={Math.max(200, ...trendData.map((item) => item.value))}
              isAnimated
              animateOnDataChange
              animationDuration={500}
            />
          </View>

          <View style={tw`bg-white rounded-3xl p-5 shadow-xl mb-4 border border-slate-100`}>
            <Text style={tw`text-slate-800 text-lg font-bold mb-4`}>Income vs Expense</Text>
            <BarChart
              data={[
                { value: Math.round(totals.income), label: 'Income', frontColor: '#16A34A' },
                { value: Math.round(totals.expense), label: 'Expense', frontColor: '#EF4444' },
              ]}
              barWidth={44}
              hideRules
              yAxisColor="transparent"
              xAxisColor="transparent"
              yAxisTextStyle={{ color: '#64748B', fontSize: 11 }}
              xAxisLabelTextStyle={{ color: '#475569', fontSize: 12, fontWeight: '600' }}
              initialSpacing={40}
              spacing={46}
              noOfSections={4}
              maxValue={Math.max(200, Math.round(totals.income), Math.round(totals.expense))}
            />
          </View>

          <View style={tw`bg-white rounded-3xl p-5 shadow-xl border border-slate-100`}>
            <Text style={tw`text-slate-800 text-lg font-bold mb-4`}>Top Expense Segments</Text>

            <View style={tw`items-center mb-2`}>
              <PieChart
                donut
                radius={86}
                innerRadius={54}
                innerCircleColor="#fff"
                data={
                  categoryBreakdown.length > 0
                    ? categoryBreakdown.map((item) => ({ value: item.value, color: item.color }))
                    : [{ value: 1, color: '#CBD5E1' }]
                }
              />
            </View>

            {categoryBreakdown.length === 0 ? (
              <Text style={tw`text-slate-500 text-center py-3`}>No expense data for this period.</Text>
            ) : (
              categoryBreakdown.map((item) => (
                <View key={item.name} style={tw`flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={[tw`w-3 h-3 rounded-full mr-2`, { backgroundColor: item.color }]} />
                    <Text style={tw`text-slate-700 font-medium`}>{item.name}</Text>
                  </View>
                  <Text style={tw`text-slate-900 font-bold`}>৳{Math.round(item.value).toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default AnalyticsScreen;
