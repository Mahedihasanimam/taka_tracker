import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Banknote,
    Briefcase,
    Car,
    Check,
    Coffee,
    Edit3,
    Gift,
    Heart,
    Home,
    MoreHorizontal,
    Plus,
    ShoppingBag,
    Smartphone,
    Trash2,
    Utensils,
    Wifi,
    X,
    Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

const CategoryManagementScreen = () => {
    const { t } = useLanguage();
    const router = useRouter();

    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [selectedIconName, setSelectedIconName] = useState('MoreHorizontal');
    const [selectedColor, setSelectedColor] = useState('#6b7280');

    // --- MOCK DATA ---
    // In a real app, these icons would be mapped to string names
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
        { name: 'MoreHorizontal', icon: MoreHorizontal },
    ];

    const availableColors = [
        '#e2136e', '#f97316', '#eab308', '#10b981', '#06b6d4',
        '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1f2937'
    ];

    const [expenseCats, setExpenseCats] = useState([
        { id: '1', name: 'Food', iconName: 'Utensils', color: '#f97316', bg: 'bg-orange-100' },
        { id: '2', name: 'Transport', iconName: 'Car', color: '#a855f7', bg: 'bg-purple-100' },
        { id: '3', name: 'Rent', iconName: 'Home', color: '#06b6d4', bg: 'bg-cyan-100' },
    ]);

    const [incomeCats, setIncomeCats] = useState([
        { id: '4', name: 'Salary', iconName: 'Briefcase', color: '#10b981', bg: 'bg-green-100' },
        { id: '5', name: 'Gift', iconName: 'Gift', color: '#ef4444', bg: 'bg-red-100' },
    ]);

    // --- HELPER: Get Icon Component by Name ---
    const getIconComponent = (name: string) => {
        const found = availableIcons.find(i => i.name === name);
        return found ? found.icon : MoreHorizontal;
    };

    // --- HANDLERS ---
    const handleOpenModal = (item?: any) => {
        if (item) {
            setIsEditing(true);
            setName(item.name);
            setSelectedIconName(item.iconName);
            setSelectedColor(item.color);
        } else {
            setIsEditing(false);
            setName('');
            setSelectedIconName('MoreHorizontal');
            setSelectedColor('#e2136e');
        }
        setModalVisible(true);
    };

    const currentList = activeTab === 'expense' ? expenseCats : incomeCats;

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`h-60 px-6 pt-12 rounded-b-[36px] shadow-lg z-0 relative`}
            >
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2 rounded-full`}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={tw`text-white text-xl font-extrabold tracking-wide`}>
                        {t('manageCategories')}
                    </Text>
                    <View style={tw`w-10`} />
                </View>

                {/* --- TABS (Overlapping Header) --- */}
                <View style={tw`bg-white rounded-2xl p-1 flex-row shadow-lg shadow-pink-900/20 -mb-10 mx-4`}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('expense')}
                        style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${activeTab === 'expense' ? 'bg-[#e2136e]' : 'bg-transparent'}`}
                    >
                        <ShoppingBag size={18} color={activeTab === 'expense' ? 'white' : '#9ca3af'} style={tw`mr-2`} />
                        <Text style={tw`font-bold ${activeTab === 'expense' ? 'text-white' : 'text-gray-500'}`}>{t('expense')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab('income')}
                        style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${activeTab === 'income' ? 'bg-[#10b981]' : 'bg-transparent'}`}
                    >
                        <Banknote size={18} color={activeTab === 'income' ? 'white' : '#9ca3af'} style={tw`mr-2`} />
                        <Text style={tw`font-bold ${activeTab === 'income' ? 'text-white' : 'text-gray-500'}`}>{t('income')}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- LIST CONTENT --- */}
            <View style={tw`flex-1 mt-12 px-6`}>

                {/* Add Button */}
                <TouchableOpacity
                    onPress={() => handleOpenModal()}
                    activeOpacity={0.8}
                    style={tw`flex-row items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed border-gray-300 mb-6 mt-4`}
                >
                    <Plus size={20} color="#9ca3af" />
                    <Text style={tw`text-gray-500 font-bold ml-2`}>{t('addCategory')}</Text>
                </TouchableOpacity>

                <FlatList
                    data={currentList}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={tw`pb-24`}
                    renderItem={({ item }) => {
                        const IconComp = getIconComponent(item.iconName);
                        return (
                            <View style={tw`bg-white rounded-2xl p-4 mb-3 shadow-sm shadow-gray-200 flex-row items-center justify-between`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: item.color + '20' }]}>
                                        <IconComp size={22} color={item.color} />
                                    </View>
                                    <Text style={tw`text-gray-800 font-bold text-base`}>{item.name}</Text>
                                </View>

                                <View style={tw`flex-row`}>
                                    <TouchableOpacity onPress={() => handleOpenModal(item)} style={tw`p-2 bg-gray-50 rounded-full mr-2`}>
                                        <Edit3 size={16} color="#6b7280" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={tw`p-2 bg-red-50 rounded-full`}>
                                        <Trash2 size={16} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                />
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
                    <View style={tw`bg-white rounded-t-[32px] h-[85%]`}>
                        <View style={tw`p-6 border-b border-gray-100 flex-row justify-between items-center`}>
                            <Text style={tw`text-xl font-bold text-gray-900`}>
                                {isEditing ? t('editCategory') : t('addCategory')}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`bg-gray-100 p-2 rounded-full`}>
                                <X size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={tw`p-6 pb-20`}>

                            {/* 1. Name Input */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('categoryName')}</Text>
                            <View style={tw`bg-gray-50 rounded-2xl px-4 py-3.5 mb-6 border border-gray-200 focus:border-[#e2136e]`}>
                                <TextInput
                                    placeholder="e.g. Groceries"
                                    value={name}
                                    onChangeText={setName}
                                    style={tw`text-base font-bold text-gray-900`}
                                />
                            </View>

                            {/* 2. Icon Picker */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-3 ml-1`}>{t('selectIcon')}</Text>
                            <View style={tw`flex-row flex-wrap justify-between mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100`}>
                                {availableIcons.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => setSelectedIconName(item.name)}
                                        style={[
                                            tw`w-12 h-12 rounded-xl items-center justify-center mb-2`,
                                            selectedIconName === item.name ? { backgroundColor: selectedColor } : tw`bg-white border border-gray-200`
                                        ]}
                                    >
                                        <item.icon size={20} color={selectedIconName === item.name ? 'white' : '#6b7280'} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* 3. Color Picker */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-3 ml-1`}>{t('selectColor')}</Text>
                            <View style={tw`flex-row flex-wrap gap-3 mb-8`}>
                                {availableColors.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        onPress={() => setSelectedColor(color)}
                                        style={[
                                            tw`w-10 h-10 rounded-full items-center justify-center shadow-sm`,
                                            { backgroundColor: color }
                                        ]}
                                    >
                                        {selectedColor === color && <Check size={18} color="white" />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.9}
                                style={[
                                    tw`rounded-2xl py-4 items-center shadow-lg`,
                                    { backgroundColor: selectedColor, shadowColor: selectedColor }
                                ]}
                            >
                                <Text style={tw`text-white font-bold text-lg`}>{t('save')}</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
};

export default CategoryManagementScreen;