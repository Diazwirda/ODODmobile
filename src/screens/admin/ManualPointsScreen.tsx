import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import type { AdminStackParamList } from '../../navigation/types';
import type { AdminUser } from '../../types/admin';

type Route = RouteProp<AdminStackParamList, 'ManualPointsScreen'>;

export default function ManualPointsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await adminApi.getUsers(1);
      const list = Array.isArray(data) ? data : (data as any).data ?? [];
      setUsers(list);
      const routeUserId = route.params?.userId;
      if (routeUserId) {
        const found = list.find((user: AdminUser) => user.id === routeUserId);
        if (found) setSelectedUser(found);
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [route.params?.userId]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const pickEvidence = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri) return;
    setEvidence({
      uri: asset.uri,
      type: asset.type ?? 'image/jpeg',
      name: asset.fileName ?? `evidence_${Date.now()}.jpg`,
    });
  };

  const handleSubmit = async () => {
    const pointsNum = parseInt(points, 10);
    if (!selectedUser) { Alert.alert('Validasi', 'Pilih user tujuan.'); return; }
    if (!points || Number.isNaN(pointsNum)) { Alert.alert('Validasi', 'Jumlah poin wajib angka bulat.'); return; }
    if (pointsNum === 0) { Alert.alert('Validasi', 'Poin tidak boleh 0.'); return; }
    if (pointsNum < -1000 || pointsNum > 1000) { Alert.alert('Validasi', 'Poin harus di antara -1000 sampai 1000.'); return; }

    setLoading(true);
    try {
      if (evidence) {
        const formData = new FormData();
        formData.append('points', String(pointsNum));
        formData.append('reason', reason.trim());
        formData.append('evidence', evidence as any);
        await adminApi.addPointsForm(selectedUser.id, formData);
      } else {
        await adminApi.addPoints(selectedUser.id, { points: pointsNum, reason: reason.trim() });
      }
      Alert.alert('Berhasil', `Poin berhasil disimpan untuk ${selectedUser.name}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menyimpan poin manual.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Input Poin Manual" subtitle="Untuk reporter di room aktif" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <Text style={styles.label}>User Tujuan</Text>
          <TouchableOpacity style={styles.inputButton} onPress={() => setShowUserModal(true)}>
            <Text style={selectedUser ? styles.inputButtonText : styles.placeholderText}>
              {selectedUser?.name ?? route.params?.userName ?? 'Pilih user tujuan'}
            </Text>
            <Text style={styles.chevron}>⌄</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Jumlah Poin</Text>
          <TextInput style={styles.input} keyboardType="numeric" placeholder="Contoh: 50 atau -10" placeholderTextColor="#9CA3AF" value={points} onChangeText={setPoints} />

          <Text style={styles.label}>Catatan (opsional)</Text>
          <TextInput style={[styles.input, styles.textArea]} multiline textAlignVertical="top" placeholder="Catatan admin..." placeholderTextColor="#9CA3AF" value={reason} onChangeText={setReason} />

          <Text style={styles.label}>Evidence (opsional)</Text>
          <TouchableOpacity style={styles.evidenceButton} onPress={pickEvidence}>
            {evidence ? (
              <>
                <Image source={{ uri: evidence.uri }} style={styles.evidenceThumb} />
                <Text style={styles.evidenceText} numberOfLines={1}>{evidence.name}</Text>
              </>
            ) : (
              <Text style={styles.evidenceText}>＋ Tambah evidence</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.submitButton, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Simpan</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showUserModal} transparent animationType="fade" onRequestClose={() => setShowUserModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Pilih User</Text>
            {loadingUsers ? <ActivityIndicator color="#2563EB" /> : (
              <FlatList
                data={users.filter((user) => user.membership_role !== 'admin' && (user as any).role !== 'admin')}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={<Text style={styles.emptyText}>Belum ada reporter di room ini.</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.userRow} onPress={() => { setSelectedUser(item); setShowUserModal(false); }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userMeta}>{item.department ?? '-'} • {item.points ?? 0} poin</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  flex: { flex: 1 },
  container: { padding: 20 },
  label: { color: '#111827', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: '#C8D2D6', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16, color: '#082F2B', fontSize: 15, marginBottom: 16 },
  textArea: { minHeight: 98, paddingTop: 14 },
  inputButton: { minHeight: 52, borderWidth: 1.5, borderColor: '#C8D2D6', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputButtonText: { color: '#082F2B', fontSize: 15, fontWeight: '700' },
  placeholderText: { color: '#9CA3AF', fontSize: 15 },
  chevron: { color: '#64748B', fontSize: 16 },
  evidenceButton: { minHeight: 72, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C8D2D6', borderRadius: 14, backgroundColor: '#fff', paddingHorizontal: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  evidenceThumb: { width: 48, height: 48, borderRadius: 10 },
  evidenceText: { color: '#64748B', fontSize: 14, flex: 1 },
  submitButton: { minHeight: 54, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.65 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.35)' },
  sheet: { maxHeight: '75%', backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18 },
  sheetTitle: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  userRow: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  userName: { color: '#111827', fontSize: 15, fontWeight: '800' },
  userMeta: { color: '#64748B', fontSize: 12, marginTop: 3 },
  emptyText: { color: '#64748B', textAlign: 'center', padding: 24 },
});
