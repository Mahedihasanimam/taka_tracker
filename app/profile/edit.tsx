import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { updateUserProfile } from '@/services/db';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ArrowLeft, Camera, Phone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import tw from 'twrnc';

const EditProfileScreen = () => {
    const { t } = useLanguage();
    const { user, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [phone] = useState(user?.phone || '');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Pick image from gallery
    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert(t('Opps'), t('galleryPermissionRequired'));
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.granted === false) {
                Alert.alert(t('Opps'), t('cameraPermissionRequired'));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert(t('Opps'), t('somethingWrong'));
        }
    };

    // Show image picker options
    const showImageOptions = () => {
        Alert.alert(
            t('changePhoto'),
            t('selectPhotoOption'),
            [
                { text: t('camera'), onPress: takePhoto },
                { text: t('gallery'), onPress: pickImage },
                { text: t('cancel'), style: 'cancel' },
            ]
        );
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert(t('Opps'), t('nameRequired'));
            return;
        }

        setIsLoading(true);
        try {
            // Note: In a real app, you'd upload the image to a server and save the URL
            const result = await updateUserProfile(user!.id, name.trim());
            if (result.success && result.user) {
                await updateUser(result.user);
                Alert.alert(
                    t('success'),
                    t('profileUpdateSuccess'),
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert(t('Opps'), result.message || t('somethingWrong'));
            }
        } catch (error) {
            Alert.alert(t('Opps'), t('somethingWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            <StatusBar backgroundColor="#e2136e" barStyle="light-content" />

            {/* Header */}
            <View style={tw`bg-[#e2136e] h-28 px-6 pt-12`}>
                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                    <ArrowLeft size={24} color="#fff" />
                    <Text style={tw`text-white text-lg font-bold ml-2`}>{t('editProfile')}</Text>
                </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={tw`flex-1 bg-white rounded-t-[32px] -mt-4`}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={tw`flex-1`}
                >
                    <ScrollView contentContainerStyle={tw`px-6 pt-8 pb-8`}>

                        {/* Profile Picture */}
                        <View style={tw`items-center mb-8`}>
                            <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
                                <View style={tw`relative`}>
                                    <View style={tw`w-28 h-28 rounded-full border-4 border-pink-100 overflow-hidden bg-pink-50`}>
                                        {profileImage ? (
                                            <Image
                                                source={{ uri: profileImage }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={tw`w-full h-full items-center justify-center`}>
                                                <User size={48} color="#e2136e" />
                                            </View>
                                        )}
                                    </View>
                                    {/* Camera Badge */}
                                    <View style={tw`absolute bottom-0 right-0 w-9 h-9 bg-[#e2136e] rounded-full items-center justify-center border-3 border-white`}>
                                        <Camera size={16} color="white" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={showImageOptions} style={tw`mt-3`}>
                                <Text style={tw`text-[#e2136e] font-semibold text-sm`}>{t('changePhoto')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Name Input */}
                        <View style={tw`mb-5`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('nameLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <User size={20} color="#9ca3af" />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('namePlaceholder')}
                                    placeholderTextColor="#9ca3af"
                                    value={name}
                                    onChangeText={setName}
                                    style={tw`flex-1 text-gray-800 text-base font-medium`}
                                />
                            </View>
                        </View>

                        {/* Phone Input (Read-only) */}
                        <View style={tw`mb-8`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('phoneLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-100`}>
                                <Phone size={20} color="#9ca3af" />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    value={phone}
                                    editable={false}
                                    style={tw`flex-1 text-gray-500 text-base font-medium`}
                                />
                            </View>
                            <Text style={tw`text-gray-400 text-xs mt-1 ml-1`}>
                                {t('phoneCannotChange')}
                            </Text>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isLoading}
                            activeOpacity={0.8}
                            style={tw`bg-[#e2136e] rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={tw`text-white text-center font-bold text-lg`}>
                                    {t('saveChanges')}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
};

export default EditProfileScreen;
