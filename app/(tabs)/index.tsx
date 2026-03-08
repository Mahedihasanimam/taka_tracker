import EmptyStateMascot from '@/components/EmptyStateMascot';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { getBalance, getBudgets, getCategories, getTransactions, getTransactionsByCategory } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Car,
  Coffee,
  Download,
  Folder,
  Gift,
  Home,
  MoreHorizontal,
  PieChart as PieIcon,
  PlusCircle,
  Settings,
  ShoppingBag,
  Utensils,
  Wallet
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import tw from 'twrnc';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.90;

// Icon mapping
const iconMap: Record<string, any> = {
  Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Coffee, MoreHorizontal
};

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  date: string;
  note?: string;
  icon?: string;
  color?: string;
}

interface Budget {
  id: number;
  category: string;
  limit_amount: number;
  spent?: number;
  icon?: string;
  color?: string;
}

const HomeScreen = () => {
  const { lang, switchLanguage, t } = useLanguage();
  const { user } = useAuth();
  const primaryColor = theme.colors.primary;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState({ totalIncome: 0, totalExpense: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [todayData, setTodayData] = useState({ spent: 0, categories: [] as any[] });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [balanceData, txnData, allTxnData, budgetData, categoryData] = await Promise.all([
        getBalance(user?.id),
        getTransactions(user?.id),
        getTransactions(user?.id, { all: true }),
        getBudgets(user?.id),
        getCategories('expense', user?.id)
      ]);

      setBalance(balanceData);
      setTransactions(txnData as Transaction[]);

      // Process budgets with spent amounts
      const budgetsWithSpent = await Promise.all(
        (budgetData as Budget[]).map(async (budget) => {
          const spent = await getTransactionsByCategory(budget.category, 'expense', user?.id);
          const category = (categoryData as any[]).find(c => c.name === budget.category);
          return {
            ...budget,
            spent: spent || 0,
            icon: category?.icon || 'MoreHorizontal',
            color: category?.color || theme.colors.mutedText
          };
        })
      );
      setBudgets(budgetsWithSpent);

      // Process today's data
      const today = new Date().toDateString();
      const todayTxns = (txnData as Transaction[]).filter(
        t => new Date(t.date).toDateString() === today && t.type === 'expense'
      );
      const todaySpent = todayTxns.reduce((sum, t) => sum + t.amount, 0);

      // Group by category for today
      const categorySpending: Record<string, { amount: number; color: string }> = {};
      todayTxns.forEach(txn => {
        if (!categorySpending[txn.category]) {
          const cat = (categoryData as any[]).find(c => c.name === txn.category);
          categorySpending[txn.category] = { amount: 0, color: cat?.color || theme.colors.mutedText };
        }
        categorySpending[txn.category].amount += txn.amount;
      });

      const todayCategories = Object.entries(categorySpending).map(([name, data]) => ({
        label: name,
        value: data.amount,
        color: data.color
      }));

      setTodayData({ spent: todaySpent, categories: todayCategories });

      // Process weekly data (last 7 days)
      const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const weeklySpending = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayTxns = (txnData as Transaction[]).filter(
          t => new Date(t.date).toDateString() === date.toDateString() && t.type === 'expense'
        );
        const daySpent = dayTxns.reduce((sum, t) => sum + t.amount, 0);
        weeklySpending.push({
          value: daySpent,
          label: weekDays[date.getDay()],
          frontColor: primaryColor
        });
      }
      setWeeklyData(weeklySpending);

      // Process monthly data (trend)
      const monthlyTrend = [];
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekTxns = (allTxnData as Transaction[]).filter(t => {
          const txnDate = new Date(t.date);
          return txnDate >= weekStart && txnDate < weekEnd && t.type === 'expense';
        });
        const weekSpent = weekTxns.reduce((sum, t) => sum + t.amount, 0);
        monthlyTrend.push({ value: weekSpent / 1000 });
      }
      setMonthlyData(monthlyTrend);

    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [primaryColor, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate derived values
  const totalBalance = balance.totalIncome - balance.totalExpense;
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d.value, 0);
  const highestDay = weeklyData.reduce((max, d) => d.value > max.value ? d : max, { value: 0, label: '' });

  // Prepare pie chart data for today
  const dailyBudget = budgets.length > 0
    ? Math.round(budgets.reduce((sum, b) => sum + b.limit_amount, 0) / 30)
    : 0;

  const getDailyPieData = () => {
    if (dailyBudget === 0 || todayData.categories.length === 0) {
      return [{ value: 1, color: theme.colors.gray200, text: '0%' }];
    }

    const remaining = Math.max(0, dailyBudget - todayData.spent);
    const pieData = todayData.categories.map(cat => ({
      value: cat.value,
      color: cat.color,
      text: `${Math.round((cat.value / dailyBudget) * 100)}%`
    }));

    if (remaining > 0) {
      pieData.push({ value: remaining, color: theme.colors.gray200, text: `${Math.round((remaining / dailyBudget) * 100)}%` });
    }

    return pieData;
  };

  // Center label for donut chart
  const renderCenterLabel = () => {
    const remaining = Math.max(0, dailyBudget - todayData.spent);
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={tw`text-xs text-gray-500 font-bold`}>{t('left')}</Text>
        <Text style={tw`text-lg font-extrabold text-gray-800`}>৳{remaining.toLocaleString()}</Text>
      </View>
    );
  };

  // Get recent transactions
  const recentTransactions = transactions.slice(0, 3);

  // Get budget alerts (over 80%)
  const budgetAlerts = budgets.filter(b => b.spent && b.limit_amount && (b.spent / b.limit_amount) >= 0.8);

  // Quick Actions
  const quickActions = [
    { id: 1, onPress: () => router.push('/add'), label: t('addExpense'), icon: PlusCircle, color: theme.colors.danger, bg: 'bg-red-50' },
    { id: 2, onPress: () => router.push('/budget'), label: t('setBudget'), icon: PieIcon, color: theme.colors.purple, bg: 'bg-purple-50' },
    { id: 3, onPress: () => router.push('/screens/categories'), label: t('categories'), icon: Folder, color: theme.colors.success, bg: 'bg-green-50' },
    { id: 4, onPress: () => router.push('/screens/export'), label: t('export'), icon: Download, color: theme.colors.warning, bg: 'bg-amber-50' },
  ];

  // Dashboard cards data
  const dashboardData = [
    {
      id: 'daily',
      title: t('today'),
      amountLabel: t('spentToday'),
      amount: `৳ ${todayData.spent.toLocaleString()}`,
      type: 'donut',
      subText: dailyBudget > 0 ? `${t('budget')}: ৳${dailyBudget.toLocaleString()}` : t('noBudgetsSet'),
      legend: todayData.categories.slice(0, 3)
    },
    {
      id: 'weekly',
      title: t('thisWeek'),
      amountLabel: t('weeklySpent'),
      amount: `৳ ${weeklyTotal.toLocaleString()}`,
      type: 'bar',
      subText: `${t('highest')}: ${highestDay.label || '-'}`
    },
    {
      id: 'monthly',
      title: t('thisMonth'),
      amountLabel: t('totalSavings'),
      amount: `৳ ${totalBalance.toLocaleString()}`,
      type: 'line',
      subText: totalBalance >= 0 ? t('trendingUp') : t('trendingDown')
    },
  ];

  if (isLoading) {
    return (
      <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar backgroundColor={theme.colors.primaryDark} barStyle="light-content" />

      {/* --- HEADER --- */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={tw`h-60 px-6 pt-12 pb-24 rounded-b-[36px] shadow-lg`}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View>
            <Text style={tw`text-white text-2xl font-extrabold tracking-wide`}>{t('appName')}</Text>
            <Text style={tw`text-white/80 text-lg font-medium`}>{t('appSub')}</Text>
          </View>
          {/* Language Toggle */}
          <View style={tw`flex-row bg-white/20 rounded-full p-1 border border-white/30`}>
            <TouchableOpacity onPress={() => switchLanguage('bn')} style={tw`px-3 py-1.5 rounded-full ${lang === 'bn' ? 'bg-white' : 'bg-transparent'}`}>
              <Text style={tw`text-[10px] font-bold ${lang === 'bn' ? 'text-teal-600' : 'text-white'}`}>বাংলা</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchLanguage('en')} style={tw`px-3 py-1.5 rounded-full ${lang === 'en' ? 'bg-white' : 'bg-transparent'}`}>
              <Text style={tw`text-[10px] font-bold ${lang === 'en' ? 'text-teal-600' : 'text-white'}`}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* --- MAIN CONTENT --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-32`}
        style={{ marginTop: -96 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        {/* --- HORIZONTAL CARDS --- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`px-5 pb-6`}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + 16}
        >
          {dashboardData.map((item) => (
            <View
              key={item.id}
              style={[
                tw`bg-white rounded-[32px] p-6 mr-4 mb-2 overflow-hidden`,
                {
                  width: CARD_WIDTH,
                  shadowColor: theme.colors.black,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}
            >
              {/* Card Header */}
              <View style={tw`flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-teal-50 p-2 rounded-full mr-2`}>
                    <Wallet size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                </View>
                <View style={tw`bg-gray-50 px-2 py-1 rounded-md flex-row items-center`}>
                  <Calendar size={12} color={theme.colors.gray400} style={tw`mr-1`} />
                  <Text style={tw`text-[10px] font-bold text-gray-500`}>{item.subText}</Text>
                </View>
              </View>

              <View style={tw`flex-row justify-between items-center`}>
                {/* LEFT SIDE: Stats & Legend */}
                <View style={tw`w-[40%]`}>
                  <Text style={tw`text-gray-400 text-[10px] font-bold uppercase mb-1 tracking-widest`}>
                    {item.amountLabel}
                  </Text>
                  <Text style={tw`text-2xl font-extrabold text-gray-900 mb-3`}>{item.amount}</Text>

                  {item.id === 'daily' && item.legend && item.legend.length > 0 ? (
                    <View>
                      {item.legend.map((l: any, i: number) => (
                        <View key={i} style={tw`flex-row items-center mb-1`}>
                          <View style={[tw`w-2 h-2 rounded-full mr-1.5`, { backgroundColor: l.color }]} />
                          <Text style={tw`text-[10px] text-gray-500 font-medium`}>{l.label}: </Text>
                          <Text style={tw`text-[10px] text-gray-800 font-bold`}>৳{l.value.toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={tw`${totalBalance >= 0 ? 'bg-green-50' : 'bg-red-50'} self-start px-2 py-1 rounded-md`}>
                      <Text style={tw`text-[10px] ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'} font-bold`}>
                        {totalBalance >= 0 ? '+' : ''}{((totalBalance / (balance.totalIncome || 1)) * 100).toFixed(0)}% vs last
                      </Text>
                    </View>
                  )}
                </View>

                {/* RIGHT SIDE: Charts */}
                <View style={tw`flex-1 items-end justify-center`}>
                  {item.type === 'donut' && (
                    <PieChart
                      data={getDailyPieData()}
                      donut
                      radius={55}
                      innerRadius={42}
                      centerLabelComponent={renderCenterLabel}
                      isAnimated
                      animationDuration={1500}
                    />
                  )}

                  {item.type === 'bar' && weeklyData.length > 0 && (
                    <BarChart
                      data={weeklyData}
                      barWidth={12}
                      spacing={14}
                      roundedTop
                      roundedBottom
                      hideRules
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                      noOfSections={3}
                      maxValue={Math.max(...weeklyData.map(d => d.value), 100)}
                      isAnimated
                      animationDuration={1500}
                      height={90}
                      width={160}
                    />
                  )}

                  {item.type === 'line' && monthlyData.length > 0 && (
                    <LineChart
                      data={monthlyData}
                      areaChart
                      curved
                      color={primaryColor}
                      startFillColor={primaryColor}
                      endFillColor={theme.colors.white}
                      startOpacity={0.4}
                      endOpacity={0.0}
                      hideRules
                      hideDataPoints={false}
                      dataPointsColor={primaryColor}
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                      noOfSections={3}
                      isAnimated
                      animationDuration={2000}
                      height={80}
                      width={160}
                    />
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* --- TRACKING QUICK ACTIONS --- */}
        <View style={tw`px-5 mb-8`}>
          <Text style={tw`text-sm font-bold text-gray-800 mb-4 px-1`}>{t('fastActions')}</Text>
          <View style={tw`flex-row justify-between`}>
            {quickActions.map((action) => (
              <TouchableOpacity onPress={action.onPress} key={action.id} style={tw`items-center w-[23%]`} activeOpacity={0.7}>
                <View style={tw`w-14 h-14 rounded-2xl ${action.bg} items-center justify-center mb-2 shadow-sm`}>
                  <action.icon size={22} color={action.color} />
                </View>
                <Text style={tw`text-[11px] font-bold text-gray-600 text-center`}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- BOTTOM GRID (Activity & Budget) --- */}
        <View style={tw`flex-row justify-between px-5`}>
          {/* Recent Activity */}
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm shadow-gray-200 w-[48%]`}>
            <View style={tw`flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2`}>
              <Text style={tw`text-sm font-bold text-gray-800`}>{t('recentActivity')}</Text>
              <TouchableOpacity onPress={() => router.push('/transactions')}>
                <Settings size={14} color={theme.colors.gray400} />
              </TouchableOpacity>
            </View>
            {recentTransactions.length === 0 ? (
              <EmptyStateMascot compact variant="general" title={t('noRecentActivity')} />
            ) : (
              recentTransactions.map((txn) => {
                const IconComp = iconMap[txn.icon || ''] || Briefcase;
                return (
                  <View key={txn.id} style={tw`flex-row items-center mb-5`}>
                    <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-2`, { backgroundColor: (txn.color || theme.colors.mutedText) + '20' }]}>
                      <IconComp size={14} color={txn.color || theme.colors.mutedText} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[11px] font-bold text-gray-800`} numberOfLines={1}>{txn.category}</Text>
                      <Text style={tw`text-[10px] font-bold ${txn.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                        {txn.type === 'expense' ? '-' : '+'} ৳{txn.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Budget Status */}
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm shadow-gray-200 w-[48%]`}>
            <Text style={tw`text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2`}>
              {t('budgetStatus')}
            </Text>
            {budgets.length === 0 ? (
              <EmptyStateMascot compact variant="budget" title={t('noBudgetsSet')} />
            ) : (
              <>
                {budgets.slice(0, 2).map((item) => {
                  const percent = item.limit_amount > 0 ? Math.min((item.spent || 0) / item.limit_amount * 100, 100) : 0;
                  const isOver = percent >= 100;
                  return (
                    <View key={item.id} style={tw`mb-4`}>
                      <View style={tw`flex-row justify-between mb-1.5`}>
                        <Text style={tw`text-[10px] font-bold text-gray-600`}>{item.category}</Text>
                        <Text style={tw`text-[10px] font-bold text-gray-400`}>{percent.toFixed(0)}%</Text>
                      </View>
                      <View style={tw`h-1.5 bg-gray-100 rounded-full overflow-hidden`}>
                        <View style={[tw`h-full rounded-full`, { width: `${percent}%`, backgroundColor: isOver ? theme.colors.danger : percent >= 80 ? theme.colors.warning : theme.colors.success }]} />
                      </View>
                    </View>
                  );
                })}
                {budgetAlerts.length > 0 && (
                  <View style={tw`flex-row items-center bg-orange-50 p-2 rounded-lg mt-1`}>
                    <AlertTriangle size={12} color={theme.colors.categoryFood} style={tw`mr-1.5`} />
                    <View>
                      <Text style={tw`text-[10px] text-orange-700 font-bold`}>{budgetAlerts[0].category}</Text>
                      <Text style={tw`text-[9px] text-orange-600`}>{t('overBudget')}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;



// import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import React from 'react';
// import { Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
// import tw from 'twrnc';

// const Home = () => {
//   return (
//     <SafeAreaView style={tw`flex-1 bg-slate-50`}>
//       <StatusBar barStyle="dark-content" />

//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-32`}>
//         {/* Header Section */}
//         <View style={tw`px-6 pt-4 flex-row justify-between items-center`}>
//           <View style={tw`flex-row items-center`}>
//             <View style={tw`w-12 h-12 rounded-full bg-purple-200 overflow-hidden border-2 border-white`}>
//               <Image
//                 source={{ uri: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' }}
//                 style={tw`w-full h-full`}
//               />
//             </View>
//             <View style={tw`ml-3`}>
//               <Text style={tw`text-xl font-bold text-slate-800`}>WALLET BUDDY</Text>
//               <Text style={tw`text-xs text-slate-500`}>Localized Malaysian title</Text>
//             </View>
//           </View>
//           <TouchableOpacity style={tw`p-2 bg-white rounded-full shadow-sm`}>
//             <Ionicons name="settings-outline" size={24} color="#64748b" />
//           </TouchableOpacity>
//         </View>

//         {/* Main Balance Card */}
//         <View style={tw`px-6 mt-6`}>
//           <LinearGradient
//             colors={['#4ade80', '#3b82f6', '#8b5cf6']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 1 }}
//             style={tw`rounded-3xl p-6 shadow-xl relative overflow-hidden`}
//           >
//             <View style={tw`flex-row justify-between`}>
//               <Text style={tw`text-white text-opacity-80 font-medium`}>Main Balance</Text>
//               <View style={tw`bg-white bg-opacity-20 px-2 py-1 rounded-lg`}>
//                 <Text style={tw`text-white text-xs font-bold`}>RM</Text>
//               </View>
//             </View>
//             <Text style={tw`text-white text-3xl font-bold mt-2`}>RM 24,567.89</Text>

//             {/* Decorative Stars/Icons */}
//             <MaterialCommunityIcons name="star-four-points" size={20} color="rgba(255,255,255,0.4)" style={tw`absolute right-10 top-20`} />
//             <View style={tw`bg-yellow-400 w-8 h-8 rounded-full items-center justify-center absolute left-10 -bottom-2 border-2 border-white shadow-sm`}>
//               <Text style={tw`text-white font-bold`}>$</Text>
//             </View>
//           </LinearGradient>
//         </View>

//         {/* Mascot Area */}
//         <View style={tw`items-center -mt-8 z-10`}>
//           <Image
//             source={require('../../assets/images/homecat.png')} // Placeholder Cat Mascot
//             style={tw`w-48 h-48`}
//             resizeMode="cover"
//           />
//         </View>

//         {/* Transactions List */}
//         <View style={tw`px-6 -mt-4`}>
//           <View style={tw`bg-white rounded-3xl p-6 shadow-sm`}>
//             <Text style={tw`text-lg font-bold text-slate-800 mb-4`}>Recent Transactions</Text>

//             {/* Transaction Item 1 */}
//             <View style={tw`flex-row items-center justify-between mb-6`}>
//               <View style={tw`flex-row items-center`}>
//                 <View style={tw`w-12 h-12 bg-green-50 rounded-2xl items-center justify-center`}>
//                   <Ionicons name="fast-food" size={24} color="#22c55e" />
//                 </View>
//                 <View style={tw`ml-4`}>
//                   <Text style={tw`font-bold text-slate-800`}>Groceries</Text>
//                   <Text style={tw`text-xs text-slate-400`}>Groceries</Text>
//                 </View>
//               </View>
//               <Text style={tw`font-bold text-red-500`}>-$85.50</Text>
//             </View>

//             {/* Transaction Item 2 */}
//             <View style={tw`flex-row items-center justify-between mb-2`}>
//               <View style={tw`flex-row items-center`}>
//                 <View style={tw`w-12 h-12 bg-red-50 rounded-2xl items-center justify-center`}>
//                   <Ionicons name="home" size={24} color="#ef4444" />
//                 </View>
//                 <View style={tw`ml-4`}>
//                   <Text style={tw`font-bold text-slate-800`}>Rent</Text>
//                   <Text style={tw`text-xs text-slate-400`}>$11,200.00</Text>
//                 </View>
//               </View>
//               <Text style={tw`font-bold text-red-500`}>-$1,200.00</Text>
//             </View>
//           </View>
//         </View>
//       </ScrollView>


//     </SafeAreaView>
//   );
// };

// export default Home;