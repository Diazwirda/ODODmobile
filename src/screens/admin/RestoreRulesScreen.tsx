import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import type { Rule } from '../../types/rule';

function daysLeft(deletedAt?: string): number | null {
  if (!deletedAt) return null;
  const deleted = new Date(deletedAt).getTime();
  if (Number.isNaN(deleted)) return null;
  const restoreUntil = deleted + 30 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((restoreUntil - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function RestoreRulesScreen() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getDeletedRules();
      setRules(Array.isArray(data) ? data : (data as any).data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const restoreRule = async (rule: Rule) => {
    setRestoringId(rule.id);
    try {
      await adminApi.restoreRule(rule.id);
      setRules((prev) => prev.filter((item) => item.id !== rule.id));
      Alert.alert('Berhasil', 'Rule berhasil direstore.');
    } catch {
      Alert.alert('Gagal', 'Tidak dapat restore rule.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Restore Rules" subtitle="Rule terhapus bisa dikembalikan selama 30 hari" />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={rules}
          keyExtractor={(item) => String(item.id)}
          onRefresh={loadRules}
          refreshing={loading}
          contentContainerStyle={rules.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Tidak ada rule terhapus.</Text>}
          renderItem={({ item }) => {
            const remaining = daysLeft(item.deleted_at);
            return (
              <View style={styles.card}>
                <Text style={styles.ruleName}>{item.name}</Text>
                {item.category ? <Text style={styles.meta}>{item.category}</Text> : null}
                <Text style={styles.meta}>Dihapus: {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('id-ID') : '-'}</Text>
                <Text style={styles.remaining}>{remaining === null ? 'Sisa restore tidak tersedia' : `${remaining} hari tersisa`}</Text>
                <TouchableOpacity style={[styles.restoreBtn, restoringId === item.id && styles.disabled]} onPress={() => restoreRule(item)} disabled={restoringId === item.id}>
                  {restoringId === item.id ? <ActivityIndicator color="#064E3B" /> : <Text style={styles.restoreText}>Restore</Text>}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', padding: 24 },
  card: {
    borderRadius: 12, backgroundColor: '#fff', padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  ruleName: { color: '#111827', fontSize: 16, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 12, marginTop: 5 },
  remaining: { color: '#B45309', fontSize: 12, fontWeight: '700', marginTop: 8 },
  restoreBtn: { marginTop: 12, borderRadius: 10, backgroundColor: '#3B82F6', paddingVertical: 11, alignItems: 'center' },
  restoreText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.6 },
});
