import { useAuth } from '@/context/AuthContext';
import { theme } from "@/constants/theme";
import { useLanguage } from '@/context/LanguageContext';
import { addCategory, deleteCategory, getCategories, updateCategory } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    ArrowLeft,
    Banknote,
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
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

// Category type
interface Category {
    id: number;
    name: string;
    type: string;
    icon: string;
    color: string;
    user_id?: number;
}

const CategoryManagementScreen = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const router = useRouter();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [selectedIconName, setSelectedIconName] = useState('MoreHorizontal');
    const [selectedColor, setSelectedColor] = useState(theme.colors.primary);

    // Categories data
    const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);

    // --- ICONS & COLORS ---
    const availableIcons = [
        { name: 'Utensils', icon: Utensils },
        { name: 'Car', icon: Car },
        { name: 'Home', icon: Home },
        { name: 'ShoppingBag', icon: ShoppingBag },
        { name: 'Wifi', icon: Wifi },
        { name: 'Zap', icon: Zap },
        { name: 'Gift', icon: Gift },
        { name: 'Briefcase', icon: Briefcase },
        { name: 'Smartphone', icon: Smartphone },
        { name: 'Coffee', icon: Coffee },
        { name: 'Heart', icon: Heart },
        { name: 'Plane', icon: Plane },
        { name: 'Book', icon: Book },
        { name: 'Music', icon: Music },
        { name: 'Gamepad2', icon: Gamepad2 },
        { name: 'Shirt', icon: Shirt },
        { name: 'Pill', icon: Pill },
        { name: 'GraduationCap', icon: GraduationCap },
        { name: 'Dumbbell', icon: Dumbbell },
        { name: 'MoreHorizontal', icon: MoreHorizontal },
    ];

    const availableColors = [
        theme.colors.primary, theme.colors.categoryFood, theme.colors.categoryBills, theme.colors.success, theme.colors.categoryRent,
        theme.colors.secondary, theme.colors.purple, theme.colors.categoryShopping, theme.colors.danger, theme.colors.primary,
        theme.colors.warning, theme.colors.success, theme.colors.indigo, theme.colors.purple, theme.colors.darkSlate
    ];

    // --- FETCH CATEGORIES ---
    const fetchCategories = useCallback(async () => {
        try {
            const expense = await getCategories('expense', user?.id);
            const income = await getCategories('income', user?.id);
            setExpenseCategories(expense as Category[]);
            setIncomeCategories(income as Category[]);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            fetchCategories();
        }, [fetchCategories])
    );

    // --- HELPER: Get Icon Component ---
    const getIconComponent = (iconName: string) => {
        const found = availableIcons.find(i => i.name === iconName);
        return found ? found.icon : MoreHorizontal;
    };

    // --- HANDLERS ---
    const handleOpenModal = (item?: Category) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item.id);
            setName(item.name);
            setSelectedIconName(item.icon);
            setSelectedColor(item.color);
        } else {
            setIsEditing(false);
            setEditingId(null);
            setName('');
            setSelectedIconName('MoreHorizontal');
            setSelectedColor(activeTab === 'expense' ? theme.colors.primary : theme.colors.success);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('Opps'), t('categoryNameRequired'));
            return;
        }

        setIsSaving(true);
        try {
            if (isEditing && editingId) {
                await updateCategory(editingId, name.trim(), activeTab, selectedIconName, selectedColor);
            } else {
                await addCategory(user?.id || 0, name.trim(), activeTab, selectedIconName, selectedColor);
            }
            setModalVisible(false);
            fetchCategories();
            Alert.alert(t('success'), isEditing ? t('categoryUpdated') : t('categoryAdded'));
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (category: Category) => {
        Alert.alert(
            t('deleteCategory'),
            t('deleteCategoryConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCategory(category.id);
                            fetchCategories();
                        } catch (error) {
                            Alert.alert(t('Opps'), t('somethingWrong'));
                        }
                    }
                }
            ]
        );
    };

    const currentList = activeTab === 'expense' ? expenseCategories : incomeCategories;

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
                style={tw`h-52 px-6 pt-12 rounded-b-[36px] shadow-lg`}
            >
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2.5 rounded-full`}>
                        <ArrowLeft size={22} color={theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={tw`text-white text-xl font-extrabold tracking-wide`}>
                        {t('manageCategories')}
                    </Text>
                    <View style={tw`w-10`} />
                </View>

                {/* --- TABS --- */}
                <View style={tw`bg-white rounded-2xl p-1.5 flex-row shadow-xl mx-2`}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('expense')}
                        style={tw`flex-1 py-3.5 rounded-xl items-center flex-row justify-center ${activeTab === 'expense' ? 'bg-teal-600' : 'bg-transparent'}`}
                    >
                        <ShoppingBag size={18} color={activeTab === 'expense' ? 'white' : theme.colors.gray400} style={tw`mr-2`} />
                        <Text style={tw`font-bold ${activeTab === 'expense' ? 'text-white' : 'text-gray-500'}`}>
                            {t('expense')} ({expenseCategories.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('income')}
                        style={tw`flex-1 py-3.5 rounded-xl items-center flex-row justify-center ${activeTab === 'income' ? 'bg-green-600' : 'bg-transparent'}`}
                    >
                        <Banknote size={18} color={activeTab === 'income' ? 'white' : theme.colors.gray400} style={tw`mr-2`} />
                        <Text style={tw`font-bold ${activeTab === 'income' ? 'text-white' : 'text-gray-500'}`}>
                            {t('income')} ({incomeCategories.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- LIST CONTENT --- */}
            <View style={tw`flex-1 px-5 pt-6`}>

                {/* Add Button */}
                <TouchableOpacity
                    onPress={() => handleOpenModal()}
                    activeOpacity={0.8}
                    style={tw`flex-row items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed ${activeTab === 'expense' ? 'border-teal-300' : 'border-green-300'} mb-5`}
                >
                    <View style={tw`w-10 h-10 rounded-full ${activeTab === 'expense' ? 'bg-teal-100' : 'bg-green-100'} items-center justify-center mr-3`}>
                        <Plus size={20} color={activeTab === 'expense' ? theme.colors.primary : theme.colors.success} />
                    </View>
                    <Text style={tw`${activeTab === 'expense' ? 'text-teal-600' : 'text-green-600'} font-bold text-base`}>
                        {t('addNewCategory')}
                    </Text>
                </TouchableOpacity>

                {currentList.length === 0 ? (
                    <View style={tw`flex-1 justify-center items-center`}>
                        <View style={tw`w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4`}>
                            <ShoppingBag size={32} color={theme.colors.gray400} />
                        </View>
                        <Text style={tw`text-gray-500 font-medium`}>{t('noCategories')}</Text>
                        <Text style={tw`text-gray-400 text-sm mt-1`}>{t('addCategoryHint')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={currentList}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-24`}
                        renderItem={({ item }) => {
                            const IconComp = getIconComponent(item.icon);
                            return (
                                <View style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-gray-200 flex-row items-center justify-between`}>
                                    <View style={tw`flex-row items-center flex-1`}>
                                        <View
                                            style={[
                                                tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`,
                                                { backgroundColor: item.color + '20' }
                                            ]}
                                        >
                                            <IconComp size={22} color={item.color} />
                                        </View>
                                        <View style={tw`flex-1`}>
                                            <Text style={tw`text-gray-800 font-bold text-base`}>{item.name}</Text>
                                            <Text style={tw`text-gray-400 text-xs mt-0.5 capitalize`}>{item.type}</Text>
                                        </View>
                                    </View>

                                    <View style={tw`flex-row`}>
                                        <TouchableOpacity
                                            onPress={() => handleOpenModal(item)}
                                            style={tw`p-2.5 bg-gray-50 rounded-xl mr-2`}
                                        >
                                            <Edit3 size={16} color={theme.colors.mutedText} />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDelete(item)}
                                            style={tw`p-2.5 bg-red-50 rounded-xl`}
                                        >
                                            <Trash2 size={16} color={theme.colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>

            {/* --- ADD/EDIT MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={tw`flex-1 justify-end bg-black/50`}
                >
                    <View style={tw`bg-white rounded-t-[32px] max-h-[90%]`}>
                        {/* Modal Header */}
                        <View style={tw`p-5 border-b border-gray-100 flex-row justify-between items-center`}>
                            <Text style={tw`text-xl font-bold text-gray-900`}>
                                {isEditing ? t('editCategory') : t('addCategory')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={tw`bg-gray-100 p-2 rounded-full`}
                            >
                                <X size={20} color={theme.colors.mutedText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={tw`p-5 pb-10`} showsVerticalScrollIndicator={false}>

                            {/* Preview */}
                            <View style={tw`items-center mb-6`}>
                                <View
                                    style={[
                                        tw`w-20 h-20 rounded-3xl items-center justify-center mb-3`,
                                        { backgroundColor: selectedColor }
                                    ]}
                                >
                                    {React.createElement(getIconComponent(selectedIconName), { size: 36, color: theme.colors.white })}
                                </View>
                                <Text style={tw`text-gray-800 font-bold text-lg`}>
                                    {name || t('categoryName')}
                                </Text>
                            </View>

                            {/* Name Input */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('categoryName')}</Text>
                            <View style={tw`bg-gray-50 rounded-2xl px-4 py-3.5 mb-6 border border-gray-200`}>
                                <TextInput
                                    placeholder={t('categoryNamePlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
                                    value={name}
                                    onChangeText={setName}
                                    style={tw`text-base font-bold text-gray-900`}
                                />
                            </View>

                            {/* Icon Picker */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-3 ml-1`}>{t('selectIcon')}</Text>
                            <View style={tw`flex-row flex-wrap mb-6 bg-gray-50 p-3 rounded-2xl`}>
                                {availableIcons.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedIconName(item.name)}
                                        style={[
                                            tw`w-11 h-11 rounded-xl items-center justify-center m-1`,
                                            selectedIconName === item.name
                                                ? { backgroundColor: selectedColor }
                                                : tw`bg-white border border-gray-200`
                                        ]}
                                    >
                                        <item.icon size={20} color={selectedIconName === item.name ? 'white' : theme.colors.mutedText} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Color Picker */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-3 ml-1`}>{t('selectColor')}</Text>
                            <View style={tw`flex-row flex-wrap mb-8`}>
                                {availableColors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={[
                                            tw`w-10 h-10 rounded-full items-center justify-center m-1 shadow-sm`,
                                            { backgroundColor: color },
                                            selectedColor === color && tw`border-2 border-white shadow-lg`
                                        ]}
                                    >
                                        {selectedColor === color && <Check size={18} color={theme.colors.white} />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving}
                                activeOpacity={0.9}
                                style={[
                                    tw`rounded-2xl py-4 items-center shadow-lg ${isSaving ? 'opacity-70' : ''}`,
                                    { backgroundColor: selectedColor }
                                ]}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color={theme.colors.white} />
                                ) : (
                                    <Text style={tw`text-white font-bold text-lg`}>
                                        {isEditing ? t('updateCategory') : t('saveCategory')}
                                    </Text>
                                )}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

export default CategoryManagementScreen;
