import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Banknote,
    Briefcase,
    Calendar,
    Car,
    CheckCircle,
    FileText,
    Gift,
    Home,
    MoreHorizontal,
    ShoppingBag,
    Utensils,
    Zap
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
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

const AddTransactionScreen = () => {
    const { t } = useLanguage();
    const router = useRouter();

    // State
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toLocaleDateString());

    // Categories Data
    const categories = [
        { id: '1', name: 'Food', icon: Utensils, color: '#f97316', bg: 'bg-orange-100' },
        { id: '2', name: 'Transport', icon: Car, color: '#a855f7', bg: 'bg-purple-100' },
        { id: '3', name: 'Rent', icon: Home, color: '#06b6d4', bg: 'bg-cyan-100' },
        { id: '4', name: 'Shopping', icon: ShoppingBag, color: '#ec4899', bg: 'bg-pink-100' },
        { id: '5', name: 'Bills', icon: Zap, color: '#eab308', bg: 'bg-yellow-100' },
        { id: '6', name: 'Salary', icon: Briefcase, color: '#10b981', bg: 'bg-green-100' },
        { id: '7', name: 'Gift', icon: Gift, color: '#ef4444', bg: 'bg-red-100' },
        { id: '8', name: 'Others', icon: MoreHorizontal, color: '#6b7280', bg: 'bg-gray-100' },
    ];

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor={type === 'expense' ? '#e2136e' : '#10b981'} barStyle="light-content" />


            <LinearGradient
                colors={type === 'expense' ? ['#e2136e', '#be125a'] : ['#10b981', '#059669']}
                style={tw`h-64 px-6 pt-12 rounded-b-[36px] shadow-lg z-10`}
            >

                <View style={tw`flex-row justify-between items-center mb-6`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2 rounded-full`}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={tw`text-white text-lg font-bold`}>Add Transaction</Text>
                    <View style={tw`w-10`} />
                </View>


                <View style={tw`items-center mt-2`}>
                    <Text style={tw`text-white/70 text-sm font-bold uppercase mb-2 tracking-widest`}>
                        Enter Amount
                    </Text>
                    <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-white text-4xl font-bold mr-2`}>৳</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            keyboardType="numeric"
                            style={tw`text-white text-6xl font-extrabold w-64 text-center`}
                            autoFocus
                        />
                    </View>
                </View>
            </LinearGradient>


            <View style={tw`flex-1  px-6`}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={tw`flex-1`}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-20`}>


                        <View style={tw`bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200`}>


                            <View style={tw`bg-gray-100 p-1 rounded-2xl flex-row mb-8`}>
                                <TouchableOpacity
                                    onPress={() => setType('expense')}
                                    style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${type === 'expense' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <ShoppingBag size={18} color={type === 'expense' ? '#e2136e' : '#9ca3af'} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'expense' ? 'text-[#e2136e]' : 'text-gray-500'}`}>Expense</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setType('income')}
                                    style={tw`flex-1 py-3 rounded-xl items-center flex-row justify-center ${type === 'income' ? 'bg-white shadow-sm' : ''}`}
                                >
                                    <Banknote size={18} color={type === 'income' ? '#10b981' : '#9ca3af'} style={tw`mr-2`} />
                                    <Text style={tw`font-bold ${type === 'income' ? 'text-[#10b981]' : 'text-gray-500'}`}>Income</Text>
                                </TouchableOpacity>
                            </View>

                            {/* 2. Category Selection */}
                            <Text style={tw`text-gray-600 text-sm font-bold mb-4 ml-1`}>Category</Text>
                            <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setSelectedCategory(cat.id)}
                                        style={tw`w-[23%] items-center mb-4`}
                                    >
                                        <View
                                            style={tw`w-14 h-14 rounded-2xl items-center justify-center mb-2 
                      ${selectedCategory === cat.id ? (type === 'expense' ? 'bg-[#e2136e]' : 'bg-[#10b981]') : cat.bg}`}
                                        >
                                            <cat.icon
                                                size={22}
                                                color={selectedCategory === cat.id ? 'white' : cat.color}
                                            />
                                        </View>
                                        <Text
                                            style={tw`text-[10px] font-bold text-center 
                      ${selectedCategory === cat.id ? 'text-gray-900' : 'text-gray-500'}`}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>


                            <View style={tw`mb-4`}>
                                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>Date</Text>
                                <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                    <Calendar size={20} color="#9ca3af" />
                                    <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                    <Text style={tw`text-gray-800 font-medium`}>{date}</Text>
                                </View>
                            </View>


                            <View style={tw`mb-8`}>
                                <Text style={tw`text-gray-600 text-sm font-bold mb-2 ml-1`}>Note</Text>
                                <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                    <FileText size={20} color="#9ca3af" />
                                    <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                    <TextInput
                                        placeholder="Add a note..."
                                        placeholderTextColor="#9ca3af"
                                        value={note}
                                        onChangeText={setNote}
                                        style={tw`flex-1 text-gray-800 font-medium`}
                                    />
                                </View>
                            </View>


                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={tw`rounded-2xl py-4 items-center shadow-lg 
                ${type === 'expense' ? 'bg-[#e2136e] shadow-pink-200' : 'bg-[#10b981] shadow-green-200'}`}
                                onPress={() => router.back()}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <CheckCircle size={20} color="white" style={tw`mr-2`} />
                                    <Text style={tw`text-white font-bold text-lg tracking-wide`}>Save Transaction</Text>
                                </View>
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

export default AddTransactionScreen;