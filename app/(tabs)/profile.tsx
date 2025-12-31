import { useLanguage } from '@/context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Bell,
    ChevronRight,
    CreditCard,
    Edit3,
    Globe,
    HelpCircle,
    Lock,
    LogOut,
    ShieldCheck,
    Smartphone,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const ProfileScreen = () => {
    const { lang, switchLanguage, t } = useLanguage();
    const router = useRouter();

    // Toggles State
    const [isNotifEnabled, setIsNotifEnabled] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

    // --- REUSABLE MENU ITEM COMPONENT ---
    const MenuItem = ({ icon: Icon, label, value, onPress, isDestructive = false, showChevron = true, showSwitch = false, switchValue, onSwitchChange }: any) => (
        <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            style={tw`flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0`}
        >
            <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 rounded-full ${isDestructive ? 'bg-red-50' : 'bg-gray-50'} items-center justify-center mr-4`}>
                    <Icon size={20} color={isDestructive ? '#ef4444' : '#4b5563'} />
                </View>
                <Text style={tw`text-sm font-bold ${isDestructive ? 'text-red-500' : 'text-gray-700'}`}>
                    {label}
                </Text>
            </View>

            <View style={tw`flex-row items-center`}>
                {value && <Text style={tw`text-xs font-bold text-gray-400 mr-2`}>{value}</Text>}

                {showSwitch ? (
                    <Switch
                        trackColor={{ false: "#e5e7eb", true: "#fbcfe8" }}
                        thumbColor={switchValue ? "#e2136e" : "#f4f3f4"}
                        onValueChange={onSwitchChange}
                        value={switchValue}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                ) : showChevron ? (
                    <ChevronRight size={18} color="#d1d5db" />
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-slate-50`}>

            {/* --- HEADER --- */}
            <LinearGradient
                colors={['#e2136e', '#be125a']}
                style={tw`h-72 px-6 pt-12 pb-24 rounded-b-[36px] shadow-lg relative z-0 items-center`}
            >
                <Text style={tw`text-white text-xl font-bold mb-6`}>{t('profileTitle')}</Text>

                {/* Profile Image Wrapper */}
                <View style={tw`relative`}>
                    <View style={tw`w-24 h-24 bg-white rounded-full items-center justify-center border-4 border-white/30 shadow-xl`}>
                        {/* Placeholder or Image */}
                        <User size={40} color="#e2136e" />
                        {/* <Image source={{ uri: '...' }} style={tw`w-full h-full rounded-full`} /> */}
                    </View>
                    <TouchableOpacity style={tw`absolute bottom-0 right-0 bg-gray-900 p-2 rounded-full border-2 border-white`}>
                        <Edit3 size={12} color="white" />
                    </TouchableOpacity>
                </View>

                <Text style={tw`text-white text-xl font-bold mt-4`}>Mahedi Hassan</Text>
                <Text style={tw`text-white/80 text-sm font-medium`}>+880 1712 345 678</Text>
            </LinearGradient>

            {/* --- BODY CONTENT --- */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-24 px-5 pt-4`}
                style={tw` z-10`}
            >

                {/* --- STATS ROW --- */}
                <View style={tw`flex-row justify-between mb-6`}>
                    <View style={tw`flex-1 bg-white p-4 rounded-2xl shadow-sm shadow-gray-200 mr-2 items-center`}>
                        <Text style={tw`text-gray-400 text-[10px] font-bold uppercase mb-1`}>{t('memberSince')}</Text>
                        <Text style={tw`text-gray-800 font-bold`}>Jan 2024</Text>
                    </View>
                    <View style={tw`flex-1 bg-white p-4 rounded-2xl shadow-sm shadow-gray-200 ml-2 items-center`}>
                        <Text style={tw`text-gray-400 text-[10px] font-bold uppercase mb-1`}>Status</Text>
                        <View style={tw`flex-row items-center`}>
                            <ShieldCheck size={14} color="#10b981" style={tw`mr-1`} />
                            <Text style={tw`text-green-600 font-bold`}>Verified</Text>
                        </View>
                    </View>
                </View>

                {/* --- SECTION 1: GENERAL --- */}
                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('general')}</Text>

                    <MenuItem
                        icon={User}
                        label={t('editProfile')}
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={CreditCard}
                        label="Payment Methods"
                        value="2 Cards"
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={Globe}
                        label={t('language')}
                        value={lang === 'bn' ? 'বাংলা' : 'English'}
                        onPress={() => switchLanguage(lang === 'bn' ? 'en' : 'bn')} // Simple Toggle
                    />
                    <MenuItem
                        icon={Bell}
                        label={t('notifications')}
                        showSwitch
                        showChevron={false}
                        switchValue={isNotifEnabled}
                        onSwitchChange={setIsNotifEnabled}
                    />
                </View>

                {/* --- SECTION 2: SECURITY --- */}
                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('security')}</Text>

                    <MenuItem
                        icon={Lock}
                        label="Change Password"
                        onPress={() => router.push('/auth/forgotPasswrod')}
                    />
                    <MenuItem
                        icon={Smartphone}
                        label="Biometric ID"
                        showSwitch
                        showChevron={false}
                        switchValue={isBiometricEnabled}
                        onSwitchChange={setIsBiometricEnabled}
                    />
                </View>

                {/* --- SECTION 3: SUPPORT --- */}
                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-8`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('support')}</Text>

                    <MenuItem
                        icon={HelpCircle}
                        label={t('helpCenter')}
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={ShieldCheck}
                        label={t('privacy')}
                        onPress={() => { }}
                    />
                    <MenuItem
                        icon={LogOut}
                        label={t('logout')}
                        isDestructive
                        showChevron={false}
                        onPress={() => router.replace('/')} // Logout Action
                    />
                </View>

                <View style={tw`items-center mb-4`}>
                    <Text style={tw`text-gray-400 text-xs font-medium`}>{t('version')}</Text>
                </View>

            </ScrollView>
        </View>
    );
};

export default ProfileScreen;