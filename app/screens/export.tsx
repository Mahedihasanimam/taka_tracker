import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Download,
    FileSpreadsheet,
    FileText,
    Image as ImageIcon,
    ShieldCheck
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const ExportScreen = () => {
    const { t } = useLanguage();
    const router = useRouter();

    // --- STATE ---
    const [range, setRange] = useState('30days');
    const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
    const [includeReceipts, setIncludeReceipts] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // --- MOCK ACTION ---
    const handleExport = () => {
        setIsExporting(true);
        // Simulate API/Generation Delay
        setTimeout(() => {
            setIsExporting(false);
            Alert.alert('Success', t('successExport'), [
                { text: 'Open', onPress: () => console.log('Open File') },
                { text: 'Close' }
            ]);
        }, 2000);
    };

    // --- REUSABLE RANGE OPTION ---
    const RangeOption = ({ id, label }: { id: string, label: string }) => (
        <TouchableOpacity
            onPress={() => setRange(id)}
            activeOpacity={0.7}
            style={tw`w-[48%] py-3 px-4 rounded-xl border mb-3 flex-row justify-between items-center 
      ${range === id ? 'bg-[#e2136e] border-[#e2136e]' : 'bg-gray-50 border-gray-100'}`}
        >
            <Text style={tw`text-xs font-bold ${range === id ? 'text-white' : 'text-gray-600'}`}>
                {label}
            </Text>
            {range === id && <CheckCircle size={14} color="white" />}
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`h-64 px-6 pt-12 rounded-b-[36px] shadow-lg z-0 relative`}
            >
                <View style={tw`flex-row justify-between items-center mb-4`}>
                    <TouchableOpacity onPress={() => router.back()} style={tw`bg-white/20 p-2 rounded-full`}>
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View style={tw`bg-white/20 p-2 rounded-full`}>
                        <ShieldCheck size={24} color="white" />
                    </View>
                </View>

                <Text style={tw`text-white text-2xl font-extrabold tracking-wide mb-1`}>
                    {t('exportTitle')}
                </Text>
                <Text style={tw`text-white/80 text-sm font-medium`}>
                    {t('exportSub')}
                </Text>
            </LinearGradient>

            {/* --- BODY --- */}
            <View style={tw`flex-1 -mt-16 px-6`}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>

                    <View style={tw`bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200`}>

                        {/* 1. DATE RANGE SECTION */}
                        <View style={tw`flex-row items-center mb-4`}>
                            <Calendar size={18} color="#6b7280" style={tw`mr-2`} />
                            <Text style={tw`text-gray-800 font-bold text-sm`}>{t('selectRange')}</Text>
                        </View>

                        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
                            <RangeOption id="7days" label={t('last7')} />
                            <RangeOption id="30days" label={t('last30')} />
                            <RangeOption id="month" label={t('thisMonth')} />
                            <RangeOption id="all" label={t('allTime')} />
                        </View>

                        <View style={tw`h-[1px] bg-gray-100 mb-6`} />

                        {/* 2. FORMAT SECTION */}
                        <View style={tw`flex-row items-center mb-4`}>
                            <Download size={18} color="#6b7280" style={tw`mr-2`} />
                            <Text style={tw`text-gray-800 font-bold text-sm`}>{t('selectFormat')}</Text>
                        </View>

                        {/* PDF Option */}
                        <TouchableOpacity
                            onPress={() => setFormat('pdf')}
                            activeOpacity={0.8}
                            style={tw`flex-row items-center p-4 rounded-2xl border mb-3 
                ${format === 'pdf' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3`}>
                                <FileText size={20} color="#ef4444" />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-900 font-bold text-sm`}>PDF</Text>
                                <Text style={tw`text-gray-500 text-xs`}>{t('pdfDesc')}</Text>
                            </View>
                            <View style={tw`w-5 h-5 rounded-full border-2 ${format === 'pdf' ? 'border-red-500 bg-red-500' : 'border-gray-300'} items-center justify-center`}>
                                {format === 'pdf' && <View style={tw`w-2 h-2 rounded-full bg-white`} />}
                            </View>
                        </TouchableOpacity>

                        {/* CSV Option */}
                        <TouchableOpacity
                            onPress={() => setFormat('csv')}
                            activeOpacity={0.8}
                            style={tw`flex-row items-center p-4 rounded-2xl border mb-6
                ${format === 'csv' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3`}>
                                <FileSpreadsheet size={20} color="#10b981" />
                            </View>
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-gray-900 font-bold text-sm`}>Excel (CSV)</Text>
                                <Text style={tw`text-gray-500 text-xs`}>{t('csvDesc')}</Text>
                            </View>
                            <View style={tw`w-5 h-5 rounded-full border-2 ${format === 'csv' ? 'border-green-500 bg-green-500' : 'border-gray-300'} items-center justify-center`}>
                                {format === 'csv' && <View style={tw`w-2 h-2 rounded-full bg-white`} />}
                            </View>
                        </TouchableOpacity>

                        {/* 3. OPTIONS */}
                        <View style={tw`flex-row justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl`}>
                            <View style={tw`flex-row items-center`}>
                                <ImageIcon size={18} color="#6b7280" style={tw`mr-2`} />
                                <Text style={tw`text-gray-700 font-bold text-xs`}>{t('includeReceipts')}</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#e5e7eb", true: "#fbcfe8" }}
                                thumbColor={includeReceipts ? "#e2136e" : "#f4f3f4"}
                                onValueChange={setIncludeReceipts}
                                value={includeReceipts}
                                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                            />
                        </View>

                        {/* EXPORT BUTTON */}
                        <TouchableOpacity
                            onPress={handleExport}
                            disabled={isExporting}
                            activeOpacity={0.8}
                            style={tw`bg-[#1f2937] rounded-2xl py-4 shadow-lg shadow-gray-400 flex-row justify-center items-center`}
                        >
                            {isExporting ? (
                                <ActivityIndicator color="white" size="small" style={tw`mr-2`} />
                            ) : (
                                <Download size={20} color="white" style={tw`mr-2`} />
                            )}
                            <Text style={tw`text-white font-bold text-lg tracking-wide`}>
                                {isExporting ? t('exporting') : t('exportBtn')}
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* PREVIEW INFO */}
                    <View style={tw`mt-6 items-center`}>
                        <Text style={tw`text-gray-400 text-xs text-center`}>
                            Approx file size: {format === 'pdf' ? '2.4 MB' : '150 KB'}
                        </Text>
                        <Text style={tw`text-gray-400 text-xs text-center mt-1`}>
                            Transactions found: 45
                        </Text>
                    </View>

                </ScrollView>
            </View>
        </View>
    );
};

export default ExportScreen;