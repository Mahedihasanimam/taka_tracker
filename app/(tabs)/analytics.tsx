import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getTransactions } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, CalendarRange, ChevronDown, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
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

const CATEGORY_ALL = 'All categories';
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
  const { formatAmount } = useCurrency();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('week');
  const [zoomScale, setZoomScale] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(1);

  const fetchData = useCallback(async () => {
    try {
      const data = (await getTransactions(user?.id || 0, { all: true })) as Txn[];
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

  const expenseCategories = useMemo(() => {
    const names = transactions
      .filter((txn) => txn.type === 'expense')
      .map((txn) => (txn.category || 'Other').trim())
      .filter(Boolean);
    const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    return [CATEGORY_ALL, ...unique];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (categoryFilter === CATEGORY_ALL) return transactions;

    const target = categoryFilter.trim().toLowerCase();
    return transactions.filter((txn) => {
      if (txn.type !== 'expense') return false;
      return (txn.category || 'Other').trim().toLowerCase() === target;
    });
  }, [transactions, categoryFilter]);

  const buckets = useMemo(() => groupForPeriod(filteredTransactions, period), [filteredTransactions, period]);

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

    const grouped = filteredTransactions.reduce<Record<string, number>>((acc, txn) => {
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
  }, [filteredTransactions, period]);

  const baseSpacing = period === 'year' ? 16 : period === 'month' ? 10 : 36;
  const chartSpacing = Math.max(8, Math.round(baseSpacing * zoomScale));
  const chartMinWidth = Dimensions.get('window').width - 64;
  const chartWidth = Math.max(chartMinWidth, trendData.length * chartSpacing + 70);

  const getTouchDistance = (touches: any[]) => {
    if (!touches || touches.length < 2) return null;
    const [a, b] = touches;
    const dx = (a.pageX || 0) - (b.pageX || 0);
    const dy = (a.pageY || 0) - (b.pageY || 0);
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleChartTouchStart = (event: any) => {
    const touches = event?.nativeEvent?.touches;
    if (!touches || touches.length < 2) return;
    const distance = getTouchDistance(touches);
    if (!distance) return;
    pinchStartDistanceRef.current = distance;
    pinchStartZoomRef.current = zoomScale;
  };

  const handleChartTouchMove = (event: any) => {
    const touches = event?.nativeEvent?.touches;
    if (!touches || touches.length < 2 || !pinchStartDistanceRef.current) return;
    const currentDistance = getTouchDistance(touches);
    if (!currentDistance) return;

    const ratio = currentDistance / pinchStartDistanceRef.current;
    const nextZoom = Math.max(0.7, Math.min(2.2, pinchStartZoomRef.current * ratio));
    setZoomScale(nextZoom);
  };

  const handleChartTouchEnd = () => {
    pinchStartDistanceRef.current = null;
  };

  const handleCalendarPress = () => {
    const currentIndex = PERIODS.findIndex((item) => item.key === period);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % PERIODS.length : 0;
    setPeriod(PERIODS[nextIndex].key);
    setShowCategoryDropdown(false);
  };

  return (
    <View style={tw`flex-1 bg-[#EEF2F7]`}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[tw`absolute`, { width: 900, height: 900, left: -250, top: -720, borderRadius: 9999 }]}
      />

      <View style={tw`flex-1 mt-3`}>
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

            <TouchableOpacity
              onPress={handleCalendarPress}
              activeOpacity={0.85}
              style={tw`w-11 h-11 rounded-full bg-white/20 items-center justify-center`}
            >
              <CalendarRange color="#fff" size={18} />
            </TouchableOpacity>
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

          <View style={tw`mt-3 relative`}>
            <Text style={tw`text-white/90 text-[11px] font-semibold mb-1 ml-1 uppercase tracking-wide`}>
              Category
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowCategoryDropdown((prev) => !prev)}
              style={tw`bg-white border border-white rounded-xl px-3 py-2.5 flex-row items-center justify-between`}
            >
              <Text style={tw`text-slate-800 text-sm font-semibold flex-1 mr-2`} numberOfLines={1}>
                {categoryFilter}
              </Text>
              <ChevronDown size={16} color="#0F172A" />
            </TouchableOpacity>

            {showCategoryDropdown ? (
              <View style={tw`absolute left-0 right-0 top-[68px] bg-white rounded-xl border border-slate-200 overflow-hidden z-50 shadow-lg`}>
                <ScrollView style={{ maxHeight: 190 }} nestedScrollEnabled>
                  {expenseCategories.map((item) => {
                    const active = item === categoryFilter;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => {
                          setCategoryFilter(item);
                          setShowCategoryDropdown(false);
                        }}
                        style={[
                          tw`px-3 py-2.5 border-b border-slate-100`,
                          active ? { backgroundColor: '#ECFEFF' } : null,
                        ]}
                      >
                        <Text style={[tw`text-sm font-medium`, { color: active ? '#0F766E' : '#334155' }]}>{item}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => showCategoryDropdown && setShowCategoryDropdown(false)}
          style={tw`flex-1`}
        >
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

              <View
                onTouchStart={handleChartTouchStart}
                onTouchMove={handleChartTouchMove}
                onTouchEnd={handleChartTouchEnd}
                onTouchCancel={handleChartTouchEnd}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    width={chartWidth}
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
                    spacing={chartSpacing}
                    initialSpacing={period === 'week' ? 14 : 8}
                    maxValue={Math.max(200, ...trendData.map((item) => item.value))}
                    pointerConfig={{
                      activatePointersOnLongPress: true,
                      autoAdjustPointerLabelPosition: true,
                      pointerColor: theme.colors.primary,
                      pointerStripColor: '#94A3B8',
                      pointerStripWidth: 1,
                      radius: 4,
                      pointerLabelWidth: 110,
                      pointerLabelHeight: 42,
                      pointerLabelComponent: (items: any) => (
                        <View style={tw`bg-slate-900 px-2.5 py-1.5 rounded-lg`}>
                          <Text style={tw`text-white text-xs font-semibold`}>
                            {formatAmount(Math.round(items?.[0]?.value || 0))}
                          </Text>
                        </View>
                      ),
                    }}
                    isAnimated
                    animateOnDataChange
                    animationDuration={500}
                  />
                </ScrollView>
              </View>
              <Text style={tw`text-[11px] text-slate-500 mt-2`}>
                Pinch with 2 fingers to zoom. Long-press a point for exact value.
              </Text>
            </View>

            <View style={tw`bg-white rounded-3xl p-5 shadow-xl mb-4 border border-slate-100`}>
              <Text style={tw`text-slate-800 text-lg font-bold mb-4`}>
                {categoryFilter === CATEGORY_ALL ? 'Income vs Expense' : `${categoryFilter} (Filtered)`}
              </Text>
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
                    <Text style={tw`text-slate-900 font-bold`}>{formatAmount(Math.round(item.value))}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AnalyticsScreen;
