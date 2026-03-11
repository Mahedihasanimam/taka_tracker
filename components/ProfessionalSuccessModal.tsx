import { theme } from '@/constants/theme';
import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

type ProfessionalSuccessModalProps = {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  secondaryButtonText?: string;
  onConfirm: () => void;
  onSecondaryPress?: () => void;
  onDismiss: () => void;
};

const ProfessionalSuccessModal = ({
  visible,
  title,
  message,
  buttonText,
  secondaryButtonText,
  onConfirm,
  onSecondaryPress,
  onDismiss,
}: ProfessionalSuccessModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={[
          tw`flex-1 items-center justify-center px-5`,
          { backgroundColor: 'rgba(15, 23, 42, 0.52)' },
        ]}
      >
        <Pressable style={tw`w-full max-w-[380px]`}>
          <View
            style={[
              tw`bg-white rounded-2xl px-6 py-6`,
              {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                elevation: 10,
              },
            ]}
          >
            <View style={tw`items-center mb-4`}>
              <CheckCircle size={48} color={theme.colors.success} />
            </View>

            <Text style={tw`text-center text-gray-900 text-xl font-bold mb-2`}>
              {title}
            </Text>
            <Text style={tw`text-center text-gray-500 text-sm leading-5 mb-6`}>
              {message}
            </Text>

            {secondaryButtonText ? (
              <View style={tw`flex-row`}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onSecondaryPress}
                  style={tw`flex-1 h-11 rounded-lg border border-gray-200 bg-white mr-2 items-center justify-center`}
                >
                  <Text style={tw`text-center text-gray-700 font-semibold text-sm`}>
                    {secondaryButtonText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onConfirm}
                  style={tw`flex-1 h-11 rounded-lg bg-green-600 ml-2 items-center justify-center`}
                >
                  <Text style={tw`text-center text-white font-semibold text-sm`}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onConfirm}
                style={tw`h-11 rounded-lg bg-green-600 items-center justify-center`}
              >
                <Text style={tw`text-center text-white font-semibold text-sm`}>
                  {buttonText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ProfessionalSuccessModal;
