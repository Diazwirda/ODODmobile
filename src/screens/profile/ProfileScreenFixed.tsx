import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { profileApi } from '../../api/profile';
import { violationsApi } from '../../api/violations';
import ImageViewerModal from '../../components/ImageViewerModal';
import AppNavbar from '../../components/AppNavbar';
import { useMultiAuthStore } from '../../stores/multiAuthStore';
import { useRoomStore } from '../../stores/roomStore';
import type { Department } from '../../types/admin';
import type { UserProfile, UpdateProfilePayload } from '../../types/profile';
import type { Violation } from '../../types/violation';
import { validateImage } from '../../utils/imageValidation';
import { handleApiError } from '../../utils/toast';

const STATUS_OPTIONS = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Terverifikasi', value: 'verified' },
  { label: 'Ditolak', value: 'rejected' },
];

const PERIOD_OPTIONS = [
  { label: 'Semua Waktu', value: 'all' },
  { label: 'Tahunan', value: 'yearly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Harian', value: 'daily' },
];

const YEAR_OPTIONS = ['2026', '2025', '2024'];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  verified: '#10B981',
  rejected: '#EF4444',
};

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

function unwrapProfile(payload: any, fallback?: Partial<UserProfile> | null): UserProfile {
  const raw = payload?.data?.user ?? payload?.data ?? payload?.user ?? payload ?? {};
  return {
    id: raw.id ?? fallback?.id ?? 0,
    name: raw.name ?? fallback?.name ?? '',
    email: raw.email ?? fallback?.email ?? '',
    photo: raw.photo ?? raw.photo_url ?? fallback?.photo,
    department: raw.department ?? raw.department_name ?? fallback?.department ?? '',
    position: raw.position ?? fallback?.position ?? '',
    age: raw.age ?? fallback?.age,
    points: Number(raw.points ?? raw.total_points ?? fallback?.points ?? 0),
    rank: Number(raw.rank ?? fallback?.rank ?? 0),
    membership_role: raw.membership_role ?? raw.role ?? fallback?.membership_role ?? 'reporter',
  };
}

export default function ProfileScreenFixed() {
  const { spot } = useMultiAuthStore();
  const { activeRoomRole } = useRoomStore();
  const fallbackUser = spot.user;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('yearly');
  const [yearFilter, setYearFilter] = useState('2026');
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptSearch, setDeptSearch] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const syncForm = useCallback((nextProfile: UserProfile) => {
    setEditName(nextProfile.name ?? '');
    setEditAge(nextProfile.age ? String(nextProfile.age) : '');
    setEditDept(nextProfile.department ?? '');
    setEditPosition(nextProfile.position ?? '');
  }, []);

  const loadProfile = useCallback(async () => {
    setError(null);
    try {
      const { data } = await profileApi.get();
      const nextProfile = unwrapProfile(data, fallbackUser as any);
      setProfile(nextProfile);
      syncForm(nextProfile);
    } catch (err) {
      const fallbackProfile = fallbackUser ? unwrapProfile(fallbackUser) : null;
      if (fallbackProfile?.name) {
        setProfile(fallbackProfile);
        syncForm(fallbackProfile);
      } else {
        setError(handleApiError(err));
      }
    }
  }, [fallbackUser, syncForm]);

  const loadDepartments = useCallback(async () => {
    try {
      const { data } = await profileApi.getDepartments();
      const raw = Array.isArray(data) ? data : (data as any).data ?? [];
      setDepartments(raw.map((item: any, index: number) => (
        typeof item === 'string' ? { id: index + 1, name: item } : item
      )));
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadViolations = useCallback(async () => {
    setLoadingViolations(true);
    try {
      const { data } = await violationsApi.my(1);
      setViolations(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch {
      setViolations([]);
    } finally {
      setLoadingViolations(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadProfile(), loadDepartments(), loadViolations()])
      .finally(() => setIsLoading(false));
  }, [loadDepartments, loadProfile, loadViolations]);

  const filteredViolations = useMemo(() => {
    return violations.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      const created = new Date(item.created_at);
      if (Number.isNaN(created.getTime())) return true;
      if (periodFilter === 'yearly' && String(created.getFullYear()) !== yearFilter) return false;
      if (periodFilter === 'all' || periodFilter === 'yearly') return true;
      const day = 24 * 60 * 60 * 1000;
      const ranges: Record<string, number> = { daily: day, weekly: 7 * day, monthly: 30 * day };
      return Date.now() - created.getTime() <= (ranges[periodFilter] ?? Number.MAX_SAFE_INTEGER);
    });
  }, [periodFilter, statusFilter, violations, yearFilter]);

  const filteredDepartments = useMemo(() => {
    const query = deptSearch.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter((dept) => dept.name.toLowerCase().includes(query));
  }, [departments, deptSearch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadDepartments(), loadViolations()]);
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setEditError('Nama wajib diisi.');
      return;
    }
    setEditError(null);
    setIsSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        name: editName.trim(),
        age: editAge ? parseInt(editAge, 10) : undefined,
        department: editDept.trim() || undefined,
        position: editPosition.trim() || undefined,
      };
      const { data } = await profileApi.update(payload);
      const nextProfile = unwrapProfile(data, { ...profile, ...payload } as UserProfile);
      setProfile(nextProfile);
      syncForm(nextProfile);
    } catch (err) {
      setEditError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;
    const type = asset.type ?? 'image/jpeg';
    const validation = validateImage(type, asset.fileSize);
    if (!validation.valid) {
      Alert.alert('Foto tidak valid', validation.error);
      return;
    }
    const formData = new FormData();
    formData.append('photo', { uri: asset.uri, type, name: asset.fileName ?? 'profile-photo.jpg' } as any);
    try {
      const { data } = await profileApi.uploadPhoto(formData);
      const nextProfile = unwrapProfile(data, profile);
      setProfile(nextProfile);
    } catch (err) {
      Alert.alert('Gagal upload foto', handleApiError(err));
    }
  };

  const renderPickerModal = (
    visible: boolean,
    title: string,
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (value: string) => void,
    onClose: () => void,
  ) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.optionSheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.optionRow, selected === option.value && styles.optionRowActive]}
              onPress={() => { onSelect(option.value); onClose(); }}>
              <Text style={[styles.optionText, selected === option.value && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.centerState}><ActivityIndicator color="#2563EB" /></View>
      </SafeAreaView>
    );
  }

  const displayName = profile?.name || fallbackUser?.name || 'Pengguna';
  const displayDept = profile?.department || (fallbackUser as any)?.department || 'No department';
  const role = activeRoomRole ?? profile?.membership_role ?? (profile as any)?.role ?? 'reporter';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppNavbar title="Profil" />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {profile?.photo ? (
              <Image source={{ uri: profile.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickPhoto}>
              <Text style={styles.cameraText}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{displayName.toUpperCase()}</Text>
          <Text style={styles.department}>{displayDept.toUpperCase()}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{role === 'admin' ? 'Admin' : 'Reporter'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Edit Profil</Text>
          {editError ? <Text style={styles.errorText}>{editError}</Text> : null}
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Nama lengkap" placeholderTextColor="#9CA3AF" />
          <Text style={styles.label}>Umur</Text>
          <TextInput style={styles.input} value={editAge} onChangeText={setEditAge} keyboardType="number-pad" placeholder="Umur" placeholderTextColor="#9CA3AF" />
          <Text style={styles.label}>Departemen</Text>
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowDeptModal(true)}>
            <Text style={editDept ? styles.inputButtonText : styles.placeholderText}>{editDept || 'Pilih departemen'}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          <Text style={styles.label}>Jabatan</Text>
          <TextInput style={styles.input} value={editPosition} onChangeText={setEditPosition} placeholder="Jabatan" placeholderTextColor="#9CA3AF" />
          <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabledButton]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Simpan Profil</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Riwayat Spotting</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowStatusModal(true)}>
            <Text style={styles.selectText}>{STATUS_OPTIONS.find((item) => item.value === statusFilter)?.label}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowPeriodModal(true)}>
            <Text style={styles.selectText}>{PERIOD_OPTIONS.find((item) => item.value === periodFilter)?.label}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowYearModal(true)}>
            <Text style={styles.selectText}>{yearFilter}</Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>

          {loadingViolations ? (
            <ActivityIndicator color="#2563EB" style={styles.listLoader} />
          ) : filteredViolations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗂️</Text>
              <Text style={styles.emptyText}>Belum ada riwayat spotting</Text>
            </View>
          ) : (
            filteredViolations.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                {item.photos && item.photos.length > 0 ? (
                  <TouchableOpacity onPress={() => setViewingPhoto(item.photos[0])}>
                    <Image source={{ uri: item.photos[0] }} style={styles.historyThumb} />
                  </TouchableOpacity>
                ) : null}
                <View style={styles.historyText}>
                  <Text style={styles.historyTitle}>{item.rule?.name ?? 'Laporan'}</Text>
                  <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString('id-ID')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status] ?? '#6B7280'}1A` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] ?? '#6B7280' }]}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showDeptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeptModal(false)}
        onShow={() => setDeptSearch('')}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowDeptModal(false)}>
          <View style={styles.deptSheet}>
            <Text style={styles.sheetTitle}>Pilih Departemen</Text>
            <TextInput
              style={styles.deptSearchInput}
              placeholder="Cari departemen..."
              placeholderTextColor="#9CA3AF"
              value={deptSearch}
              onChangeText={setDeptSearch}
              autoCapitalize="none"
            />
            <ScrollView style={styles.deptList} keyboardShouldPersistTaps="handled">
              {filteredDepartments.length === 0 ? (
                <Text style={styles.emptyText}>
                  {deptSearch ? 'Departemen tidak ditemukan.' : 'Departemen belum tersedia.'}
                </Text>
              ) : (
                filteredDepartments.map((dept) => (
                  <TouchableOpacity
                    key={dept.id}
                    style={[styles.optionRow, editDept === dept.name && styles.optionRowActive]}
                    onPress={() => { setEditDept(dept.name); setShowDeptModal(false); }}>
                    <Text style={[styles.optionText, editDept === dept.name && styles.optionTextActive]}>{dept.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      {renderPickerModal(showStatusModal, 'Status', STATUS_OPTIONS, statusFilter, setStatusFilter, () => setShowStatusModal(false))}
      {renderPickerModal(showPeriodModal, 'Waktu', PERIOD_OPTIONS, periodFilter, setPeriodFilter, () => setShowPeriodModal(false))}
      {renderPickerModal(showYearModal, 'Tahun', YEAR_OPTIONS.map((year) => ({ label: year, value: year })), yearFilter, setYearFilter, () => setShowYearModal(false))}

      <ImageViewerModal
        visible={viewingPhoto !== null}
        uri={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 28, gap: 20 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroCard: {
    borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', paddingHorizontal: 18, paddingTop: 28, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatarWrap: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#DBEAFE' },
  avatarFallback: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: '#3B82F6', backgroundColor: '#DCE7FF', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#111827', fontSize: 34, fontWeight: '700' },
  cameraButton: { position: 'absolute', right: 0, bottom: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 7 },
  cameraText: { fontSize: 15 },
  name: { marginTop: 18, color: '#111827', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  department: { marginTop: 8, color: '#6B7280', fontSize: 14, textAlign: 'center' },
  roleBadge: { marginTop: 12, borderRadius: 999, backgroundColor: '#DBEAFE', paddingHorizontal: 14, paddingVertical: 6 },
  roleBadgeText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  card: {
    borderRadius: 16, backgroundColor: '#fff', padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 18 },
  label: { color: '#111827', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 16, color: '#111827', fontSize: 15, marginBottom: 18 },
  inputButton: { minHeight: 52, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 16, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputButtonText: { color: '#111827', fontSize: 15 },
  placeholderText: { color: '#9CA3AF', fontSize: 15 },
  chevron: { color: '#64748B', fontSize: 16 },
  saveButton: { marginTop: 2, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.25, shadowRadius: 10 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  selectButton: { minHeight: 52, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, backgroundColor: '#F9FAFB', paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { color: '#111827', fontSize: 15 },
  listLoader: { marginVertical: 24 },
  emptyState: { minHeight: 156, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', paddingVertical: 14, gap: 12 },
  historyThumb: { width: 44, height: 44, borderRadius: 8 },
  historyText: { flex: 1 },
  historyTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  historyDate: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, alignItems: 'center', gap: 8 },
  errorText: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  retryButton: { backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.35)' },
  optionSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, gap: 8 },
  deptSheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, maxHeight: '70%' },
  deptSearchInput: {
    minHeight: 44, borderRadius: 10, backgroundColor: '#F3F4F6', paddingHorizontal: 14,
    color: '#111827', fontSize: 14, marginBottom: 10,
  },
  deptList: { flexGrow: 0 },
  sheetTitle: { color: '#111827', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  optionRow: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 12 },
  optionRowActive: { backgroundColor: '#EFF6FF' },
  optionText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  optionTextActive: { color: '#2563EB', fontWeight: '700' },
});
