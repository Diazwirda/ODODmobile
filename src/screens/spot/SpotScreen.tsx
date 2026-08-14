import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  FlatList,
  Modal,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  launchImageLibrary,
  launchCamera,
} from 'react-native-image-picker';
import { rulesApi } from '../../api/rules';
import { dashboardApi } from '../../api/dashboard';
import { violationsApi } from '../../api/violations';
import { handleApiError } from '../../utils/toast';
import { validateImage, validatePhotoCount, MAX_PHOTOS } from '../../utils/imageValidation';
import { compressImageIfNeeded } from '../../utils/imageCompression';
import { getAvatarUri } from '../../utils/avatar';
import { useRoomStore } from '../../stores/roomStore';
import type { Rule } from '../../types/rule';
import type { ViolationUser } from '../../types/violation';

const schema = z.object({
  rule_id: z.number({ required_error: 'Pilih rule yang dilanggar' }),
  violator_ids: z.array(z.number()).min(1, 'Pilih minimal 1 pelanggar'),
  description: z.string().max(1200, 'Deskripsi maksimal 1200 karakter').optional(),
});

type FormData = z.infer<typeof schema>;

interface PhotoAsset {
  uri: string;
  type: string;
  name: string;
  fileSize?: number;
}

export default function SpotScreen() {
  const insets = useSafeAreaInsets();
  const { activeRoomRole } = useRoomStore();
  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<ViolationUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showRulePicker, setShowRulePicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<ViolationUser[]>([]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(userSearch.trim().toLowerCase()),
  );

  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rule_id: undefined, violator_ids: [], description: '' },
  });

  const loadData = useCallback(async () => {
    setIsLoadingRules(true);
    try {
      const [rulesRes, leaderboardRes] = await Promise.all([
        rulesApi.list(),
        // Room-scoped member list — /users returns every user in the whole
        // database, not just this room's members, so the leaderboard
        // endpoint (already room-scoped elsewhere in the app) is used here
        // as the violator picker's data source instead.
        dashboardApi.leaderboard({ per_page: 200 }),
      ]);
      setRules(rulesRes.data.filter((r) => !r.is_deleted));
      const leaderboardData = leaderboardRes.data;
      const members = Array.isArray(leaderboardData) ? leaderboardData : leaderboardData.data ?? [];
      setUsers(members.map((member) => ({ id: member.id, name: member.name, photo: member.photo })));
    } catch (err) {
      setGeneralError(handleApiError(err));
    } finally {
      setIsLoadingRules(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const processResult = useCallback(async (uri: string, type: string, name: string, size?: number) => {
    try {
      const compressed = await compressImageIfNeeded({ uri, type, name, size });
      const validation = validateImage(compressed.type, compressed.size);
      if (!validation.valid) {
        Alert.alert('Foto Tidak Valid', validation.error);
        return;
      }
      setPhotos((prev) => {
        if (prev.length >= MAX_PHOTOS) return prev;
        return [...prev, { uri: compressed.uri, type: compressed.type, name: compressed.name, fileSize: compressed.size }];
      });
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memproses foto.');
    }
  }, []);

  const openCamera = useCallback(() => {
    setShowPhotoPicker(false);
    setTimeout(async () => {
      // Android: minta permission kamera dulu
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA,
            {
              title: 'Izin Kamera',
              message: 'Aplikasi membutuhkan akses kamera untuk mengambil foto bukti.',
              buttonNeutral: 'Tanya Nanti',
              buttonNegative: 'Tolak',
              buttonPositive: 'Izinkan',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Izin Ditolak',
              'Akses kamera ditolak. Buka Pengaturan > Aplikasi untuk mengaktifkan izin kamera.',
            );
            return;
          }
        } catch {
          Alert.alert('Error', 'Tidak dapat meminta izin kamera.');
          return;
        }
      }

      launchCamera(
        {
          mediaType: 'photo',
          quality: 0.8,
          saveToPhotos: false,
          includeBase64: false,
          cameraType: 'back',
        },
        (response) => {
          if (response.errorCode) {
            Alert.alert('Kamera Error', response.errorMessage ?? 'Tidak dapat membuka kamera.');
            return;
          }
          if (response.didCancel) return;
          const asset = response.assets?.[0];
          if (!asset?.uri) return;
          processResult(
            asset.uri,
            asset.type ?? 'image/jpeg',
            asset.fileName ?? `photo_${Date.now()}.jpg`,
            asset.fileSize,
          );
        },
      );
    }, 400);
  }, [processResult]);

  const openGallery = useCallback(() => {
    setShowPhotoPicker(false);
    setTimeout(() => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          quality: 0.8,
          selectionLimit: MAX_PHOTOS - photos.length,
        },
        (response) => {
          if (response.didCancel || !response.assets) return;
          response.assets.forEach((asset) => {
            if (asset.uri) {
              processResult(
                asset.uri,
                asset.type ?? 'image/jpeg',
                asset.fileName ?? `photo_${Date.now()}.jpg`,
                asset.fileSize,
              );
            }
          });
        },
      );
    }, 400);
  }, [photos.length, processResult]);

  const handleAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Batas Foto', `Maksimal ${MAX_PHOTOS} foto per laporan.`);
      return;
    }
    setShowPhotoPicker(true);
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const toggleUser = (user: ViolationUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      const next = exists ? prev.filter((u) => u.id !== user.id) : [...prev, user];
      setValue('violator_ids', next.map((u) => u.id));
      return next;
    });
  };

  const onSubmit = async (values: FormData) => {
    const photoValidation = validatePhotoCount(photos.length);
    if (!photoValidation.valid) { Alert.alert('Foto Diperlukan', photoValidation.error); return; }
    setGeneralError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('rule_id', String(values.rule_id));
      values.violator_ids.forEach((id, i) => formData.append(`violator_ids[${i}]`, String(id)));
      if (values.description) formData.append('description', values.description);
      photos.forEach((photo, i) =>
        formData.append(`photos[${i}]`, { uri: photo.uri, type: photo.type, name: photo.name } as unknown as Blob)
      );
      await violationsApi.create(formData);
      reset();
      setSelectedRule(null);
      setSelectedUsers([]);
      setPhotos([]);
      setSuccessMsg('Laporan berhasil dikirim! Menunggu verifikasi admin.');
    } catch (err) {
      setGeneralError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard admin
  if (activeRoomRole === 'admin') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.adminGuard}>
          <Text style={styles.adminGuardEmoji}>🔒</Text>
          <Text style={styles.adminGuardTitle}>Fitur Tidak Tersedia</Text>
          <Text style={styles.adminGuardDesc}>
            Admin tidak dapat membuat laporan violation.{'\n'}
            Gunakan akun reporter untuk melakukan spotting.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📸 Spot Pelanggaran</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {successMsg ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ {successMsg}</Text>
          </View>
        ) : null}

        {generalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        {isLoadingRules ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#3B82F6" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <>
            {/* Rule */}
            <View style={styles.field}>
              <Text style={styles.label}>Rule yang Dilanggar <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.pickerBtn, errors.rule_id ? styles.inputError : null]}
                onPress={() => setShowRulePicker(true)}
                accessibilityRole="button">
                <Text style={[styles.pickerBtnText, !selectedRule ? styles.placeholderText : null]} numberOfLines={1}>
                  {selectedRule ? selectedRule.name : 'Pilih rule...'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              {errors.rule_id ? <Text style={styles.fieldError}>{errors.rule_id.message}</Text> : null}
            </View>

            {/* Violator */}
            <View style={styles.field}>
              <Text style={styles.label}>Pelanggar <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[styles.pickerBtn, errors.violator_ids ? styles.inputError : null]}
                onPress={() => setShowUserPicker(true)}
                accessibilityRole="button">
                <Text style={[styles.pickerBtnText, selectedUsers.length === 0 ? styles.placeholderText : null]} numberOfLines={1}>
                  {selectedUsers.length > 0 ? selectedUsers.map((u) => u.name).join(', ') : 'Pilih pelanggar...'}
                </Text>
                <Text style={styles.pickerArrow}>▼</Text>
              </TouchableOpacity>
              {errors.violator_ids ? <Text style={styles.fieldError}>{errors.violator_ids.message as string}</Text> : null}
            </View>

            {/* Deskripsi */}
            <View style={styles.field}>
              <Text style={styles.label}>Deskripsi (opsional)</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.textarea}
                    placeholder="Ceritakan apa yang terjadi... (max 1200 karakter)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={1200}
                    value={value ?? ''}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {/* Foto Bukti */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Foto Bukti <Text style={styles.required}>*</Text>
                <Text style={styles.labelHint}> ({photos.length}/{MAX_PHOTOS}, maks 5 MB)</Text>
              </Text>
              <View style={styles.photoRow}>
                {photos.map((photo, index) => (
                  <View key={photo.uri + index} style={styles.photoWrapper}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(index)}>
                      <Text style={styles.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto} accessibilityRole="button">
                    <Text style={styles.addPhotoBtnIcon}>+</Text>
                    <Text style={styles.addPhotoBtnLabel}>Tambah</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btnSubmit, isSubmitting ? styles.btnDisabled : null]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSubmitText}>Kirim Laporan</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ─── Custom Photo Source Picker Modal ─── */}
      <Modal visible={showPhotoPicker} transparent animationType="fade" onRequestClose={() => setShowPhotoPicker(false)}>
        <TouchableOpacity style={styles.photoModalOverlay} activeOpacity={1} onPress={() => setShowPhotoPicker(false)}>
          <View style={styles.photoModalSheet}>
            <View style={styles.photoModalHandle} />
            <Text style={styles.photoModalTitle}>Tambah Foto Bukti</Text>
            <Text style={styles.photoModalSubtitle}>Pilih sumber foto untuk laporan Anda</Text>

            <View style={styles.photoModalOptions}>
              <TouchableOpacity style={styles.photoModalOption} onPress={openCamera} activeOpacity={0.8}>
                <View style={[styles.photoModalOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={styles.photoModalOptionEmoji}>📷</Text>
                </View>
                <Text style={styles.photoModalOptionLabel}>Kamera</Text>
                <Text style={styles.photoModalOptionDesc}>Ambil foto baru</Text>
              </TouchableOpacity>

              <View style={styles.photoModalDivider} />

              <TouchableOpacity style={styles.photoModalOption} onPress={openGallery} activeOpacity={0.8}>
                <View style={[styles.photoModalOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={styles.photoModalOptionEmoji}>🖼️</Text>
                </View>
                <Text style={styles.photoModalOptionLabel}>Galeri</Text>
                <Text style={styles.photoModalOptionDesc}>Pilih dari foto tersimpan</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.photoModalCancel} onPress={() => setShowPhotoPicker(false)}>
              <Text style={styles.photoModalCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Rule Picker Modal ─── */}
      <Modal visible={showRulePicker} animationType="slide" transparent onRequestClose={() => setShowRulePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Rule</Text>
              <TouchableOpacity onPress={() => setShowRulePicker(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <FlatList
              data={rules}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, selectedRule?.id === item.id ? styles.pickerItemActive : null]}
                  onPress={() => { setSelectedRule(item); setValue('rule_id', item.id); setShowRulePicker(false); }}>
                  <Text style={[styles.pickerItemText, selectedRule?.id === item.id ? styles.pickerItemTextActive : null]}>{item.name}</Text>
                  {item.category ? <Text style={styles.pickerItemCategory}>{item.category}</Text> : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Belum ada rule.</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* ─── User Picker Modal ─── */}
      <Modal
        visible={showUserPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowUserPicker(false)}
        onShow={() => setUserSearch('')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pelanggar</Text>
              <TouchableOpacity onPress={() => setShowUserPicker(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
            </View>
            <View style={styles.userSearchWrap}>
              <TextInput
                style={styles.userSearchInput}
                placeholder="Cari nama pelanggar..."
                placeholderTextColor="#9CA3AF"
                value={userSearch}
                onChangeText={setUserSearch}
                autoCapitalize="none"
              />
            </View>
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const isSelected = selectedUsers.some((u) => u.id === item.id);
                return (
                  <TouchableOpacity
                    style={[styles.userPickerItem, isSelected ? styles.pickerItemActive : null]}
                    onPress={() => toggleUser(item)}>
                    <Image source={getAvatarUri(item.photo, item.name)} style={styles.userAvatar} />
                    <Text style={[styles.userPickerName, isSelected ? styles.pickerItemTextActive : null]}>{item.name}</Text>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>{userSearch ? 'Tidak ada pelanggar yang cocok.' : 'Belum ada anggota.'}</Text>}
            />
            <TouchableOpacity
              style={[styles.btnConfirm, { marginBottom: 16 + insets.bottom }]}
              onPress={() => setShowUserPicker(false)}>
              <Text style={styles.btnConfirmText}>Konfirmasi ({selectedUsers.length} dipilih)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  adminGuard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  adminGuardEmoji: { fontSize: 56, marginBottom: 16 },
  adminGuardTitle: { fontSize: 20, fontWeight: '700', color: '#374151', marginBottom: 10, textAlign: 'center' },
  adminGuardDesc: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22 },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  container: { paddingHorizontal: 20, paddingVertical: 16 },
  successBox: { backgroundColor: '#D1FAE5', borderRadius: 10, padding: 14, marginBottom: 16 },
  successText: { color: '#065F46', fontSize: 14 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 13 },
  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  field: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  labelHint: { fontWeight: '400', color: '#9CA3AF' },
  required: { color: '#EF4444' },
  pickerBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerBtnText: { fontSize: 15, color: '#111827', flex: 1 },
  placeholderText: { color: '#9CA3AF' },
  pickerArrow: { fontSize: 12, color: '#9CA3AF' },
  inputError: { borderColor: '#EF4444' },
  fieldError: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  textarea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', height: 120 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: 10 },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  addPhotoBtnIcon: { fontSize: 24, color: '#9CA3AF' },
  addPhotoBtnLabel: { fontSize: 11, color: '#9CA3AF' },
  btnSubmit: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Custom Photo Picker Modal
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  photoModalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  photoModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  photoModalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4 },
  photoModalSubtitle: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  photoModalOptions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  photoModalOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalOptionEmoji: { fontSize: 26 },
  photoModalOptionLabel: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  photoModalOptionDesc: { fontSize: 12, color: '#9CA3AF' },
  photoModalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  photoModalCancel: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  photoModalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },

  // Rule/User Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 18, color: '#6B7280', padding: 4 },
  userSearchWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  userSearchInput: {
    minHeight: 42, borderRadius: 10, backgroundColor: '#F3F4F6',
    paddingHorizontal: 14, color: '#111827', fontSize: 14,
  },
  pickerItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  pickerItemActive: { backgroundColor: '#EFF6FF' },
  pickerItemText: { fontSize: 15, color: '#374151' },
  pickerItemTextActive: { color: '#1D4ED8', fontWeight: '600' },
  pickerItemCategory: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  userPickerItem: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userPickerName: { fontSize: 15, color: '#374151', flex: 1 },
  checkmark: { fontSize: 18, color: '#1D4ED8', fontWeight: '700' },
  emptyText: { textAlign: 'center', padding: 24, color: '#9CA3AF', fontSize: 14 },
  btnConfirm: { margin: 16, backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
