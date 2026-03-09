import { useAuth } from '@/context/AuthContext';
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
import React, { useCallback, useState } from 'react';
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
    { id: 'd1', name: 'Food', icon: 'Utensils', color: theme.colors.categoryFood },
    { id: 'd2', name: 'Transport', icon: 'Car', color: theme.colors.categoryPurple },
    { id: 'd3', name: 'Rent', icon: 'Home', color: theme.colors.categoryRent },
    { id: 'd4', name: 'Shopping', icon: 'ShoppingBag', color: theme.colors.categoryShopping },
    { id: 'd5', name: 'Bills', icon: 'Zap', color: theme.colors.categoryBills },
    { id: 'd6', name: 'Others', icon: 'MoreHorizontal', color: theme.colors.mutedText },
];

const defaultIncomeCategories = [
    { id: 'i1', name: 'Salary', icon: 'Briefcase', color: theme.colors.success },
    { id: 'i2', name: 'Gift', icon: 'Gift', color: theme.colors.danger },
    { id: 'i3', name: 'Investment', icon: 'Banknote', color: theme.colors.secondary },
    { id: 'i4', name: 'Others', icon: 'MoreHorizontal', color: theme.colors.mutedText },
];

interface Category {
    id: number | string;
    name: string;
    icon: string;
    color: string;
    type?: string;
}

const AddTransactionScreen = () => {
    const { t, lang } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams<{ type?: string }>();

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
                getCategories('expense', user?.id),
                getCategories('income', user?.id)
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

            Alert.alert(
                t('success'),
                t('transactionAdded'),
                [
                    {
                        text: t('addAnother'),
                        onPress: () => {
                            setAmount('');
                            setSelectedCategory(null);
                            setNote('');
                            setDate(new Date());
                        }
                    },
                    {
                        text: t('done'),
                        onPress: () => router.push('/(tabs)/transactions')
                    }
                ]
            );
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
        return d.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor={type === 'expense' ? theme.colors.primary : theme.colors.success} barStyle="light-content" />

            {/* Header with Amount Input */}
            <LinearGradient
                colors={type === 'expense' ? [theme.colors.primary, theme.colors.primaryDark] : [theme.colors.success, theme.colors.successDark]}
                style={tw`h-64 px-6 pt-12 rounded-b-[36px] shadow-lg z-10`}
            >
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2.5 rounded-full`}>
                        <ArrowLeft size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={tw`text-white text-lg font-bold`}>{t('addTransaction')}</Text>
                    <View style={tw`w-10`} />
                </View>

                <View style={tw`items-center mt-2`}>
                    <Text style={tw`text-white/70 text-xs font-bold uppercase mb-2 tracking-widest`}>
                        {t('enterAmount')}
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-white text-4xl font-bold mr-1`}>৳</Text>
                        <TextInput
                            value={amount}
                            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                            placeholder="0"
                            placeholderTextColor={`${theme.colors.white}80`}
                            keyboardType="decimal-pad"
                            style={tw`text-white text-5xl font-extrabold min-w-20 text-center`}
                            maxLength={10}
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Form Content */}
            <View style={tw`flex-1 `}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1`}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-5 pb-24`}>
                        <View style={tw`bg-white rounded-3xl p-5 shadow-xl shadow-gray-200/80`}>

                            {/* Type Toggle */}
                            <View style={tw`bg-gray-100 p-1.5 rounded-2xl flex-row mb-6`}>
                                <TouchableOpacity
                                    onPress={() => handleTypeChange('expense')}
                                    style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${type === 'expense' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <ShoppingBag size={18} color={type === 'expense' ? theme.colors.primary : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'expense' ? 'text-teal-600' : 'text-gray-500'}`}>
                                        {t('expense')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleTypeChange('income')}
                                    style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${type === 'income' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Banknote size={18} color={type === 'income' ? theme.colors.success : theme.colors.gray400} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'income' ? 'text-green-600' : 'text-gray-500'}`}>
                                        {t('income')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Category Selection */}
                            <View style={tw`flex-row justify-between items-center mb-4`}>
                                <Text style={tw`text-gray-600 text-sm font-bold ml-1`}>{t('category')}</Text>
                                <TouchableOpacity
                                    onPress={() => router.push('/screens/categories')}
                                    style={tw`flex-row items-center`}
                                >
                                    <Plus size={14} color={theme.colors.primary} />
                                    <Text style={tw`text-teal-600 text-xs font-bold ml-1`}>{t('manage')}</Text>
                                </TouchableOpacity>
                            </View>

                            {isLoadingCategories ? (
                                <View style={tw`h-32 items-center justify-center`}>
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                </View>
                            ) : (
                                <View style={tw`flex-row flex-wrap mb-6`}>
                                    {currentCategories.map((cat) => {
                                        const IconComp = getIconComponent(cat.icon);
                                        const isSelected = selectedCategory?.name === cat.name;
                                        return (
                                            <TouchableOpacity
                                                key={cat.id}
                                                onPress={() => setSelectedCategory(cat)}
                                                style={tw`w-[23%] items-center mb-4 mr-[2%]`}
                                            >
                                                <View
                                                    style={[
                                                        tw`w-14 h-14 rounded-2xl items-center justify-center mb-2`,
                                                        {
                                                            backgroundColor: isSelected
                                                                ? (type === 'expense' ? theme.colors.primary : theme.colors.success)
                                                                : cat.color + '20'
                                                        }
                                                    ]}
                                                >
                                                    <IconComp
                                                        size={22}
                                                        color={isSelected ? 'white' : cat.color}
                                                    />
                                                </View>
                                                <Text
                                                    style={tw`text-[10px] font-bold text-center ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}
                                                    numberOfLines={1}
                                                >
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* Date Picker */}
                            <View style={tw`mb-4`}>
                                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('date')}</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}
                                >
                                    <Calendar size={20} color={theme.colors.gray400} />
                                    <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                    <Text style={tw`text-gray-800 font-medium flex-1`}>{formatDate(date)}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Note Input */}
                            <View style={tw`mb-6`}>
                                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('note')}</Text>
                                <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                    <FileText size={20} color={theme.colors.gray400} />
                                    <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                    <TextInput
                                        placeholder={t('addNote')}
                                        placeholderTextColor={theme.colors.gray400}
                                        value={note}
                                        onChangeText={setNote}
                                        style={tw`flex-1 text-gray-800 font-medium`}
                                        maxLength={100}
                                    />
                                </View>
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={isSaving}
                                style={tw`rounded-2xl py-4 items-center shadow-lg ${isSaving ? 'opacity-70' : ''}
                                    ${type === 'expense' ? 'bg-teal-600' : 'bg-green-600'}`}
                                onPress={handleSave}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={theme.colors.white} />
                                ) : (
                                    <View style={tw`flex-row items-center`}>
                                        <CheckCircle size={20} color={theme.colors.white} style={tw`mr-2`} />
                                        <Text style={tw`text-white font-bold text-lg tracking-wide`}>
                                            {t('saveTransaction')}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
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
