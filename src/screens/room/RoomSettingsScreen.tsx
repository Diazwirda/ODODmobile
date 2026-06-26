/**
 * RoomSettingsScreen — Pengaturan room (admin only).
 * Requirements: 5.1–5.9
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  Alert, ActivityIndicator, Image, Clipboard, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import { validateImageFile } from '@utils/imageValidation';
import { getInitials } from '@utils/avatar';
import type { ImageFile } from '@/types/common';
import type { InviteCodeType } from '@/types/room';

const schema = z.object({
  name: z.string().min(1, 'Nama room wajib diisi'),
  description: z.string().optional(),
  invite_code_enabled: z.boolean(),
  invite_code_type: z.enum(['generated', 'manual']),
  invite_code: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function RoomSettingsScreen() {
  const navigation = useNavigation();
  const { activeRoom, updateRoom, deleteRoom, clearActiveRoom } = useRoomStore();
  const [photo, setPhoto] = useState<ImageFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: activeRoom?.name ?? '',
      description: activeRoom?.description ?? '',
      invite_code_enabled: activeRoom?.invite_code_enabled ?? true,
      invite_code_type: activeRoom?.invite_code_type ?? 'generated',
      invite_code: activeRoom?.invite_code ?? '',
    },
  });

  const inviteCodeEnabled = watch('invite_code_enabled');
  const inviteCodeType = watch('invite_code_type');

  const handlePickPhoto = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.length) return;
    const asset: Asset = result.assets[0];
    const file: ImageFile = {
      uri: asset.uri ?? '',
      type: (asset.type ?? 'image/jpeg') as ImageFile['type'],
      name: asset.fileName ?? 'photo.jpg',
      size: asset.fileSize ?? 0,
    };
    const validation = validateImageFile(file, 5);
    if (!validation.valid) { Alert.alert('Foto Tidak Valid', validation.error ?? ''); return; }
    setPhoto(file);
  }, []);

  const onSubmit = useCallback(async (values: FormValues) => {
    if (!activeRoom) return;
    setIsSubmitting(true);
    try {
      await updateRoom(activeRoom.id, {
        name: values.name,
        description: values.description || undefined,
        photo: photo ?? undefined,
        invite_code_enabled: values.invite_code_enabled,
        invite_code_type: values.invite_code_type as InviteCodeType,
        invite_code: values.invite_code_type === 'manual' ? values.invite_code : undefined,
      });
      Alert.alert('Berhasil', 'Pengaturan room telah diperbarui.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeRoom, photo, updateRoom]);

  const handleAddAdmin = useCallback(async () => {
    if (!activeRoom || !addAdminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      await apiClient.post(`/rooms/${activeRoom.id}/admins`, { email: addAdminEmail.trim() });
      setAddAdminEmail('');
      Alert.alert('Berhasil', 'Admin berhasil ditambahkan.');
    } catch (err: any) {
      const status = err?.statusCode ?? err?.response?.status;
      if (status === 404) {
        Alert.alert('Tidak Ditemukan', 'User dengan email tersebut belum terdaftar.');
      } else {
        Alert.alert('Gagal', 'Tidak dapat menambahkan admin.');
      }
    } finally {
      setAddingAdmin(false);
    }
  }, [activeRoom, addAdminEmail]);

  const handleDeleteRoom = useCallback(() => {
    if (!activeRoom) return;
    Alert.alert(
      'Hapus Room',
      `Hapus room "${activeRoom.name}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoom(activeRoom.id);
              clearActiveRoom();
              navigation.reset({ index: 0, routes: [{ name: 'RoomListScreen' as never }] });
            } catch {
              Alert.alert('Gagal', 'Tidak dapat menghapus room.');
            }
          },
        },
      ]
    );
  }, [activeRoom, deleteRoom, clearActiveRoom, navigation]);

  if (!activeRoom) return null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">Pengaturan Room</Text>

          {/* Photo */}
          <View style={styles.field}>
            <Text style={styles.label}>Foto Room</Text>
            <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPicker}
              accessibilityLabel="Pilih foto room" accessibilityRole="button">
              {photo
                ? <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                : activeRoom.photo
                  ? <Image source={{ uri: activeRoom.photo }} style={styles.photoPreview} />
                  : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoInitials}>{getInitials(activeRoom.name)}</Text>
                      <Text style={styles.photoChangeText}>Ketuk untuk ganti</Text>
                    </View>
                  )}
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Nama Room <Text style={styles.required}>*</Text></Text>
            <Controller control={control} name="name" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.name && styles.inputError]}
                placeholder="Nama room" placeholderTextColor="#9CA3AF"
                onChangeText={onChange} onBlur={onBlur} value={value}
                accessibilityLabel="Nama room" />
            )} />
            {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Deskripsi <Text style={styles.optional}>(opsional)</Text></Text>
            <Controller control={control} name="description" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, styles.textArea]} placeholder="Deskripsi room"
                placeholderTextColor="#9CA3AF" multiline numberOfLines={3}
                onChangeText={onChange} onBlur={onBlur} value={value}
                accessibilityLabel="Deskripsi room" />
            )} />
          </View>

          {/* Invite code toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Aktifkan Kode Undangan</Text>
              <Text style={styles.switchDesc}>Izinkan anggota baru bergabung via kode</Text>
            </View>
            <Controller control={control} name="invite_code_enabled" render={({ field: { onChange, value } }) => (
              <Switch value={value} onValueChange={onChange} accessibilityLabel="Toggle kode undangan" />
            )} />
          </View>

          {/* Show invite code if enabled */}
          {inviteCodeEnabled && activeRoom.invite_code && (
            <TouchableOpacity style={styles.copyCode}
              onPress={() => { Clipboard.setString(activeRoom.invite_code); Alert.alert('Disalin', 'Kode undangan disalin ke clipboard.'); }}
              accessibilityLabel={`Salin kode undangan: ${activeRoom.invite_code}`}
              accessibilityRole="button">
              <Text style={styles.copyCodeLabel}>Kode Undangan</Text>
              <Text style={styles.copyCodeValue}>{activeRoom.invite_code}</Text>
              <Text style={styles.copyCodeHint}>Ketuk untuk menyalin</Text>
            </TouchableOpacity>
          )}

          {/* Save button */}
          <TouchableOpacity style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
            onPress={handleSubmit(onSubmit)} disabled={isSubmitting}
            accessibilityLabel="Simpan pengaturan" accessibilityRole="button">
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>}
          </TouchableOpacity>

          {/* Admins */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Room</Text>
            {activeRoom.admins.map(admin => (
              <View key={admin.id} style={styles.adminRow}>
                {admin.photo
                  ? <Image source={{ uri: admin.photo }} style={styles.adminAvatar} />
                  : (
                    <View style={styles.adminAvatarFallback}>
                      <Text style={styles.adminAvatarInitials}>{getInitials(admin.name)}</Text>
                    </View>
                  )}
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{admin.name}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                  {admin.department ? <Text style={styles.adminDept}>{admin.department}</Text> : null}
                </View>
              </View>
            ))}
            {/* Add admin */}
            <Text style={styles.label}>Tambah Admin</Text>
            <View style={styles.addAdminRow}>
              <TextInput style={[styles.input, styles.addAdminInput]}
                placeholder="Email pengguna" placeholderTextColor="#9CA3AF"
                value={addAdminEmail} onChangeText={setAddAdminEmail}
                keyboardType="email-address" autoCapitalize="none"
                accessibilityLabel="Email admin baru" />
              <TouchableOpacity style={[styles.addAdminBtn, addingAdmin && { opacity: 0.5 }]}
                onPress={handleAddAdmin} disabled={addingAdmin}
                accessibilityLabel="Tambah admin" accessibilityRole="button">
                {addingAdmin ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.addAdminBtnText}>Tambah</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete room */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteRoom}
            accessibilityLabel="Hapus room" accessibilityRole="button">
            <Text style={styles.deleteBtnText}>🗑 Hapus Room</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  inputError: { borderColor: '#EF4444' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  photoPicker: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#DBEAFE', height: 120, alignItems: 'center', justifyContent: 'center' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center', gap: 6 },
  photoInitials: { fontSize: 32, fontWeight: '700', color: '#1D4ED8' },
  photoChangeText: { fontSize: 12, color: '#6B7280' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12 },
  switchDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  copyCode: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BFDBFE', marginBottom: 16, alignItems: 'center' },
  copyCodeLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  copyCodeValue: { fontSize: 20, fontWeight: '800', color: '#1D4ED8', letterSpacing: 2 },
  copyCodeHint: { fontSize: 11, color: '#93C5FD', marginTop: 4 },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  saveBtnDisabled: { backgroundColor: '#93C5FD' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  adminAvatar: { width: 40, height: 40, borderRadius: 20 },
  adminAvatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  adminAvatarInitials: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  adminEmail: { fontSize: 12, color: '#6B7280' },
  adminDept: { fontSize: 12, color: '#9CA3AF' },
  addAdminRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  addAdminInput: { flex: 1 },
  addAdminBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' },
  addAdminBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deleteBtn: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FEF2F2' },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
