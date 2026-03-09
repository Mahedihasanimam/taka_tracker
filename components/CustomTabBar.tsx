import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

// Theme colors matching the home page gradient
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
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const panelTranslateX = useRef(new Animated.Value(36)).current;
    const fabRotation = useRef(new Animated.Value(0)).current;

    // Tab animation refs
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

    const quickActions = useMemo(
        () => [
            {
                key: 'expense',
                label: t('createExpense'),
                icon: 'arrow-down-circle' as const,
                color: theme.colors.expense,
                bg: theme.colors.redSoft,
                onPress: () => router.push({ pathname: '/add', params: { type: 'expense' } }),
            },
            {
                key: 'income',
                label: t('createIncome'),
                icon: 'arrow-up-circle' as const,
                color: theme.colors.income,
                bg: theme.colors.greenSoft,
                onPress: () => router.push({ pathname: '/add', params: { type: 'income' } }),
            },
            {
                key: 'category',
                label: t('createCategory'),
                icon: 'grid' as const,
                color: theme.colors.categoryBlue,
                bg: theme.colors.blueSoft,
                onPress: () => router.push('/screens/categories'),
            },
            {
                key: 'budget',
                label: t('createBudget'),
                icon: 'flag' as const,
                color: theme.colors.categoryPurple,
                bg: theme.colors.purpleSoft,
                onPress: () => router.push('/budget'),
            },
        ],
        [router, t],
    );

    // Animate tab when selected
    const animateTab = useCallback((tabName: string) => {
        const scaleAnim = tabAnimations[tabName as keyof typeof tabAnimations];
        const bounceAnim = tabBounce[tabName as keyof typeof tabBounce];

        // Scale animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Bounce animation for the icon
        Animated.sequence([
            Animated.timing(bounceAnim, {
                toValue: -8,
                duration: 100,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(bounceAnim, {
                toValue: 0,
                friction: 3,
                tension: 120,
                useNativeDriver: true,
            }),
        ]).start();
    }, [tabAnimations, tabBounce]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(overlayOpacity, {
                toValue: showCreateModal ? 1 : 0,
                duration: 160,
                useNativeDriver: true,
            }),
            Animated.timing(panelTranslateX, {
                toValue: showCreateModal ? 0 : 36,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(fabRotation, {
                toValue: showCreateModal ? 1 : 0,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [showCreateModal, fabRotation, overlayOpacity, panelTranslateX]);

    const goTo = (name: string) => {
        animateTab(name);
        if (name === 'index') router.push('/');
        else router.push(`/${name}` as any);
    };

    const isActive = (name: string) =>
        (pathname === '/' && name === 'index') ||
        (pathname === '/index' && name === 'index') ||
        (name !== 'index' && pathname.includes(name));

    const closeAndRun = (fn: () => void) => {
        setShowCreateModal(false);
        setTimeout(fn, 120);
    };

    return (
        <View style={tw`absolute bottom-0 w-full`}>
            {/* The Tab Bar Body */}
            <LinearGradient
                colors={[theme.colors.white, theme.colors.lightSlate]}
                style={tw`flex-row pt-2 pb-${Platform.OS === 'ios' ? '8' : '4'} px-4 justify-between items-center rounded-t-[32px] shadow-2xl border-t border-purple-100/50`}
            >
                {/* Left Tabs */}
                <View style={tw`flex-row flex-1 justify-around`}>
                    {tabs.slice(0, 2).map((tab) => {
                        const active = isActive(tab.name);
                        const scaleAnim = tabAnimations[tab.name as keyof typeof tabAnimations];
                        const bounceAnim = tabBounce[tab.name as keyof typeof tabBounce];
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={() => goTo(tab.name)}
                                style={tw`items-center justify-center py-1`}
                                activeOpacity={0.7}
                            >
                                <Animated.View
                                    style={{
                                        transform: [
                                            { scale: scaleAnim },
                                            { translateY: bounceAnim },
                                        ],
                                    }}
                                >
                                    <View style={[tw`p-2 rounded-xl`, active && { backgroundColor: TAB_COLORS.activeBg }]}>
                                        <Ionicons
                                            name={active ? tab.icon : (`${tab.icon}-outline` as any)}
                                            size={24}
                                            color={active ? TAB_COLORS.active : TAB_COLORS.inactive}
                                        />
                                    </View>
                                </Animated.View>
                                <Text style={[tw`text-[10px] mt-1 font-semibold`, { color: active ? TAB_COLORS.active : TAB_COLORS.inactive }]}>
                                    {tab.label}
                                </Text>
                                {active && <View style={[tw`w-1 h-1 rounded-full mt-1`, { backgroundColor: TAB_COLORS.active }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* FAB Placeholder Gap */}
                <View style={tw`w-20`} />

                {/* Right Tabs */}
                <View style={tw`flex-row flex-1 justify-around`}>
                    {tabs.slice(2).map((tab) => {
                        const active = isActive(tab.name);
                        const scaleAnim = tabAnimations[tab.name as keyof typeof tabAnimations];
                        const bounceAnim = tabBounce[tab.name as keyof typeof tabBounce];
                        return (
                            <TouchableOpacity
                                key={tab.name}
                                onPress={() => goTo(tab.name)}
                                style={tw`items-center justify-center py-1`}
                                activeOpacity={0.7}
                            >
                                <Animated.View
                                    style={{
                                        transform: [
                                            { scale: scaleAnim },
                                            { translateY: bounceAnim },
                                        ],
                                    }}
                                >
                                    <View style={[tw`p-2 rounded-xl`, active && { backgroundColor: TAB_COLORS.activeBg }]}>
                                        <Ionicons
                                            name={active ? tab.icon : (`${tab.icon}-outline` as any)}
                                            size={24}
                                            color={active ? TAB_COLORS.active : TAB_COLORS.inactive}
                                        />
                                    </View>
                                </Animated.View>
                                <Text style={[tw`text-[10px] mt-1 font-semibold`, { color: active ? TAB_COLORS.active : TAB_COLORS.inactive }]}>
                                    {tab.label}
                                </Text>
                                {active && <View style={[tw`w-1 h-1 rounded-full mt-1`, { backgroundColor: TAB_COLORS.active }]} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </LinearGradient>

            {/* Floating Action Button */}
            <View style={[tw`absolute -top-7 items-center`, { left: '50%', transform: [{ translateX: -32 }] }]}>
                {/* Visual Notch Background */}
                <View style={[tw`w-20 h-10 absolute -top-1 rounded-full`, { backgroundColor: theme.colors.white }]} />

                <Pressable onPress={() => setShowCreateModal((prev) => !prev)}>
                    <LinearGradient
                        colors={TAB_COLORS.fabGradient}
                        start={{ x: 1, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[tw`w-16 h-16 rounded-full items-center justify-center border-4 shadow-lg`, { borderColor: theme.colors.white }]}
                    >
                        <Animated.View
                            style={{
                                transform: [{
                                    rotate: fabRotation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0deg', '135deg'],
                                    }),
                                }],
                            }}
                        >
                            <Ionicons name="add" size={36} color={theme.colors.white} />
                        </Animated.View>
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Quick Action Modal */}
            <Modal transparent visible={showCreateModal} animationType="none" onRequestClose={() => setShowCreateModal(false)}>
                <Pressable style={tw`flex-1`} onPress={() => setShowCreateModal(false)}>
                    <Animated.View style={[tw`absolute inset-0 blur-lg `, { backgroundColor: TAB_COLORS.modalOverlay, opacity: overlayOpacity }]} />
                    <Animated.View
                        style={[
                            tw`absolute right-6 bottom-32 w-72 rounded-[32px] p-5 shadow-2xl border`,
                            { backgroundColor: `${theme.colors.white}F2`, borderColor: theme.colors.white },
                            { transform: [{ translateX: panelTranslateX }] },
                        ]}
                    >
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <View style={tw`flex-row items-center`}>
                                <LinearGradient
                                    colors={TAB_COLORS.fabGradient}
                                    start={{ x: 1, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={tw`p-1.5 rounded-lg mr-2`}
                                >
                                    <MaterialCommunityIcons name="cat" size={20} color={theme.colors.white} />
                                </LinearGradient>
                                <Text style={[tw`text-lg font-bold`, { color: TAB_COLORS.active }]}>{t('quickCreate')}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: theme.colors.gray100 }]}
                            >
                                <Ionicons name="close" size={18} color={TAB_COLORS.inactive} />
                            </TouchableOpacity>
                        </View>

                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                onPress={() => closeAndRun(action.onPress)}
                                style={[tw`flex-row items-center p-3 rounded-2xl mb-2`, { backgroundColor: `${theme.colors.gray100}80` }]}
                            >
                                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={20} color={action.color} />
                                </View>
                                <View style={tw`ml-4`}>
                                    <Text style={[tw`text-sm font-bold`, { color: TAB_COLORS.active }]}>{action.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}
