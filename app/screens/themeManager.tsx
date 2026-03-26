import ThemePaywallModal from '@/components/ThemePaywallModal';
import { DEFAULT_BILLING_CYCLE, PAYWALL_PLANS } from '@/constants/paywallPlans';
import { theme } from '@/constants/theme';
import { useLanguage } from '@/context/LanguageContext';
import { useSuccessModal } from '@/context/SuccessModalContext';
import { useThemePreferences } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, BadgeCheck, Crown, Flame, Lock, Palette, Sparkles } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

const ThemeManagerScreen = () => {
    const { t } = useLanguage();
    const { showSuccess } = useSuccessModal();
    const { themes, activeTheme, activeThemeId, selectTheme, isPro, unlockPro } = useThemePreferences();
    const router = useRouter();

    const [billingCycle, setBillingCycle] = useState(DEFAULT_BILLING_CYCLE);
    const [isPaywallVisible, setIsPaywallVisible] = useState(false);
    const [pendingThemeId, setPendingThemeId] = useState<string | null>(null);
    const [isUnlockingPro, setIsUnlockingPro] = useState(false);

    const selectedPlan = PAYWALL_PLANS[billingCycle];
    const pendingTheme = useMemo(() => themes.find((preset) => preset.id === pendingThemeId), [pendingThemeId, themes]);
    const popularThemes = useMemo(() => themes.filter((preset) => preset.tier === 'premium'), [themes]);

    const openPaywall = (themeId?: string) => {
        if (isPro) {
            showSuccess({
                title: t('youArePro'),
                message: t('themePremiumHint'),
            });
            return;
        }
        setPendingThemeId(themeId ?? null);
        setIsPaywallVisible(true);
    };

    const closePaywall = () => {
        setIsPaywallVisible(false);
        setPendingThemeId(null);
    };

    const handleThemeSelection = async (themeId: string) => {
        const result = await selectTheme(themeId);
        if (result.applied && result.preset) {
            showSuccess({
                title: t('themeAppliedTitle'),
                message: `${t('themeAppliedMessage')} ${result.preset.name}`,
            });
            return;
        }

        if (result.reason === 'locked') {
            openPaywall(themeId);
            Alert.alert(t('proFeature'), t('premiumThemeLocked'));
            return;
        }

        Alert.alert(t('Opps'), t('somethingWrong'));
    };

    const handleUnlockPro = async () => {
        const themeToApply = pendingThemeId;
        if (isPro) {
            closePaywall();
            if (themeToApply) {
                await handleThemeSelection(themeToApply);
            }
            return;
        }

        setIsUnlockingPro(true);
        try {
            await unlockPro();
            showSuccess({ title: t('success'), message: t('unlockProSuccess') });
            if (themeToApply) {
                await handleThemeSelection(themeToApply);
            }
        } catch (error) {
            console.error('Pro upgrade failed', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsUnlockingPro(false);
            closePaywall();
        }
    };

    const handleManageTheme = (themeId: string, locked: boolean) => {
        if (locked) {
            openPaywall(themeId);
            return;
        }
        handleThemeSelection(themeId);
    };

    const renderPreviewCard = (preset: typeof themes[number]) => {
        const locked = preset.tier === 'premium' && !isPro;
        const isActive = preset.id === activeThemeId;
        const gradient = preset.previewGradient;

        return (
            <View key={preset.id} style={[tw`mb-4 px-2`, { width: '50%' }]}>
                <LinearGradient
                    colors={gradient}
                    style={tw`rounded-3xl p-4  h-64 shadow-lg justify-between`}
                >
                    <View>
                        <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-1 pr-2`}>
                                <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>
                                    {preset.name}
                                </Text>
                                <Text style={tw`text-white/80 text-[11px] mt-1`} numberOfLines={2}>
                                    {preset.description}
                                </Text>
                            </View>
                            {isActive ? (
                                <BadgeCheck size={18} color={theme.colors.lightSuccess} />
                            ) : locked ? (
                                <Lock size={16} color={theme.colors.white} />
                            ) : (
                                <Sparkles size={16} color={theme.colors.accent} />
                            )}
                        </View>

                        <View style={tw`bg-white/15 rounded-2xl p-3 mt-4`}>
                            <View style={tw`bg-white/70 rounded-2xl p-2 mb-2`}>
                                <View style={tw`flex-row items-center justify-between`}>
                                    <View>
                                        <View style={tw`h-2 w-12 rounded-full bg-black/10 mb-1`} />
                                        <View style={tw`h-2 w-16 rounded-full bg-black/10`} />
                                    </View>
                                    <View style={tw`bg-black/10 h-5 w-10 rounded-2xl`} />
                                </View>
                            </View>
                            <View style={tw`bg-white/10 rounded-2xl p-2`}>
                                <View style={tw`bg-white/40 h-2 w-20 rounded-full mb-1`} />
                                <View style={tw`bg-white/25 h-2 w-24 rounded-full`} />
                            </View>
                        </View>
                    </View>

                    <View>
                        <View style={tw`flex-row items-center justify-between mt-4  `}>
                            <View style={tw`px-3 py-1 rounded-full bg-white/15`}>
                                <Text style={tw`text-[10px] font-semibold text-white uppercase tracking-wide`}>
                                    {preset.tier === 'premium' ? 'PRO' : 'FREE'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    tw`px-3 py-1.5 rounded-2xl`,
                                    {
                                        backgroundColor: locked ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                                        borderWidth: 1,
                                        borderColor: isActive ? theme.colors.success : 'rgba(255,255,255,0.4)',
                                    },
                                ]}
                                disabled={isActive}
                                activeOpacity={0.85}
                                onPress={() => handleManageTheme(preset.id, locked)}
                            >
                                <Text style={tw`text-[11px] font-semibold text-white`}>
                                    {isActive ? t('youArePro') : locked ? t('upgradeToPro') : 'Apply Theme'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <View style={tw`flex-1  `}>
            <LinearGradient
                colors={activeTheme.previewGradient}
                style={tw`px-5 pt-14 pb-10 rounded-b-[32px] shadow-lg`}
            >
                <View style={tw`flex-row items-center justify-between mb-6`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={tw`w-10 h-10 rounded-full bg-white/20 items-center justify-center`}
                        activeOpacity={0.85}
                    >
                        <ArrowLeft size={18} color={theme.colors.white} />
                    </TouchableOpacity>
                    <Text style={tw`text-white font-bold text-base`}>
                        {t('themeSectionTitle')}
                    </Text>
                    <View style={tw`w-10 h-10`} />
                </View>
                <View>
                    <View style={tw`flex-row items-center mb-2`}>
                        <Crown size={18} color={theme.colors.white} />
                        <Text style={tw`text-white font-bold text-base ml-2`}>
                            {t('upgradeToPro')}
                        </Text>
                    </View>
                    <Text style={tw`text-white/85 text-sm leading-5`}>
                        {t('themeSectionSubtitle')}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`px-3 pt-6 pb-24`}
            >
                <View style={tw`mb-4 flex-row items-center justify-between`}>
                    <View>
                        <Text style={tw`text-gray-900 font-bold text-lg`}>
                            {t('themeSectionTitle')}
                        </Text>
                        <Text style={tw`text-gray-500 text-xs mt-1`}>
                            {t('themeSectionSubtitle')}
                        </Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                        <Palette size={18} color={theme.colors.gray400} />
                        <Text style={tw`text-gray-500 text-xs ml-1`}>{themes.length} presets</Text>
                    </View>
                </View>

                {popularThemes.length > 0 && (
                    <View style={tw`mb-6 bg-white rounded-3xl py-4 px-2 shadow-sm shadow-gray-200`}>
                        <View style={tw`flex-row items-center justify-between mb-3`}>
                            <View>
                                <Text style={tw`text-gray-900 font-extrabold text-base`}>
                                    Popular Themes
                                </Text>
                                <Text style={tw`text-gray-500 text-xs mt-1`}>
                                    Curated palettes trending this week
                                </Text>
                            </View>
                            <Flame size={18} color={theme.colors.warning} />
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={tw`pr-3`}
                        >
                            {popularThemes.map((preset) => {
                                const locked = preset.tier === 'premium' && !isPro;
                                return (
                                    <TouchableOpacity
                                        key={`popular-${preset.id}`}
                                        activeOpacity={0.85}
                                        style={[tw`mr-3`, { width: 200 }]}
                                        onPress={() => handleManageTheme(preset.id, locked)}
                                    >
                                        <LinearGradient
                                            colors={preset.previewGradient}
                                            style={tw`rounded-3xl p-4 shadow-lg shadow-gray-200`}
                                        >
                                            <Text style={tw`text-white font-bold text-base`} numberOfLines={1}>
                                                {preset.name}
                                            </Text>
                                            <Text style={tw`text-white/80 text-[11px] mt-1`} numberOfLines={2}>
                                                {preset.description}
                                            </Text>
                                            <View style={tw`flex-row items-center mt-3`}>
                                                <Sparkles size={14} color={theme.colors.accent} />
                                                <Text style={tw`text-white/75 text-[11px] ml-2`}>
                                                    {locked ? 'Pro exclusive' : 'Ready to apply'}
                                                </Text>
                                            </View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                <View style={[tw`flex-row flex-wrap`, { marginHorizontal: -8 }]}>
                    {themes.map(renderPreviewCard)}
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
                previewGradient={(pendingTheme?.previewGradient ?? activeTheme.previewGradient) as [string, string]}
                headline={pendingTheme?.name ?? t('upgradeToPro')}
                summary={pendingTheme?.description ?? t('proSummary')}
                loadingLabel={t('loading')}
                ctaLabel={t('goProCta')}
                proLabel={t('youArePro')}
            />
        </View>
    );
};

export default ThemeManagerScreen;
