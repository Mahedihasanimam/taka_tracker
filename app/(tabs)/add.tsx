import { theme } from "@/constants/theme";
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import { addTransaction, getCategories } from '@/services/db';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Banknote,
    Book,
    Briefcase,
    Calendar,
    Car,
    CheckCircle,
    Coffee,
    Dumbbell,
    FileText,
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
    Utensils,
    Wifi,
    Zap
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
    Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
    Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal, Banknote
};

const defaultExpenseCategories = [
    { id: 'd1', name: 'Food & Dining', icon: 'Utensils', color: theme.colors.categoryFood },
    { id: 'd2', name: 'Transport', icon: 'Car', color: theme.colors.categoryPurple },
    { id: 'd3', name: 'Rent', icon: 'Home', color: theme.colors.categoryRent },
    { id: 'd4', name: 'Shopping', icon: 'Shirt', color: theme.colors.categoryShopping },
    { id: 'd5', name: 'Bills', icon: 'Zap', color: theme.colors.categoryBills },
    { id: 'd6', name: 'Internet', icon: 'Wifi', color: theme.colors.categoryBlue },
    { id: 'd7', name: 'Mobile', icon: 'Smartphone', color: theme.colors.indigo },
    { id: 'd8', name: 'Healthcare', icon: 'Pill', color: theme.colors.danger },
    { id: 'd9', name: 'Education', icon: 'GraduationCap', color: theme.colors.primary },
    { id: 'd10', name: 'Entertainment', icon: 'Gamepad2', color: '#ec4899' },
    { id: 'd11', name: 'Fitness', icon: 'Dumbbell', color: theme.colors.success },
    { id: 'd12', name: 'Travel', icon: 'Plane', color: theme.colors.categoryBlue },
    { id: 'd13', name: 'Others', icon: 'MoreHorizontal', color: theme.colors.mutedText },
];

const defaultIncomeCategories = [
    { id: 'i1', name: 'Salary', icon: 'Briefcase', color: theme.colors.success },
    { id: 'i2', name: 'Freelance', icon: 'Smartphone', color: theme.colors.primary },
    { id: 'i3', name: 'Business', icon: 'Briefcase', color: theme.colors.successDark },
    { id: 'i4', name: 'Bonus', icon: 'Gift', color: theme.colors.lightSuccess },
    { id: 'i5', name: 'Investment', icon: 'Banknote', color: theme.colors.secondary },
    { id: 'i6', name: 'Rental Income', icon: 'Home', color: theme.colors.categoryBlue },
    { id: 'i7', name: 'Others', icon: 'MoreHorizontal', color: theme.colors.mutedText },
];

interface Category {
    id: number | string;
    name: string;
    icon: string;
    color: string;
    type?: string;
}

const AddTransactionScreen = () => {
    const { t } = useLanguage();
    const { currencySymbol } = useCurrency();
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams<{ type?: string }>();
    const scrollRef = useRef<ScrollView>(null);
    const amountInputRef = useRef<TextInput>(null);

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    const [expenseCategories, setExpenseCategories] = useState<Category[]>(defaultExpenseCategories);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>(defaultIncomeCategories);

    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        try {
            const [expenseCats, incomeCats] = await Promise.all([
                getCategories('expense', user?.id || 0),
                getCategories('income', user?.id || 0)
            ]);

            if (expenseCats && expenseCats.length > 0) setExpenseCategories(expenseCats as Category[]);
            if (incomeCats && incomeCats.length > 0) setIncomeCategories(incomeCats as Category[]);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            setAmount('');
            setSelectedCategory(null);
            setNote('');
            setDate(new Date());

            if (params.type === 'income' || params.type === 'expense') {
                setType(params.type);
            } else {
                setType('expense');
            }
        }, [fetchCategories, params.type])
    );

    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
    const visibleCategories = useMemo(() => currentCategories.slice(0, 12), [currentCategories]);

    const accentColor = type === 'expense' ? theme.colors.primary : theme.colors.success;
    const accentSoft = type === 'expense' ? '#CCFBF1' : '#DCFCE7';
    const gradientColors = type === 'expense'
        ? [theme.colors.primaryDeep, theme.colors.primary]
        : [theme.colors.successDark, theme.colors.success];

    const getIconComponent = (iconName: string) => iconMap[iconName] || MoreHorizontal;

    const handleTypeChange = (newType: 'expense' | 'income') => {
        setType(newType);
        setSelectedCategory(null);
    };

    const focusAmountInput = useCallback(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
        requestAnimationFrame(() => {
            setTimeout(() => amountInputRef.current?.focus(), 180);
        });
    }, []);

    const sanitizeAmount = (value: string) => {
        const cleaned = value.replace(/[^0-9.]/g, '');
        const [whole, ...decimalParts] = cleaned.split('.');
        if (decimalParts.length === 0) return whole;
        return `${whole}.${decimalParts.join('').slice(0, 2)}`;
    };

    const applyQuickAmount = (quickValue: string) => {
        setAmount(quickValue);
        focusAmountInput();
    };

    const quickAmounts = type === 'expense' ? ['100', '500', '1000'] : ['1000', '5000', '10000'];

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert(t('Opps'), t('enterValidAmount'));
            return;
        }
        if (!selectedCategory) {
            Alert.alert(t('Opps'), t('selectCategory'));
            return;
        }

        router.replace('/(tabs)/transactions');
        addTransaction(
            user?.id || 0,
            parseFloat(amount),
            type,
            selectedCategory.name,
            date.toISOString(),
            note.trim(),
            selectedCategory.icon,
            selectedCategory.color
        ).catch((error) => {
            console.error('Failed to save transaction:', error);
        });
    };

    const formatDate = (d: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return t('today');
        if (d.toDateString() === yesterday.toDateString()) return t('yesterday');

        return d.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor={accentColor} barStyle="light-content" />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={tw`flex-1`}>
                <ScrollView
                    ref={scrollRef}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tw`pb-8`}
                >
                    <LinearGradient
                        colors={gradientColors as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={tw`px-5 pt-10 pb-7 h-[150px] rounded-b-[34px]`}
                    >
                        <View style={tw`flex-row items-center justify-between`}>
                            <TouchableOpacity onPress={() => router.back()} style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center`}>
                                <ArrowLeft size={20} color={theme.colors.white} />
                            </TouchableOpacity>
                            <Text style={tw`text-white text-lg font-extrabold`}>{t('addTransaction')}</Text>
                            <View style={tw`w-10`} />
                        </View>

                    </LinearGradient>

                    <View style={tw`px-5 -mt-10`}>
                        <View style={tw`bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/70`}>
                            <View style={tw`bg-slate-100 p-1 rounded-2xl flex-row mb-4`}>
                                <TouchableOpacity
                                    onPress={() => handleTypeChange('expense')}
                                    style={tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${type === 'expense' ? 'bg-white' : ''}`}
                                >
                                    <ShoppingBag size={16} color={type === 'expense' ? theme.colors.primary : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'expense' ? 'text-teal-700' : 'text-slate-500'}`}>{t('expense')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleTypeChange('income')}
                                    style={tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${type === 'income' ? 'bg-white' : ''}`}
                                >
                                    <Banknote size={16} color={type === 'income' ? theme.colors.success : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'income' ? 'text-green-700' : 'text-slate-500'}`}>{t('income')}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={tw`mb-4`}>
                                <View style={tw`flex-row justify-between items-center mb-2`}>
                                    <Text style={tw`text-slate-700 text-sm font-bold`}>{t('category')}</Text>
                                    <TouchableOpacity onPress={() => router.push('/screens/categories')} style={tw`flex-row items-center`}>
                                        <Plus size={14} color={accentColor} />
                                        <Text style={[tw`text-xs font-bold ml-1`, { color: accentColor }]}>{t('manage')}</Text>
                                    </TouchableOpacity>
                                </View>

                                {isLoadingCategories ? (
                                    <View style={tw`h-20 items-center justify-center`}>
                                        <ActivityIndicator size="small" color={accentColor} />
                                    </View>
                                ) : (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={tw`pr-2`}
                                    >
                                        {visibleCategories.map((cat) => {
                                            const IconComp = getIconComponent(cat.icon);
                                            const isSelected = selectedCategory?.id === cat.id;
                                            return (
                                                <TouchableOpacity
                                                    key={cat.id}
                                                    onPress={() => {
                                                        setSelectedCategory(cat);
                                                        focusAmountInput();
                                                    }}
                                                    style={tw`mr-3 items-center`}
                                                >
                                                    <View
                                                        style={[
                                                            tw`w-12 h-12 rounded-2xl items-center justify-center border`,
                                                            {
                                                                backgroundColor: isSelected ? cat.color : `${cat.color}20`,
                                                                borderColor: isSelected ? cat.color : 'transparent'
                                                            }
                                                        ]}
                                                    >
                                                        <IconComp size={19} color={isSelected ? theme.colors.white : cat.color} />
                                                    </View>
                                                    <Text
                                                        numberOfLines={1}
                                                        style={[
                                                            tw`text-[10px] mt-1 font-semibold max-w-[66px]`,
                                                            { color: isSelected ? accentColor : theme.colors.gray500 }
                                                        ]}
                                                    >
                                                        {cat.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                )}
                            </View>

                            <View style={tw`mb-4`}>
                                <Text style={tw`text-slate-700 text-sm font-bold mb-2`}>{t('date')}</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={tw`flex-row items-center border border-slate-200 rounded-2xl px-3.5 py-3 bg-slate-50`}
                                >
                                    <Calendar size={18} color={theme.colors.gray500} />
                                    <Text style={tw`text-slate-700 text-sm font-semibold ml-2 flex-1`}>{formatDate(date)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={tw`mb-4`}>
                                <Text style={tw`text-slate-700 text-sm font-bold mb-2`}>{t('addNote')}</Text>
                                <View style={tw`flex-row items-start border border-slate-200 rounded-2xl px-3.5 py-3 bg-slate-50`}>
                                    <FileText size={18} color={theme.colors.gray500} style={tw`mt-0.5`} />
                                    <TextInput
                                        placeholder={t('addNote')}
                                        placeholderTextColor={theme.colors.gray400}
                                        value={note}
                                        onChangeText={setNote}
                                        style={tw`flex-1 text-slate-800 font-medium text-sm ml-2`}
                                        maxLength={80}
                                    />
                                </View>
                            </View>

                            <View style={tw`mb-5`}>
                                <Text style={tw`text-slate-700 text-sm font-bold mb-2`}>Quick Amount</Text>
                                <View style={tw`flex-row`}>
                                    {quickAmounts.map((quickValue) => {
                                        const isActive = amount === quickValue;
                                        return (
                                            <TouchableOpacity
                                                key={quickValue}
                                                onPress={() => applyQuickAmount(quickValue)}
                                                style={[
                                                    tw`px-3 py-2 rounded-xl mr-2 border`,
                                                    {
                                                        borderColor: isActive ? accentColor : theme.colors.border,
                                                        backgroundColor: isActive ? accentSoft : theme.colors.white
                                                    }
                                                ]}
                                            >
                                                <Text style={[tw`text-sm font-semibold`, { color: isActive ? accentColor : theme.colors.gray600 }]}>
                                                    {currencySymbol}{quickValue}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={tw`mb-4`}>
                                <Text style={tw`text-slate-700 text-sm font-bold mb-2`}>{t('enterAmount')}</Text>
                                <View
                                    style={[
                                        tw`flex-row items-center border-2 rounded-2xl px-4 py-2.5 bg-slate-50`,
                                        { borderColor: amount ? accentColor : theme.colors.border }
                                    ]}
                                >
                                    <Text style={tw`text-2xl font-bold text-slate-500 mr-2`}>{currencySymbol}</Text>
                                    <TextInput
                                        ref={amountInputRef}
                                        value={amount}
                                        onChangeText={(text) => setAmount(sanitizeAmount(text))}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.colors.gray400}
                                        keyboardType="decimal-pad"
                                        returnKeyType="done"
                                        style={tw`flex-1 text-slate-900 text-3xl font-extrabold`}
                                        maxLength={12}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                activeOpacity={0.85}
                                style={[tw`rounded-2xl mb-12 py-4 items-center`, { backgroundColor: accentColor }]}
                                onPress={handleSave}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <CheckCircle size={20} color={theme.colors.white} style={tw`mr-2`} />
                                    <Text style={tw`text-white font-bold text-base tracking-wide`}>{t('saveTransaction')}</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) setDate(selectedDate);
                    }}
                />
            )}
        </View>
    );
};

export default AddTransactionScreen;
