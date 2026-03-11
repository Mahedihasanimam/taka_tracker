import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
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
    const pathname = usePathname();
    const { t } = useLanguage();

    const [showCreateModal, setShowCreateModal] = useState(false);

    // Panel animations
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const panelTranslateX = useRef(new Animated.Value(40)).current; // Panel slides from right
    const fabRotation = useRef(new Animated.Value(0)).current;

    const quickActions = useMemo(() => [
        { key: 'expense', label: t('createExpense'), icon: 'arrow-down-circle' as const, color: theme.colors.expense, bg: theme.colors.redSoft, onPress: () => router.push({ pathname: '/add', params: { type: 'expense' } }) },
        { key: 'income', label: t('createIncome'), icon: 'arrow-up-circle' as const, color: theme.colors.income, bg: theme.colors.greenSoft, onPress: () => router.push({ pathname: '/add', params: { type: 'income' } }) },
        { key: 'category', label: t('createCategory'), icon: 'grid' as const, color: theme.colors.categoryBlue, bg: theme.colors.blueSoft, onPress: () => router.push('/screens/categories') },
        { key: 'budget', label: t('createBudget'), icon: 'flag' as const, color: theme.colors.categoryPurple, bg: theme.colors.purpleSoft, onPress: () => router.push('/budget') },
    ], [router, t]);

    // 1. Animation values for each individual list item
    const itemAnims = useRef(quickActions.map(() => new Animated.Value(0))).current;

    // Tab bar interaction refs
    const tabAnimations = useRef({
        index: new Animated.Value(1),
        transactions: new Animated.Value(1),
        budget: new Animated.Value(1),
        profile: new Animated.Value(1),
    }).current;

    const tabBounce = useRef({
        index: new Animated.Value(0),
        transactions: new Animated.Value(0),
        budget: new Animated.Value(0),
        profile: new Animated.Value(0),
    }).current;

    const tabs = [
        { name: 'index', label: t('tabHome'), icon: 'home' as const },
        { name: 'transactions', label: t('tabTransactions'), icon: 'list' as const },
        { name: 'budget', label: t('tabBudget'), icon: 'pie-chart' as const },
        { name: 'profile', label: t('tabProfile'), icon: 'person' as const },
    ];

    useEffect(() => {
        if (showCreateModal) {
            // OPEN ANIMATION
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(panelTranslateX, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
                Animated.timing(fabRotation, { toValue: 1, duration: 300, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
                // STAGGERED ITEMS: Each item slides from right (X: 50 -> 0)
                Animated.stagger(100, itemAnims.map(anim =>
                    Animated.spring(anim, {
                        toValue: 1,
                        friction: 7,
                        tension: 45,
                        useNativeDriver: true,
                    })
                ))
            ]).start();
        } else {
            // CLOSE ANIMATION
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(panelTranslateX, { toValue: 40, duration: 200, useNativeDriver: true }),
                Animated.timing(fabRotation, { toValue: 0, duration: 250, useNativeDriver: true }),
                ...itemAnims.map(anim => Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }))
            ]).start();
        }
    }, [showCreateModal]);

    const animateTab = useCallback((tabName: string) => {
        const scaleAnim = tabAnimations[tabName as keyof typeof tabAnimations];
        const bounceAnim = tabBounce[tabName as keyof typeof tabBounce];
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
        name === 'index' ? router.push('/') : router.push(`/${name}` as any);
    };

    const isActive = (name: string) => (pathname === '/' && name === 'index') || pathname.includes(name);

    return (
        <View style={tw`absolute bottom-0 w-full`}>
            {/* Tab Bar Content */}
            <LinearGradient
                colors={[theme.colors.white, theme.colors.lightSlate]}
                style={tw`flex-row pt-2 pb-${Platform.OS === 'ios' ? '8' : '4'} px-4 justify-between items-center rounded-t-[32px] shadow-2xl border-t border-purple-100/50`}
            >
                {tabs.map((tab, idx) => (
                    <React.Fragment key={tab.name}>
                        {idx === 2 && <View style={tw`w-20`} />}
                        <TouchableOpacity onPress={() => goTo(tab.name)} style={tw`items-center justify-center flex-1`}>
                            <Animated.View style={{ transform: [{ scale: tabAnimations[tab.name as keyof typeof tabAnimations] }, { translateY: tabBounce[tab.name as keyof typeof tabBounce] }] }}>
                                <View style={[tw`p-2 rounded-xl`, isActive(tab.name) && { backgroundColor: TAB_COLORS.activeBg }]}>
                                    <Ionicons name={isActive(tab.name) ? tab.icon : (`${tab.icon}-outline` as any)} size={24} color={isActive(tab.name) ? TAB_COLORS.active : TAB_COLORS.inactive} />
                                </View>
                            </Animated.View>
                            <Text style={[tw`text-[10px] mt-1 font-semibold`, { color: isActive(tab.name) ? TAB_COLORS.active : TAB_COLORS.inactive }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    </React.Fragment>
                ))}
            </LinearGradient>

            {/* FAB */}
            <View style={[tw`absolute -top-7 items-center`, { left: '50%', transform: [{ translateX: -32 }] }]}>
                <View style={[tw`w-20 h-10 absolute -top-1 rounded-full`, { backgroundColor: theme.colors.white }]} />
                <Pressable onPress={() => setShowCreateModal(!showCreateModal)}>
                    <LinearGradient colors={TAB_COLORS.fabGradient} style={[tw`w-16 h-16 rounded-full items-center justify-center border-4 shadow-lg`, { borderColor: theme.colors.white }]}>
                        <Animated.View style={{ transform: [{ rotate: fabRotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '135deg'] }) }] }}>
                            <Ionicons name="add" size={36} color={theme.colors.white} />
                        </Animated.View>
                    </LinearGradient>
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
                            <Text style={[tw`text-lg font-bold`, { color: TAB_COLORS.active }]}>{t('quickCreate')}</Text>
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
                                                outputRange: [60, 0] // SLIDES FROM RIGHT (60px away)
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
