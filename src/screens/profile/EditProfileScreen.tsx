/**
 * EditProfileScreen — Form edit profil user.
 * Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import type { UserProfile } from '@/types/profile';

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  age: z.string().optional().refine(v => !v || (Number(v) >= 17 && Number(v) <= 90), { message: 'Usia harus antara 17–90 tahun' }),
  department: z.string().optional(),
  position: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const { activeRoom } = useRoomStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', age: '', department: '', position: '' },
  });

  // Load current profile data
  useEffect(() => {
    if (!activeRoom) return;
    apiClient.get<{ profile: UserProfile }>(`/rooms/${activeRoom.id}/profile`)
      .then(({ data }) => {
        reset({
          name: data.profile.name,
          age: data.profile.age ? String(data.profile.age) : '',
          department: data.profile.department ?? '',
          position: data.profile.position ?? '',
        });
      })
      .catch(() => {/* Silently fail — form starts with empty defaults */});
  }, [activeRoom, reset]);

  const onSubmit = useCallback(async (values: FormValues) => {
    if (!activeRoom) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/rooms/${activeRoom.id}/profile`, {
        name: values.name,
        age: values.age ? Number(values.age) : undefined,
        department: values.department || undefined,
        position: values.position || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan perubahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeRoom, navigation]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">Edit Profil</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nama <Text style={styles.required}>*</Text></Text>
          <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={[styles.input, errors.name && styles.inputError]}
              placeholder="Nama lengkap" placeholderTextColor="#9CA3AF"
              onChangeText={onChange} onBlur={onBlur} value={value}
              autoCapitalize="words" accessibilityLabel="Nama" />
          )} />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Usia <Text style={styles.optional}>(opsional, 17–90)</Text></Text>
          <Controller control={control} name="age" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={[styles.input, errors.age && styles.inputError]}
              placeholder="Usia Anda" placeholderTextColor="#9CA3AF"
              keyboardType="numeric" onChangeText={onChange} onBlur={onBlur} value={value}
              accessibilityLabel="Usia" />
          )} />
          {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Departemen <Text style={styles.optional}>(opsional)</Text></Text>
          <Controller control={control} name="department" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={styles.input} placeholder="Departemen Anda"
              placeholderTextColor="#9CA3AF" onChangeText={onChange} onBlur={onBlur} value={value}
              autoCapitalize="words" accessibilityLabel="Departemen" />
          )} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Jabatan <Text style={styles.optional}>(opsional)</Text></Text>
          <Controller control={control} name="position" render={({ field: { onChange, onBlur, value } }) => (
            <TextInput style={styles.input} placeholder="Jabatan Anda"
              placeholderTextColor="#9CA3AF" onChangeText={onChange} onBlur={onBlur} value={value}
              autoCapitalize="words" returnKeyType="done" onSubmitEditing={handleSubmit(onSubmit)}
              accessibilityLabel="Jabatan" />
          )} />
        </View>

        <TouchableOpacity style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)} disabled={isSubmitting}
          accessibilityLabel="Simpan perubahan profil" accessibilityRole="button">
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Simpan Perubahan</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} accessibilityLabel="Batal">
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8, marginBottom: 10 },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 15, color: '#6B7280' },
});
