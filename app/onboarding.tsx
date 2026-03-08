import { ONBOARDING_DONE_KEY } from '@/constants/storageKeys';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Car,
  PieChart,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

// ─── Screen 2 Illustration ───────────────────────────────────────────────────
const BudgetIllustration = () => (
  <View style={tw`w-full h-full items-center justify-center px-8`}>
    {/* Floating glow blob */}
    <View
      style={[
        tw`absolute`,
        { width: 260, height: 260, borderRadius: 130, backgroundColor: '#0D948818', top: 60, alignSelf: 'center' },
      ]}
    />

    {/* Card */}
    <View style={tw`bg-white rounded-3xl p-5 w-full shadow-lg shadow-teal-200`}>
      {/* Card header */}
      <View style={tw`flex-row items-center mb-4`}>
        <View style={tw`bg-teal-100 p-2 rounded-xl mr-3`}>
          <PieChart size={20} color="#0D9488" />
        </View>
        <View>
          <Text style={tw`text-gray-800 font-extrabold text-base`}>Monthly Budget</Text>
          <Text style={tw`text-gray-400 text-xs`}>October 2024</Text>
        </View>
        <View style={tw`ml-auto bg-green-100 px-2 py-1 rounded-lg`}>
          <Text style={tw`text-green-700 text-xs font-bold`}>On Track</Text>
        </View>
      </View>

      {/* Budget rows */}
      {[
        { icon: Utensils, color: '#f97316', label: 'Food', pct: 72 },
        { icon: Car, color: '#3b82f6', label: 'Transport', pct: 40 },
        { icon: ShoppingBag, color: '#a855f7', label: 'Shopping', pct: 55 },
        { icon: Zap, color: '#eab308', label: 'Utilities', pct: 30 },
      ].map(({ icon: Icon, color, label, pct }) => (
        <View key={label} style={tw`mb-3`}>
          <View style={tw`flex-row items-center justify-between mb-1`}>
            <View style={tw`flex-row items-center`}>
              <View
                style={[
                  tw`w-7 h-7 rounded-lg items-center justify-center mr-2`,
                  { backgroundColor: color + '22' },
                ]}
              >
                <Icon size={14} color={color} />
              </View>
              <Text style={tw`text-gray-700 text-xs font-semibold`}>{label}</Text>
            </View>
            <Text style={tw`text-xs font-bold`} />{/*spacer*/}
            <Text style={[tw`text-xs font-bold`, { color }]}>{pct}%</Text>
          </View>
          <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
            <View
              style={[
                tw`h-full rounded-full`,
                { width: `${pct}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      ))}
    </View>

    {/* Small floating badge */}
    <View
      style={tw`absolute bottom-20 right-6 bg-white rounded-2xl px-3 py-2 flex-row items-center shadow-md shadow-gray-300`}
    >
      <View style={tw`w-2 h-2 rounded-full bg-green-500 mr-2`} />
      <Text style={tw`text-xs font-bold text-gray-700`}>৳12,400 left</Text>
    </View>
  </View>
);

// ─── Screen 3 Illustration ───────────────────────────────────────────────────
const TransactionIllustration = () => (
  <View style={tw`w-full h-full items-center justify-center px-8`}>
    {/* Glow blob */}
    <View
      style={[
        tw`absolute`,
        { width: 260, height: 260, borderRadius: 130, backgroundColor: '#0D948818', top: 60, alignSelf: 'center' },
      ]}
    />

    {/* Balance Card */}
    <LinearGradient
      colors={['#0D9488', '#0F766E']}
      style={tw`w-full rounded-3xl p-5 mb-4 shadow-lg`}
    >
      <Text style={tw`text-white/70 text-xs font-semibold mb-1`}>Total Balance</Text>
      <Text style={tw`text-white text-3xl font-extrabold mb-3`}>৳48,250</Text>
      <View style={tw`flex-row justify-between`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-white/20 p-1.5 rounded-lg mr-2`}>
            <TrendingUp size={14} color="#86efac" />
          </View>
          <View>
            <Text style={tw`text-white/60 text-[10px]`}>Income</Text>
            <Text style={tw`text-white font-bold text-sm`}>৳62,000</Text>
          </View>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={tw`bg-white/20 p-1.5 rounded-lg mr-2`}>
            <TrendingDown size={14} color="#fca5a5" />
          </View>
          <View>
            <Text style={tw`text-white/60 text-[10px]`}>Expense</Text>
            <Text style={tw`text-white font-bold text-sm`}>৳13,750</Text>
          </View>
        </View>
      </View>
    </LinearGradient>

    {/* Transaction list card */}
    <View style={tw`bg-white rounded-3xl p-4 w-full shadow-md shadow-gray-200`}>
      <Text style={tw`text-gray-800 font-extrabold text-sm mb-3`}>Recent Transactions</Text>
      {[
        { icon: TrendingUp, color: '#10b981', label: 'Salary', sub: 'Oct 1', amount: '+৳50,000', up: true },
        { icon: Utensils, color: '#f97316', label: 'Groceries', sub: 'Oct 3', amount: '-৳1,200', up: false },
        { icon: Wallet, color: '#6366f1', label: 'Freelance', sub: 'Oct 5', amount: '+৳12,000', up: true },
        { icon: Car, color: '#3b82f6', label: 'Fuel', sub: 'Oct 7', amount: '-৳800', up: false },
      ].map(({ icon: Icon, color, label, sub, amount, up }) => (
        <View key={label} style={tw`flex-row items-center py-2 border-b border-gray-50`}>
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
              { backgroundColor: color + '1A' },
            ]}
          >
            <Icon size={16} color={color} />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-800 text-xs font-bold`}>{label}</Text>
            <Text style={tw`text-gray-400 text-[10px]`}>{sub}</Text>
          </View>
          <Text style={[tw`text-xs font-extrabold`, { color: up ? '#10b981' : '#ef4444' }]}>{amount}</Text>
        </View>
      ))}
    </View>
  </View>
);

// ─── Slide Data ───────────────────────────────────────────────────────────────
// Unified theme: all screens share the same bg and accent
const ACCENT = '#0D9488';
const BG = '#E4F3F6';

const slides = [
  {
    key: 'welcome',
    bgStart: BG,
    bgEnd: BG,
    title: 'Track Your\nWealth with ',
    titleAccent: 'Finn!',
    subtitle: 'Take control of your money, budget smarter, and save effortlessly.',
    dotColor: ACCENT,
  },
  {
    key: 'budget',
    bgStart: BG,
    bgEnd: BG,
    title: 'Smart Budgets,\n',
    titleAccent: 'Bigger Savings',
    subtitle: 'Set monthly limits per category, track every spend, and get notified before you overshoot.',
    dotColor: ACCENT,
  },
  {
    key: 'transactions',
    bgStart: BG,
    bgEnd: BG,
    title: 'Every Taka\n',
    titleAccent: 'Accountable',
    subtitle: 'Log income and expenses in seconds. See exactly where your money goes, every single day.',
    dotColor: ACCENT,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const OnboardingScreen = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Floating mascot animation (screen 0 only)
  const mascotY = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotY, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(mascotY, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    );
    bounce.start();
    return () => bounce.stop();
  }, [mascotY]);

  // Track visible slide
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/signIn');
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  };

  const isLast = currentIndex === slides.length - 1;
  const accentColor = slides[currentIndex].dotColor;

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <View style={[{ width }, tw`flex-1 bg-[${item.bgStart}]`]}>
      <LinearGradient colors={[item.bgStart, item.bgEnd]} style={tw`absolute inset-0`} />

      {/* Top illustration area */}
      <View style={tw`w-full h-[58%]`}>
        {item.key === 'welcome' ? (
          <Animated.View style={[{ transform: [{ translateY: mascotY }] }, tw`w-full h-full`]}>
            <Image
              source={require('../assets/images/onbording.png')}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
          </Animated.View>
        ) : item.key === 'budget' ? (
          <BudgetIllustration />
        ) : (
          <TransactionIllustration />
        )}
      </View>

      {/* Bottom text content */}
      <View style={tw`flex-1 px-8 pt-6`}>
        <Text style={tw`text-3xl font-extrabold text-center text-[#1C3A5E] mb-3 leading-10`}>
          {item.title}
          <Text style={{ color: item.dotColor }}>{item.titleAccent}</Text>
        </Text>
        <Text style={tw`text-[15px] text-center text-gray-600 leading-6 px-2`}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <View style={tw`flex-1 bg-[#E4F3F6]`}>
      <StatusBar backgroundColor="transparent" translucent barStyle="dark-content" />

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        bounces={false}
        style={tw`flex-1`}
      />

      {/* Bottom controls (fixed, outside FlatList) */}
      <View style={tw`absolute bottom-0 left-0 right-0 px-8 pb-12`}>
        {/* Dot indicators */}
        <View style={tw`flex-row justify-center items-center mb-8 gap-3`}>
          {slides.map((s, i) => (
            <View
              key={s.key}
              style={[
                tw`rounded-full`,
                i === currentIndex
                  ? { width: 20, height: 10, backgroundColor: slides[currentIndex].dotColor }
                  : { width: 10, height: 10, backgroundColor: '#D1D5DB' },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        {isLast ? (
          <TouchableOpacity
            onPress={handleGetStarted}
            activeOpacity={0.8}
            style={[tw`w-full rounded-full py-4 items-center`, { backgroundColor: accentColor }]}
          >
            <Text style={tw`text-white text-lg font-bold tracking-widest`}>GET STARTED</Text>
          </TouchableOpacity>
        ) : (
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity onPress={skip} activeOpacity={0.7} style={tw`py-4 px-2`}>
              <Text style={tw`text-gray-400 font-semibold text-base`}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goNext}
              activeOpacity={0.8}
              style={[
                tw`flex-row items-center rounded-full py-4 px-8 gap-2`,
                { backgroundColor: accentColor },
              ]}
            >
              <Text style={tw`text-white text-base font-bold tracking-wider`}>Next</Text>
              <ArrowRight size={18} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default OnboardingScreen;
