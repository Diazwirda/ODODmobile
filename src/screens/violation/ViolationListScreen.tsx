/**
 * ViolationListScreen — Daftar semua violations di room aktif.
 * Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useViolationStore } from '@stores/violationStore';
import { useRoomStore } from '@stores/roomStore';
import type { Violation } from '@/types/violation';
import type { SpotTabParamList } from '@navigation/types';

type Nav = StackNavigationProp<SpotTabParamList>;

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

function ViolationCard({ item, onPress }: { item: Violation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}
      accessibilityLabel={`Violation: ${item.rule.name}. Status: ${STATUS_LABEL[item.status]}`}
      accessibilityRole="button">
      <View style={styles.cardHeader}>
        <Text style={styles.ruleName} numberOfLines={1}>{item.rule.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
            {STATUS_LABEL[item.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>
        Pelapor: {item.reporter.name} · Pelanggar: {item.violators.map(v => v.name).join(', ')}
      </Text>
      <Text style={styles.date}>
        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </Text>
    </TouchableOpacity>
  );
}

export default function ViolationListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom } = useRoomStore();
  const { violations, myReports, isLoading, fetchViolations, fetchMyReports } = useViolationStore();
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    if (activeRoom) fetchViolations(activeRoom.id);
  }, [activeRoom, fetchViolations]);

  const handleTabChange = useCallback((tab: 'all' | 'mine') => {
    setActiveTab(tab);
    if (tab === 'mine' && activeRoom) fetchMyReports(activeRoom.id);
  }, [activeRoom, fetchMyReports]);

  const data = activeTab === 'all' ? violations : myReports;

  return (
    <SafeAreaView style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => handleTabChange('all')} accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Semua</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'mine' && styles.tabActive]}
          onPress={() => handleTabChange('mine')} accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'mine' }}>
          <Text style={[styles.tabText, activeTab === 'mine' && styles.tabTextActive]}>Laporan Saya</Text>
        </TouchableOpacity>
      </View>

      {isLoading && data.length === 0 ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <ViolationCard item={item}
              onPress={() => navigation.navigate('ViolationDetailScreen')} />
          )}
          contentContainerStyle={data.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Belum ada laporan.</Text>
            </View>
          }
          onRefresh={() => activeRoom && fetchViolations(activeRoom.id)}
          refreshing={isLoading}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#6B7280' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  list: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  ruleName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  date: { fontSize: 11, color: '#9CA3AF' },
});
