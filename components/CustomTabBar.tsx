import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname, useRouter } from 'expo-router';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Cat,
    FolderPlus,
    Home,
    List,
    PieChart,
    Plus,
    Target,
    User,
    X
} from 'lucide-react-native';
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
        { name: 'index', label: t('tabHome'), icon: Home },
        { name: 'transactions', label: t('tabTransactions'), icon: List },
        { name: 'budget', label: t('tabBudget'), icon: PieChart },
        { name: 'profile', label: t('tabProfile'), icon: User },
    ];

    const quickActions = useMemo(
        () => [
            {
                key: 'expense',
                label: t('createExpense'),
                icon: ArrowDownCircle,
                color: '#ef4444',
                bg: '#fef2f2',
                onPress: () => router.push({ pathname: '/add', params: { type: 'expense' } }),
            },
            {
                key: 'income',
                label: t('createIncome'),
                icon: ArrowUpCircle,
                color: '#16a34a',
                bg: '#f0fdf4',
                onPress: () => router.push({ pathname: '/add', params: { type: 'income' } }),
            },
            {
                key: 'category',
                label: t('createCategory'),
                icon: FolderPlus,
                color: '#0ea5e9',
                bg: '#f0f9ff',
                onPress: () => router.push('/screens/categories'),
            },
            {
                key: 'budget',
                label: t('createBudget'),
                icon: Target,
                color: '#a855f7',
                bg: '#faf5ff',
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
    }, [overlayOpacity, panelTranslateX, showCreateModal]);

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
        <>
            <View
                style={tw`flex-row bg-white pt-1 pb-${Platform.OS === 'ios' ? '8' : '4'} px-4 justify-between items-end rounded-t-3xl absolute bottom-0 w-full border-t border-gray-100`}
            >
                {tabs.slice(0, 2).map((tab) => (
                    <TouchableOpacity
                        key={tab.name}
                        onPress={() => goTo(tab.name)}
                        style={tw`items-center justify-center w-16 h-full pt-2`}
                    >
                        <tab.icon size={22} color={isActive(tab.name) ? theme.colors.primary : '#9ca3af'} />
                        <Text style={[tw`text-[10px] mt-1`, { color: isActive(tab.name) ? theme.colors.primary : '#9ca3af' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}

                <View style={tw`items-center justify-center -top-7`}>
                    <Pressable onPress={() => setShowCreateModal((prev) => !prev)} hitSlop={10}>
                        <View
                            style={[
                                tw`w-14 h-14 rounded-full items-center justify-center border-[4px] border-white`,
                                { backgroundColor: theme.colors.success },
                            ]}
                        >
                            <Plus size={28} color="white" strokeWidth={2.5} />
                        </View>
                    </Pressable>
                    <Text style={tw`text-[10px] text-gray-500 font-medium mt-1`}>{t('tabAdd')}</Text>
                </View>

                {tabs.slice(2).map((tab) => (
                    <TouchableOpacity
                        key={tab.name}
                        onPress={() => goTo(tab.name)}
                        style={tw`items-center justify-center w-16 h-full pt-2`}
                    >
                        <tab.icon size={22} color={isActive(tab.name) ? theme.colors.primary : '#9ca3af'} />
                        <Text style={[tw`text-[10px] mt-1`, { color: isActive(tab.name) ? theme.colors.primary : '#9ca3af' }]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Modal transparent visible={showCreateModal} animationType="none" onRequestClose={() => setShowCreateModal(false)}>
                <Pressable style={tw`flex-1`} onPress={() => setShowCreateModal(false)}>
                    <Animated.View style={[tw`absolute inset-0 bg-black/20`, { opacity: overlayOpacity }]} />
                    <Animated.View
                        style={[
                            tw`absolute right-4 bottom-28 w-72 bg-white/90 rounded-3xl p-4 border border-white`,
                            { transform: [{ translateX: panelTranslateX }] },
                        ]}
                    >
                        <View style={tw`flex-row items-center justify-between mb-2`}>
                            <View style={tw`flex-row items-center`}>
                                <Cat size={16} color={theme.colors.primary} />
                                <Text style={[tw`ml-1 text-base font-bold`, { color: theme.colors.text }]}>{t('quickCreate')}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={tw`w-7 h-7 rounded-full bg-gray-100 items-center justify-center`}>
                                <X size={14} color="#6b7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[tw`text-xs mb-3`, { color: theme.colors.mutedText }]}>{t('quickCreateSub')}</Text>

                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.key}
                                onPress={() => closeAndRun(action.onPress)}
                                style={tw`flex-row items-center p-3 rounded-2xl mb-2 bg-white`}
                            >
                                <View style={[tw`w-9 h-9 rounded-xl items-center justify-center`, { backgroundColor: action.bg }]}>
                                    <action.icon size={18} color={action.color} />
                                </View>
                                <Text style={[tw`ml-3 text-sm font-semibold`, { color: theme.colors.text }]}>{action.label}</Text>

                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>
        </>
    );
}
