import CustomTabBar from "@/components/CustomTabBar";
import OfflineBanner from '@/components/OfflineBanner';
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <>
            <OfflineBanner />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: "none" },
                }}
                tabBar={() => <CustomTabBar />}
            >
                <Tabs.Screen name="index" />
                <Tabs.Screen name="transactions" />
                <Tabs.Screen name="analytics" />
                <Tabs.Screen name="profile" />
                <Tabs.Screen name="budget" options={{ href: null }} />
                <Tabs.Screen name="add" options={{ href: null }} />
            </Tabs>
        </>
    );
}
