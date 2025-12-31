import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Briefcase,
    Car,
    Download,
    Filter,
    Gift,
    Home,
    Search,
    ShoppingBag,
    Utensils
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    FlatList,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const TransactionsScreen = () => {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // --- MOCK DATA (Grouped by Date) ---
    const sections = [
        {
            title: 'Today',
            data: [
                { id: '1', category: 'Food', note: 'Lunch at Cafe', amount: '250', type: 'expense', icon: Utensils, color: '#f97316', bg: 'bg-orange-100', time: '1:30 PM' },
                { id: '2', category: 'Transport', note: 'Uber to Office', amount: '150', type: 'expense', icon: Car, color: '#a855f7', bg: 'bg-purple-100', time: '9:00 AM' },
            ]
        },
        {
            title: 'Yesterday',
            data: [
                { id: '3', category: 'Salary', note: 'March Salary', amount: '40,000', type: 'income', icon: Briefcase, color: '#10b981', bg: 'bg-green-100', time: '10:00 AM' },
                { id: '4', category: 'Shopping', note: 'Grocery', amount: '2,500', type: 'expense', icon: ShoppingBag, color: '#ec4899', bg: 'bg-pink-100', time: '6:45 PM' },
            ]
        },
        {
            title: '01 Mar 2024',
            data: [
                { id: '5', category: 'Rent', note: 'House Rent', amount: '12,000', type: 'expense', icon: Home, color: '#06b6d4', bg: 'bg-cyan-100', time: '11:00 AM' },
                { id: '6', category: 'Gift', note: 'Birthday Gift', amount: '1,000', type: 'income', icon: Gift, color: '#ef4444', bg: 'bg-red-100', time: '2:00 PM' },
            ]
        }
    ];

    // Helper to filter data based on selection
    const getFilteredData = () => {
        // In a real app, you would filter the sections array here based on 'filter' and 'searchQuery'
        // For UI demo, we return all, but visual tabs work.
        return sections;
    };

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`h-48 px-6 pt-12 rounded-b-[36px] shadow-lg z-0 relative`}
            >
                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <Text style={tw`text-white text-2xl font-extrabold tracking-wide`}>
                        Transactions
                    </Text>
                    <TouchableOpacity style={tw`bg-white/20 p-2 rounded-full`}>
                        <Download size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* --- SEARCH BAR (Floating Overlap) --- */}
            <View style={tw`px-6 -mt-6 z-10`}>
                <View style={tw`bg-white rounded-2xl shadow-lg shadow-gray-200 flex-row items-center px-4 py-3 border border-gray-100`}>
                    <Search size={20} color="#9ca3af" />
                    <TextInput
                        placeholder="Search transactions..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={tw`flex-1 ml-3 text-gray-800 font-medium`}
                    />
                    <TouchableOpacity>
                        <Filter size={20} color="#e2136e" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- FILTER TABS --- */}
            <View style={tw`flex-row justify-center mt-6 mb-2 px-6`}>
                {['All', 'Income', 'Expense'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        onPress={() => setFilter(item as any)}
                        style={tw`px-6 py-2 rounded-full mx-1 border 
            ${filter === item ? 'bg-[#e2136e] border-[#e2136e]' : 'bg-white border-gray-200'}`}
                    >
                        <Text style={tw`text-xs font-bold ${filter === item ? 'text-white' : 'text-gray-500'}`}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* --- TRANSACTION LIST --- */}
            <FlatList
                data={getFilteredData()}
                keyExtractor={(item) => item.title}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-24 px-6 pt-2`}
                renderItem={({ item: section }) => (
                    <View style={tw`mb-6`}>
                        {/* Date Header */}
                        <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-3 ml-1 tracking-wider`}>
                            {section.title}
                        </Text>

                        {/* List Items Card */}
                        <View style={tw`bg-white rounded-3xl p-2 shadow-sm shadow-gray-100`}>
                            {section.data.map((transaction, index) => (
                                <View key={transaction.id}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={tw`flex-row items-center p-3`}
                                    >
                                        {/* Icon */}
                                        <View style={tw`w-12 h-12 rounded-2xl ${transaction.bg} items-center justify-center mr-4`}>
                                            <transaction.icon size={20} color={transaction.color} />
                                        </View>

                                        {/* Details */}
                                        <View style={tw`flex-1`}>
                                            <View style={tw`flex-row justify-between items-center mb-1`}>
                                                <Text style={tw`text-sm font-bold text-gray-800`}>{transaction.category}</Text>
                                                <Text style={tw`text-sm font-bold ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                                                    {transaction.type === 'expense' ? '-' : '+'} ৳{transaction.amount}
                                                </Text>
                                            </View>
                                            <View style={tw`flex-row justify-between items-center`}>
                                                <Text style={tw`text-xs text-gray-400 font-medium`} numberOfLines={1}>{transaction.note}</Text>
                                                <View style={tw`flex-row items-center`}>
                                                    {transaction.type === 'expense' ? (
                                                        <ArrowUpRight size={12} color="#ef4444" style={tw`mr-1`} />
                                                    ) : (
                                                        <ArrowDownLeft size={12} color="#10b981" style={tw`mr-1`} />
                                                    )}
                                                    <Text style={tw`text-[10px] text-gray-400 font-medium`}>{transaction.time}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Divider (except last item) */}
                                    {index < section.data.length - 1 && (
                                        <View style={tw`h-[1px] bg-gray-50 mx-4`} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

export default TransactionsScreen;