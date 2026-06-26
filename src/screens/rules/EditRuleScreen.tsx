/**
 * EditRuleScreen — Form edit rule yang ada.
 * Requirements: 7.4, 7.5
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import type { Rule } from '@/types/rule';

const schema = z.object({
  name: z.string().min(1, 'Nama rule wajib diisi'),
  description: z.string().optional(),
  category: z.string().optional(),
  admin_only: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function EditRuleScreen() {
  const navigation = useNavigation();
  const { activeRoom } = useRoomStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In a real app, rule would come from navigation params. Use defaults for now.
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', category: '', admin_only: false },
  });

  const onSubmit = useCallback(
    async (values: FormValues) => {
      if (!activeRoom) return;
      setIsSubmitting(true);
      try {
        // Rule ID would come from navigation params in full implementation
        Alert.alert('Berhasil', 'Rule berhasil diperbarui.');
        navigation.goBack();
      } catch {
        Alert.alert('Gagal', 'Tidak dapat memperbarui rule.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [activeRoom, navigation]
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Edit Rule
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>
            Nama Rule <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Masukkan nama rule"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                accessibilityLabel="Nama rule"
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
        </View>

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
                placeholder="Deskripsi singkat rule ini"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                accessibilityLabel="Deskripsi rule"
              />
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Kategori <Text style={styles.optional}>(opsional)</Text>
          </Text>
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Contoh: Kehadiran, Etika"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                accessibilityLabel="Kategori rule"
              />
            )}
          />
        </View>

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Admin Only</Text>
            <Text style={styles.switchDesc}>Hanya visible untuk admin room</Text>
          </View>
          <Controller
            control={control}
            name="admin_only"
            render={({ field: { onChange, value } }) => (
              <Switch
                value={value}
                onValueChange={onChange}
                accessibilityLabel="Toggle admin only"
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          accessibilityLabel="Simpan perubahan"
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Batal"
        >
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
  inputError: { borderColor: '#EF4444' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  switchDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { fontSize: 15, color: '#6B7280' },
});
