import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
    AlertTriangle,
    Car,
    Edit3,
    Home,
    PieChart,
    Plus,
    ShoppingBag,
    Trash2,
    Utensils,
    X
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const BudgetScreen = () => {
    const { t } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);
    const [newAmount, setNewAmount] = useState('');

    // --- MOCK DATA: BUDGETS ---
    const [budgets, setBudgets] = useState([
        { id: '1', category: 'Food', limit: 5000, spent: 3500, icon: Utensils, color: '#f97316', bg: 'bg-orange-100' },
        { id: '2', category: 'Transport', limit: 2000, spent: 1800, icon: Car, color: '#a855f7', bg: 'bg-purple-100' },
        { id: '3', category: 'Rent', limit: 15000, spent: 15000, icon: Home, color: '#06b6d4', bg: 'bg-cyan-100' },
        { id: '4', category: 'Shopping', limit: 3000, spent: 4500, icon: ShoppingBag, color: '#ec4899', bg: 'bg-pink-100' }, // Exceeded
    ]);

    // --- CALCULATIONS ---
    const totalBudget = budgets.reduce((acc, item) => acc + item.limit, 0);
    const totalSpent = budgets.reduce((acc, item) => acc + item.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallProgress = (totalSpent / totalBudget) * 100;

    // --- HELPER: GET PROGRESS COLOR ---
    const getStatusColor = (spent: number, limit: number) => {
        const percentage = (spent / limit) * 100;
        if (percentage >= 100) return '#ef4444'; // Red (Exceeded)
        if (percentage >= 80) return '#f59e0b';  // Orange (Warning)
        return '#10b981';                        // Green (Safe)
    };

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`h-64 px-6 pt-10 rounded-b-[36px] shadow-lg z-10 relative`}
            >
                <Text style={tw`text-white text-2xl font-extrabold tracking-wide mb-6`}>
                    {t('budgetTitle')}
                </Text>

                {/* --- SUMMARY CARD (Overlapping Header) --- */}
                <View style={tw`bg-white rounded-3xl p-6 shadow-xl  shadow-pink-900/20`}>
                    <View style={tw`flex-row justify-between items-center mb-4`}>
                        <View>
                            <Text style={tw`text-gray-400 text-xs font-bold uppercase tracking-wider`}>{t('totalBudget')}</Text>
                            <Text style={tw`text-2xl font-extrabold text-gray-900`}>৳ {totalBudget.toLocaleString()}</Text>
                        </View>
                        <View style={tw`bg-pink-50 p-3 rounded-full`}>
                            <PieChart size={24} color="#e2136e" />
                        </View>
                    </View>

                    {/* Overall Progress Bar */}
                    <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden mb-2`}>
                        <View
                            style={[
                                tw`h-full rounded-full`,
                                { width: `${Math.min(overallProgress, 100)}%`, backgroundColor: getStatusColor(totalSpent, totalBudget) }
                            ]}
                        />
                    </View>

                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-xs font-bold text-gray-500`}>{t('totalSpent')}: ৳{totalSpent.toLocaleString()}</Text>
                        <Text style={tw`text-xs font-bold text-gray-500`}>{t('remaining')}: ৳{totalRemaining.toLocaleString()}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* --- BODY CONTENT --- */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-24 pt-24 px-6`}
                style={tw`-mt-12 z-0`} // Overlap fix
            >

                {/* --- CREATE NEW BUTTON --- */}
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                    style={tw`flex-row items-center justify-center bg-white p-4 rounded-2xl border-2 border-dashed border-gray-300 mb-6`}
                >
                    <Plus size={20} color="#9ca3af" />
                    <Text style={tw`text-gray-500 font-bold ml-2`}>{t('createBudget')}</Text>
                </TouchableOpacity>

                {/* --- BUDGET LIST --- */}
                {budgets.map((item) => {
                    const percent = Math.min((item.spent / item.limit) * 100, 100);
                    const statusColor = getStatusColor(item.spent, item.limit);
                    const isExceeded = item.spent > item.limit;

                    return (
                        <View key={item.id} style={tw`bg-white rounded-2xl p-5 mb-4 shadow-sm shadow-gray-200`}>

                            {/* Top Row: Icon, Name, Options */}
                            <View style={tw`flex-row justify-between items-center mb-3`}>
                                <View style={tw`flex-row items-center`}>
                                    <View style={tw`w-10 h-10 rounded-xl ${item.bg} items-center justify-center mr-3`}>
                                        <item.icon size={20} color={item.color} />
                                    </View>
                                    <View>
                                        <Text style={tw`text-sm font-bold text-gray-800`}>{item.category}</Text>
                                        <Text style={tw`text-[10px] text-gray-400 font-medium`}>Monthly Limit</Text>
                                    </View>
                                </View>
                                <View style={tw`flex-row`}>
                                    <TouchableOpacity style={tw`p-2`}><Edit3 size={16} color="#9ca3af" /></TouchableOpacity>
                                    <TouchableOpacity style={tw`p-2`}><Trash2 size={16} color="#ef4444" /></TouchableOpacity>
                                </View>
                            </View>

                            {/* Middle Row: Amounts */}
                            <View style={tw`flex-row justify-between items-end mb-2`}>
                                <Text style={tw`text-lg font-bold text-gray-800`}>৳{item.spent.toLocaleString()}</Text>
                                <Text style={tw`text-xs font-bold text-gray-400 mb-1`}>/ ৳{item.limit.toLocaleString()}</Text>
                            </View>

                            {/* Progress Bar */}
                            <View style={tw`h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2`}>
                                <View style={[tw`h-full rounded-full`, { width: `${percent}%`, backgroundColor: statusColor }]} />
                            </View>

                            {/* Status Footer */}
                            <View style={tw`flex-row justify-between items-center`}>
                                <Text style={[tw`text-[10px] font-bold`, { color: statusColor }]}>
                                    {percent.toFixed(0)}% Used
                                </Text>
                                {isExceeded && (
                                    <View style={tw`flex-row items-center bg-red-50 px-2 py-0.5 rounded-md`}>
                                        <AlertTriangle size={10} color="#ef4444" style={tw`mr-1`} />
                                        <Text style={tw`text-[10px] font-bold text-red-500`}>{t('alertOver')}</Text>
                                    </View>
                                )}
                            </View>

                        </View>
                    );
                })}

            </ScrollView>

            {/* --- ADD BUDGET MODAL --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={tw`flex-1 justify-end bg-black/50`}>
                    <View style={tw`bg-white rounded-t-[32px] p-8`}>

                        <View style={tw`flex-row justify-between items-center mb-6`}>
                            <Text style={tw`text-xl font-bold text-gray-900`}>{t('createBudget')}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={tw`bg-gray-100 p-2 rounded-full`}>
                                <X size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Input: Category (Simplified as text for UI demo) */}
                        <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('category')}</Text>
                        <View style={tw`bg-gray-50 rounded-2xl px-4 py-3.5 mb-4 border border-gray-200`}>
                            <Text style={tw`text-gray-500`}>Select Category (Food, Rent...)</Text>
                        </View>

                        {/* Input: Limit */}
                        <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>{t('setLimit')}</Text>
                        <View style={tw`flex-row items-center bg-gray-50 rounded-2xl px-4 py-3.5 mb-8 border border-gray-200 focus:border-[#e2136e]`}>
                            <Text style={tw`text-lg font-bold text-gray-900 mr-2`}>৳</Text>
                            <TextInput
                                placeholder="0"
                                keyboardType="numeric"
                                style={tw`flex-1 text-lg font-bold text-gray-900`}
                                value={newAmount}
                                onChangeText={setNewAmount}
                                autoFocus={true}
                            />
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={() => setModalVisible(false)}
                            activeOpacity={0.9}
                            style={tw`bg-[#e2136e] rounded-2xl py-4 items-center shadow-lg shadow-pink-200`}
                        >
                            <Text style={tw`text-white font-bold text-lg`}>{t('saveBudget')}</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default BudgetScreen;