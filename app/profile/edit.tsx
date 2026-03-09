import { theme } from '@/constants/theme';
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
    const { user, avatarUri, updateUser, updateAvatar } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [phone] = useState(user?.phone || '');
    const [profileImage, setProfileImage] = useState<string | null>(avatarUri);
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
                await updateAvatar(profileImage);
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
            <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />

            {/* Header */}
            <View style={[tw`h-28 px-6 pt-12`, { backgroundColor: theme.colors.primary }]}>
                <TouchableOpacity onPress={() => router.back()} style={tw`flex-row items-center`}>
                    <ArrowLeft size={24} color={theme.colors.white} />
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
                                    <View style={tw`w-28 h-28 rounded-full border-4 border-teal-100 overflow-hidden bg-teal-50`}>
                                        {profileImage ? (
                                            <Image
                                                source={{ uri: profileImage }}
                                                style={{ width: '100%', height: '100%' }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <View style={tw`w-full h-full items-center justify-center`}>
                                                <User size={48} color={theme.colors.primary} />
                                            </View>
                                        )}
                                    </View>
                                    {/* Camera Badge */}
                                    <View style={[tw`absolute bottom-0 right-0 w-9 h-9 rounded-full items-center justify-center border-3 border-white`, { backgroundColor: theme.colors.primary }]}>
                                        <Camera size={16} color={theme.colors.white} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={showImageOptions} style={tw`mt-3`}>
                                <Text style={[tw`font-semibold text-sm`, { color: theme.colors.primary }]}>{t('changePhoto')}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Name Input */}
                        <View style={tw`mb-5`}>
                            <Text style={tw`text-gray-600 text-sm font-semibold mb-2 ml-1`}>
                                {t('nameLabel')}
                            </Text>
                            <View style={tw`flex-row items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50`}>
                                <User size={20} color={theme.colors.gray400} />
                                <View style={tw`h-6 w-[1px] bg-gray-300 mx-3`} />
                                <TextInput
                                    placeholder={t('namePlaceholder')}
                                    placeholderTextColor={theme.colors.gray400}
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
                                <Phone size={20} color={theme.colors.gray400} />
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
                            style={[
                                tw`rounded-2xl py-4 shadow-lg ${isLoading ? 'opacity-70' : ''}`,
                                { backgroundColor: theme.colors.primary }
                            ]}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.colors.white} />
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
