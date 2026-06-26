/**
 * CreateRoomScreen — Formulir pembuatan room baru.
 *
 * Requirements: 4.2, 4.3, 4.4, 14.5
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useRoomStore } from '@stores/roomStore';
import { validateImageFile } from '@utils/imageValidation';
import type { AppStackParamList } from '@navigation/types';
import type { ImageFile, NormalizedError } from '@/types/common';
import type { InviteCodeType } from '@/types/room';

type Nav = StackNavigationProp<AppStackParamList>;

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createRoomSchema = z
  .object({
    name: z.string().min(1, 'Nama room wajib diisi'),
    description: z.string().optional(),
    invite_code_type: z.enum(['generated', 'manual']),
    invite_code: z.string().optional(),
  })
  .refine(
    (data) =>
      data.invite_code_type !== 'manual' ||
      (data.invite_code && data.invite_code.trim().length > 0),
    {
      message: 'Kode undangan wajib diisi untuk tipe manual',
      path: ['invite_code'],
    },
  );

type FormValues = z.infer<typeof createRoomSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateRoomScreen() {
  const navigation = useNavigation<Nav>();
  const { createRoom } = useRoomStore();
  const [photo, setPhoto] = useState<ImageFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      invite_code_type: 'generated',
      invite_code: '',
    },
  });

  const inviteCodeType = watch('invite_code_type');

  // ── Image picker ──────────────────────────────────────────────────────────

  const handlePickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel || !result.assets?.length) return;

    const asset: Asset = result.assets[0];
    const file: ImageFile = {
      uri: asset.uri ?? '',
      type: (asset.type ?? 'image/jpeg') as ImageFile['type'],
      name: asset.fileName ?? 'photo.jpg',
      size: asset.fileSize ?? 0,
    };

    const validation = validateImageFile(file, 5);
    if (!validation.valid) {
      Alert.alert('Foto Tidak Valid', validation.error ?? 'Foto tidak valid.');
      return;
    }

    setPhoto(file);
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    async (values: FormValues) => {
      setIsSubmitting(true);
      try {
        await createRoom({
          name: values.name,
          description: values.description || undefined,
          photo: photo ?? undefined,
          invite_code_type: values.invite_code_type as InviteCodeType,
          invite_code:
            values.invite_code_type === 'manual' ? values.invite_code : undefined,
        });
        navigation.navigate('RoomListScreen');
      } catch (err) {
        const normalized = err as NormalizedError;
        if (normalized.statusCode === 422 && normalized.validationErrors) {
          const map: Record<string, keyof FormValues> = {
            name: 'name',
            description: 'description',
            invite_code: 'invite_code',
          };
          Object.entries(normalized.validationErrors).forEach(([field, msgs]) => {
            const key = map[field];
            if (key) setError(key, { message: msgs[0] });
          });
        } else {
          Alert.alert(
            'Gagal',
            normalized.message ?? 'Terjadi kesalahan. Silakan coba lagi.',
          );
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [createRoom, navigation, photo, setError],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title} accessibilityRole="header">
          Buat Room Baru
        </Text>

        {/* ── Nama Room ──────────────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>Nama Room</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Masukkan nama room"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                accessibilityLabel="Nama room"
              />
            )}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name.message}</Text>
          )}
        </View>

        {/* ── Deskripsi ──────────────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Deskripsi <Text style={styles.optional}>(opsional)</Text>
          </Text>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Deskripsi singkat tentang room ini"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                accessibilityLabel="Deskripsi room"
              />
            )}
          />
        </View>

        {/* ── Foto Room ──────────────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Foto Room <Text style={styles.optional}>(opsional)</Text>
          </Text>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={handlePickPhoto}
            accessibilityLabel="Pilih foto room"
            accessibilityRole="button"
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>📷 Pilih Foto</Text>
              </View>
            )}
          </TouchableOpacity>
          {photo && (
            <TouchableOpacity
              onPress={() => setPhoto(null)}
              style={styles.removePhoto}
              accessibilityLabel="Hapus foto room"
            >
              <Text style={styles.removePhotoText}>Hapus foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Tipe Kode Undangan ─────────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipe Kode Undangan</Text>
          <Controller
            control={control}
            name="invite_code_type"
            render={({ field: { onChange, value } }) => (
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => onChange('generated')}
                  accessibilityLabel="Kode undangan otomatis"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: value === 'generated' }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      value === 'generated' && styles.radioCircleSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>Otomatis</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => onChange('manual')}
                  accessibilityLabel="Kode undangan manual"
                  accessibilityRole="radio"
                  accessibilityState={{ checked: value === 'manual' }}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      value === 'manual' && styles.radioCircleSelected,
                    ]}
                  />
                  <Text style={styles.radioLabel}>Manual</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* ── Kode Undangan Manual (conditional) ────────────────────────── */}
        {inviteCodeType === 'manual' && (
          <View style={styles.field}>
            <Text style={styles.label}>Kode Undangan</Text>
            <Controller
              control={control}
              name="invite_code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.invite_code && styles.inputError]}
                  placeholder="Masukkan kode undangan"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  accessibilityLabel="Kode undangan manual"
                />
              )}
            />
            {errors.invite_code && (
              <Text style={styles.errorText}>{errors.invite_code.message}</Text>
            )}
          </View>
        )}

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          accessibilityLabel="Buat room"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmitting }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Buat Room</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Batal"
          accessibilityRole="button"
        >
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  optional: { fontWeight: '400', color: '#9CA3AF' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FFF5F5' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  photoButton: { borderRadius: 8, overflow: 'hidden' },
  photoPreview: { width: '100%', height: 160, borderRadius: 8, resizeMode: 'cover' },
  photoPlaceholder: {
    height: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  photoPlaceholderText: { fontSize: 14, color: '#9CA3AF' },
  removePhoto: { marginTop: 6 },
  removePhotoText: { fontSize: 12, color: '#EF4444', textDecorationLine: 'underline' },
  radioGroup: { flexDirection: 'row', gap: 20 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioCircleSelected: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
  radioLabel: { fontSize: 15, color: '#374151' },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { fontSize: 15, color: '#6B7280' },
});
