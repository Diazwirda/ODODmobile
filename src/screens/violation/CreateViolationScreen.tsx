/**
 * CreateViolationScreen — Form spotting (laporan pelanggaran).
 * Requirements: 8.1–8.9, 13.3
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import apiClient from '@api/client';
import { useViolationStore } from '@stores/violationStore';
import { useRoomStore } from '@stores/roomStore';
import { filterRulesForRole } from '@utils/role';
import { validateImageFile } from '@utils/imageValidation';
import { getInitials } from '@utils/avatar';
import type { Rule } from '@/types/rule';
import type { ViolationUser } from '@/types/violation';
import type { ImageFile } from '@/types/common';

const MAX_PHOTOS = 3;
const MAX_PHOTO_MB = 5;
const MAX_DESC_CHARS = 1200;

export default function CreateViolationScreen() {
  const navigation = useNavigation();
  const { activeRoom, activeRoomRole } = useRoomStore();
  const { createViolation, isSubmitting } = useViolationStore();

  const [rules, setRules] = useState<Rule[]>([]);
  const [users, setUsers] = useState<ViolationUser[]>([]);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [selectedViolators, setSelectedViolators] = useState<number[]>([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<ImageFile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [violatorModalVisible, setViolatorModalVisible] = useState(false);

  // Fetch rules and violatable users on mount
  useEffect(() => {
    if (!activeRoom) return;
    const fetchData = async () => {
      try {
        const [rulesRes, usersRes] = await Promise.all([
          apiClient.get<Rule[]>(`/rooms/${activeRoom.id}/rules`),
          apiClient.get<ViolationUser[]>(`/rooms/${activeRoom.id}/violations/users`),
        ]);
        setRules(filterRulesForRole(rulesRes.data, activeRoomRole));
        setUsers(usersRes.data);
      } catch {
        Alert.alert('Gagal', 'Tidak dapat memuat data formulir.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [activeRoom, activeRoomRole]);

  const handlePickPhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Batas Foto', `Maksimal ${MAX_PHOTOS} foto per laporan.`);
      return;
    }
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
    const validation = validateImageFile(file, MAX_PHOTO_MB);
    if (!validation.valid) {
      Alert.alert('Foto Tidak Valid', validation.error ?? '');
      return;
    }
    setPhotos((prev) => [...prev, file]);
  }, [photos.length]);

  const toggleViolator = useCallback((id: number) => {
    setSelectedViolators((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!activeRoom) return;
    if (!selectedRule) {
      Alert.alert('Validasi', 'Pilih aturan yang dilanggar.');
      return;
    }
    if (selectedViolators.length === 0) {
      Alert.alert('Validasi', 'Pilih minimal 1 pelanggar.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Validasi', 'Unggah minimal 1 foto bukti.');
      return;
    }

    try {
      await createViolation(activeRoom.id, {
        rule_id: selectedRule.id,
        violator_ids: selectedViolators,
        description: description.trim() || undefined,
        photos,
      });
      Alert.alert('Berhasil', 'Laporan berhasil dikirim dan sedang menunggu verifikasi.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengirim laporan. Silakan coba lagi.');
    }
  }, [
    activeRoom,
    selectedRule,
    selectedViolators,
    photos,
    description,
    createViolation,
    navigation,
  ]);

  if (loadingData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Buat Laporan
        </Text>

        {/* Rule picker */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Aturan yang Dilanggar <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setRuleModalVisible(true)}
            accessibilityLabel="Pilih aturan"
            accessibilityRole="button"
          >
            <Text style={selectedRule ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedRule ? selectedRule.name : 'Pilih aturan...'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Violator picker */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Pelanggar <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setViolatorModalVisible(true)}
            accessibilityLabel="Pilih pelanggar"
            accessibilityRole="button"
          >
            <Text
              style={selectedViolators.length > 0 ? styles.pickerValue : styles.pickerPlaceholder}
            >
              {selectedViolators.length > 0
                ? `${selectedViolators.length} orang dipilih`
                : 'Pilih pelanggar...'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Deskripsi <Text style={styles.optional}>(opsional)</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Deskripsikan kejadian secara singkat..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={MAX_DESC_CHARS}
            value={description}
            onChangeText={setDescription}
            accessibilityLabel="Deskripsi kejadian"
          />
          <Text style={styles.charCount}>
            {description.length}/{MAX_DESC_CHARS}
          </Text>
        </View>

        {/* Photo upload */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Foto Bukti <Text style={styles.required}>*</Text>{' '}
            <Text style={styles.optional}>(1–3 foto, maks {MAX_PHOTO_MB} MB)</Text>
          </Text>
          <View style={styles.photoRow}>
            {photos.map((p, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri: p.uri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  accessibilityLabel={`Hapus foto ${i + 1}`}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <TouchableOpacity
                style={styles.addPhoto}
                onPress={handlePickPhoto}
                accessibilityLabel="Tambah foto bukti"
                accessibilityRole="button"
              >
                <Text style={styles.addPhotoText}>📷{'\n'}Tambah</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityLabel="Kirim laporan"
          accessibilityRole="button"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Kirim Laporan</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Rule Modal */}
      <Modal
        visible={ruleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRuleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRuleModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pilih Aturan</Text>
            <FlatList
              data={rules}
              keyExtractor={(r) => String(r.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedRule?.id === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedRule(item);
                    setRuleModalVisible(false);
                  }}
                  accessibilityLabel={`Pilih aturan: ${item.name}`}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.modalItemSub}>{item.description}</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Violator Modal */}
      <Modal
        visible={violatorModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setViolatorModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setViolatorModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pilih Pelanggar</Text>
            <FlatList
              data={users}
              keyExtractor={(u) => String(u.id)}
              renderItem={({ item }) => {
                const selected = selectedViolators.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                    onPress={() => toggleViolator(item.id)}
                    accessibilityLabel={`${selected ? 'Batalkan pilihan' : 'Pilih'} ${item.name}`}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.checkBox}>
                        {selected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <View style={styles.userAvatarFallback}>
                        <Text style={styles.userInitials}>{getInitials(item.name)}</Text>
                      </View>
                      <View>
                        <Text style={styles.modalItemText}>{item.name}</Text>
                        {item.department ? (
                          <Text style={styles.modalItemSub}>{item.department}</Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity style={styles.doneBtn} onPress={() => setViolatorModalVisible(false)}>
              <Text style={styles.doneBtnText}>Selesai ({selectedViolators.length} dipilih)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },
  optional: { color: '#9CA3AF', fontWeight: '400' },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerValue: { fontSize: 15, color: '#111827', flex: 1 },
  pickerPlaceholder: { fontSize: 15, color: '#9CA3AF', flex: 1 },
  chevron: { fontSize: 11, color: '#6B7280' },
  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 90,
  },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoWrapper: { position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: 8 },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalItem: { paddingVertical: 12, paddingHorizontal: 4 },
  modalItemSelected: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 8 },
  modalItemText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  modalItemSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#F3F4F6', marginHorizontal: 4 },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkMark: { fontSize: 13, color: '#3B82F6', fontWeight: '700' },
  userAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },
  doneBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
