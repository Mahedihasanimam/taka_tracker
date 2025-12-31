import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  Calendar,
  Download,
  Folder,
  PieChart as PieIcon,
  PlusCircle,
  Settings,
  Utensils,
  Wallet
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
// Import Charts
import { router } from 'expo-router';
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import tw from 'twrnc';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.90;

const HomeScreen = () => {
  const { lang, switchLanguage, t } = useLanguage();
  const primaryColor = '#e2136e';

  // --- 1. DAILY: DETAILED BREAKDOWN ---
  // Now split by actual categories instead of just "Spent vs Left"
  const dailyPieData = [
    { value: 450, color: primaryColor, text: '45%' },   // Food (Pink)
    { value: 200, color: '#f59e0b', text: '20%' },      // Transport (Orange)
    { value: 350, color: '#e5e7eb', text: '35%' }       // Remaining (Gray)
  ];

  // Center Label Component for Donut Chart
  const renderCenterLabel = () => {
    return (
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={tw`text-xs text-gray-500 font-bold`}>Left</Text>
        <Text style={tw`text-lg font-extrabold text-gray-800`}>৳350</Text>
      </View>
    );
  };

  // --- 2. WEEKLY & MONTHLY DATA (Unchanged) ---
  const weeklyBarData = [
    { value: 250, label: 'S', frontColor: primaryColor },
    { value: 500, label: 'M', frontColor: primaryColor },
    { value: 745, label: 'T', frontColor: primaryColor },
    { value: 320, label: 'W', frontColor: primaryColor },
    { value: 600, label: 'T', frontColor: primaryColor },
    { value: 256, label: 'F', frontColor: primaryColor },
    { value: 300, label: 'S', frontColor: primaryColor },
  ];

  const monthlyLineData = [
    { value: 0 }, { value: 20 }, { value: 18 }, { value: 40 },
    { value: 36 }, { value: 60 }, { value: 54 }, { value: 85 }
  ];

  // --- DASHBOARD CARDS DATA ---
  const dashboardData = [
    {
      id: 'daily',
      title: t('today'),
      amountLabel: 'Spent Today',
      amount: '৳ 650', // Total of Food + Transport
      type: 'donut',
      subText: 'Budget: ৳1,000',
      // New: Legend Data for Today Card
      legend: [
        { label: 'Food', color: primaryColor, value: '৳450' },
        { label: 'Transport', color: '#f59e0b', value: '৳200' },
      ]
    },
    {
      id: 'weekly',
      title: t('thisWeek'),
      amountLabel: 'Weekly Spent',
      amount: '৳ 8,500',
      type: 'bar',
      subText: 'Highest: Tuesday'
    },
    {
      id: 'monthly',
      title: t('thisMonth'),
      amountLabel: 'Total Savings',
      amount: '৳ 15,500',
      type: 'line',
      subText: 'Trending Up'
    },
  ];

  // Quick Actions & Lists (Same as before)
  const quickActions = [
    { id: 1, onPress: () => router.push('/add'), label: 'Add Expense', icon: PlusCircle, color: '#ef4444', bg: 'bg-red-50' },
    { id: 3, onPress: () => router.push('/budget'), label: 'Set Budget', icon: PieIcon, color: '#8b5cf6', bg: 'bg-purple-50' },
    { id: 2, onPress: () => router.push('/screens/categories'), label: 'Categories', icon: Folder, color: '#10b981', bg: 'bg-green-50' },
    { id: 4, onPress: () => router.push('/screens/export'), label: 'Export PDF', icon: Download, color: '#f59e0b', bg: 'bg-amber-50' },
  ];

  const recentActivities = [
    { id: 1, icon: Utensils, color: '#f97316', bg: 'bg-orange-100', label: t('food'), amount: '- ৳ 250', type: 'expense', date: 'Today, 10:30 AM' },
  ];

  const budgetItems = [
    { id: 1, label: t('food'), progress: '70%', color: 'bg-[#10b981]' },
  ];

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <StatusBar backgroundColor="#be125a" barStyle="light-content" />

      {/* --- HEADER --- */}
      <LinearGradient
        colors={['#e2136e', '#be125a']}
        style={tw`h-60 px-6 pt-12 pb-24 rounded-b-[36px] shadow-lg relative z-10`}
      >
        <View style={tw`flex-row justify-between items-start`}>
          <View>
            <Text style={tw`text-white text-2xl font-extrabold tracking-wide`}>{t('appName')}</Text>
            <Text style={tw`text-white/80 text-lg font-medium`}>{t('appSub')}</Text>
          </View>
          {/* Language Toggle */}
          <View style={tw`flex-row bg-white/20 rounded-full p-1 border border-white/30`}>
            <TouchableOpacity onPress={() => switchLanguage('bn')} style={tw`px-3 py-1.5 rounded-full ${lang === 'bn' ? 'bg-white' : 'bg-transparent'}`}>
              <Text style={tw`text-[10px] font-bold ${lang === 'bn' ? 'text-[#e2136e]' : 'text-white'}`}>বাংলা</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => switchLanguage('en')} style={tw`px-3 py-1.5 rounded-full ${lang === 'en' ? 'bg-white' : 'bg-transparent'}`}>
              <Text style={tw`text-[10px] font-bold ${lang === 'en' ? 'text-[#e2136e]' : 'text-white'}`}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* --- MAIN CONTENT --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-32`}
        style={tw`-mt-24 z-20`}
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
                tw`bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200 mr-4 mb-2 overflow-hidden`,
                { width: CARD_WIDTH }
              ]}
            >
              {/* Card Header */}
              <View style={tw`flex-row justify-between items-center mb-4 border-b border-gray-100 pb-3`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-pink-50 p-2 rounded-full mr-2`}>
                    <Wallet size={18} color="#e2136e" />
                  </View>
                  <Text style={tw`text-lg font-bold text-gray-800`}>{item.title}</Text>
                </View>
                <View style={tw`bg-gray-50 px-2 py-1 rounded-md flex-row items-center`}>
                  <Calendar size={12} color="#9ca3af" style={tw`mr-1`} />
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

                  {/* Custom Legend for Daily Card */}
                  {item.id === 'daily' && item.legend ? (
                    <View>
                      {item.legend.map((l, i) => (
                        <View key={i} style={tw`flex-row items-center mb-1`}>
                          <View style={[tw`w-2 h-2 rounded-full mr-1.5`, { backgroundColor: l.color }]} />
                          <Text style={tw`text-[10px] text-gray-500 font-medium`}>{l.label}: </Text>
                          <Text style={tw`text-[10px] text-gray-800 font-bold`}>{l.value}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={tw`bg-green-50 self-start px-2 py-1 rounded-md`}>
                      <Text style={tw`text-[10px] text-green-600 font-bold`}>+12% vs last</Text>
                    </View>
                  )}
                </View>

                {/* RIGHT SIDE: Charts */}
                <View style={tw`flex-1 items-end justify-center`}>

                  {/* 1. DAILY (Contextual Donut) */}
                  {item.type === 'donut' && (
                    <PieChart
                      data={dailyPieData}
                      donut
                      radius={55} // Bigger radius
                      innerRadius={42}
                      centerLabelComponent={renderCenterLabel} // Shows "Left ৳350"
                      isAnimated
                      animationDuration={1500}
                    />
                  )}

                  {/* 2. WEEKLY (Bar) */}
                  {item.type === 'bar' && (
                    <BarChart
                      data={weeklyBarData}
                      barWidth={12}
                      spacing={14}
                      roundedTop
                      roundedBottom
                      hideRules
                      xAxisThickness={0}
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                      noOfSections={3}
                      maxValue={900}
                      isAnimated
                      animationDuration={1500}
                      height={90}
                      width={160}
                    />
                  )}

                  {/* 3. MONTHLY (Line) */}
                  {item.type === 'line' && (
                    <LineChart
                      data={monthlyLineData}
                      areaChart
                      curved
                      color={primaryColor}
                      startFillColor={primaryColor}
                      endFillColor="#ffffff"
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
          <Text style={tw`text-sm font-bold text-gray-800 mb-4 px-1`}>Fast Actions</Text>
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
              <Settings size={14} color="#9ca3af" />
            </View>
            {recentActivities.map((item) => (
              <View key={item.id} style={tw`flex-row items-center mb-5`}>
                <View style={tw`w-8 h-8 rounded-full ${item.bg} items-center justify-center mr-2`}>
                  <item.icon size={14} color={item.color} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[11px] font-bold text-gray-800`} numberOfLines={1}>{item.label}</Text>
                  <Text style={tw`text-[10px] font-bold ${item.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>{item.amount}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Budget Status */}
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm shadow-gray-200 w-[48%]`}>
            <Text style={tw`text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2`}>
              {t('budgetStatus')}
            </Text>
            {budgetItems.map((item) => (
              <View key={item.id} style={tw`mb-4`}>
                <View style={tw`flex-row justify-between mb-1.5`}>
                  <Text style={tw`text-[10px] font-bold text-gray-600`}>{item.label}</Text>
                  <Text style={tw`text-[10px] font-bold text-gray-400`}>{item.progress}</Text>
                </View>
                <View style={tw`h-1.5 bg-gray-100 rounded-full overflow-hidden`}>
                  <View style={tw`h-full ${item.color} w-[${item.progress}] rounded-full`} />
                </View>
              </View>
            ))}
            <View style={tw`flex-row items-center bg-orange-50 p-2 rounded-lg mt-1`}>
              <AlertTriangle size={12} color="#f97316" style={tw`mr-1.5`} />
              <View>
                <Text style={tw`text-[10px] text-orange-700 font-bold`}>Shopping</Text>
                <Text style={tw`text-[9px] text-orange-600`}>Over budget</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

export default HomeScreen;