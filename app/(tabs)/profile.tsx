import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { backupUserDataToSupabase, importBackupFromJsonFile, restoreLatestUserBackupFromSupabase } from '@/services/backup';
import { resetUserData } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Bell,
    ChevronRight,
    CreditCard,
    Database,
    Edit3,
    FileUp,
    Globe,
    HelpCircle,
    Lock,
    LogOut,
    RefreshCcw,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    Upload,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const ProfileScreen = () => {
    const { lang, switchLanguage, t } = useLanguage();
    const { showSuccess } = useSuccessModal();
    const { user, avatarUri, logout } = useAuth();
    const router = useRouter();

    // Toggles State
    const [isNotifEnabled, setIsNotifEnabled] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const formatMemberSince = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatPhone = (phone?: string) => {
        if (!phone) return '';
        if (phone.length === 11) {
            return `+880 ${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
        }
        return phone;
    };

    const openLanguageSelector = () => {
        Alert.alert(
            t('language'),
            t('chooseLanguage'),
            [
                {
                    text: 'English',
                    onPress: () => switchLanguage('en')
                },
                {
                    text: 'বাংলা',
                    onPress: () => switchLanguage('bn')
                },
                {
                    text: t('cancel'),
                    style: 'cancel'
                }
            ]
        );
    };

    const handleBackup = async () => {
        if (!user?.id || isBackingUp) return;
        setIsBackingUp(true);
        try {
            const result = await backupUserDataToSupabase(user.id);
            if (result.success) {
                showSuccess({
                    title: t('success'),
                    message: result.message,
                });
            } else {
                Alert.alert(t('Opps'), result.message);
            }
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleResetData = () => {
        if (!user?.id || isResetting) return;

        Alert.alert(
            t('resetData'),
            t('resetDataConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsResetting(true);
                        try {
                            const success = await resetUserData(user.id);
                            if (success) {
                                showSuccess({
                                    title: t('success'),
                                    message: t('resetDataSuccess'),
                                });
                            } else {
                                Alert.alert(t('Opps'), t('somethingWrong'));
                            }
                        } finally {
                            setIsResetting(false);
                        }
                    },
                },
            ]
        );
    };

    const handleRestoreData = () => {
        if (!user?.id || isRestoring) return;

        Alert.alert(
            t('restoreData'),
            t('restoreDataConfirm'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('restoreData'),
                    onPress: async () => {
                        setIsRestoring(true);
                        try {
                            const result = await restoreLatestUserBackupFromSupabase(user.id);
                            if (result.success) {
                                showSuccess({
                                    title: t('success'),
                                    message: result.message,
                                });
                            } else {
                                Alert.alert(t('Opps'), result.message);
                            }
                        } finally {
                            setIsRestoring(false);
                        }
                    },
                },
            ]
        );
    };

    const handleImportBackup = async () => {
        if (!user?.id || isImporting) return;
        setIsImporting(true);
        try {
            const result = await importBackupFromJsonFile(user.id);
            if (result.success) {
                showSuccess({
                    title: t('success'),
                    message: result.message,
                });
            } else {
                Alert.alert(t('Opps'), result.message);
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('logoutConfirmTitle'),
            t('logoutConfirmMessage'),
            [
                {
                    text: t('cancel'),
                    style: 'cancel',
                },
                {
                    text: t('logout'),
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await logout();
                        } catch {
                            Alert.alert(t('Opps'), t('somethingWrong'));
                        } finally {
                            setIsLoggingOut(false);
                        }
                    },
                },
            ]
        );
    };

    const MenuItem = ({ icon: Icon, label, value, onPress, isDestructive = false, showChevron = true, showSwitch = false, switchValue, onSwitchChange, isLoading = false }: any) => (
        <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={isLoading}
            style={tw`flex-row items-center justify-between py-4 border-b border-gray-50 last:border-0 ${isLoading ? 'opacity-50' : ''}`}
        >
            <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 rounded-full ${isDestructive ? 'bg-red-50' : 'bg-gray-50'} items-center justify-center mr-4`}>
                    <Icon size={20} color={isDestructive ? theme.colors.danger : theme.colors.gray600} />
                </View>
                <Text style={tw`text-sm font-bold ${isDestructive ? 'text-red-500' : 'text-gray-700'}`}>
                    {label}
                </Text>
            </View>

            <View style={tw`flex-row items-center`}>
                {value && <Text style={tw`text-xs font-bold text-gray-400 mr-2`}>{value}</Text>}

                {showSwitch ? (
                    <Switch
                        trackColor={{ false: theme.colors.border, true: theme.colors.lightMint }}
                        thumbColor={switchValue ? theme.colors.primary : theme.colors.whiteSoft}
                        onValueChange={onSwitchChange}
                        value={switchValue}
                        style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                ) : showChevron ? (
                    <ChevronRight size={18} color={theme.colors.gray300} />
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-slate-50`}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                style={tw`h-72 px-6 pt-12 pb-24 rounded-b-[36px] shadow-lg relative z-0 items-center`}
            >
                <Text style={tw`text-white text-xl font-bold mb-6`}>{t('profileTitle')}</Text>

                <View style={tw`relative`}>
                    <View style={tw`w-24 h-24 bg-white rounded-full items-center justify-center border-4 border-white/30 shadow-xl`}>
                        {avatarUri ? (
                            <Image
                                source={{ uri: avatarUri }}
                                style={{ width: 88, height: 88, borderRadius: 999 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <User size={40} color={theme.colors.primary} />
                        )}
                    </View>
                    <TouchableOpacity
                        style={tw`absolute bottom-0 right-0 bg-gray-900 p-2 rounded-full border-2 border-white`}
                        onPress={() => router.push('/profile/edit')}
                    >
                        <Edit3 size={12} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                <Text style={tw`text-white text-xl font-bold mt-4`}>
                    {user?.name || t('guest')}
                </Text>
                <Text style={tw`text-white/80 text-sm font-medium`}>
                    {formatPhone(user?.phone)}
                </Text>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-24 px-5 pt-4`}
                style={tw`z-10`}
            >

                <View style={tw`flex-row justify-between mb-6`}>
                    <View style={tw`flex-1 bg-white p-4 rounded-2xl shadow-sm shadow-gray-200 mr-2 items-center`}>
                        <Text style={tw`text-gray-400 text-[10px] font-bold uppercase mb-1`}>{t('memberSince')}</Text>
                        <Text style={tw`text-gray-800 font-bold`}>
                            {formatMemberSince(user?.created_at)}
                        </Text>
                    </View>
                    <View style={tw`flex-1 bg-white p-4 rounded-2xl shadow-sm shadow-gray-200 ml-2 items-center`}>
                        <Text style={tw`text-gray-400 text-[10px] font-bold uppercase mb-1`}>{t('status')}</Text>
                        <View style={tw`flex-row items-center`}>
                            <ShieldCheck size={14} color={theme.colors.success} style={tw`mr-1`} />
                            <Text style={tw`text-green-600 font-bold`}>{t('verified')}</Text>
                        </View>
                    </View>
                </View>

                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('general')}</Text>

                    <MenuItem
                        icon={User}
                        label={t('editProfile')}
                        onPress={() => router.push('/profile/edit')}
                    />
                    <MenuItem
                        icon={CreditCard}
                        label={t('paymentMethods')}
                        value={t('comingSoon')}
                        onPress={() => Alert.alert(t('comingSoon'), t('featureComingSoon'))}
                    />
                    <MenuItem
                        icon={Globe}
                        label={t('language')}
                        value={lang === 'bn' ? 'বাংলা' : 'English'}
                        onPress={openLanguageSelector}
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

                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('security')}</Text>

                    <MenuItem
                        icon={Lock}
                        label={t('changePassword')}
                        onPress={() => router.push('/profile/changePassword')}
                    />
                    <MenuItem
                        icon={Smartphone}
                        label={t('biometricId')}
                        showSwitch
                        showChevron={false}
                        switchValue={isBiometricEnabled}
                        onSwitchChange={setIsBiometricEnabled}
                    />
                </View>

                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('dataManagement')}</Text>

                    <MenuItem
                        icon={Upload}
                        label={t('backupData')}
                        showChevron={false}
                        isLoading={isBackingUp}
                        onPress={handleBackup}
                    />
                    <MenuItem
                        icon={RefreshCcw}
                        label={t('resetData')}
                        showChevron={false}
                        isLoading={isResetting}
                        onPress={handleResetData}
                    />
                    <MenuItem
                        icon={RotateCcw}
                        label={t('restoreData')}
                        showChevron={false}
                        isLoading={isRestoring}
                        onPress={handleRestoreData}
                    />
                    <MenuItem
                        icon={FileUp}
                        label={t('importBackupFile')}
                        showChevron={false}
                        isLoading={isImporting}
                        onPress={handleImportBackup}
                    />
                    <View style={tw`flex-row items-start mt-3 px-1`}>
                        <Database size={14} color={theme.colors.mutedText} style={tw`mt-0.5 mr-2`} />
                        <Text style={tw`text-xs text-gray-500 flex-1`}>{t('backupHint')}</Text>
                    </View>
                </View>

                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-8`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('support')}</Text>

                    <MenuItem
                        icon={HelpCircle}
                        label={t('helpCenter')}
                        onPress={() => Alert.alert(t('helpCenter'), t('contactSupport'))}
                    />
                    <MenuItem
                        icon={ShieldCheck}
                        label={t('privacy')}
                        onPress={() => Alert.alert(t('privacy'), t('privacyInfo'))}
                    />
                    <MenuItem
                        icon={LogOut}
                        label={t('logout')}
                        isDestructive
                        showChevron={false}
                        isLoading={isLoggingOut}
                        onPress={handleLogout}
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
