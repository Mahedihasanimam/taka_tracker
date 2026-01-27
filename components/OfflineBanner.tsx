import { useNetworkStatus } from '@/utils/networkStatus';
import { WifiOff } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

const OfflineBanner = () => {
    const isConnected = useNetworkStatus();

    if (isConnected !== false) return null;

    return (
        <View style={tw`bg-amber-500 px-4 py-2 flex-row items-center justify-center`}>
            <WifiOff size={16} color="white" />
            <Text style={tw`text-white font-medium text-sm ml-2`}>
                You're offline. Data is saved locally.
            </Text>
        </View>
    );
};

export default OfflineBanner;
