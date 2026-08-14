import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useRoomStore } from '../../stores/roomStore';
import { handleApiError, getValidationErrors } from '../../utils/toast';
import type { AppStackParamList } from '../../navigation/types';

const schema = z.object({
  code: z.string().min(1, 'Kode undangan wajib diisi'),
});

type FormData = z.infer<typeof schema>;

type Props = NativeStackScreenProps<AppStackParamList, 'JoinRoomScreen'>;

export default function JoinRoomScreen({ navigation }: Props) {
  const { joinRoom, setActiveRoom, fetchRooms } = useRoomStore();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  const onSubmit = async (values: FormData) => {
    setGeneralError(null);
    setIsLoading(true);
    try {
      const room = await joinRoom({ code: values.code });
      setActiveRoom(room);
      // Refresh room list agar data terbaru
      fetchRooms().catch(() => {});
      navigation.replace('RoomTabs', { screen: 'HomeTab' } as never);
    } catch (err: unknown) {
      const fieldErrors = getValidationErrors(err);
      if (fieldErrors?.code) {
        setError('code', { message: fieldErrors.code });
      } else {
        setGeneralError(handleApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gabung Room</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoEmoji}>🎫</Text>
            <Text style={styles.infoText}>
              Masukkan kode undangan yang Anda terima dari admin room.
            </Text>
          </View>

          {/* Error umum */}
          {generalError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.field}>
            <Text style={styles.label}>
              Kode Undangan <Text style={styles.required}>*</Text>
            </Text>
            <Controller
              control={control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.code ? styles.inputError : null]}
                  placeholder="Masukkan kode undangan"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.code ? (
              <Text style={styles.errorText}>{errors.code.message}</Text>
            ) : null}
          </View>

          {/* Tombol Gabung */}
          <TouchableOpacity
            style={[styles.btnPrimary, isLoading ? styles.btnDisabled : null]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Gabung"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Gabung</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 24, color: '#3B82F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoEmoji: { fontSize: 36, marginBottom: 8 },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: { color: '#DC2626', fontSize: 13 },
  field: { marginBottom: 18 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  btnPrimary: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
