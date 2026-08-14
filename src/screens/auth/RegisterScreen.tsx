/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { useMultiAuthStore } from '../../stores/multiAuthStore';
import { BACKENDS } from '../../config/backends';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ route, navigation }: Props) {
  const { backend } = route.params;
  const backendConfig = BACKENDS[backend];

  const { registerToBackend, isLoading } = useMultiAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    department: '',
    position: '',
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Gagal', 'Lengkapi semua field wajib');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Gagal', 'Kata sandi minimal 8 karakter');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      Alert.alert('Gagal', 'Konfirmasi kata sandi tidak cocok');
      return;
    }

    try {
      await registerToBackend(backend, formData);
      // Navigation handled by RootNavigator after auth state change
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registrasi gagal';

      const errors = error.response?.data?.errors;
      if (errors) {
        const errorList = Object.values(errors).flat().join('\n');
        Alert.alert('Validasi Gagal', errorList);
      } else {
        Alert.alert('Registrasi Gagal', errorMessage);
      }
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backButtonText}>← Kembali ke Login</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Daftar ke {backendConfig.name}</Text>

            {backendConfig.features.emailRestriction && (
              <Text style={styles.subtitle}>
                Gunakan email {backendConfig.features.emailRestriction}
              </Text>
            )}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nama Lengkap <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="you@humanplus.co.id"
                value={formData.email}
                onChangeText={(value) => updateField('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text style={styles.hint}>
                Hanya email @humanplus.co.id yang diperbolehkan
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Kata Sandi <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 karakter"
                value={formData.password}
                onChangeText={(value) => updateField('password', value)}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {/* Password Confirmation */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Konfirmasi Kata Sandi <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan ulang kata sandi"
                value={formData.password_confirmation}
                onChangeText={(value) =>
                  updateField('password_confirmation', value)
                }
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            {/* Department (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Departemen (opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="contoh: Engineering, Marketing"
                value={formData.department}
                onChangeText={(value) => updateField('department', value)}
                editable={!isLoading}
              />
            </View>

            {/* Position (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Posisi (opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="contoh: Developer, Manager"
                value={formData.position}
                onChangeText={(value) => updateField('position', value)}
                editable={!isLoading}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Buat Akun</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={handleBackToLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginLinkText}>
                Sudah punya akun?{' '}
                <Text style={styles.loginLinkBold}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkBold: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});
