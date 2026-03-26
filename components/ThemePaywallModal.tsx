import PaywallCard, { BillingCycle, PaywallPlan } from '@/components/onboarding/PaywallCard';
import { theme } from '@/constants/theme';
import { X } from 'lucide-react-native';
import React from 'react';
import {
    Modal,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import tw from 'twrnc';

export type PaywallPlans = Record<BillingCycle, PaywallPlan>;

export type ThemePaywallModalProps = {
    visible: boolean;
    billingCycle: BillingCycle;
    onChangeBillingCycle: (cycle: BillingCycle) => void;
    plans: PaywallPlans;
    selectedPlan: PaywallPlan;
    isUnlocking: boolean;
    isPro: boolean;
    onUnlock: () => void;
    onClose: () => void;
    previewGradient: [string, string];
    headline: string;
    summary: string;
    loadingLabel: string;
    ctaLabel: string;
    proLabel: string;
};

const ThemePaywallModal = ({
    visible,
    billingCycle,
    onChangeBillingCycle,
    plans,
    selectedPlan,
    isUnlocking,
    isPro,
    onUnlock,
    onClose,
    previewGradient,
    headline,
    summary,
    loadingLabel,
    ctaLabel,
    proLabel,
}: ThemePaywallModalProps) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[tw`flex-1 justify-end `, { backgroundColor: theme.colors.overlayStrong }]}>
                <View
                    style={[
                        tw`rounded-t-[38px] pt-6 px-5 pb-8 border-t shadow-2xl`,
                        { backgroundColor: theme.colors.primary, borderColor: theme.colors.border },
                    ]}
                >
                    <View style={tw`items-center mb-5`}>
                        <View style={[tw`w-12 h-1.5 rounded-full`, { backgroundColor: theme.colors.gray200 }]} />
                    </View>

                    <TouchableOpacity
                        style={[
                            tw`absolute right-4 top-4 p-2 rounded-full`,
                            {
                                backgroundColor: theme.colors.card,
                                borderColor: theme.colors.border,
                                borderWidth: 1,
                            },
                        ]}
                        activeOpacity={0.85}
                        onPress={onClose}
                    >
                        <X size={18} color={theme.colors.gray600} />
                    </TouchableOpacity>




                    <View style={tw`h-140`}>
                        <PaywallCard
                            billingCycle={billingCycle}
                            onChangeBillingCycle={onChangeBillingCycle}
                            plans={plans}
                            selectedPlan={selectedPlan}
                        />
                    </View>


                    <TouchableOpacity
                        style={[tw`w-full rounded-2xl py-4 items-center`, { backgroundColor: theme.colors.primary }]}
                        activeOpacity={0.85}
                        onPress={onUnlock}
                        disabled={isUnlocking}
                    >
                        <Text style={tw`text-white font-bold text-base`}>
                            {isUnlocking ? loadingLabel : isPro ? proLabel : ctaLabel}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ThemePaywallModal;
