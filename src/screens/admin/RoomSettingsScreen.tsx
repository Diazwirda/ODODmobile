import React, { useCallback, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Image,
  ActivityIndicator, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import ScreenHeader from '../../components/ScreenHeader';
import { useRoomStore } from '../../stores/roomStore';
import { adminApi } from '../../api/admin';
import { validateImage } from '../../utils/imageValidation';
import { handleApiError } from '../../utils/toast';

const ROOM_PLACEHOLDER_IMAGE = require('../../assets/room-placeholder.png');
const ADMIN_EMAIL_DOMAIN = '@humanplus.co.id';

export default function RoomSettingsScreen() {
  const { activeRoom, fetchRooms } = useRoomStore();
  const [name, setName] = useState(activeRoom?.name ?? '');
  const [description, setDescription] = useState(activeRoom?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const handleSave = useCallback(async () => {
    if (!activeRoom || !name.trim()) {
      Alert.alert('Validasi', 'Nama room wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateRoom(activeRoom.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      await fetchRooms();
      Alert.alert('Berhasil', 'Pengaturan room telah disimpan.');
    } catch (err) {
      Alert.alert('Gagal', handleApiError(err));
    } finally {
      setSaving(false);
    }
  }, [activeRoom, name, description, fetchRooms]);

  const handlePickPhoto = useCallback(async () => {
    if (!activeRoom) return;
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;

    const type = asset.type ?? 'image/jpeg';
    const validation = validateImage(type, asset.fileSize);
    if (!validation.valid) {
      Alert.alert('Foto Tidak Valid', validation.error);
      return;
    }

    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      type,
      name: asset.fileName ?? 'room-photo.jpg',
    } as any);

    setUploadingPhoto(true);
    try {
      await adminApi.uploadRoomPhoto(activeRoom.id, formData);
      await fetchRooms();
    } catch (err) {
      Alert.alert('Gagal', handleApiError(err));
    } finally {
      setUploadingPhoto(false);
    }
  }, [activeRoom, fetchRooms]);

  const handleDeletePhoto = useCallback(() => {
    if (!activeRoom) return;
    Alert.alert('Hapus Foto', 'Hapus foto perusahaan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          setUploadingPhoto(true);
          try {
            await adminApi.deleteRoomPhoto(activeRoom.id);
            await fetchRooms();
          } catch (err) {
            Alert.alert('Gagal', handleApiError(err));
          } finally {
            setUploadingPhoto(false);
          }
        },
      },
    ]);
  }, [activeRoom, fetchRooms]);

  const handleAddAdmin = useCallback(async () => {
    if (!activeRoom || !addAdminEmail.trim()) return;

    const email = addAdminEmail.trim();
    if (!email.toLowerCase().endsWith(ADMIN_EMAIL_DOMAIN)) {
      Alert.alert('Validasi', `Admin hanya boleh ditambahkan dengan email ${ADMIN_EMAIL_DOMAIN}.`);
      return;
    }

    setAddingAdmin(true);
    try {
      await adminApi.addRoomAdmin(activeRoom.id, email);
      setAddAdminEmail('');
      Alert.alert('Berhasil', 'Admin berhasil ditambahkan.');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        Alert.alert('Tidak Ditemukan', 'Pengguna dengan email tersebut tidak ditemukan.');
      } else {
        Alert.alert('Gagal', handleApiError(err));
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
              await adminApi.deleteRoom(activeRoom.id);
              Alert.alert('Berhasil', 'Room telah dihapus.');
            } catch (err) {
              Alert.alert('Gagal', handleApiError(err));
            }
          },
        },
      ]
    );
  }, [activeRoom]);

  if (!activeRoom) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ScreenHeader title="Pengaturan Room" />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Tidak ada room aktif.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Pengaturan Room" subtitle={activeRoom.name} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photoSection}>
            <Image
              source={activeRoom.photo ? { uri: activeRoom.photo } : ROOM_PLACEHOLDER_IMAGE}
              style={styles.photo}
            />
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={[styles.photoBtn, uploadingPhoto && styles.disabledBtn]}
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}>
                {uploadingPhoto ? (
                  <ActivityIndicator color="#3B82F6" size="small" />
                ) : (
                  <Text style={styles.photoBtnText}>
                    {activeRoom.photo ? 'Ubah Foto' : '+ Tambah Foto'}
                  </Text>
                )}
              </TouchableOpacity>
              {activeRoom.photo && (
                <TouchableOpacity
                  style={[styles.photoBtn, styles.photoDeleteBtn, uploadingPhoto && styles.disabledBtn]}
                  onPress={handleDeletePhoto}
                  disabled={uploadingPhoto}>
                  <Text style={styles.photoDeleteBtnText}>Hapus Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nama Room</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama room"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Deskripsi <Text style={styles.optional}>(opsional)</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Deskripsi room"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan Perubahan</Text>}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Tambah Admin</Text>
          <Text style={styles.sectionHint}>Hanya email {ADMIN_EMAIL_DOMAIN} yang dapat dijadikan admin.</Text>
          <View style={styles.addAdminRow}>
            <TextInput
              style={[styles.input, styles.addAdminInput]}
              placeholder="Email pengguna"
              placeholderTextColor="#9CA3AF"
              value={addAdminEmail}
              onChangeText={setAddAdminEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.addAdminBtn, addingAdmin && styles.disabledBtn]}
              onPress={handleAddAdmin}
              disabled={addingAdmin}>
              {addingAdmin
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.addAdminBtnText}>Tambah</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteRoom}>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 40 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  photoSection: { alignItems: 'center', marginBottom: 24 },
  photo: { width: 96, height: 96, borderRadius: 16, backgroundColor: '#EFF6FF' },
  photoActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoBtn: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  photoBtnText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  photoDeleteBtn: { backgroundColor: '#FEF2F2' },
  photoDeleteBtnText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabledBtn: { opacity: 0.6 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionHint: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  addAdminRow: { flexDirection: 'row', gap: 10 },
  addAdminInput: { flex: 1 },
  addAdminBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  addAdminBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deleteBtn: { borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 8, paddingVertical: 13, alignItems: 'center', backgroundColor: '#FEF2F2' },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
