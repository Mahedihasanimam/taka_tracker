
import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";



export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: "none" },
            }}
            tabBar={() => <CustomTabBar />}
        >
            <Tabs.Screen name="index" />
          
        </Tabs>
    );
}