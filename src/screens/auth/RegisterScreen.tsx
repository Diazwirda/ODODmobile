/**
 * RegisterScreen — Task 12.3
 *
 * Full registration form using React Hook Form + Zod.
 * Fields: name, email, password, password_confirmation, department (optional), position (optional).
 * Department is fetched from GET /api/departments and shown as a modal picker.
 * On 422 responses, server validation errors are applied per field.
 *
 * Requirements: 1.1, 1.2, 1.3, 14.5
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StackScreenProps } from '@react-navigation/stack';

import apiClient from '@api/client';
import { useAuthStore } from '@stores/authStore';
import type { Department, NormalizedError } from '@/types/common';
import type { AuthStackParamList } from '@navigation/types';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    name: z.string().min(1, 'Nama lengkap wajib diisi'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string(),
    department: z.string().optional(),
    position: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi password tidak cocok',
    path: ['password_confirmation'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Navigation Props ─────────────────────────────────────────────────────────

type Props = StackScreenProps<AuthStackParamList, 'RegisterScreen'>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }: Props) {
  const { register: authRegister, isLoading } = useAuthStore();

  // Department list state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);

  // ─── Form ────────────────────────────────────────────────────────────────────

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      department: '',
      position: '',
    },
  });

  const selectedDepartment = watch('department');

  // ─── Fetch Departments ───────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const { data } = await apiClient.get<Department[]>('/departments');
        if (!cancelled) {
          setDepartments(data);
        }
      } catch {
        // Non-critical — department is optional, silently fail
      } finally {
        if (!cancelled) {
          setDepartmentsLoading(false);
        }
      }
    };

    fetchDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    async (values: RegisterFormValues) => {
      try {
        await authRegister({
          name: values.name,
          email: values.email,
          password: values.password,
          password_confirmation: values.password_confirmation,
          department: values.department || undefined,
          position: values.position || undefined,
        });
        // Navigation is handled by RootNavigator reacting to isAuthenticated state change
      } catch (error) {
        const normalizedError = error as NormalizedError;

        if (normalizedError.statusCode === 422 && normalizedError.validationErrors) {
          // Apply per-field validation errors from server
          const fieldMap: Record<string, keyof RegisterFormValues> = {
            name: 'name',
            email: 'email',
            password: 'password',
            password_confirmation: 'password_confirmation',
            department: 'department',
            position: 'position',
          };

          Object.entries(normalizedError.validationErrors).forEach(([field, messages]) => {
            const formField = fieldMap[field];
            if (formField) {
              setError(formField, {
                type: 'server',
                message: messages[0],
              });
            }
          });
        } else {
          Alert.alert(
            'Pendaftaran Gagal',
            normalizedError.message ?? 'Terjadi kesalahan. Silakan coba lagi.'
          );
        }
      }
    },
    [authRegister, setError]
  );

  // ─── Department display label ─────────────────────────────────────────────

  const departmentLabel =
    departments.find((d) => d.name === selectedDepartment)?.name ?? selectedDepartment ?? '';

  // ─── Render ──────────────────────────────────────────────────────────────────

  const isButtonDisabled = isLoading || isSubmitting;

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
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Buat Akun Baru
          </Text>
          <Text style={styles.subtitle}>Isi data diri Anda untuk mendaftar</Text>
        </View>

        {/* ─── Nama Lengkap ────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nama Lengkap</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                accessibilityLabel="Nama lengkap"
              />
            )}
          />
          {errors.name ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.name.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Email ───────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Masukkan alamat email"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                accessibilityLabel="Email"
              />
            )}
          />
          {errors.email ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.email.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Password ────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Minimal 8 karakter"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="next"
                accessibilityLabel="Password"
              />
            )}
          />
          {errors.password ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.password.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Konfirmasi Password ─────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Konfirmasi Password</Text>
          <Controller
            control={control}
            name="password_confirmation"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.password_confirmation ? styles.inputError : null]}
                placeholder="Ulangi password"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                returnKeyType="next"
                accessibilityLabel="Konfirmasi password"
              />
            )}
          />
          {errors.password_confirmation ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.password_confirmation.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Departemen ──────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Departemen <Text style={styles.optionalText}>(opsional)</Text>
          </Text>

          {departmentsLoading ? (
            <View style={[styles.input, styles.pickerLoading]}>
              <ActivityIndicator size="small" color="#6B7280" />
            </View>
          ) : departments.length > 0 ? (
            /* Use modal picker when departments are available */
            <>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerButton,
                  errors.department ? styles.inputError : null,
                ]}
                onPress={() => setDepartmentModalVisible(true)}
                accessibilityLabel="Pilih departemen"
                accessibilityRole="button"
              >
                <Text
                  style={departmentLabel ? styles.pickerValueText : styles.pickerPlaceholderText}
                >
                  {departmentLabel || 'Pilih departemen'}
                </Text>
                <Text style={styles.pickerChevron}>▼</Text>
              </TouchableOpacity>

              {/* Clear department button */}
              {selectedDepartment ? (
                <TouchableOpacity
                  onPress={() => setValue('department', '')}
                  style={styles.clearButton}
                  accessibilityLabel="Hapus departemen"
                >
                  <Text style={styles.clearButtonText}>Hapus pilihan</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            /* Fallback to free-text when departments can't be loaded */
            <Controller
              control={control}
              name="department"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.department ? styles.inputError : null]}
                  placeholder="Masukkan nama departemen"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Departemen"
                />
              )}
            />
          )}

          {errors.department ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.department.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Jabatan ─────────────────────────────────────────────────────── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Jabatan <Text style={styles.optionalText}>(opsional)</Text>
          </Text>
          <Controller
            control={control}
            name="position"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.position ? styles.inputError : null]}
                placeholder="Masukkan jabatan Anda"
                placeholderTextColor="#9CA3AF"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                accessibilityLabel="Jabatan"
              />
            )}
          />
          {errors.position ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {errors.position.message}
            </Text>
          ) : null}
        </View>

        {/* ─── Daftar Button ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitButton, isButtonDisabled ? styles.submitButtonDisabled : null]}
          onPress={handleSubmit(onSubmit)}
          disabled={isButtonDisabled}
          accessibilityLabel="Daftar"
          accessibilityRole="button"
          accessibilityState={{ disabled: isButtonDisabled }}
        >
          {isLoading || isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Daftar</Text>
          )}
        </TouchableOpacity>

        {/* ─── Login Link ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('LoginScreen')}
          accessibilityLabel="Sudah punya akun? Masuk"
          accessibilityRole="button"
        >
          <Text style={styles.loginLinkText}>
            Sudah punya akun? <Text style={styles.loginLinkBold}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ─── Department Picker Modal ────────────────────────────────────────── */}
      <Modal
        visible={departmentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDepartmentModalVisible(false)}
          accessibilityLabel="Tutup pilihan departemen"
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Departemen</Text>
              <TouchableOpacity
                onPress={() => setDepartmentModalVisible(false)}
                accessibilityLabel="Tutup"
                accessibilityRole="button"
              >
                <Text style={styles.modalCloseText}>Tutup</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={departments}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedDepartment === item.name ? styles.modalItemSelected : null,
                  ]}
                  onPress={() => {
                    setValue('department', item.name, {
                      shouldValidate: true,
                    });
                    setDepartmentModalVisible(false);
                  }}
                  accessibilityLabel={`Pilih ${item.name}`}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedDepartment === item.name ? styles.modalItemTextSelected : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedDepartment === item.name ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // Header
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Field
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  optionalText: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },

  // Picker button
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerValueText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  pickerPlaceholderText: {
    fontSize: 15,
    color: '#9CA3AF',
    flex: 1,
  },
  pickerChevron: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 8,
  },
  clearButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },

  // Submit button
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Login link
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loginLinkBold: {
    color: '#2563EB',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  modalItemText: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
  },
  modalItemTextSelected: {
    color: '#2563EB',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    color: '#2563EB',
    marginLeft: 8,
  },
  modalSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
});
