/**
 * LoginScreen — Layar autentikasi email/password dan Google OAuth.
 *
 * Requirements: 1.4, 1.5, 1.6, 2.1, 14.3, 14.5
 */

import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import Config from 'react-native-config';
import type { StackScreenProps } from '@react-navigation/stack';

import { useAuthStore } from '@stores/authStore';
import { normalizeError } from '@api/errorNormalizer';
import { extractGoogleToken } from '@utils/googleOAuth';
import type { AuthStackParamList } from '@navigation/types';
import type { NormalizedError } from '@/types/common';
import type { AxiosError } from 'axios';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Navigation prop type ─────────────────────────────────────────────────────

type Props = StackScreenProps<AuthStackParamList, 'LoginScreen'>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: Props) {
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ── Submit handler ──────────────────────────────────────────────────────────

  const onSubmit = async (values: LoginFormValues) => {
    setGeneralError(null);
    try {
      await login(values.email, values.password);
      // Navigation is handled by RootNavigator reacting to isAuthenticated
    } catch (err) {
      const normalized: NormalizedError = normalizeError(err as AxiosError);

      if (normalized.validationErrors) {
        // Map 422 validation errors to individual fields
        const { validationErrors } = normalized;
        if (validationErrors.email) {
          setError('email', { message: validationErrors.email[0] });
        }
        if (validationErrors.password) {
          setError('password', { message: validationErrors.password[0] });
        }
        // Show the general 422 message if it references both fields or neither
        if (!validationErrors.email && !validationErrors.password) {
          setGeneralError(normalized.message);
        }
      } else if (normalized.statusCode === 502 || normalized.statusCode === null) {
        // 502 = server down, null = network error — show Alert (Req 14.1, 14.2)
        Alert.alert('Kesalahan', normalized.message);
      } else {
        // 401 (wrong credentials), or any other unexpected status
        setGeneralError(normalized.message);
      }
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setGeneralError(null);
    try {
      const baseUrl = Config.API_BASE_URL?.replace('/api', '') ?? '';
      const url = `${baseUrl}/api/auth/google/redirect`;
      const redirectUrl = 'odob://auth/callback';

      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(url, redirectUrl, {
          // iOS
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: '#ffffff',
          preferredControlTintColor: '#000000',
          readerMode: false,
          animated: true,
          // Android
          showTitle: true,
          toolbarColor: '#ffffff',
          secondaryToolbarColor: '#000000',
          navigationBarColor: '#000000',
          navigationBarDividerColor: '#ffffff',
          enableUrlBarHiding: true,
          enableDefaultShare: false,
          forceCloseOnRedirection: true,
        });

        if (result.type === 'success' && result.url) {
          const token = extractGoogleToken(result.url);
          if (token) {
            await loginWithGoogle(token);
            // Navigation handled by RootNavigator via isAuthenticated
          } else if (result.url.includes('google_error=')) {
            // Req 2.4 — auth_failed or no_email error
            setGeneralError('Login dengan Google gagal. Silakan coba lagi.');
          }
        }
        // result.type === 'cancel' means user dismissed — do nothing
      } else {
        Alert.alert(
          'Browser Tidak Tersedia',
          'Tidak dapat membuka browser untuk login dengan Google.'
        );
      }
    } catch {
      Alert.alert('Kesalahan', 'Gagal membuka halaman login Google. Silakan coba lagi.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text className="text-3xl font-bold text-gray-900 mb-8 text-center">Masuk</Text>

        {/* General error banner */}
        {generalError ? (
          <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            <Text className="text-red-700 text-sm" accessibilityLabel={`Error: ${generalError}`}>
              {generalError}
            </Text>
          </View>
        ) : null}

        {/* Email field */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-base text-gray-900 bg-white ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="contoh@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="next"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                accessibilityLabel="Input email"
              />
            )}
          />
          {errors.email ? (
            <Text
              className="text-red-500 text-xs mt-1"
              accessibilityLabel={`Error email: ${errors.email.message}`}
            >
              {errors.email.message}
            </Text>
          ) : null}
        </View>

        {/* Password field */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-lg px-4 py-3 text-base text-gray-900 bg-white ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Minimal 8 karakter"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                autoComplete="password"
                returnKeyType="done"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                onSubmitEditing={handleSubmit(onSubmit)}
                accessibilityLabel="Input password"
              />
            )}
          />
          {errors.password ? (
            <Text
              className="text-red-500 text-xs mt-1"
              accessibilityLabel={`Error password: ${errors.password.message}`}
            >
              {errors.password.message}
            </Text>
          ) : null}
        </View>

        {/* Masuk button — disabled while loading (Req 14.5) */}
        <Pressable
          className={`rounded-lg py-4 items-center mb-4 ${
            isLoading ? 'bg-blue-300' : 'bg-blue-600 active:bg-blue-700'
          }`}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          accessibilityLabel="Tombol masuk"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? 'Memproses...' : 'Masuk'}
          </Text>
        </Pressable>

        {/* Masuk dengan Google button (Req 2.1) */}
        <Pressable
          className="border border-gray-300 rounded-lg py-4 items-center mb-6 active:bg-gray-50"
          onPress={handleGoogleLogin}
          accessibilityLabel="Masuk dengan Google"
          accessibilityRole="button"
        >
          <Text className="text-gray-700 font-semibold text-base">Masuk dengan Google</Text>
        </Pressable>

        {/* Navigate to RegisterScreen */}
        <View className="flex-row justify-center">
          <Text className="text-gray-600 text-sm">Belum punya akun? </Text>
          <Pressable
            onPress={() => navigation.navigate('RegisterScreen')}
            accessibilityLabel="Daftar akun baru"
            accessibilityRole="link"
          >
            <Text className="text-blue-600 text-sm font-semibold">Daftar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
