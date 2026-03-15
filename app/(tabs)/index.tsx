// 

import { bluestar, colorStar, seetingicon } from '@/assets/icons/Icon';
import tw from '@/assets/lib/tailwind';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { getBalance, getBudgets, getCategories, getTransactions, getTransactionsByCategory } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  Banknote,
  Book,
  Briefcase,
  Car,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  Music,
  Pill,
  Plane,
  Shirt,
  ShoppingBag,
  Smartphone,
  Utensils,
  Wifi,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Image, RefreshControl, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, PieChart } from "react-native-gifted-charts";
import { SvgXml } from 'react-native-svg';

const iconMap: Record<string, any> = {
  Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
  Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
  Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal, Banknote
};

interface Category {
  name: string;
  icon: string;
  color: string;
}

interface Budget {
  category: string;
  limit_amount: number;
}

const HomeScreen = () => {
  const { user, avatarUri } = useAuth();
  const { currency, formatAmount } = useCurrency();

  // Data States
  const [balance, setBalance] = useState({ totalIncome: 0, totalExpense: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [todaySpent, setTodaySpent] = useState(0);
  const [dailyBenchmark, setDailyBenchmark] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetUsageMap, setBudgetUsageMap] = useState<Record<string, { spent: number; limit: number }>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [balanceData, txnData, categoryData, budgetData] = await Promise.all([
        getBalance(user?.id || 0),
        getTransactions(user?.id || 0),
        getCategories('expense', user?.id || 0),
        getBudgets(user?.id || 0),
      ]);
      setBalance(balanceData);
      setTransactions(txnData);
      setCategories((categoryData as Category[]) || []);

      // Calculate Today's Spending
      const today = new Date().toDateString();
      const todayTransactions = txnData.filter((t: any) => new Date(t.date).toDateString() === today);

      const todaySum = todayTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);

      let last7DaysSpent = 0;
      for (let i = 1; i <= 7; i++) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - i);
        const daySpent = txnData
          .filter((t: any) => new Date(t.date).toDateString() === pastDate.toDateString() && t.type === 'expense')
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        last7DaysSpent += daySpent;
      }

      setTodaySpent(todaySum);
      setDailyBenchmark(last7DaysSpent / 7);

      // Use the exact same budget usage source as budget.tsx
      const usageEntries = await Promise.all(
        ((budgetData as Budget[]) || []).map(async (budget) => {
          const spent = await getTransactionsByCategory(budget.category, 'expense', user?.id);
          return [budget.category.trim().toLowerCase(), {
            spent: spent || 0,
            limit: Number(budget.limit_amount) || 0
          }] as const;
        })
      );
      setBudgetUsageMap(Object.fromEntries(usageEntries));

      // Weekly Data for Chart
      const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const weeklySpending = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const daySpent = txnData
          .filter((t: any) => new Date(t.date).toDateString() === date.toDateString() && t.type === 'expense')
          .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
        weeklySpending.push({ value: daySpent, label: weekDays[date.getDay()], frontColor: '#FFFFFF' });
      }
      setWeeklyData(weeklySpending);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const getCategoryDetails = (categoryName: string) =>
    categories.find((item) => item.name === categoryName) || null;

  const getTransactionIcon = (transaction: any) => {
    if (transaction?.icon && iconMap[transaction.icon]) {
      return iconMap[transaction.icon];
    }
    const category = getCategoryDetails(transaction?.category);
    if (category?.icon && iconMap[category.icon]) {
      return iconMap[category.icon];
    }
    return MoreHorizontal;
  };

  const getTransactionColor = (transaction: any) => {
    if (transaction?.color) return transaction.color;
    const category = getCategoryDetails(transaction?.category);
    return category?.color || '#5E59B3';
  };

  const getStatusColor = (spent: number, limit: number) => {
    if (!limit || limit === 0) return theme.colors.mutedText;
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return theme.colors.danger;
    if (percentage >= 80) return theme.colors.warning;
    return theme.colors.success;
  };

  const getBudgetProgressData = (transaction: any) => {
    const categoryKey = String(transaction?.category || '').trim().toLowerCase();
    const usage = budgetUsageMap[categoryKey];

    if (transaction?.type !== 'expense' || !usage?.limit) {
      return { percent: 0, color: theme.colors.mutedText };
    }

    const percent = Math.min((usage.spent / usage.limit) * 100, 100);
    return { percent, color: getStatusColor(usage.spent, usage.limit) };
  };

  const recentTransactions = transactions.slice(0, 10);
  const chartBenchmark = Math.max(dailyBenchmark, todaySpent, 1);
  const todayUseChartData = todaySpent <= chartBenchmark
    ? [
      { value: Number(todaySpent) || 0.0001, color: '#7EE7D8' },
      { value: Math.max(chartBenchmark - todaySpent, 0.0001), color: 'rgba(255,255,255,0.22)' },
    ]
    : [
      { value: chartBenchmark, color: '#7EE7D8' },
      { value: Math.max(todaySpent - chartBenchmark, 0.0001), color: '#FFD166' },
    ];

  return (
    <View style={tw`flex-1 bg-[#F1F1F1]`}>
      <StatusBar barStyle="light-content" />

      {/* Decorative Background Circle */}
      <LinearGradient
        colors={['#3F3A8A', '#5E59B3', '#4E9F98']}
        locations={[0, 0.5, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[tw`absolute`, { width: 1155, height: 1155, left: -357, top: -920, borderRadius: 9999 }]}
      />

      <View style={tw`flex-1 mt-4`}>
        {/* Header Section */}
        <View style={tw`px-5  flex-row justify-between items-center pb-3 mt-1`}>
          <View style={tw`flex-row items-center gap-3 mt-6`}>
            <Image
              source={avatarUri ? { uri: avatarUri } : require('@/assets/images/avatar.png')}
              style={tw`w-12 h-12 rounded-full bg-gray-300`}
            />
            <View>
              <Text style={tw`text-white text-xl font-bold`}>{user?.name || 'Guest'}</Text>
              <Text style={tw`text-white/70 text-sm`}>{user?.phone || '000-000-0000'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={tw`w-12 h-12 bg-white rounded-full justify-center items-center shadow-md`}>
            <SvgXml xml={seetingicon} />
          </TouchableOpacity>
        </View>

        {/* 2. Main Vertical Scroll Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-10`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        >
          <View style={{ position: 'relative' }}>
            {/* 1. Horizontal Card Slider */}
            <View style={{ zIndex: 1 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-5 mt-4 gap-3`}>

                {/* CARD 1: MAIN BALANCE */}
                <LinearGradient colors={['#5E59B3', '#4E9F98']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={tw`w-[340px] h-[221px] rounded-2xl border border-white/30 p-5`}>
                  <View style={tw`flex-row justify-between h-[221px] items-start`}>
                    <View>
                      <Text style={tw`text-white/70 text-base`}>Main balance</Text>
                      <Text style={tw`text-white text-[40px] font-bold`}>{formatAmount(balance.totalIncome - balance.totalExpense)}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push('/screens/currency')}
                      style={tw`px-3 py-1 rounded-full border border-white/30`}
                    >
                      <Text style={tw`text-white text-base`}>{currency}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[tw`absolute`, { width: 25, height: 25, right: 70, bottom: 80 }]}><SvgXml xml={colorStar} /></View>
                  <View style={[tw`absolute`, { width: 27, height: 27, right: 20, bottom: 40 }]}><SvgXml xml={bluestar} /></View>
                </LinearGradient>

                {/* CARD 2: TODAY'S USE WITH CHART */}
                <LinearGradient colors={['#5E59B3', '#4E9F98']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={tw`w-[340px] h-[221px] rounded-2xl border border-white/30 p-5`}>
                  <View style={tw`flex-row justify-between items-center`}>
                    <View>
                      <Text style={tw`text-white/70 text-base`}>Today&apos;s Use</Text>
                      <Text style={tw`text-white text-[32px] font-bold`}>{formatAmount(todaySpent)}</Text>
                      <Text style={tw`text-white/80 text-xs mt-1`}>vs 7d avg {formatAmount(Math.round(chartBenchmark))}</Text>
                    </View>
                    <PieChart
                      donut
                      radius={52}
                      innerRadius={38}
                      data={todayUseChartData}
                      innerCircleColor={'#5E59B3'}
                    />
                  </View>
                  <View style={[tw`absolute`, { right: 20, bottom: 20 }]}><SvgXml xml={bluestar} /></View>
                </LinearGradient>

                {/* CARD 3: WEEKLY ANALYSIS */}
                <LinearGradient colors={['#5E59B3', '#4E9F98']} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={tw`w-[340px] h-[221px] rounded-2xl border border-white/30 p-5`}>
                  <Text style={tw`text-white/70 text-base mb-2`}>Weekly Analysis</Text>
                  <BarChart
                    data={weeklyData}
                    barWidth={18}
                    initialSpacing={10}
                    spacing={15}
                    hideRules
                    hideYAxisText
                    xAxisThickness={0}
                    yAxisThickness={0}
                    height={100}
                    width={250}
                    barBorderRadius={4}
                    xAxisLabelTextStyle={tw`text-white/70 text-xs`}
                  />
                </LinearGradient>

                {/* CARD 4: ADVANCED ANALYTICS */}
                <LinearGradient colors={['#102A43', '#0F766E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-[340px] h-[221px] rounded-2xl border border-white/30 p-5`}>
                  <Text style={tw`text-white/70 text-base`}>Premium insights</Text>
                  <Text style={tw`text-white text-[28px] font-bold mt-2`}>Week, Month & Year</Text>
                  <Text style={tw`text-white/80 text-sm mt-3`}>
                    Separate screen with segment-wise visual analytics.
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/analytics')}
                    style={tw`mt-6 self-start bg-white px-4 py-2 rounded-full`}
                  >
                    <Text style={tw`text-[#102A43] font-semibold`}>Open Analytics</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </ScrollView>
            </View>

            {/* THE CAT IMAGE */}
            <View pointerEvents="none" style={[tw`absolute w-full items-center`, { bottom: -290, zIndex: 10 }]}>
              <Image
                source={require('@/assets/images/homecat.png')}
                style={[tw`w-[380px] h-[500px]`, { transform: [{ rotate: '12deg' }] }]}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* 3. Transaction List Section */}
          <View style={[tw`mx-5 bg-white rounded-3xl pb-20 mb-14 p-6 shadow-xl mt-24`, { zIndex: 20 }]}>
            <Text style={tw`text-black text-xl font-semibold mb-6`}>Recent transactions</Text>

            {recentTransactions.length === 0 ? (
              <View style={tw`py-6`}>
                <Text style={tw`text-center text-gray-500`}>No transactions yet</Text>

                <Image
                  source={require('@/assets/images/find.jpeg')}
                  style={tw`w-40 h-40 mx-auto mt-4`}
                  resizeMode="contain"
                />

              </View>
            ) : (
              recentTransactions.map((item, index) => {
                const IconComponent = getTransactionIcon(item);
                const color = getTransactionColor(item);
                const budgetProgress = getBudgetProgressData(item);

                return (
                  <View
                    key={index}
                    style={tw`flex-row items-center gap-4 mb-4 w-full`}
                  >
                    {/* Icon Circle */}
                    <View
                      style={[
                        tw`w-14 h-14 rounded-full justify-center items-center`,
                        { backgroundColor: `${color}1F` }, // semi-transparent background
                      ]}
                    >
                      <IconComponent size={28} color={color} />
                    </View>

                    {/* Content Column */}
                    <View style={tw`flex-1 flex-col gap-2`}>
                      {/* Title & Amount Row */}
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-black text-[20px] font-semibold`}>
                          {item.category || item.title}
                        </Text>
                        <Text
                          style={[
                            tw`text-[20px] font-semibold`,
                            { color: item.type === 'expense' ? '#CE5347' : '#4E9F98' },
                          ]}
                        >
                          {item.type === 'expense' ? '-' : '+'} {formatAmount(Number(item.amount) || 0)}
                        </Text>
                      </View>

                      {/* Spending Row */}
                      <View style={tw`flex-row justify-between items-center`}>
                        <Text style={tw`text-black/50 text-[14px] font-medium`}>
                          {formatAmount(Number(budgetUsageMap[item.category?.toLowerCase()]?.spent) || 0)}
                        </Text>
                        <Text style={tw`text-black/50 text-[14px] font-medium`}>
                          {formatAmount(Number(budgetUsageMap[item.category?.toLowerCase()]?.limit) || 0)}
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View
                        style={[
                          tw`h-2 w-full rounded-full bg-gray-200 mt-1`,
                        ]}
                      >
                        <View
                          style={{
                            width: `${budgetProgress.percent}%`,
                            height: '100%',
                            borderRadius: 999,
                            backgroundColor: budgetProgress.color,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default HomeScreen;
