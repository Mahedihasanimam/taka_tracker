import { useAuth } from '@/context/AuthContext';
import { theme } from "@/constants/theme";
import { useLanguage } from '@/context/LanguageContext';
import EmptyStateMascot from '@/components/EmptyStateMascot';
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
    AlertTriangle,
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
    PieChart,
    Pill,
    Plane,
    Plus,
    Shirt,
    ShoppingBag,
    Smartphone,
    Trash2,
    TrendingUp,
    Utensils,
    Wifi,
    X,
    Zap
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

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

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);

            // Fetch all data
            const [budgetData, categoryData, balanceData] = await Promise.all([
                getBudgets(user?.id),
                getCategories('expense', user?.id),
                getBalance(user?.id)
            ]);

            const cats = (categoryData || []) as Category[];
            setCategories(cats);
            setBalance(balanceData || { totalIncome: 0, totalExpense: 0 });

            // Get spent amount for each budget - handle errors gracefully
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
                    console.error('Error fetching category spent:', err);
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
            // Set default values on error
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

    // Calculations - with safe defaults
    const totalBudget = budgets.reduce((acc, item) => acc + (item.limit_amount || 0), 0);
    const totalSpent = budgets.reduce((acc, item) => acc + (item.spent || 0), 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const incomeUtilization = balance.totalIncome > 0 ? (totalBudget / balance.totalIncome) * 100 : 0;

    // Get status color
    const getStatusColor = (spent: number, limit: number) => {
        if (!limit || limit === 0) return theme.colors.mutedText;
        const percentage = (spent / limit) * 100;
        if (percentage >= 100) return theme.colors.danger;
        if (percentage >= 80) return theme.colors.warning;
        return theme.colors.success;
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
            Alert.alert(t('Opps') || 'Opps', t('selectCategory') || 'Please select a category');
            return;
        }
        if (!limitAmount || parseFloat(limitAmount) <= 0) {
            Alert.alert(t('Opps') || 'Opps', t('enterValidAmount') || 'Please enter a valid amount');
            return;
        }

        // Check if budget already exists for this category (when adding new)
        if (!isEditing) {
            const existing = budgets.find(b => b.category === selectedCategory.name);
            if (existing) {
                Alert.alert(t('Opps') || 'Opps', t('budgetExists') || 'Budget already exists for this category');
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
            console.error('Save budget error:', error);
            Alert.alert(t('Opps') || 'Opps', t('somethingWrong') || 'Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    // Delete budget
    const handleDelete = (budget: BudgetWithSpent) => {
        Alert.alert(
            t('deleteBudget') || 'Delete Budget',
            t('deleteBudgetConfirm') || 'Are you sure you want to delete this budget?',
            [
                { text: t('cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('delete') || 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteBudget(budget.id);
                            fetchData();
                        } catch (error) {
                            console.error('Delete budget error:', error);
                            Alert.alert(t('Opps') || 'Opps', t('somethingWrong') || 'Something went wrong');
                        }
                    }
                }
            ]
        );
    };

    // Get available categories (not already budgeted)
    const getAvailableCategories = () => {
        if (isEditing) return categories;
        const budgetedCategories = budgets.map(b => b.category);
        return categories.filter(c => !budgetedCategories.includes(c.name));
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={tw`px-6 pt-10 pb-32 rounded-b-[36px] shadow-lg`}
            >
                <Text style={tw`text-white text-2xl font-extrabold tracking-wide mb-4`}>
                    {t('budgetTitle') || 'Budget'}
                </Text>

                {/* Income Info */}
                <View style={tw`flex-row items-center bg-white/15 rounded-xl px-4 py-2 mb-4`}>
                    <TrendingUp size={16} color={theme.colors.lightSuccess} />
                    <Text style={tw`text-white/80 text-sm ml-2`}>
                        {t('monthlyIncome') || 'Monthly Income'}: <Text style={tw`font-bold text-white`}>৳{(balance.totalIncome || 0).toLocaleString()}</Text>
                    </Text>
                </View>

                {/* --- SUMMARY CARD --- */}
                <View style={tw`bg-white rounded-3xl p-5 shadow-xl`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <View>
                            <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-wider`}>{t('totalBudget') || 'Total Budget'}</Text>
                            <Text style={tw`text-2xl font-extrabold text-gray-900`}>৳{totalBudget.toLocaleString()}</Text>
                        </View>
                        <View style={tw`bg-teal-50 p-3 rounded-2xl`}>
                            <PieChart size={24} color={theme.colors.primary} />
                        </View>
                    </View>

                    {/* Income Utilization */}
                    <View style={tw`bg-gray-50 rounded-xl p-3 mb-4`}>
                        <View style={tw`flex-row justify-between mb-2`}>
                            <Text style={tw`text-xs text-gray-500 font-medium`}>{t('incomeUtilization') || 'Income Utilization'}</Text>
                            <Text style={tw`text-xs font-bold ${incomeUtilization > 100 ? 'text-red-500' : incomeUtilization > 80 ? 'text-amber-500' : 'text-green-600'}`}>
                                {incomeUtilization.toFixed(0)}%
                            </Text>
                        </View>
                        <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden`}>
                            <View
                                style={[
                                    tw`h-full rounded-full`,
                                    {
                                        width: `${Math.min(incomeUtilization, 100)}%`,
                                        backgroundColor: incomeUtilization > 100 ? theme.colors.danger : incomeUtilization > 80 ? theme.colors.warning : theme.colors.success
                                    }
                                ]}
                            />
                        </View>
                    </View>

                    {/* Budget Progress */}
                    <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden mb-2`}>
                        <View
                            style={[
                                tw`h-full rounded-full`,
                                { width: `${Math.min(overallProgress, 100)}%`, backgroundColor: getStatusColor(totalSpent, totalBudget) }
                            ]}
                        />
                    </View>

                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-xs font-bold text-gray-500`}>{t('spent') || 'Spent'}: ৳{totalSpent.toLocaleString()}</Text>
                        <Text style={tw`text-xs font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {t('remaining') || 'Remaining'}: ৳{totalRemaining.toLocaleString()}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* --- BODY CONTENT --- */}
            <FlatList
                data={budgets}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-24 pt-4 px-6`}
                style={tw`-mt-16`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                }
                ListHeaderComponent={() => (
                    <TouchableOpacity
                        onPress={() => openModal()}
                        activeOpacity={0.8}
                        style={tw`flex-row items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed border-teal-300 mb-5`}
                    >
                        <View style={tw`w-10 h-10 bg-teal-100 rounded-full items-center justify-center mr-3`}>
                            <Plus size={20} color={theme.colors.primary} />
                        </View>
                        <Text style={tw`text-teal-600 font-bold`}>{t('createBudget') || 'Create Budget'}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <EmptyStateMascot
                        variant="budget"
                        title={t('noBudgets') || 'No budgets yet'}
                        subtitle={t('noBudgetsHint') || 'Create a budget to track your spending'}
                    />
                )}
                renderItem={({ item }) => {
                    const percent = item.limit_amount > 0 ? Math.min((item.spent / item.limit_amount) * 100, 100) : 0;
                    const statusColor = getStatusColor(item.spent, item.limit_amount);
                    const isExceeded = item.spent > item.limit_amount;
                    const remaining = item.limit_amount - item.spent;
                    const IconComp = getIconComponent(item.icon);

                    return (
                        <View style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-gray-200`}>
                            {/* Top Row */}
                            <View style={tw`flex-row justify-between items-center mb-3`}>
                                <View style={tw`flex-row items-center flex-1`}>
                                    <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mr-3`, { backgroundColor: (item.color || theme.colors.mutedText) + '20' }]}>
                                        <IconComp size={20} color={item.color || theme.colors.mutedText} />
                                    </View>
                                    <View style={tw`flex-1`}>
                                        <Text style={tw`text-sm font-bold text-gray-800`}>{item.category}</Text>
                                        <Text style={tw`text-[10px] text-gray-400 font-medium`}>{t('monthlyLimit') || 'Monthly Limit'}</Text>
                                    </View>
                                </View>
                                <View style={tw`flex-row`}>
                                    <TouchableOpacity onPress={() => openModal(item)} style={tw`p-2 bg-gray-50 rounded-lg mr-1`}>
                                        <Edit3 size={14} color={theme.colors.gray400} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(item)} style={tw`p-2 bg-red-50 rounded-lg`}>
                                        <Trash2 size={14} color={theme.colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Amounts */}
                            <View style={tw`flex-row justify-between items-end mb-2`}>
                                <Text style={tw`text-xl font-bold text-gray-800`}>৳{(item.spent || 0).toLocaleString()}</Text>
                                <Text style={tw`text-xs font-bold text-gray-400`}>/ ৳{(item.limit_amount || 0).toLocaleString()}</Text>
                            </View>

                            {/* Progress Bar */}
                            <View style={tw`h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2`}>
                                <View style={[tw`h-full rounded-full`, { width: `${percent}%`, backgroundColor: statusColor }]} />
                            </View>

                            {/* Status Footer */}
                            <View style={tw`flex-row justify-between items-center`}>
                                <Text style={[tw`text-[10px] font-bold`, { color: statusColor }]}>
                                    {percent.toFixed(0)}% {t('used') || 'Used'}
                                </Text>
                                {isExceeded ? (
                                    <View style={tw`flex-row items-center bg-red-50 px-2 py-1 rounded-lg`}>
                                        <AlertTriangle size={10} color={theme.colors.danger} style={tw`mr-1`} />
                                        <Text style={tw`text-[10px] font-bold text-red-500`}>
                                            {t('exceeded') || 'Exceeded'} ৳{Math.abs(remaining).toLocaleString()}
                                        </Text>
                                    </View>
                                ) : (
                                    <Text style={tw`text-[10px] font-bold text-gray-400`}>
                                        ৳{remaining.toLocaleString()} {t('left') || 'left'}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                }}
            />

            {/* --- ADD/EDIT BUDGET MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-white rounded-t-[32px] max-h-[85%]`}>
                        {/* Header */}
                        <View style={tw`flex-row justify-between items-center p-6 border-b border-gray-100`}>
                            <Text style={tw`text-xl font-bold text-gray-900`}>
                                {isEditing ? (t('editBudget') || 'Edit Budget') : (t('createBudget') || 'Create Budget')}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`bg-gray-100 p-2 rounded-full`}>
                                <X size={20} color={theme.colors.mutedText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={tw`p-6`}>
                            {/* Category Selection */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-3 ml-1`}>{t('selectCategory') || 'Select Category'}</Text>

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
                                                style={tw`w-[23%] items-center mb-4 mr-[2%] ${isEditing ? 'opacity-50' : ''}`}
                                            >
                                                <View
                                                    style={[
                                                        tw`w-12 h-12 rounded-2xl items-center justify-center mb-1`,
                                                        { backgroundColor: isSelected ? theme.colors.primary : (cat.color || theme.colors.mutedText) + '20' }
                                                    ]}
                                                >
                                                    <IconComp size={20} color={isSelected ? 'white' : (cat.color || theme.colors.mutedText)} />
                                                    {isSelected && (
                                                        <View style={tw`absolute -top-1 -right-1 bg-white rounded-full p-0.5`}>
                                                            <Check size={10} color={theme.colors.primary} />
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={tw`text-[10px] font-bold text-center ${isSelected ? 'text-teal-600' : 'text-gray-500'}`} numberOfLines={1}>
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ) : !isEditing ? (
                                <View style={tw`bg-amber-50 p-4 rounded-xl mb-6`}>
                                    <Text style={tw`text-amber-700 text-sm text-center`}>{t('allCategoriesBudgeted') || 'All categories have budgets'}</Text>
                                    <TouchableOpacity onPress={() => { setModalVisible(false); router.push('/screens/categories'); }}>
                                        <Text style={tw`text-teal-600 font-bold text-center mt-2`}>{t('addMoreCategories') || 'Add more categories'}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            {/* Limit Amount */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('setLimit') || 'Set Limit'}</Text>
                            <View style={tw`flex-row items-center bg-gray-50 rounded-2xl px-4 py-3.5 mb-4 border border-gray-200`}>
                                <Text style={tw`text-xl font-bold text-gray-400 mr-2`}>৳</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.gray400}
                                    keyboardType="numeric"
                                    style={tw`flex-1 text-xl font-bold text-gray-900`}
                                    value={limitAmount}
                                    onChangeText={(text) => setLimitAmount(text.replace(/[^0-9]/g, ''))}
                                />
                            </View>

                            {/* Suggestion based on income */}
                            {balance.totalIncome > 0 && (
                                <View style={tw`bg-blue-50 rounded-xl p-4 mb-6`}>
                                    <Text style={tw`text-blue-700 text-xs font-medium mb-2`}>{t('suggestedLimits') || 'Suggested limits:'}</Text>
                                    <View style={tw`flex-row flex-wrap`}>
                                        {[10, 20, 30].map((percent) => (
                                            <TouchableOpacity
                                                key={percent}
                                                onPress={() => setLimitAmount(Math.round(balance.totalIncome * percent / 100).toString())}
                                                style={tw`bg-white px-3 py-2 rounded-lg mr-2 mb-2 border border-blue-200`}
                                            >
                                                <Text style={tw`text-blue-700 font-bold text-xs`}>
                                                    {percent}% = ৳{Math.round(balance.totalIncome * percent / 100).toLocaleString()}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving || (!isEditing && getAvailableCategories().length === 0)}
                                activeOpacity={0.9}
                                style={tw`bg-teal-600 rounded-2xl py-4 items-center shadow-lg ${isSaving || (!isEditing && getAvailableCategories().length === 0) ? 'opacity-70' : ''}`}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={tw`text-white font-bold text-lg`}>
                                        {isEditing ? (t('updateBudget') || 'Update Budget') : (t('saveBudget') || 'Save Budget')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default BudgetScreen;
