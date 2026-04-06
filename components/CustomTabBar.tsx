import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

const TAB_COLORS = {
    active: theme.colors.primary,
    inactive: theme.colors.gray400,
    fabGradient: [theme.colors.primary, theme.colors.primaryTeal] as [string, string],
    background: theme.colors.white,
    modalOverlay: theme.colors.overlay,
    activeBg: `${theme.colors.primary}1A`,
};

export default function CustomTabBar() {
    const router = useRouter();
    const segments = useSegments();
    const { t } = useLanguage();

    const [showCreateModal, setShowCreateModal] = useState(false);

    // Panel animations
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const panelTranslateX = useRef(new Animated.Value(40)).current;

    const quickActions = useMemo(() => [
        { key: 'expense', label: t('createExpense'), icon: 'arrow-down-circle' as const, color: theme.colors.expense, bg: theme.colors.redSoft, onPress: () => router.push({ pathname: '/add', params: { type: 'expense' } }) },
        { key: 'income', label: t('createIncome'), icon: 'arrow-up-circle' as const, color: theme.colors.income, bg: theme.colors.greenSoft, onPress: () => router.push({ pathname: '/add', params: { type: 'income' } }) },
        { key: 'category', label: t('createCategory'), icon: 'grid' as const, color: theme.colors.categoryBlue, bg: theme.colors.blueSoft, onPress: () => router.push('/screens/categories') },
        { key: 'budget', label: t('createBudget'), icon: 'flag' as const, color: theme.colors.categoryPurple, bg: theme.colors.purpleSoft, onPress: () => router.push('/budget') },
        { key: 'currency', label: 'Currency', icon: 'globe-outline' as const, color: theme.colors.primary, bg: theme.colors.teal50, onPress: () => router.push('/screens/currency') },
    ], [router, t]);

    // Fast Refresh Safeguard
    const itemAnims = useRef(quickActions.map(() => new Animated.Value(0))).current;
    if (itemAnims.length < quickActions.length) {
        const diff = quickActions.length - itemAnims.length;
        for (let i = 0; i < diff; i++) {
            itemAnims.push(new Animated.Value(0));
        }
    }

    // Tab bar interaction refs (Set to 'create' instead of 'voice')
    const tabAnimations = useRef({
        index: new Animated.Value(1),
        transactions: new Animated.Value(1),
        analytics: new Animated.Value(1),
        create: new Animated.Value(1),
    }).current;

    const tabBounce = useRef({
        index: new Animated.Value(0),
        transactions: new Animated.Value(0),
        analytics: new Animated.Value(0),
        create: new Animated.Value(0),
    }).current;

    // Fast Refresh Safeguard
    if (!tabAnimations.create) tabAnimations.create = new Animated.Value(1);
    if (!tabBounce.create) tabBounce.create = new Animated.Value(0);

    // The 4 main tabs on the bottom bar
    const tabs = [
        { name: 'index', label: t('tabHome') || 'Home', icon: 'home' as const },
        { name: 'transactions', label: t('tabTransactions') || 'History', icon: 'list' as const },
        { name: 'analytics', label: 'Analytics', icon: 'pie-chart' as const },
        { name: 'create', label: t('quickCreate') || 'Create', icon: 'add-circle' as const },
    ];

    useEffect(() => {
        if (showCreateModal) {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(panelTranslateX, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                Animated.stagger(100, itemAnims.slice(0, quickActions.length).map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        friction: 7,
                        tension: 45,
                        useNativeDriver: true,
                    })
                ))
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(panelTranslateX, { toValue: 40, duration: 200, useNativeDriver: true }),
                ...itemAnims.slice(0, quickActions.length).map(anim => Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }))
            ]).start();
        }
    }, [showCreateModal]);

    const animateTab = useCallback((tabName: string) => {
        const scaleAnim = tabAnimations[tabName as keyof typeof tabAnimations] || new Animated.Value(1);
        const bounceAnim = tabBounce[tabName as keyof typeof tabBounce] || new Animated.Value(0);

        Animated.parallel([
            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]),
            Animated.sequence([
                Animated.timing(bounceAnim, { toValue: -8, duration: 100, useNativeDriver: true }),
                Animated.spring(bounceAnim, { toValue: 0, friction: 3, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    const goTo = (name: string) => {
        animateTab(name);

        // Intercept Create click to open the modal
        if (name === 'create') {
            setShowCreateModal(true);
            return;
        }

        if (name === 'index') {
            router.push('/');
            return;
        }
        router.push(`/${name}` as any);
    };

    const currentSegment = segments[segments.length - 1] || 'index';

    // Highlight the create tab if the modal is open
    const isActive = (name: string) => {
        if (name === 'create') return showCreateModal;
        return currentSegment === name || (name === 'index' && currentSegment === '(tabs)');
    };

    // FAB animation for tapping
    const fabScale = useRef(new Animated.Value(1)).current;

    const handleVoicePressIn = () => {
        Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }).start();
    };

    const handleVoicePressOut = () => {
        Animated.spring(fabScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    };

    return (
        <View style={tw`absolute bottom-0 w-full`}>
            {/* Tab Bar Content */}
            <LinearGradient
                colors={[theme.colors.white, theme.colors.lightSlate]}
                style={tw`flex-row pt-2 pb-${Platform.OS === 'ios' ? '8' : '4'} px-4 justify-between items-center rounded-t-[32px] shadow-2xl border-t border-purple-100/50`}
            >
                {tabs.map((tab, idx) => (
                    <React.Fragment key={tab.name}>
                        {/* Center Gap for the FAB */}
                        {idx === 2 && <View style={tw`w-20`} />}

                        <TouchableOpacity onPress={() => goTo(tab.name)} style={tw`items-center justify-center flex-1`}>
                            <Animated.View style={{ transform: [{ scale: tabAnimations[tab.name as keyof typeof tabAnimations] || 1 }, { translateY: tabBounce[tab.name as keyof typeof tabBounce] || 0 }] }}>
                                <View style={[tw`p-2 rounded-xl`, isActive(tab.name) && { backgroundColor: TAB_COLORS.activeBg }]}>
                                    <Ionicons
                                        name={isActive(tab.name) ? tab.icon : (`${tab.icon}-outline` as any)}
                                        size={24}
                                        color={isActive(tab.name) ? TAB_COLORS.active : TAB_COLORS.inactive}
                                    />
                                </View>
                            </Animated.View>
                            <Text style={[tw`text-[10px] mt-1 font-semibold`, { color: isActive(tab.name) ? TAB_COLORS.active : TAB_COLORS.inactive }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ))}
            </LinearGradient>

            {/* CENTRAL FAB - Triggers Voice Action */}
            <View style={[tw`absolute -top-7 items-center`, { left: '50%', transform: [{ translateX: -32 }] }]}>
                <View style={[tw`w-20 h-10 absolute -top-1 rounded-full`]} />
                <Pressable
                    onPressIn={handleVoicePressIn}
                    onPressOut={handleVoicePressOut}
                    onPress={() => {
                        console.log('Voice Input Triggered!');
                        // Trigger your voice logic here
                    }}
                >
                    <Animated.View style={{ transform: [{ scale: fabScale }] }}>
                        <LinearGradient colors={['#EF4444', '#DC2626']} style={[tw`w-16 h-16 rounded-full items-center justify-center border-4 shadow-lg`, { borderColor: theme.colors.white }]}>
                            <Ionicons name="mic" size={32} color={theme.colors.white} />
                        </LinearGradient>
                    </Animated.View>
                </Pressable>
            </View>

            {/* QUICK ACTIONS MODAL */}
            <Modal transparent visible={showCreateModal} animationType="none" onRequestClose={() => setShowCreateModal(false)}>
                <Pressable style={tw`flex-1`} onPress={() => setShowCreateModal(false)}>
                    <View style={[tw`absolute inset-0`,]} />
                    <Animated.View
                        style={[
                            tw`absolute right-5 bottom-32 w-72 rounded-[32px] p-5 shadow-2xl border`,
                            {
                                backgroundColor: theme.colors.white,
                                borderColor: theme.colors.gray100,
                                opacity: overlayOpacity,
                                transform: [{ translateX: panelTranslateX }]
                            },
                        ]}
                    >
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <Text style={[tw`text-lg font-bold`, { color: TAB_COLORS.active }]}>{t('quickCreate') || 'Quick Create'}</Text>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={tw`w-8 h-8 rounded-full items-center justify-center bg-gray-100`}>
                                <Ionicons name="close" size={18} color={TAB_COLORS.inactive} />
                            </TouchableOpacity>
                        </View>

                        {quickActions.map((action, index) => (
                            <Animated.View
                                key={action.key}
                                style={{
                                    opacity: itemAnims[index],
                                    transform: [
                                        {
                                            translateX: itemAnims[index].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [60, 0] // SLIDES FROM RIGHT
                                            })
                                        }
                                    ]
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => { setShowCreateModal(false); setTimeout(action.onPress, 250); }}
                                    style={[tw`flex-row items-center p-3 rounded-2xl mb-2`, { backgroundColor: `${theme.colors.gray100}80` }]}
                                >
                                    <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: action.bg }]}>
                                        <Ionicons name={action.icon} size={20} color={action.color} />
                                    </View>
                                    <Text style={[tw`ml-4 text-sm font-bold`, { color: TAB_COLORS.active }]}>{action.label}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}

