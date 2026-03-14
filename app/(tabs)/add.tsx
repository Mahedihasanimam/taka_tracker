import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { theme } from "@/constants/theme";
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

// Icon mapping
const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
    Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
    Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal, Banknote
};

// Default categories (fallback)
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
    const amountInputRef = useRef<TextInput>(null);

    // State
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    // Categories
    const [expenseCategories, setExpenseCategories] = useState<Category[]>(defaultExpenseCategories);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>(defaultIncomeCategories);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        setIsLoadingCategories(true);
        try {
            const [expenseCats, incomeCats] = await Promise.all([
                getCategories('expense', user?.id || 0),
                getCategories('income', user?.id || 0)
            ]);

            if (expenseCats && expenseCats.length > 0) {
                setExpenseCategories(expenseCats as Category[]);
            }
            if (incomeCats && incomeCats.length > 0) {
                setIncomeCategories(incomeCats as Category[]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
            // Reset form on focus
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

    // Get current categories based on type
    const currentCategories = type === 'expense' ? expenseCategories : incomeCategories;
    const quickCategories = useMemo(() => currentCategories.slice(0, 6), [currentCategories]);

    // Get icon component
    const getIconComponent = (iconName: string) => iconMap[iconName] || MoreHorizontal;

    // Handle type change
    const handleTypeChange = (newType: 'expense' | 'income') => {
        setType(newType);
        setSelectedCategory(null);
    };

    // Handle save
    const handleSave = async () => {
        // Validation
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert(t('Opps'), t('enterValidAmount'));
            return;
        }
        if (!selectedCategory) {
            Alert.alert(t('Opps'), t('selectCategory'));
            return;
        }

        setIsSaving(true);
        try {
            await addTransaction(
                user?.id || 0,
                parseFloat(amount),
                type,
                selectedCategory.name,
                date.toISOString(),
                note.trim(),
                selectedCategory.icon,
                selectedCategory.color
            );
            router.replace('/(tabs)/transactions');
        } catch (error) {
            console.error('Failed to save transaction:', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsSaving(false);
        }
    };

    // Format date for display
    const formatDate = (d: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) {
            return t('today');
        } else if (d.toDateString() === yesterday.toDateString()) {
            return t('yesterday');
        }
        return d.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor={type === 'expense' ? theme.colors.primary : theme.colors.success} barStyle="light-content" />

            {/* Header */}
            <LinearGradient
                colors={type === 'expense' ? [theme.colors.primary, theme.colors.primaryDark] : [theme.colors.success, theme.colors.successDark]}
                style={tw`h-40 px-6 pt-12 rounded-b-[36px] shadow-lg z-10`}
            >
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2.5 rounded-full`}>
                        <ArrowLeft size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={tw`text-white text-lg font-bold`}>{t('addTransaction')}</Text>
                    <View style={tw`w-10`} />
                </View>
            </LinearGradient>

            {/* Form Content */}
            <View style={tw`flex-1 `}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1`}>
                    <View style={tw`flex-1 px-5 pb-5`}>
                        <View style={tw`bg-white rounded-3xl p-4 shadow-xl shadow-gray-200/80 flex-1`}>

                            {/* Type Toggle */}
                            <View style={tw`bg-gray-100 p-1.5 rounded-2xl flex-row mb-4`}>
                                <TouchableOpacity
                                    onPress={() => handleTypeChange('expense')}
                                    style={tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${type === 'expense' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <ShoppingBag size={16} color={type === 'expense' ? theme.colors.primary : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'expense' ? 'text-teal-600' : 'text-gray-500'}`}>{t('expense')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleTypeChange('income')}
                                    style={tw`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${type === 'income' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Banknote size={16} color={type === 'income' ? theme.colors.success : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'income' ? 'text-green-600' : 'text-gray-500'}`}>{t('income')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Category Selection (quick grid, no scroll needed) */}
                            <View style={tw`flex-row justify-between items-center mb-3`}>
                                <Text style={tw`text-gray-600 text-sm font-bold ml-1`}>{t('category')}</Text>
                                <TouchableOpacity onPress={() => router.push('/screens/categories')} style={tw`flex-row items-center`}>
                                    <Plus size={14} color={theme.colors.primary} />
                                    <Text style={tw`text-teal-600 text-xs font-bold ml-1`}>{t('manage')}</Text>
                                </TouchableOpacity>
                            </View>

                            {isLoadingCategories ? (
                                <View style={tw`h-16 items-center justify-center`}>
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                </View>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={tw`pr-3 mb-2`}
                                >
                                    {quickCategories.map((cat) => {
                                        const IconComp = getIconComponent(cat.icon);
                                        const isSelected = selectedCategory?.name === cat.name;
                                        return (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => {
                                                    setSelectedCategory(cat);
                                                    setTimeout(() => amountInputRef.current?.focus(), 50);
                                                }}
                                                style={tw`mr-2.5`}
                                            >
                                                <View
                                                    style={[
                                                        tw`w-11 h-11 rounded-xl items-center justify-center`,
                                                        {
                                                            backgroundColor: isSelected
                                                                ? (type === 'expense' ? theme.colors.primary : theme.colors.success)
                                                                : cat.color + '20'
                                                        }
                                                    ]}
                                                >
                                                    <IconComp size={18} color={isSelected ? 'white' : cat.color} />
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}

                            <Text style={tw`text-xs font-semibold text-gray-600 mb-2 ml-1`}>
                                {selectedCategory ? `Selected: ${selectedCategory.name}` : 'Select a category'}
                            </Text>

                            {/* Date + Note compact row */}
                            <View style={tw`flex-row mb-3`}>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={tw`flex-1 flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-gray-50 mr-2`}
                                >
                                    <Calendar size={18} color={theme.colors.gray400} />
                                    <Text style={tw`text-gray-700 text-xs font-semibold ml-2 flex-1`} numberOfLines={1}>{formatDate(date)}</Text>
                                </TouchableOpacity>
                                <View style={tw`flex-1 flex-row items-center border border-gray-200 rounded-2xl px-3 py-3 bg-gray-50 ml-2`}>
                                    <FileText size={18} color={theme.colors.gray400} />
                                    <TextInput
                                        placeholder={t('addNote')}
                                        placeholderTextColor={theme.colors.gray400}
                                        value={note}
                                        onChangeText={setNote}
                                        style={tw`flex-1 text-gray-800 font-medium text-xs ml-2`}
                                        maxLength={40}
                                    />
                                </View>
                            </View>

                            <View>
                                {/* Amount Input */}
                                <View style={tw`mb-3`}>
                                    <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('enterAmount')}</Text>
                                    <View style={tw`flex-row items-center border-2 border-gray-200 rounded-2xl px-4 py-2.5 bg-gray-50`}>
                                        <Text style={tw`text-2xl font-bold text-gray-500 mr-2`}>{currencySymbol}</Text>
                                        <TextInput
                                            ref={amountInputRef}
                                            value={amount}
                                            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                                            placeholder="0"
                                            placeholderTextColor={theme.colors.gray400}
                                            keyboardType="decimal-pad"
                                            returnKeyType="done"
                                            style={tw`flex-1 text-gray-900 text-3xl font-extrabold`}
                                            maxLength={10}
                                        />
                                    </View>
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    disabled={isSaving}
                                    style={tw`rounded-2xl py-3.5 items-center shadow-lg ${isSaving ? 'opacity-70' : ''} ${type === 'expense' ? 'bg-teal-600' : 'bg-green-600'}`}
                                    onPress={handleSave}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color={theme.colors.white} />
                                    ) : (
                                        <View style={tw`flex-row items-center`}>
                                            <CheckCircle size={20} color={theme.colors.white} style={tw`mr-2`} />
                                            <Text style={tw`text-white font-bold text-lg tracking-wide`}>{t('saveTransaction')}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDate(selectedDate);
                        }
                    }}
                />
            )}
        </View>
    );
};

export default AddTransactionScreen;
