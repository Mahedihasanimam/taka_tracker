import { theme } from '@/constants/theme';
import { useNetworkStatus } from '@/utils/networkStatus';
import { WifiOff } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

const OfflineBanner = () => {
    const isConnected = useNetworkStatus();

    if (isConnected !== false) return null;

    return (
        <View style={tw`bg-amber-500 px-4 py-2 mt-4 flex-row items-center justify-center`}>
            <WifiOff size={16} color={theme.colors.white} />
            <Text style={[tw`font-medium text-sm ml-2`, { color: theme.colors.white }]}>
                You are offline. Data is saved locally.
            </Text>
        </View>
    );
};

export default OfflineBanner;
