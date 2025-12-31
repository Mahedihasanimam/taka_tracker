import { usePathname, useRouter } from "expo-router";
import { Home, List, PieChart, Plus, User } from "lucide-react-native";
import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import tw from "twrnc";

export default function CustomTabBar() {
    const router = useRouter();
    const pathname = usePathname();

    // Define tabs. We use a 'type' to distinguish the middle button.
    const tabs = [
        {
            name: "index", // This maps to app/(tabs)/index.tsx
            label: "Home",
            icon: Home,
            type: "standard",
        },
        {
            name: "transactions",
            label: "Transactions",
            icon: List,
            type: "standard",
        },
        {
            name: "add",
            label: "Add",
            icon: Plus,
            type: "action", // This is the middle button
        },
        {
            name: "budget",
            label: "Budget",
            icon: PieChart,
            type: "standard",
        },
        {
            name: "profile",
            label: "Profile",
            icon: User,
            type: "standard",
        },
    ];

    return (
        <View
            style={tw`flex-row bg-white pt-2 pb-${Platform.OS === "ios" ? "8" : "4"} px-2 justify-around items-end shadow-lg border-t border-gray-100 h-[85px]`}
        >
            {tabs.map((tab, index) => {
                const isActive =
                    (pathname === "/" && tab.name === "index") ||
                    pathname.includes(tab.name);

                // --- RENDER MIDDLE "ADD" BUTTON ---
                if (tab.type === "action") {
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => router.push("/add")} // Or open a modal
                            style={tw`items-center justify-center -top-8`}
                            activeOpacity={0.8}
                        >
                            <View
                                style={tw`w-16 h-16 bg-[#10b981] rounded-full items-center justify-center shadow-lg border-4 border-white`}
                            >
                                <Plus size={32} color="white" />
                            </View>
                            {/* Optional Label for Add Button */}
                            <Text style={tw`text-xs text-gray-400 font-medium mt-1`}>
                                Add
                            </Text>
                        </TouchableOpacity>
                    );
                }

                // --- RENDER STANDARD TABS ---
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            if (tab.name === 'index') router.push('/');
                            else router.push(`/${tab.name}`);
                        }}
                        style={tw`items-center justify-center w-16 h-full pb-2`}
                    >
                        {/* Icon */}
                        <tab.icon
                            size={24}
                            color={isActive ? "#e2136e" : "#9ca3af"} // Pink for active, Gray for inactive
                            strokeWidth={isActive ? 2.5 : 2}
                        />

                        {/* Label */}
                        <Text
                            style={tw`text-[10px] mt-1 ${isActive ? "text-[#e2136e] font-bold" : "text-gray-400 font-medium"
                                }`}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}