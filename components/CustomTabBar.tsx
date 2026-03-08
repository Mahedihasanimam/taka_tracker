import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Swapped to Expo Icons
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

export default function CustomTabBar() {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useLanguage();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const panelTranslateX = useRef(new Animated.Value(36)).current;

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
        ]).start();
    }, [showCreateModal]);

    const goTo = (name: string) => {
        if (name === 'index') router.push('/');
        else router.push(`/${name}`);
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
            <View style={tw`flex-row bg-white pt-2 pb-${Platform.OS === 'ios' ? '8' : '4'} px-4 justify-between items-center rounded-t-[32px] shadow-2xl border-t border-gray-100`}>

                {/* Left Tabs */}
                <View style={tw`flex-row flex-1 justify-around`}>
                    {tabs.slice(0, 2).map((tab) => (
                        <TouchableOpacity
                            key={tab.name}
                            onPress={() => goTo(tab.name)}
                            style={tw`items-center justify-center py-1`}
                        >
                            <Ionicons
                                name={isActive(tab.name) ? tab.icon : (`${tab.icon}-outline` as any)}
                                size={24}
                                color={isActive(tab.name) ? theme.colors.primary : '#94a3b8'}
                            />
                            <Text style={[tw`text-[10px] mt-1 font-medium`, { color: isActive(tab.name) ? theme.colors.primary : '#94a3b8' }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAB Placeholder Gap */}
                <View style={tw`w-20`} />

                {/* Right Tabs */}
                <View style={tw`flex-row flex-1 justify-around`}>
                    {tabs.slice(2).map((tab) => (
                        <TouchableOpacity
                            key={tab.name}
                            onPress={() => goTo(tab.name)}
                            style={tw`items-center justify-center py-1`}
                        >
                            <Ionicons
                                name={isActive(tab.name) ? tab.icon : (`${tab.icon}-outline` as any)}
                                size={24}
                                color={isActive(tab.name) ? theme.colors.primary : '#94a3b8'}
                            />
                            <Text style={[tw`text-[10px] mt-1 font-medium`, { color: isActive(tab.name) ? theme.colors.primary : '#94a3b8' }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Floating Action Button */}
            <View style={[tw`absolute -top-7 items-center`, { left: '50%', transform: [{ translateX: -32 }] }]}>
                {/* Visual Notch Background */}
                <View style={tw`w-20 h-10 bg-white absolute -top-1 rounded-full`} />

                <Pressable onPress={() => setShowCreateModal((prev) => !prev)}>
                    <LinearGradient
                        colors={['#8b5cf6', '#6d28d9']}
                        style={[tw`w-16 h-16 rounded-full items-center justify-center border-4 border-white shadow-lg`]}
                    >
                        <Animated.View style={{ transform: [{ rotate: showCreateModal ? '45deg' : '0deg' }] }}>
                            <Ionicons name="add" size={36} color="white" />
                        </Animated.View>
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Quick Action Modal */}
            <Modal transparent visible={showCreateModal} animationType="none" onRequestClose={() => setShowCreateModal(false)}>
                <Pressable style={tw`flex-1`} onPress={() => setShowCreateModal(false)}>
                    <Animated.View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(15, 23, 42, 0.4)', opacity: overlayOpacity }]} />
                    <Animated.View
                        style={[
                            tw`absolute right-6 bottom-32 w-72 bg-white/95 rounded-[32px] p-5 shadow-2xl border border-white`,
                            { transform: [{ translateX: panelTranslateX }] },
                        ]}
                    >
                        <View style={tw`flex-row items-center justify-between mb-4`}>
                            <View style={tw`flex-row items-center`}>
                                <View style={tw`bg-purple-100 p-1.5 rounded-lg mr-2`}>
                                    <MaterialCommunityIcons name="cat" size={20} color={theme.colors.primary} />
                                </View>
                                <Text style={[tw`text-lg font-bold`, { color: theme.colors.text }]}>{t('quickCreate')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={tw`w-8 h-8 rounded-full bg-slate-100 items-center justify-center`}>
                                <Ionicons name="close" size={18} color={theme.colors.mutedText} />
                            </TouchableOpacity>
                        </View>

                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                onPress={() => closeAndRun(action.onPress)}
                                style={tw`flex-row items-center p-3 rounded-2xl mb-2 bg-slate-50/50`}
                            >
                                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center`, { backgroundColor: action.bg }]}>
                                    <Ionicons name={action.icon} size={20} color={action.color} />
                                </View>
                                <View style={tw`ml-4`}>
                                    <Text style={[tw`text-sm font-bold`, { color: theme.colors.text }]}>{action.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </View>
    );
}