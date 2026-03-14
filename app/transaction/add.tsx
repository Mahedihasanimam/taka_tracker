import { theme } from "@/constants/theme";
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { addTransaction, getCategories } from '@/services/db';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Banknote,
    Book,
    Briefcase,
    Calendar,
    Car,
    Check,
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
    Shirt,
    ShoppingBag,
    Smartphone,
    Utensils,
    Wifi,
    Zap
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
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

// Default categories
const defaultCategories = {
    expense: [
        { name: 'Food & Dining', icon: 'Utensils', color: theme.colors.categoryFood },
        { name: 'Transport', icon: 'Car', color: theme.colors.categoryPurple },
        { name: 'Shopping', icon: 'Shirt', color: theme.colors.categoryShopping },
        { name: 'Rent', icon: 'Home', color: theme.colors.categoryRent },
        { name: 'Utilities', icon: 'Zap', color: theme.colors.categoryBills },
        { name: 'Internet', icon: 'Wifi', color: theme.colors.categoryBlue },
        { name: 'Mobile', icon: 'Smartphone', color: theme.colors.indigo },
        { name: 'Coffee', icon: 'Coffee', color: '#b45309' },
        { name: 'Healthcare', icon: 'Pill', color: theme.colors.danger },
        { name: 'Education', icon: 'GraduationCap', color: theme.colors.primary },
        { name: 'Entertainment', icon: 'Gamepad2', color: '#ec4899' },
        { name: 'Fitness', icon: 'Dumbbell', color: theme.colors.success },
        { name: 'Travel', icon: 'Plane', color: theme.colors.categoryBlue },
        { name: 'Other', icon: 'MoreHorizontal', color: theme.colors.mutedText },
    ],
    income: [
        { name: 'Salary', icon: 'Briefcase', color: theme.colors.success },
        { name: 'Freelance', icon: 'Smartphone', color: theme.colors.primary },
        { name: 'Business', icon: 'Briefcase', color: theme.colors.successDark },
        { name: 'Bonus', icon: 'Gift', color: theme.colors.lightSuccess },
        { name: 'Investment', icon: 'Zap', color: theme.colors.secondary },
        { name: 'Rental Income', icon: 'Home', color: theme.colors.categoryBlue },
        { name: 'Other Income', icon: 'MoreHorizontal', color: theme.colors.mutedText },
    ]
};

const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift, Wifi, Zap,
    Smartphone, Coffee, Heart, Plane, Book, Music, Gamepad2,
    Shirt, Pill, GraduationCap, Dumbbell, MoreHorizontal, Banknote
};

const AddTransactionScreen = () => {
    const { t } = useLanguage();
    const { currencySymbol } = useCurrency();
    const { showSuccess } = useSuccessModal();
    const { user } = useAuth();

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const quickCategories = useMemo(() => categories.slice(0, 8), [categories]);

    useEffect(() => {
        loadCategories();
    }, [type, user?.id]);

    const loadCategories = async () => {
        try {
            const dbCategories = await getCategories(type, user?.id || 0);
            if (dbCategories && dbCategories.length > 0) {
                setCategories(dbCategories as any[]);
            } else {
                setCategories(defaultCategories[type]);
            }
            setSelectedCategory(null);
        } catch (error) {
            setCategories(defaultCategories[type]);
        }
    };

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert(t('Opps'), t('enterValidAmount'));
            return;
        }
        if (!selectedCategory) {
            Alert.alert(t('Opps'), t('selectCategory'));
            return;
        }

        setIsLoading(true);
        try {
            await addTransaction(
                user?.id || 0,
                parseFloat(amount),
                type,
                selectedCategory.name,
                date.toISOString(),
                note,
                selectedCategory.icon,
                selectedCategory.color
            );
            showSuccess({
                title: t('success'),
                message: t('transactionAdded'),
                onConfirm: () => router.back(),
            });
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (iconName: string) => iconMap[iconName] || Briefcase;

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-teal-600 h-28 px-6 pt-2`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                        <ArrowLeft size={24} color={theme.colors.white} />
                        <Text style={tw`text-white text-lg font-bold ml-2`}>{t('addTransaction')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1`}
            >
                <ScrollView contentContainerStyle={tw`px-6 pt-5 pb-4`}>

                    {/* Type Toggle */}
                    <View style={tw`flex-row bg-gray-100 rounded-2xl p-1 mb-4`}>
                        <TouchableOpacity
                            onPress={() => setType('expense')}
                            style={tw`flex-1 py-3 rounded-xl ${type === 'expense' ? 'bg-red-500' : 'bg-transparent'}`}
                        >
                            <Text style={tw`text-center font-bold ${type === 'expense' ? 'text-white' : 'text-gray-500'}`}>
                                {t('expense')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setType('income')}
                            style={tw`flex-1 py-3 rounded-xl ${type === 'income' ? 'bg-green-500' : 'bg-transparent'}`}
                        >
                            <Text style={tw`text-center font-bold ${type === 'income' ? 'text-white' : 'text-gray-500'}`}>
                                {t('income')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Amount Input */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('amount')}</Text>
                        <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50`}>
                            <Text style={tw`text-2xl font-bold text-gray-400 mr-2`}>{currencySymbol}</Text>
                            <TextInput
                                placeholder="0.00"
                                placeholderTextColor={theme.colors.gray400}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                style={tw`flex-1 text-2xl font-bold text-gray-800`}
                            />
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-3 ml-1`}>{t('category')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`pr-2 bg-black`}>
                            {quickCategories.map((cat, index) => {
                                const IconComponent = getIcon(cat.icon);
                                const isSelected = selectedCategory?.name === cat.name;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedCategory(cat)}
                                        style={tw`items-center mr-2.5`}
                                    >
                                        <View style={[
                                            tw`w-11 h-11 rounded-xl items-center justify-center`,
                                            { backgroundColor: isSelected ? cat.color : cat.color + '20' }
                                        ]}>
                                            <IconComponent size={18} color={isSelected ? theme.colors.white : cat.color} />
                                            {isSelected && (
                                                <View style={tw`absolute -top-1 -right-1 bg-white rounded-full p-0.5`}>
                                                    <Check size={12} color={cat.color} />
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <Text style={tw`text-xs font-semibold text-gray-600 mt-2 ml-1`}>
                            {selectedCategory ? `Selected: ${selectedCategory.name}` : 'Select a category'}
                        </Text>
                    </View>

                    {/* Date Picker */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('date')}</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}
                        >
                            <Calendar size={20} color={theme.colors.gray400} />
                            <Text style={tw`flex-1 ml-3 text-gray-800 font-medium`}>
                                {date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowDatePicker(false);
                                    if (selectedDate) setDate(selectedDate);
                                }}
                            />
                        )}
                    </View>

                    {/* Note Input */}
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('note')}</Text>
                        <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50`}>
                            <FileText size={20} color={theme.colors.gray400} />
                            <TextInput
                                placeholder={t('addNote')}
                                placeholderTextColor={theme.colors.gray400}
                                value={note}
                                onChangeText={setNote}
                                style={tw`flex-1 ml-3 text-gray-800 font-medium`}
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isLoading}
                        activeOpacity={0.8}
                        style={tw`bg-teal-600 rounded-2xl py-3.5 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={theme.colors.white} />
                        ) : (
                            <Text style={tw`text-white text-center font-bold text-lg`}>
                                {t('saveTransaction')}
                            </Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default AddTransactionScreen;
