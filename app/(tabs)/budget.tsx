import { theme } from "@/constants/theme";
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import {
    addBudget,
    deleteBudget,
    getBalance,
    getBudgets,
    getCategories,
    getTransactionsByCategory,
    updateBudget
} from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import {
    Book,
    Briefcase,
    Car,
    Check,
    Coffee,
    Dumbbell,
    Edit3,
    Gamepad2,
    Gift,
    GraduationCap,
    Heart,
    Home,
    MoreHorizontal,
    Music,
    Pill,
    Plane,
    Plus,
    Shirt,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Trash2,
    Utensils,
    Wifi,
    X,
    Zap
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

// Icon mapping
const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
    Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
    Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal
};

interface Budget {
    id: number;
    category: string;
    limit_amount: number;
    user_id?: number;
}

interface Category {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
}

interface BudgetWithSpent extends Budget {
    spent: number;
    icon: string;
    color: string;
}

const BudgetScreen = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { formatAmount, currencySymbol } = useCurrency();

    // State
    const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [balance, setBalance] = useState({ totalIncome: 0, totalExpense: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [limitAmount, setLimitAmount] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Animation values
    const scrollY = new Animated.Value(0);
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [280, 200],
        extrapolate: 'clamp'
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [budgetData, categoryData, balanceData] = await Promise.all([
                getBudgets(user?.id),
                getCategories('expense', user?.id),
                getBalance(user?.id)
            ]);

            const cats = (categoryData || []) as Category[];
            setCategories(cats);
            setBalance(balanceData || { totalIncome: 0, totalExpense: 0 });

            const budgetList = (budgetData || []) as Budget[];
            const budgetsWithSpent: BudgetWithSpent[] = [];

            for (const budget of budgetList) {
                try {
                    const spent = await getTransactionsByCategory(budget.category, 'expense', user?.id);
                    const category = cats.find(c => c.name === budget.category);
                    budgetsWithSpent.push({
                        ...budget,
                        spent: spent || 0,
                        icon: category?.icon || 'MoreHorizontal',
                        color: category?.color || theme.colors.mutedText
                    });
                } catch (err) {
                    budgetsWithSpent.push({
                        ...budget,
                        spent: 0,
                        icon: 'MoreHorizontal',
                        color: theme.colors.mutedText
                    });
                }
            }

            setBudgets(budgetsWithSpent);
        } catch (error) {
            console.error('Failed to fetch budget data:', error);
            setBudgets([]);
            setCategories([]);
            setBalance({ totalIncome: 0, totalExpense: 0 });
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Calculations with useMemo for performance
    const totals = useMemo(() => {
        const totalBudget = budgets.reduce((acc, item) => acc + (item.limit_amount || 0), 0);
        const totalSpent = budgets.reduce((acc, item) => acc + (item.spent || 0), 0);
        return {
            totalBudget,
            totalSpent,
            totalRemaining: totalBudget - totalSpent,
            overallProgress: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
            incomeUtilization: balance.totalIncome > 0 ? (totalBudget / balance.totalIncome) * 100 : 0
        };
    }, [budgets, balance.totalIncome]);

    // Get status color and config
    const getBudgetStatus = (spent: number, limit: number) => {
        if (!limit || limit === 0) return { color: theme.colors.mutedText, label: 'Not Set', emoji: '📊' };
        const percentage = (spent / limit) * 100;
        if (percentage >= 100) return { color: '#EF4444', label: 'Exceeded', emoji: '⚠️' };
        if (percentage >= 80) return { color: '#F59E0B', label: 'Warning', emoji: '⚡' };
        return { color: '#10B981', label: 'On Track', emoji: '✅' };
    };

    // Get icon component
    const getIconComponent = (iconName: string) => {
        if (!iconName) return MoreHorizontal;
        return iconMap[iconName] || MoreHorizontal;
    };

    // Open modal for add/edit
    const openModal = (budget?: BudgetWithSpent) => {
        if (budget) {
            setIsEditing(true);
            setEditingBudget(budget);
            const category = categories.find(c => c.name === budget.category);
            setSelectedCategory(category || null);
            setLimitAmount(budget.limit_amount?.toString() || '');
        } else {
            setIsEditing(false);
            setEditingBudget(null);
            setSelectedCategory(null);
            setLimitAmount('');
        }
        setModalVisible(true);
    };

    // Save budget
    const handleSave = async () => {
        if (!selectedCategory) {
            Alert.alert('Select Category', 'Please choose a category for your budget');
            return;
        }
        if (!limitAmount || parseFloat(limitAmount) <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid budget amount');
            return;
        }

        if (!isEditing) {
            const existing = budgets.find(b => b.category === selectedCategory.name);
            if (existing) {
                Alert.alert('Budget Exists', 'You already have a budget for this category');
                return;
            }
        }

        setIsSaving(true);
        try {
            if (isEditing && editingBudget) {
                await updateBudget(editingBudget.id, parseFloat(limitAmount));
            } else {
                await addBudget(user?.id || 0, selectedCategory.name, parseFloat(limitAmount));
            }
            setModalVisible(false);
            fetchData();
        } catch (error) {
            Alert.alert('Error', 'Failed to save budget. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete budget with swipe action
    const handleDelete = (budget: BudgetWithSpent) => {
        Alert.alert(
            'Delete Budget',
            `Are you sure you want to delete the budget for ${budget.category}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBudget(budget.id);
                            fetchData();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete budget');
                        }
                    }
                }
            ]
        );
    };

    // Get available categories
    const getAvailableCategories = () => {
        if (isEditing) return categories;
        const budgetedCategories = budgets.map(b => b.category);
        return categories.filter(c => !budgetedCategories.includes(c.name));
    };

    // Render right swipe actions
    const renderRightActions = (item: BudgetWithSpent) => (
        <View style={tw`flex-row`}>
            <TouchableOpacity
                onPress={() => openModal(item)}
                style={[tw`bg-blue-500 justify-center items-center px-6`, { backgroundColor: theme.colors.primary }]}
            >
                <Edit3 size={20} color="white" />
                <Text style={tw`text-white text-xs font-bold mt-1`}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={tw`bg-red-500 justify-center items-center px-6`}
            >
                <Trash2 size={20} color="white" />
                <Text style={tw`text-white text-xs font-bold mt-1`}>Delete</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-white justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={tw`text-gray-500 mt-4 font-medium`}>Loading your budgets...</Text>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={tw`flex-1 bg-gray-50`}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            {/* Animated Header */}
            <Animated.View style={[{ height: headerHeight }]}>
                <LinearGradient
                    colors={[theme.colors.primary, '#0F766E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`flex-1 px-6 pt-8 rounded-b-[32px]`}
                >
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <Text style={tw`text-white text-3xl font-bold tracking-tight`}>
                            Budgets
                        </Text>
                        <TouchableOpacity
                            onPress={() => openModal()}
                            style={tw`bg-white/20 p-3 rounded-full`}
                        >
                            <Plus size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Quick Stats */}
                    <View style={tw`flex-row justify-between`}>
                        <View style={tw`bg-white/10 rounded-2xl p-4 flex-1 mr-2`}>
                            <Text style={tw`text-white/60 text-xs mb-1`}>Monthly Budget</Text>
                            <Text style={tw`text-white text-2xl font-bold`}>
                                {formatAmount(totals.totalBudget)}
                            </Text>
                        </View>
                        <View style={tw`bg-white/10 rounded-2xl p-4 flex-1 ml-2`}>
                            <Text style={tw`text-white/60 text-xs mb-1`}>Remaining</Text>
                            <Text style={tw`text-white text-2xl font-bold`}>
                                {formatAmount(totals.totalRemaining)}
                            </Text>
                        </View>
                    </View>

                    {/* Progress Ring */}
                    <View style={tw`mt-4 flex-row items-center`}>
                        <View style={tw`flex-1 h-2 bg-white/20 rounded-full overflow-hidden`}>
                            <View
                                style={[
                                    tw`h-full rounded-full`,
                                    {
                                        width: `${Math.min(totals.overallProgress, 100)}%`,
                                        backgroundColor: totals.overallProgress >= 100 ? '#EF4444' :
                                            totals.overallProgress >= 80 ? '#F59E0B' : '#10B981'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={tw`text-white ml-3 font-semibold`}>
                            {Math.round(totals.overallProgress)}%
                        </Text>
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Budget List */}
            <FlatList
                data={budgets}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`px-4 pt-6 pb-24`}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
                ListEmptyComponent={() => (
                    <View style={tw`mt-10`}>
                        <View style={tw`flex-1 justify-center items-center px-6`}>
                            <Image source={require('@/assets/images/budget.png')} style={tw`w-58 h-58`} resizeMode="cover" />
                            <Text style={tw`text-gray-500 text-center text-base mb-6`}>
                                {t('noBudgets')}
                            </Text>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => {
                    const percent = item.limit_amount > 0 ? Math.min((item.spent / item.limit_amount) * 100, 100) : 0;
                    const status = getBudgetStatus(item.spent, item.limit_amount);
                    const IconComp = getIconComponent(item.icon);
                    const remaining = item.limit_amount - item.spent;

                    return (
                        <Swipeable renderRightActions={() => renderRightActions(item)}>
                            <View style={tw`bg-white rounded-2xl p-5 mb-3 shadow-sm border border-gray-100`}>
                                {/* Category Header */}
                                <View style={tw`flex-row items-center mb-4`}>
                                    <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3`, { backgroundColor: (item.color || theme.colors.mutedText) + '15' }]}>
                                        <IconComp size={22} color={item.color || theme.colors.mutedText} />
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-lg font-semibold text-gray-900`}>{item.category}</Text>
                                        <View style={tw`flex-row items-center`}>
                                            <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: status.color }]} />
                                            <Text style={[tw`text-xs font-medium`, { color: status.color }]}>
                                                {status.emoji} {status.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={tw`items-end`}>
                                        <Text style={tw`text-xl font-bold text-gray-900`}>{formatAmount(item.limit_amount)}</Text>
                                        <Text style={tw`text-xs text-gray-400`}>limit</Text>
                                    </View>
                                </View>

                                {/* Progress Bar */}
                                <View style={tw`mb-3`}>
                                    <View style={tw`flex-row justify-between mb-2`}>
                                        <Text style={tw`text-sm font-medium text-gray-700`}>
                                            Spent: {formatAmount(item.spent)}
                                        </Text>
                                        <Text style={tw`text-sm font-medium text-gray-500`}>
                                            {percent.toFixed(0)}%
                                        </Text>
                                    </View>
                                    <View style={tw`h-2.5 bg-gray-100 rounded-full overflow-hidden`}>
                                        <View
                                            style={[
                                                tw`h-full rounded-full`,
                                                { width: `${percent}%`, backgroundColor: status.color }
                                            ]}
                                        />
                                    </View>
                                </View>

                                {/* Remaining Amount */}
                                <View style={tw`flex-row justify-between items-center`}>
                                    <Text style={tw`text-sm text-gray-500`}>
                                        Remaining
                                    </Text>
                                    <Text style={[
                                        tw`text-base font-bold`,
                                        remaining >= 0 ? 'text-green-600' : 'text-red-600'
                                    ]}>
                                        {formatAmount(Math.abs(remaining))}
                                        {remaining < 0 && ' over'}
                                    </Text>
                                </View>

                                {/* Quick Actions */}
                                <View style={tw`flex-row mt-4 pt-3 border-t border-gray-100`}>
                                    <TouchableOpacity
                                        onPress={() => openModal(item)}
                                        style={tw`flex-1 flex-row items-center justify-center py-2 mr-2 bg-gray-50 rounded-xl`}
                                    >
                                        <Edit3 size={16} color={theme.colors.primary} />
                                        <Text style={tw`text-teal-600 font-semibold ml-2`}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDelete(item)}
                                        style={tw`flex-1 flex-row items-center justify-center py-2 ml-2 bg-red-50 rounded-xl`}
                                    >
                                        <Trash2 size={16} color="#EF4444" />
                                        <Text style={tw`text-red-500 font-semibold ml-2`}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Swipeable>
                    );
                }}
            />

            {/* Floating Action Button (visible when scrolled) */}
            <Animated.View style={[
                tw`absolute bottom-6 right-6`,
                {
                    opacity: scrollY.interpolate({
                        inputRange: [0, 50, 100],
                        outputRange: [0, 0.5, 1]
                    }),
                    transform: [{
                        scale: scrollY.interpolate({
                            inputRange: [0, 100],
                            outputRange: [0.8, 1]
                        })
                    }]
                }
            ]}>
                <TouchableOpacity
                    onPress={() => openModal()}
                    style={tw`bg-teal-600 w-14 h-14 rounded-full items-center justify-center shadow-lg`}
                >
                    <Plus size={28} color="white" />
                </TouchableOpacity>
            </Animated.View>

            {/* Add/Edit Budget Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-white rounded-t-[32px] max-h-[85%]`}>
                        {/* Modal Header */}
                        <View style={tw`flex-row justify-between items-center p-6 border-b border-gray-100`}>
                            <View>
                                <Text style={tw`text-2xl font-bold text-gray-900`}>
                                    {isEditing ? 'Edit Budget' : 'Create Budget'}
                                </Text>
                                <Text style={tw`text-gray-500 text-sm mt-1`}>
                                    {isEditing ? 'Adjust your budget limits' : 'Set a spending limit for a category'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={tw`bg-gray-100 p-3 rounded-full`}
                            >
                                <X size={20} color={theme.colors.mutedText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={tw`p-6`}
                        >
                            {/* Category Selection */}
                            <Text style={tw`text-gray-700 font-semibold mb-3`}>
                                Select Category
                            </Text>

                            {getAvailableCategories().length > 0 ? (
                                <View style={tw`flex-row flex-wrap mb-6`}>
                                    {getAvailableCategories().map((cat) => {
                                        const IconComp = getIconComponent(cat.icon);
                                        const isSelected = selectedCategory?.name === cat.name;
                                        return (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => !isEditing && setSelectedCategory(cat)}
                                                disabled={isEditing}
                                                style={tw`w-[23%] items-center mb-4 mr-[2%]`}
                                            >
                                                <View
                                                    style={[
                                                        tw`w-14 h-14 rounded-2xl items-center justify-center mb-2`,
                                                        {
                                                            backgroundColor: isSelected ? theme.colors.primary : (cat.color || theme.colors.mutedText) + '15'
                                                        }
                                                    ]}
                                                >
                                                    <IconComp
                                                        size={24}
                                                        color={isSelected ? 'white' : (cat.color || theme.colors.mutedText)}
                                                    />
                                                </View>
                                                <Text style={[
                                                    tw`text-xs font-medium text-center`,
                                                    isSelected ? 'text-teal-600' : 'text-gray-600'
                                                ]} numberOfLines={1}>
                                                    {cat.name}
                                                </Text>
                                                {isSelected && (
                                                    <View style={tw`absolute top-0 right-3 bg-teal-600 rounded-full p-1`}>
                                                        <Check size={10} color="white" />
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : !isEditing ? (
                                <View style={tw`bg-amber-50 p-6 rounded-2xl mb-6 items-center`}>
                                    <Sparkles size={32} color="#F59E0B" />
                                    <Text style={tw`text-amber-700 text-center mt-2 font-medium`}>
                                        All categories have budgets!
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setModalVisible(false);
                                            router.push('/screens/categories');
                                        }}
                                        style={tw`mt-3 bg-amber-600 px-6 py-3 rounded-xl`}
                                    >
                                        <Text style={tw`text-white font-semibold`}>
                                            Add More Categories
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            {/* Budget Amount Input */}
                            <Text style={tw`text-gray-700 font-semibold mb-3`}>
                                Monthly Limit
                            </Text>
                            <View style={tw`bg-gray-50 rounded-2xl px-5 py-4 mb-4 border border-gray-200`}>
                                <View style={tw`flex-row items-center`}>
                                    <Text style={tw`text-2xl font-bold text-gray-400 mr-2`}>{currencySymbol}</Text>
                                    <TextInput
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.gray400}
                                        keyboardType="numeric"
                                        style={tw`flex-1 text-2xl font-bold text-gray-900`}
                                        value={limitAmount}
                                        onChangeText={(text) => setLimitAmount(text.replace(/[^0-9]/g, ''))}
                                    />
                                </View>
                            </View>

                            {/* Quick Suggestions */}
                            {balance.totalIncome > 0 && (
                                <View style={tw`bg-blue-50 rounded-2xl p-5 mb-6`}>
                                    <Text style={tw`text-blue-700 font-semibold mb-3`}>
                                        Quick Suggestions
                                    </Text>
                                    <View style={tw`flex-row flex-wrap`}>
                                        {[10, 20, 30].map((percent) => {
                                            const amount = Math.round(balance.totalIncome * percent / 100);
                                            return (
                                                <TouchableOpacity
                                                    key={percent}
                                                    onPress={() => setLimitAmount(amount.toString())}
                                                    style={tw`bg-white px-4 py-3 rounded-xl mr-3 mb-2 border border-blue-200`}
                                                >
                                                    <Text style={tw`text-blue-700 font-semibold`}>
                                                        {percent}% {formatAmount(amount)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving || (!isEditing && getAvailableCategories().length === 0)}
                                style={tw`bg-teal-600 rounded-2xl py-5 items-center shadow-lg ${isSaving || (!isEditing && getAvailableCategories().length === 0) ? 'opacity-50' : ''}`}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={tw`text-white font-bold text-lg`}>
                                        {isEditing ? 'Update Budget' : 'Create Budget'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={tw`mt-3 py-4 items-center`}
                            >
                                <Text style={tw`text-gray-500 font-semibold`}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </GestureHandlerRootView>
    );
};

export default BudgetScreen;
