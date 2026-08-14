import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Image,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import PromptModal from '../../components/PromptModal';
import ImageViewerModal from '../../components/ImageViewerModal';
import { adminApi } from '../../api/admin';
import type { Violation } from '../../types/violation';
import type { AdminStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

export default function PendingReportsScreen() {
  const navigation = useNavigation<Nav>();
  const [reports, setReports] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Violation | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getPendingReports();
      setReports(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memuat laporan pending.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleVerify = useCallback(async (violation: Violation) => {
    setProcessingId(violation.id);
    try {
      await adminApi.updateViolationStatus(violation.id, { status: 'verified' });
      setReports(prev => prev.filter(r => r.id !== violation.id));
      Alert.alert('Berhasil', 'Laporan telah diverifikasi.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memverifikasi laporan.');
    } finally {
      setProcessingId(null);
    }
  }, []);

  const handleReject = useCallback((violation: Violation) => {
    setRejectTarget(violation);
  }, []);

  const submitReject = useCallback(async (reason: string) => {
    const violation = rejectTarget;
    if (!violation) return;
    setRejectTarget(null);
    setProcessingId(violation.id);
    try {
      await adminApi.updateViolationStatus(violation.id, { status: 'rejected', reject_reason: reason });
      setReports(prev => prev.filter(r => r.id !== violation.id));
      Alert.alert('Berhasil', 'Laporan telah ditolak.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menolak laporan.');
    } finally {
      setProcessingId(null);
    }
  }, [rejectTarget]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Laporan Pending" subtitle={`${reports.length} menunggu verifikasi`} />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={reports}
          keyExtractor={item => String(item.id)}
          onRefresh={fetchReports}
          refreshing={loading}
          contentContainerStyle={reports.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>Tidak ada laporan pending.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.ruleName}>{item.rule?.name}</Text>
              <Text style={styles.meta}>
                Pelapor: {item.reporter?.name} · Pelanggar: {item.violators?.map(v => v.name).join(', ')}
              </Text>
              {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
              {item.photos && item.photos.length > 0 ? (
                <View style={styles.photoRow}>
                  {item.photos.map((photoUri, index) => (
                    <TouchableOpacity key={index} onPress={() => setViewingPhoto(photoUri)}>
                      <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.verifyBtn, processingId === item.id && { opacity: 0.5 }]}
                  onPress={() => handleVerify(item)}
                  disabled={processingId === item.id}>
                  <Text style={styles.verifyBtnText}>✓ Verifikasi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, processingId === item.id && { opacity: 0.5 }]}
                  onPress={() => handleReject(item)}
                  disabled={processingId === item.id}>
                  <Text style={styles.rejectBtnText}>✕ Tolak</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <PromptModal
        visible={rejectTarget !== null}
        title="Alasan Penolakan"
        message="Masukkan alasan penolakan laporan ini:"
        placeholder="Tulis alasan penolakan..."
        confirmLabel="Tolak Laporan"
        destructive
        onCancel={() => setRejectTarget(null)}
        onSubmit={submitReject}
      />

      <ImageViewerModal
        visible={viewingPhoto !== null}
        uri={viewingPhoto}
        onClose={() => setViewingPhoto(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  ruleName: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  desc: { fontSize: 13, color: '#374151', marginBottom: 6 },
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  photoThumb: { width: 64, height: 64, borderRadius: 8 },
  date: { fontSize: 11, color: '#9CA3AF', marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  verifyBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  rejectBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});
