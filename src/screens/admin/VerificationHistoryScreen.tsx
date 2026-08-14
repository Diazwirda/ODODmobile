import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import ImageViewerModal from '../../components/ImageViewerModal';
import { adminApi } from '../../api/admin';
import type { Violation } from '../../types/violation';

const STATUS_COLOR: Record<string, string> = { verified: '#10B981', rejected: '#EF4444', pending: '#F59E0B' };
const STATUS_LABEL: Record<string, string> = { verified: 'Terverifikasi', rejected: 'Ditolak', pending: 'Pending' };

export default function VerificationHistoryScreen() {
  const [reports, setReports] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getReportHistory();
      setReports(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Riwayat Verifikasi" subtitle={`${reports.length} laporan`} />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={reports}
          keyExtractor={item => String(item.id)}
          onRefresh={fetchHistory}
          refreshing={loading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada riwayat verifikasi.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.ruleName} numberOfLines={1}>{item.rule?.name}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>Pelapor: {item.reporter?.name}</Text>
              {item.reject_reason ? (
                <Text style={styles.rejectReason}>Alasan: {item.reject_reason}</Text>
              ) : null}
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
            </View>
          )}
        />
      )}

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
  list: { padding: 16, gap: 10 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 48 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  ruleName: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  rejectReason: { fontSize: 12, color: '#EF4444', marginBottom: 4 },
  photoRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  photoThumb: { width: 56, height: 56, borderRadius: 8 },
  date: { fontSize: 11, color: '#9CA3AF' },
});
