import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { addTransaction, getCategories } from '@/services/db';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    Car,
    Check,
    FileText,
    Gift,
    Home,
    ShoppingBag,
    Utensils
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
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
        { name: 'Food', icon: 'Utensils', color: '#f97316' },
        { name: 'Transport', icon: 'Car', color: '#a855f7' },
        { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
        { name: 'Rent', icon: 'Home', color: '#06b6d4' },
    ],
    income: [
        { name: 'Salary', icon: 'Briefcase', color: '#10b981' },
        { name: 'Gift', icon: 'Gift', color: '#ef4444' },
        { name: 'Other', icon: 'Briefcase', color: '#6b7280' },
    ]
};

const iconMap: Record<string, any> = {
    Utensils, Car, Briefcase, ShoppingBag, Home, Gift
};

const AddTransactionScreen = () => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, [type]);

    const loadCategories = async () => {
        try {
            const dbCategories = await getCategories(type);
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
            Alert.alert(
                t('success'),
                t('transactionAdded'),
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (iconName: string) => iconMap[iconName] || Briefcase;

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-[#e2136e] h-28 px-6 pt-12`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                        <ArrowLeft size={24} color="#fff" />
                        <Text style={tw`text-white text-lg font-bold ml-2`}>{t('addTransaction')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={tw`flex-1`}
            >
                <ScrollView contentContainerStyle={tw`px-6 pt-6 pb-8`}>

                    {/* Type Toggle */}
                    <View style={tw`flex-row bg-gray-100 rounded-2xl p-1 mb-6`}>
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
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('amount')}</Text>
                        <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50`}>
                            <Text style={tw`text-2xl font-bold text-gray-400 mr-2`}>৳</Text>
                            <TextInput
                                placeholder="0.00"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                                style={tw`flex-1 text-2xl font-bold text-gray-800`}
                            />
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-3 ml-1`}>{t('category')}</Text>
                        <View style={tw`flex-row flex-wrap`}>
                            {categories.map((cat, index) => {
                                const IconComponent = getIcon(cat.icon);
                                const isSelected = selectedCategory?.name === cat.name;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedCategory(cat)}
                                        style={tw`w-[23%] items-center mb-4 mr-[2%]`}
                                    >
                                        <View style={[
                                            tw`w-14 h-14 rounded-2xl items-center justify-center mb-1`,
                                            { backgroundColor: isSelected ? cat.color : cat.color + '20' }
                                        ]}>
                                            <IconComponent size={24} color={isSelected ? '#fff' : cat.color} />
                                            {isSelected && (
                                                <View style={tw`absolute -top-1 -right-1 bg-white rounded-full p-0.5`}>
                                                    <Check size={12} color={cat.color} />
                                                </View>
                                            )}
                                        </View>
                                        <Text style={tw`text-xs font-medium text-gray-600 text-center`}>{cat.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Date Picker */}
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('date')}</Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}
                        >
                            <Calendar size={20} color="#9ca3af" />
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
                    <View style={tw`mb-8`}>
                        <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>{t('note')}</Text>
                        <View style={tw`flex-row items-start border border-gray-200 rounded-2xl px-4 py-3 bg-gray-50`}>
                            <FileText size={20} color="#9ca3af" style={tw`mt-1`} />
                            <TextInput
                                placeholder={t('addNote')}
                                placeholderTextColor="#9ca3af"
                                multiline
                                numberOfLines={3}
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
                        style={tw`bg-[#e2136e] rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
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
