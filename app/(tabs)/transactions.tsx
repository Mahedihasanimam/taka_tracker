import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { deleteTransaction, getCategories, getTransactions } from '@/services/db';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Book,
    Briefcase,
    Calendar,
    Car,
    ChevronDown,
    Coffee,
    Download,
    Dumbbell,
    Filter,
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
    Search,
    Shirt,
    ShoppingBag,
    Smartphone,
    Trash2,
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
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

// Complete icon mapping
const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
    Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
    Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal
};

// Category interface
interface Category {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
}

const TransactionsScreen = () => {
    const { t, lang } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();

    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Date filter states
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [dateFilterLabel, setDateFilterLabel] = useState<string>('');
    const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
    const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

    // Selected transaction for actions
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [showActionModal, setShowActionModal] = useState(false);

    // Export states
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

    // Fetch transactions and categories
    const fetchData = useCallback(async () => {
        try {
            const [txnData, catData] = await Promise.all([
                getTransactions(user?.id),
                getCategories(undefined, user?.id)
            ]);
            setTransactions(txnData as any[]);
            setCategories(catData as Category[]);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    // Refresh on screen focus
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Get category details by name
    const getCategoryDetails = (categoryName: string) => {
        const category = categories.find(c => c.name === categoryName);
        return category || null;
    };

    // Get icon component with fallback to category data
    const getIcon = (transaction: any) => {
        // First try to get icon from transaction
        if (transaction.icon && iconMap[transaction.icon]) {
            return iconMap[transaction.icon];
        }
        // Then try to get from category
        const category = getCategoryDetails(transaction.category);
        if (category?.icon && iconMap[category.icon]) {
            return iconMap[category.icon];
        }
        return Briefcase;
    };

    // Get color with fallback to category data
    const getColor = (transaction: any) => {
        if (transaction.color) return transaction.color;
        const category = getCategoryDetails(transaction.category);
        return category?.color || '#6b7280';
    };

    // Apply date filter presets
    const applyDatePreset = (preset: string) => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = new Date();
        end.setHours(23, 59, 59, 999);

        switch (preset) {
            case 'today':
                start = new Date();
                start.setHours(0, 0, 0, 0);
                setDateFilterLabel(t('today'));
                break;
            case 'yesterday':
                start = new Date(now.getTime() - 86400000);
                start.setHours(0, 0, 0, 0);
                end = new Date(now.getTime() - 86400000);
                end.setHours(23, 59, 59, 999);
                setDateFilterLabel(t('yesterday'));
                break;
            case 'week':
                start = new Date();
                start.setDate(start.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                setDateFilterLabel(t('thisWeek'));
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                setDateFilterLabel(t('thisMonth'));
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                setDateFilterLabel(t('lastMonth'));
                break;
            case 'year':
                start = new Date(now.getFullYear(), 0, 1);
                setDateFilterLabel(t('thisYear'));
                break;
            case 'clear':
                start = null;
                end = null;
                setDateFilterLabel('');
                setTempStartDate(null);
                setTempEndDate(null);
                break;
        }
        setStartDate(start);
        setEndDate(end);
        setShowDateFilter(false);
    };

    // Apply custom date range
    const applyCustomDateRange = () => {
        if (tempStartDate && tempEndDate) {
            const start = new Date(tempStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(tempEndDate);
            end.setHours(23, 59, 59, 999);

            setStartDate(start);
            setEndDate(end);

            const formatDate = (date: Date) => date.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                day: '2-digit',
                month: 'short'
            });
            setDateFilterLabel(`${formatDate(start)} - ${formatDate(end)}`);
        }
        setShowDateFilter(false);
    };

    // Group transactions by date
    const groupTransactionsByDate = () => {
        let filtered = transactions.filter(txn => {
            const matchesFilter = filter === 'all' ||
                (filter === 'income' && txn.type === 'income') ||
                (filter === 'expense' && txn.type === 'expense');

            const matchesSearch = !searchQuery ||
                txn.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                txn.note?.toLowerCase().includes(searchQuery.toLowerCase());

            const txnDate = new Date(txn.date);
            const matchesDateRange = (!startDate || txnDate >= startDate) &&
                (!endDate || txnDate <= endDate);

            return matchesFilter && matchesSearch && matchesDateRange;
        });

        const groups: Record<string, any[]> = {};
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        filtered.forEach(txn => {
            const date = new Date(txn.date).toDateString();
            let label = date;
            if (date === today) label = t('today') || 'Today';
            else if (date === yesterday) label = t('yesterday') || 'Yesterday';
            else label = new Date(txn.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            if (!groups[label]) groups[label] = [];
            groups[label].push(txn);
        });

        return Object.entries(groups).map(([title, data]) => ({ title, data }));
    };

    const sections = groupTransactionsByDate();

    // Calculate totals based on filtered data
    const calculateTotals = () => {
        let filtered = transactions;
        if (startDate || endDate) {
            filtered = transactions.filter(txn => {
                const txnDate = new Date(txn.date);
                return (!startDate || txnDate >= startDate) && (!endDate || txnDate <= endDate);
            });
        }
        return filtered.reduce((acc, txn) => {
            if (txn.type === 'income') acc.income += txn.amount;
            else acc.expense += txn.amount;
            return acc;
        }, { income: 0, expense: 0 });
    };

    const totals = calculateTotals();

    // Handle delete
    const handleDelete = (transaction: any) => {
        Alert.alert(
            t('deleteTransaction'),
            t('deleteTransactionConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(transaction.id);
                            fetchData();
                            setShowActionModal(false);
                        } catch (error) {
                            Alert.alert(t('error'), t('somethingWrong'));
                        }
                    }
                }
            ]
        );
    };

    // Handle long press
    const handleLongPress = (transaction: any) => {
        setSelectedTransaction(transaction);
        setShowActionModal(true);
    };

    if (isLoading) {
        return (
            <View style={tw`flex-1 bg-slate-50 justify-center items-center`}>
                <ActivityIndicator size="large" color="#e2136e" />
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`px-6 pt-12 pb-20 rounded-b-[36px] shadow-lg`}
            >
                <View style={tw`flex-row justify-between items-center mb-5`}>
                    <Text style={tw`text-white text-2xl font-extrabold tracking-wide`}>
                        {t('transactions')}
                    </Text>
                    <TouchableOpacity
                        style={tw`bg-white/20 p-2.5 rounded-full`}
                        onPress={() => setShowExportModal(true)}
                    >
                        <Download size={20} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Summary Cards */}
                <View style={tw`flex-row justify-between`}>
                    <View style={tw`flex-1 bg-white/15 rounded-2xl p-4 mr-2`}>
                        <View style={tw`flex-row items-center mb-1`}>
                            <ArrowDownLeft size={16} color="#86efac" />
                            <Text style={tw`text-white/70 text-xs ml-1 font-medium`}>{t('totalIncome')}</Text>
                        </View>
                        <Text style={tw`text-white text-lg font-bold`}>৳{totals.income.toLocaleString()}</Text>
                    </View>
                    <View style={tw`flex-1 bg-white/15 rounded-2xl p-4 ml-2`}>
                        <View style={tw`flex-row items-center mb-1`}>
                            <ArrowUpRight size={16} color="#fca5a5" />
                            <Text style={tw`text-white/70 text-xs ml-1 font-medium`}>{t('totalExpense')}</Text>
                        </View>
                        <Text style={tw`text-white text-lg font-bold`}>৳{totals.expense.toLocaleString()}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* --- SEARCH & FILTER BAR --- */}
            <View style={tw`px-5 -mt-7 z-10`}>
                <View style={tw`bg-white rounded-2xl shadow-xl shadow-gray-300/50 p-4`}>
                    {/* Search Input */}
                    <View style={tw`flex-row items-center bg-gray-50 rounded-xl px-4 py-2.5 mb-3`}>
                        <Search size={18} color="#9ca3af" />
                        <TextInput
                            placeholder={t('searchTransactions')}
                            placeholderTextColor="#9ca3af"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={tw`flex-1 ml-3 text-gray-800 font-medium text-sm`}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={18} color="#9ca3af" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Filter Row */}
                    <View style={tw`flex-row items-center justify-between`}>
                        {/* Type Filters */}
                        <View style={tw`flex-row`}>
                            {(['all', 'income', 'expense'] as const).map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    onPress={() => setFilter(item)}
                                    style={tw`px-4 py-2 rounded-full mr-2 ${filter === item
                                        ? item === 'income' ? 'bg-green-500' : item === 'expense' ? 'bg-red-500' : 'bg-[#e2136e]'
                                        : 'bg-gray-100'
                                        }`}
                                >
                                    <Text style={tw`text-xs font-bold ${filter === item ? 'text-white' : 'text-gray-500'}`}>
                                        {t(item)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Date Filter Button */}
                        <TouchableOpacity
                            onPress={() => setShowDateFilter(true)}
                            style={tw`flex-row items-center px-3 py-2 rounded-full ${dateFilterLabel ? 'bg-[#e2136e]' : 'bg-gray-100'}`}
                        >
                            <Calendar size={14} color={dateFilterLabel ? '#fff' : '#6b7280'} />
                            <Text style={tw`text-xs font-bold ml-1 ${dateFilterLabel ? 'text-white' : 'text-gray-500'}`}>
                                {dateFilterLabel || t('date')}
                            </Text>
                            <ChevronDown size={14} color={dateFilterLabel ? '#fff' : '#6b7280'} style={tw`ml-1`} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* --- TRANSACTION LIST --- */}
            {sections.length === 0 ? (
                <View style={tw`flex-1 justify-center items-center px-6`}>
                    <View style={tw`bg-gray-100 w-20 h-20 rounded-full items-center justify-center mb-4`}>
                        <Briefcase size={32} color="#9ca3af" />
                    </View>
                    <Text style={tw`text-gray-500 text-center font-medium`}>{t('noTransactions')}</Text>
                    <Text style={tw`text-gray-400 text-sm text-center mt-1`}>{t('noTransactionsHint')}</Text>
                </View>
            ) : (
                <FlatList
                    data={sections}
                    keyExtractor={(item) => item.title}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tw`pb-28 px-5 pt-4`}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e2136e']} />
                    }
                    renderItem={({ item: section }) => (
                        <View style={tw`mb-5`}>
                            <View style={tw`flex-row justify-between items-center mb-3 px-1`}>
                                <Text style={tw`text-gray-500 text-xs font-bold uppercase tracking-wider`}>
                                    {section.title}
                                </Text>
                                <Text style={tw`text-gray-400 text-xs font-medium`}>
                                    {section.data.length} {t('items')}
                                </Text>
                            </View>
                            <View style={tw`bg-white rounded-3xl overflow-hidden shadow-sm shadow-gray-200`}>
                                {section.data.map((transaction: any, index: number) => {
                                    const IconComponent = getIcon(transaction);
                                    const color = getColor(transaction);
                                    const bgColor = `${color}15`;
                                    return (
                                        <View key={transaction.id}>
                                            <TouchableOpacity
                                                activeOpacity={0.7}

                                                onLongPress={() => handleLongPress(transaction)}
                                                delayLongPress={500}
                                                style={tw`flex-row items-center p-4`}
                                            >
                                                <View
                                                    style={[
                                                        tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`,
                                                        { backgroundColor: bgColor }
                                                    ]}
                                                >
                                                    <IconComponent size={22} color={color} />
                                                </View>

                                                <View style={tw`flex-1`}>
                                                    <View style={tw`flex-row justify-between items-center mb-1`}>
                                                        <Text style={tw`text-sm font-bold text-gray-800`}>
                                                            {transaction.category}
                                                        </Text>
                                                        <Text style={tw`text-base font-bold ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                                                            {transaction.type === 'expense' ? '-' : '+'} ৳{transaction.amount.toLocaleString()}
                                                        </Text>
                                                    </View>
                                                    <View style={tw`flex-row justify-between items-center`}>
                                                        <Text style={tw`text-xs text-gray-400 font-medium flex-1 mr-2`} numberOfLines={1}>
                                                            {transaction.note || t('noNote')}
                                                        </Text>
                                                        <View style={tw`flex-row items-center`}>
                                                            {transaction.type === 'expense' ? (
                                                                <ArrowUpRight size={12} color="#ef4444" />
                                                            ) : (
                                                                <ArrowDownLeft size={12} color="#10b981" />
                                                            )}
                                                            <Text style={tw`text-[10px] text-gray-400 font-medium ml-1`}>
                                                                {new Date(transaction.date).toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                            {index < section.data.length - 1 && (
                                                <View style={tw`h-[1px] bg-gray-100 mx-4`} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                />
            )}

            {/* --- FAB BUTTON --- */}
            <TouchableOpacity
                onPress={() => router.push('/add')}
                activeOpacity={0.9}
                style={tw`absolute bottom-28 right-5 w-14 h-14 bg-[#e2136e] rounded-2xl items-center justify-center shadow-lg shadow-[#e2136e]/50`}
            >
                <Plus size={28} color="white" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* --- DATE FILTER MODAL --- */}
            <Modal
                visible={showDateFilter}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDateFilter(false)}
            >
                <TouchableOpacity
                    style={tw`flex-1 bg-black/50 justify-end`}
                    activeOpacity={1}
                    onPress={() => setShowDateFilter(false)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                        <View style={tw`bg-white rounded-t-3xl p-6`}>
                            <View style={tw`flex-row justify-between items-center mb-6`}>
                                <Text style={tw`text-xl font-bold text-gray-800`}>{t('filterByDate')}</Text>
                                <TouchableOpacity onPress={() => setShowDateFilter(false)}>
                                    <X size={24} color="#6b7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Quick Presets */}
                            <Text style={tw`text-gray-500 text-sm font-semibold mb-3`}>{t('quickSelect')}</Text>
                            <View style={tw`flex-row flex-wrap mb-6`}>
                                {[
                                    { key: 'today', label: t('today') },
                                    { key: 'yesterday', label: t('yesterday') },
                                    { key: 'week', label: t('thisWeek') },
                                    { key: 'month', label: t('thisMonth') },
                                    { key: 'lastMonth', label: t('lastMonth') },
                                    { key: 'year', label: t('thisYear') },
                                ].map((preset) => (
                                    <TouchableOpacity
                                        key={preset.key}
                                        onPress={() => applyDatePreset(preset.key)}
                                        style={tw`bg-gray-100 px-4 py-2.5 rounded-full mr-2 mb-2`}
                                    >
                                        <Text style={tw`text-gray-700 font-medium text-sm`}>{preset.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Custom Date Range */}
                            <Text style={tw`text-gray-500 text-sm font-semibold mb-3`}>{t('customRange')}</Text>
                            <View style={tw`flex-row mb-6`}>
                                <TouchableOpacity
                                    onPress={() => setShowStartPicker(true)}
                                    style={tw`flex-1 bg-gray-100 p-4 rounded-xl mr-2 ${tempStartDate ? 'border-2 border-[#e2136e]' : ''}`}
                                >
                                    <Text style={tw`text-gray-400 text-xs mb-1`}>{t('from')}</Text>
                                    <View style={tw`flex-row items-center`}>
                                        <Calendar size={16} color={tempStartDate ? '#e2136e' : '#6b7280'} />
                                        <Text style={tw`ml-2 font-medium ${tempStartDate ? 'text-[#e2136e]' : 'text-gray-800'}`}>
                                            {tempStartDate
                                                ? tempStartDate.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : t('selectDate')
                                            }
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setShowEndPicker(true)}
                                    style={tw`flex-1 bg-gray-100 p-4 rounded-xl ml-2 ${tempEndDate ? 'border-2 border-[#e2136e]' : ''}`}
                                >
                                    <Text style={tw`text-gray-400 text-xs mb-1`}>{t('to')}</Text>
                                    <View style={tw`flex-row items-center`}>
                                        <Calendar size={16} color={tempEndDate ? '#e2136e' : '#6b7280'} />
                                        <Text style={tw`ml-2 font-medium ${tempEndDate ? 'text-[#e2136e]' : 'text-gray-800'}`}>
                                            {tempEndDate
                                                ? tempEndDate.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : t('selectDate')
                                            }
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Actions */}
                            <View style={tw`flex-row`}>
                                <TouchableOpacity
                                    onPress={() => applyDatePreset('clear')}
                                    style={tw`flex-1 bg-gray-100 py-4 rounded-xl mr-2`}
                                >
                                    <Text style={tw`text-gray-700 text-center font-bold`}>{t('clearFilter')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={applyCustomDateRange}
                                    disabled={!tempStartDate || !tempEndDate}
                                    style={tw`flex-1 py-4 rounded-xl ml-2 ${tempStartDate && tempEndDate ? 'bg-[#e2136e]' : 'bg-gray-300'}`}
                                >
                                    <Text style={tw`text-white text-center font-bold`}>{t('applyFilter')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Date Pickers */}
            {showStartPicker && (
                <DateTimePicker
                    value={tempStartDate || new Date()}
                    mode="date"
                    display="default"
                    maximumDate={tempEndDate || new Date()}
                    onChange={(event, date) => {
                        setShowStartPicker(false);
                        if (date) setTempStartDate(date);
                    }}
                />
            )}
            {showEndPicker && (
                <DateTimePicker
                    value={tempEndDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={tempStartDate || undefined}
                    maximumDate={new Date()}
                    onChange={(event, date) => {
                        setShowEndPicker(false);
                        if (date) setTempEndDate(date);
                    }}
                />
            )}

            {/* --- ACTION MODAL --- */}
            <Modal
                visible={showActionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowActionModal(false)}
            >
                <TouchableOpacity
                    style={tw`flex-1 bg-black/50 justify-center items-center px-10`}
                    activeOpacity={1}
                    onPress={() => setShowActionModal(false)}
                >
                    <View style={tw`bg-white rounded-3xl w-full p-6`}>
                        <Text style={tw`text-lg font-bold text-gray-800 mb-4 text-center`}>
                            {selectedTransaction?.category}
                        </Text>

                        <TouchableOpacity
                            onPress={() => {
                                setShowActionModal(false);
                                router.push({
                                    pathname: '/transaction/edit',
                                    params: { id: selectedTransaction?.id }
                                });
                            }}
                            style={tw`flex-row items-center p-4 bg-gray-50 rounded-xl mb-3`}
                        >
                            <Filter size={20} color="#6b7280" />
                            <Text style={tw`ml-3 text-gray-700 font-medium`}>{t('editTransaction')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleDelete(selectedTransaction)}
                            style={tw`flex-row items-center p-4 bg-red-50 rounded-xl`}
                        >
                            <Trash2 size={20} color="#ef4444" />
                            <Text style={tw`ml-3 text-red-500 font-medium`}>{t('deleteTransaction')}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default TransactionsScreen;