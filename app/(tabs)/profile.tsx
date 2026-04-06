import { BillingCycle } from '@/components/onboarding/PaywallCard';
import ThemePaywallModal from '@/components/ThemePaywallModal';
import { PAYWALL_PLANS } from '@/constants/paywallPlans';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { useThemePreferences } from '@/context/ThemeContext';
import { backupUserDataToSupabase, importBackupFromJsonFile, restoreLatestUserBackupFromSupabase } from '@/services/backup';
import { resetUserData } from '@/services/db';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Bell,
    ChevronRight,
    Crown,
    Database,
    Edit3,
    FileUp,
    Globe,
    HelpCircle,
    Lock,
    LogIn,
    LogOut,
    RefreshCcw,
    RotateCcw,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Upload,
    User,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import tw from 'twrnc';

const ProfileScreen = () => {
    const { t } = useLanguage();
    const { currency } = useCurrency();
    const { showSuccess } = useSuccessModal();
    const { user, avatarUri, logout, isAuthenticated } = useAuth();
    const { activeTheme, isPro, unlockPro } = useThemePreferences();
    const router = useRouter();

    const [isNotifEnabled, setIsNotifEnabled] = useState(true);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('yearly');
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);
    const [isUnlockingPro, setIsUnlockingPro] = useState(false);

    const selectedPlan = PAYWALL_PLANS[billingCycle];

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

    const promptLoginForSync = () => {
        Alert.alert(
            'Login required',
            'Please login to sync, backup, restore, and manage account settings.',
            [
                { text: t('cancel'), style: 'cancel' },
                { text: 'Login', onPress: () => router.push('/auth/signIn') },
            ],
        );
    };

    const handleBackup = async () => {
        if (!user?.id || isBackingUp) {
            promptLoginForSync();
            return;
        }
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
        if (!user?.id || isResetting) {
            promptLoginForSync();
            return;
        }

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
            ],
        );
    };

    const handleRestoreData = () => {
        if (!user?.id || isRestoring) {
            promptLoginForSync();
            return;
        }

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
            ],
        );
    };

    const handleImportBackup = async () => {
        if (!user?.id || isImporting) {
            promptLoginForSync();
            return;
        }
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

    const openPaywall = () => {
        if (isPro) {
            showSuccess({
                title: t('youArePro'),
                message: t('proSummary'),
            });
            return;
        }
        setIsPaywallVisible(true);
    };

    const closePaywall = () => {
        setIsPaywallVisible(false);
    };

    const handleUnlockPro = async () => {
        if (isPro) {
            closePaywall();
            return;
        }

        setIsUnlockingPro(true);
        try {
            await unlockPro();
            showSuccess({ title: t('success'), message: t('unlockProSuccess') });
        } catch (error) {
            console.error('Pro upgrade failed', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsUnlockingPro(false);
            closePaywall();
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('logoutConfirmTitle'),
            t('logoutConfirmMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
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
            ],
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
                style={tw`h-72 px-6 pt-6 pb-24 rounded-b-[36px] shadow-lg relative z-0 items-center`}
            >
                <Text style={tw`text-white text-xl font-bold mb-3`}>{t('profileTitle')}</Text>

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
                        onPress={() => {
                            if (!isAuthenticated) {
                                promptLoginForSync();
                                return;
                            }
                            router.push('/profile/edit');
                        }}
                    >
                        <Edit3 size={12} color={theme.colors.white} />
                    </TouchableOpacity>
                </View>

                <View style={tw`flex-row items-center mt-4`}>
                    <Text style={tw`text-white text-xl font-bold`}>
                        {user?.name || t('guest')}
                    </Text>
                    {!isPro && (
                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={openPaywall}
                            style={tw`ml-3 px-3 py-1.5 rounded-full bg-amber-300 flex-row items-center`}
                        >
                            <Crown size={12} color={theme.colors.darkSlate} />
                            <Text style={tw`text-slate-900 text-[11px] font-extrabold ml-1 uppercase tracking-wide`}>
                                Upgrade to Pro
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={tw`text-white/80 text-sm font-medium`}>
                    {formatPhone(user?.phone)}
                </Text>
                {isPro && (
                    <View style={tw`flex-row items-center mt-3 px-4 py-1.5 rounded-full bg-white/15`}>
                        <Crown size={14} color={theme.colors.white} />
                        <Text style={tw`text-white text-xs font-semibold ml-2`}>
                            {t('youArePro')}
                        </Text>
                    </View>
                )}
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
                            <ShieldCheck size={14} color={isAuthenticated ? theme.colors.success : theme.colors.mutedText} style={tw`mr-1`} />
                            <Text style={tw`font-bold ${isAuthenticated ? 'text-green-600' : 'text-gray-500'}`}>
                                {isAuthenticated ? t('verified') : 'Guest'}
                            </Text>
                        </View>
                    </View>
                </View>

                {!isAuthenticated && (
                    <TouchableOpacity
                        style={[tw`rounded-2xl px-5 py-4 mb-6 flex-row items-center justify-center`, { backgroundColor: theme.colors.primary }]}
                        onPress={() => router.push('/auth/signIn')}
                        activeOpacity={0.85}
                    >
                        <LogIn size={18} color={theme.colors.white} />
                        <Text style={tw`text-white font-bold text-base ml-2`}>Login to sync your data</Text>
                    </TouchableOpacity>
                )}

                {!isPro && (
                    <LinearGradient
                        colors={activeTheme.previewGradient}
                        style={tw`rounded-3xl p-5 mb-6 shadow-lg`}
                    >
                        <View style={tw`flex-row items-start justify-between`}>
                            <View style={tw`flex-1 pr-3`}>
                                <View style={tw`flex-row items-center mb-2`}>
                                    <Crown size={18} color={theme.colors.white} />
                                    <Text style={tw`text-white font-bold text-base ml-2`}>
                                        {t('upgradeToPro')}
                                    </Text>
                                </View>
                                <Text style={tw`text-white/90 text-sm leading-5`}>
                                    {t('proSummary')}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={tw`px-4 py-2 rounded-full bg-white/20 border border-white/30`}
                                activeOpacity={0.85}
                                onPress={openPaywall}
                            >
                                <Text style={tw`text-white font-semibold text-xs uppercase tracking-wide`}>
                                    {t('upgradeToPro')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={tw`flex-row items-center mt-4`}>
                            <Sparkles size={16} color={theme.colors.accent} />
                            <Text style={tw`text-white/80 text-xs font-semibold ml-2`}>
                                {selectedPlan.selectedSummary} · {selectedPlan.billingNote}
                            </Text>
                        </View>
                    </LinearGradient>
                )}

                <View style={tw`bg-white rounded-3xl p-5 shadow-sm shadow-gray-200 mb-6`}>
                    <Text style={tw`text-gray-400 text-xs font-bold uppercase mb-2 ml-1`}>{t('general')}</Text>

                    <MenuItem
                        icon={User}
                        label={t('editProfile')}
                        onPress={() => {
                            if (!isAuthenticated) {
                                promptLoginForSync();
                                return;
                            }
                            router.push('/profile/edit');
                        }}
                    />

                    <MenuItem
                        icon={Globe}
                        label="Currency"
                        value={currency}
                        onPress={() => router.push('/screens/currency')}
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
                        onPress={() => {
                            if (!isAuthenticated) {
                                promptLoginForSync();
                                return;
                            }
                            router.push('/profile/changePassword');
                        }}
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
                    {isAuthenticated ? (
                        <MenuItem
                            icon={LogOut}
                            label={t('logout')}
                            isDestructive
                            showChevron={false}
                            isLoading={isLoggingOut}
                            onPress={handleLogout}
                        />
                    ) : (
                        <MenuItem
                            icon={LogIn}
                            label="Login for cloud sync"
                            showChevron={false}
                            onPress={() => router.push('/auth/signIn')}
                        />
                    )}
                </View>

                <View style={tw`items-center mb-4`}>
                    <Text style={tw`text-gray-400 text-xs font-medium`}>{t('version')}</Text>
                </View>

            </ScrollView>

            <ThemePaywallModal
                visible={isPaywallVisible}
                billingCycle={billingCycle}
                onChangeBillingCycle={setBillingCycle}
                plans={PAYWALL_PLANS}
                selectedPlan={selectedPlan}
                isUnlocking={isUnlockingPro}
                isPro={isPro}
                onUnlock={handleUnlockPro}
                onClose={closePaywall}
                previewGradient={activeTheme.previewGradient}
                headline={t('upgradeToPro')}
                summary={t('proSummary')}
                loadingLabel={t('loading')}
                ctaLabel={t('goProCta')}
                proLabel={t('youArePro')}
            />
        </View>
    );
};

export default ProfileScreen;
