/**
 * JoinRoomScreen — Formulir bergabung ke room dengan kode undangan.
 *
 * Requirements: 4.5, 4.6, 4.7, 4.8
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useRoomStore } from '@stores/roomStore';
import type { AppStackParamList } from '@navigation/types';
import type { NormalizedError } from '@/types/common';

type Nav = StackNavigationProp<AppStackParamList>;

export default function JoinRoomScreen() {
  const navigation = useNavigation<Nav>();
  const { joinRoom, setActiveRoom } = useRoomStore();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoin = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Kode undangan wajib diisi.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const room = await joinRoom(trimmed);
      setActiveRoom(room);
      navigation.navigate('RoomTabNavigator', {
        screen: 'HomeTab',
        params: { screen: 'RoomHomeScreen' },
      });
    } catch (err) {
      const normalized = err as NormalizedError;
      if (normalized.statusCode === 422) {
        setError('Kode room tidak valid atau sedang nonaktif.');
      } else {
        Alert.alert('Gagal', normalized.message ?? 'Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [code, joinRoom, navigation, setActiveRoom]);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          Gabung Room
        </Text>
        <Text style={styles.subtitle}>Masukkan kode undangan yang diberikan oleh Admin Room.</Text>

        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Masukkan kode undangan"
          placeholderTextColor="#9CA3AF"
          value={code}
          onChangeText={(t) => {
            setCode(t);
            if (error) setError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleJoin}
          accessibilityLabel="Kode undangan room"
        />
        {error ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleJoin}
          disabled={isLoading}
          accessibilityLabel="Gabung ke room"
          accessibilityRole="button"
          accessibilityState={{ disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Gabung</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Batal"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 18,
    letterSpacing: 2,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 4,
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', textAlign: 'center', marginBottom: 8 },
  btn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 15, color: '#6B7280' },
});
