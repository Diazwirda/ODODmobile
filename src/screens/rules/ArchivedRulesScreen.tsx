/**
 * ArchivedRulesScreen — Rules yang telah dihapus dan bisa dipulihkan.
 * Requirements: 7.8, 7.9
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import type { ArchivedRule } from '@/types/rule';

export default function ArchivedRulesScreen() {
  const { activeRoom } = useRoomStore();
  const [rules, setRules] = useState<ArchivedRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<number | null>(null);

  const fetchArchived = useCallback(async () => {
    if (!activeRoom) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<ArchivedRule[]>(
        `/rooms/${activeRoom.id}/rules?deleted=true`
      );
      setRules(data);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memuat arsip rules.');
    } finally {
      setLoading(false);
    }
  }, [activeRoom]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const handleRestore = useCallback(
    async (rule: ArchivedRule) => {
      if (!activeRoom) return;
      setRestoring(rule.id);
      try {
        await apiClient.post(`/rooms/${activeRoom.id}/rules/${rule.id}/restore`);
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
        Alert.alert('Berhasil', `Rule "${rule.name}" telah dipulihkan.`);
      } catch {
        Alert.alert('Gagal', 'Tidak dapat memulihkan rule.');
      } finally {
        setRestoring(null);
      }
    },
    [activeRoom]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Arsip Rules
        </Text>
        <Text style={styles.subtitle}>
          Rules yang dihapus dapat dipulihkan sebelum terhapus permanen.
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={rules}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={rules.length === 0 ? styles.emptyContainer : styles.list}
          onRefresh={fetchArchived}
          refreshing={loading}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🗂️</Text>
              <Text style={styles.emptyText}>Tidak ada rule yang diarsipkan.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.ruleName}>{item.name}</Text>
                <View style={[styles.daysBadge, item.days_left <= 7 && styles.daysBadgeUrgent]}>
                  <Text style={[styles.daysText, item.days_left <= 7 && styles.daysTextUrgent]}>
                    {item.days_left} hari tersisa
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.restoreBtn, restoring === item.id && styles.restoreBtnDisabled]}
                onPress={() => handleRestore(item)}
                disabled={restoring === item.id}
                accessibilityLabel={`Pulihkan rule ${item.name}`}
                accessibilityRole="button"
              >
                {restoring === item.id ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Text style={styles.restoreBtnText}>Pulihkan</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  list: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  ruleName: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 6 },
  daysBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  daysBadgeUrgent: { backgroundColor: '#FEF2F2' },
  daysText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  daysTextUrgent: { color: '#EF4444', fontWeight: '700' },
  restoreBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minWidth: 80,
    alignItems: 'center',
  },
  restoreBtnDisabled: { opacity: 0.5 },
  restoreBtnText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
});
