import PaywallCard, { BillingCycle, PaywallPlan } from '@/components/onboarding/PaywallCard';
import { ONBOARDING_DONE_KEY } from '@/constants/storageKeys';
import { theme } from "@/constants/theme";
import { typography } from '@/constants/typography';
import { useCurrency } from '@/context/CurrencyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  ChartPie,
  CircleDollarSign,
  Clock3,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const ONBOARDING_BG = [theme.colors.primaryDeep, theme.colors.primaryTeal, theme.colors.primary] as [string, string, string];
const ACCENT = theme.colors.accent;

const PROBLEM_OPTIONS = [
  'I do not know where my money goes',
  'I overspend before month-end',
  'I struggle to save consistently',
  'I forget to track daily expenses',
];

const PAYWALL_PLANS: Record<BillingCycle, PaywallPlan> = {
  yearly: {
    key: 'yearly',
    label: 'YEARLY',
    headlinePrice: '$29.99',
    subPrice: '$2.49 / month',
    badge: 'SAVE 50%',
    selectedSummary: '$29.99 / year',
    billingNote: 'Billed yearly. Cancel anytime.',
  },
  monthly: {
    key: 'monthly',
    label: 'MONTHLY',
    headlinePrice: '$4.99',
    subPrice: 'per month',
    badge: 'FLEXIBLE',
    selectedSummary: '$4.99 / month',
    billingNote: 'Billed monthly. Cancel anytime.',
  },
} as const;

type SlideType = 'problem' | 'empathy' | 'solution' | 'wow' | 'paywall';

type Slide = {
  key: string;
  type: SlideType;
  title: string;
  subtitle: string;
};

const slides: Slide[] = [
  {
    key: 'problem',
    type: 'problem',
    title: 'What is your biggest money challenge?',
    subtitle: 'Pick your top pain points so TakaTrack can guide you better.',
  },
  {
    key: 'empathy',
    type: 'empathy',
    title: 'You are not bad with money',
    subtitle: 'Most people fail because they do not have one clear system. We fix that.',
  },
  {
    key: 'solution',
    type: 'solution',
    title: 'Track. Budget. Improve.',
    subtitle: 'Log transactions fast, set category budgets, and see exactly what to change.',
  },
  {
    key: 'wow',
    type: 'wow',
    title: 'Your numbers become crystal clear',
    subtitle: 'In one week, you can spot leaks, control spending, and build savings momentum.',
  },
  {
    key: 'paywall',
    type: 'paywall',
    title: 'Unlock Pro and stay in control',
    subtitle: 'Subscribe to unlock all features. No commitment, cancel anytime.',
  },
];

const completeOnboarding = async (router: ReturnType<typeof useRouter>) => {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  router.replace('/(tabs)');
};

const OnboardingScreen = () => {
  const { formatAmount } = useCurrency();
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
  const flatListRef = useRef<FlatList<Slide>>(null);
  const hintPulse = useRef(new Animated.Value(0)).current;
  const nextArrowShift = useRef(new Animated.Value(0)).current;

  const isLast = currentIndex === slides.length - 1;
  const selectedPlan = PAYWALL_PLANS[billingCycle];

  React.useEffect(() => {
    const hintLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(hintPulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const arrowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(nextArrowShift, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(nextArrowShift, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    hintLoop.start();
    arrowLoop.start();

    return () => {
      hintLoop.stop();
      arrowLoop.stop();
    };
  }, [hintPulse, nextArrowShift]);

  const toggleProblem = (problem: string) => {
    setSelectedProblems((prev) =>
      prev.includes(problem)
        ? prev.filter((item) => item !== problem)
        : [...prev, problem],
    );
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const skipToPaywall = () => {
    flatListRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
  };

  const renderIllustration = (type: SlideType) => {
    if (type === 'problem') {
      return (
        <View style={tw`w-full h-full px-7 justify-center`}>
          <View style={tw`bg-white/15 border border-white/25 rounded-3xl p-5`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3`}>
                <CircleDollarSign size={20} color={theme.colors.white} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-base font-bold`}>Money Stress Check</Text>
                <Text style={tw`text-white/75 text-xs mt-0.5`}>Tap options to personalize your journey</Text>
              </View>
              <Animated.View
                style={{
                  opacity: hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
                  transform: [{ scale: hintPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) }],
                }}
              >
                <Sparkles size={16} color={theme.colors.accent} />
              </Animated.View>
            </View>

            <View style={tw`flex-row flex-wrap`}>
              {PROBLEM_OPTIONS.map((problem) => {
                const active = selectedProblems.includes(problem);
                return (
                  <TouchableOpacity
                    key={problem}
                    activeOpacity={0.8}
                    onPress={() => toggleProblem(problem)}
                    style={[
                      tw`px-3 py-2 rounded-full mr-2 mb-2 border`,
                      active
                        ? { backgroundColor: theme.colors.white, borderColor: theme.colors.white }
                        : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.26)' },
                    ]}
                  >
                    <Text style={[tw`text-xs font-semibold`, { color: active ? theme.colors.primaryDeep : theme.colors.white }]}>
                      {problem}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      );
    }

    if (type === 'empathy') {
      return (
        <View style={tw`w-full h-full px-8 justify-center`}>
          <View style={tw`bg-white/15 border border-white/25 rounded-3xl p-6`}>
            <View style={tw`flex-row items-center mb-4`}>
              <Clock3 size={20} color={theme.colors.white} />
              <Text style={tw`text-white text-base font-bold ml-2`}>We have seen this pattern</Text>
            </View>
            <Text style={tw`text-white/90 text-sm leading-6`}>
              Spending happens fast. Tracking usually starts late. That does not mean you failed.
            </Text>
            <Text style={tw`text-white/90 text-sm leading-6 mt-3`}>
              It means you needed a system that works in real life.
            </Text>
          </View>
        </View>
      );
    }

    if (type === 'solution') {
      return (
        <View style={tw`w-full h-full px-8 justify-center`}>
          <View style={tw`bg-white/15 border border-white/25 rounded-3xl p-5`}>
            {[
              { icon: Wallet, label: '1. Add income and expenses in seconds' },
              { icon: Target, label: '2. Set budget limits by category' },
              { icon: ChartPie, label: '3. Track progress weekly, monthly, yearly' },
            ].map(({ icon: Icon, label }) => (
              <View key={label} style={tw`flex-row items-center py-3 border-b border-white/20 last:border-b-0`}>
                <View style={tw`w-10 h-10 rounded-xl bg-white/20 items-center justify-center mr-3`}>
                  <Icon size={18} color={theme.colors.white} />
                </View>
                <Text style={tw`text-white text-sm font-semibold flex-1`}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    if (type === 'wow') {
      return (
        <View style={tw`w-full h-full px-8 justify-center`}>
          <LinearGradient
            colors={['rgba(255,255,255,0.24)', 'rgba(255,255,255,0.12)']}
            style={tw`rounded-3xl p-5 border border-white/25`}
          >
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Text style={tw`text-white font-bold text-base`}>7-Day Improvement</Text>
              <View style={tw`px-2 py-1 rounded-full bg-green-500/20`}>
                <Text style={tw`text-green-200 text-xs font-bold`}>+42% control</Text>
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-3`}>
              <View>
                <Text style={tw`text-white/70 text-xs`}>Overspending</Text>
                <Text style={tw`text-white text-base font-bold`}>- {formatAmount(8300)}</Text>
              </View>
              <View>
                <Text style={tw`text-white/70 text-xs`}>Saved</Text>
                <Text style={tw`text-white text-base font-bold`}>+ {formatAmount(12400)}</Text>
              </View>
            </View>

            <View style={tw`mt-2 flex-row items-center`}>
              <Sparkles size={16} color={theme.colors.accent} />
              <Text style={tw`text-white text-xs font-semibold ml-2`}>
                This is where users usually say: Now I finally get it.
              </Text>
            </View>
          </LinearGradient>
        </View>
      );
    }

    return (
      <PaywallCard
        billingCycle={billingCycle}
        onChangeBillingCycle={setBillingCycle}
        plans={PAYWALL_PLANS}
        selectedPlan={selectedPlan}
      />
    );
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[{ width }, tw`flex-1`]}>
      <LinearGradient colors={ONBOARDING_BG} style={tw`absolute inset-0`} />
      <View style={[tw`absolute`, { width: 240, height: 240, borderRadius: 120, top: -30, right: -90, backgroundColor: 'rgba(255,255,255,0.06)' }]} />

      <View style={tw`w-full ${item.type === 'paywall' ? 'h-[64%]' : 'h-[58%]'}`}>{renderIllustration(item.type)}</View>

      <View style={tw`flex-1 ${item.type === 'paywall' ? 'px-4 pt-0' : 'px-8 pt-5'} `}>
        <Text
          style={[
            tw` font-extrabold text-center ${item.type === 'paywall' ? 'mb-1 text-[27px]' : 'mb-3 text-[32px]'} leading-10`,
            {
              color: '#FFFFFF',
              fontFamily: typography.heading,
              textShadowColor: 'rgba(0,0,0,0.22)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 6,
            }
          ]}
        >
          {item.title}
        </Text>
        <Text
          style={[
            tw`text-[16px] text-center leading-7 px-2`,
            {
              color: 'rgba(255,255,255,0.96)',
              textShadowColor: 'rgba(0,0,0,0.18)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }
          ]}
        >
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[tw`flex-1`, { backgroundColor: theme.colors.primaryDeep }]}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
        style={tw`flex-1`}
      />

      <View style={tw`absolute bottom-0 left-0 right-0 px-8 pb-12`}>
        <View style={tw`flex-row justify-center items-center mb-8 gap-3`}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                tw`rounded-full`,
                index === currentIndex
                  ? { width: 24, height: 10, backgroundColor: ACCENT }
                  : { width: 10, height: 10, backgroundColor: 'rgba(255,255,255,0.35)' },
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <View>
            <TouchableOpacity
              onPress={() => completeOnboarding(router)}
              activeOpacity={0.85}
              style={[tw`w-full rounded-full py-4 items-center mb-3`, { backgroundColor: ACCENT }]}
            >
              <Text style={tw`text-white text-base font-bold tracking-wider`}>
                {billingCycle === 'yearly' ? 'START YEARLY TRIAL' : 'START MONTHLY TRIAL'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => completeOnboarding(router)}
              activeOpacity={0.75}
              style={tw`w-full rounded-full py-4 items-center border border-white/35`}
            >
              <Text style={tw`text-white text-base font-semibold`}>CONTINUE FREE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={tw`flex-row items-center justify-between`}>
            <TouchableOpacity onPress={skipToPaywall} activeOpacity={0.7} style={tw`py-4 px-2`}>
              <Text style={[tw`font-semibold text-base`, { color: 'rgba(255,255,255,0.75)' }]}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={goNext}
              activeOpacity={0.85}
              style={[tw`flex-row items-center rounded-full py-4 px-8 gap-2`, { backgroundColor: ACCENT }]}
            >
              <Text style={tw`text-white text-base font-bold tracking-wider`}>Next</Text>
              <Animated.View
                style={{
                  transform: [{ translateX: nextArrowShift.interpolate({ inputRange: [0, 1], outputRange: [0, 5] }) }],
                }}
              >
                <ArrowRight size={18} color={theme.colors.white} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default OnboardingScreen;
