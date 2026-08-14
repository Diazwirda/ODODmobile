import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppNavbar from '../../components/AppNavbar';
import { dashboardApi } from '../../api/dashboard';
import { handleApiError } from '../../utils/toast';
import type { LeaderboardEntry } from '../../types/dashboard';

const PERIODS = [
  { label: 'All-time', value: 'all-time' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Harian', value: 'daily' },
];

const SORTS = [
  { label: 'Nilai Terbanyak', value: 'desc' },
  { label: 'Nilai Tersedikit', value: 'asc' },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase();
}

function normalizeEntry(item: LeaderboardEntry, fallbackRank: number): LeaderboardEntry {
  return {
    ...item,
    points: Number(item.points ?? item.total_points ?? 0),
    rank: Number(item.rank ?? fallbackRank),
  };
}

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('all-time');
  const [sort, setSort] = useState('desc');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const loadLeaderboard = useCallback(async (nextPage = 1, append = false) => {
    setError(null);
    try {
      const { data } = await dashboardApi.leaderboard({
        period,
        sort,
        search: search.trim() || undefined,
        page: nextPage,
        per_page: 10,
      });
      const rawList = Array.isArray(data) ? data : data.data ?? [];
      const list = rawList.map((item, index) => normalizeEntry(item, (nextPage - 1) * 10 + index + 1));
      setEntries((prev) => append ? [...prev, ...list] : list);
      setPage(Array.isArray(data) ? nextPage : data.current_page ?? nextPage);
      setLastPage(Array.isArray(data) ? nextPage : data.last_page ?? nextPage);
      setTotal(Array.isArray(data) ? list.length : data.total ?? list.length);
    } catch (err) {
      setError(handleApiError(err));
    }
  }, [period, search, sort]);

  useEffect(() => {
    setIsLoading(true);
    loadLeaderboard(1, false).finally(() => setIsLoading(false));
  }, [loadLeaderboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard(1, false);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (isLoadingMore || page >= lastPage) return;
    setIsLoadingMore(true);
    await loadLeaderboard(page + 1, true);
    setIsLoadingMore(false);
  };

  const currentPeriodLabel = PERIODS.find((p) => p.value === period)?.label ?? 'All-time';
  const currentSortLabel = SORTS.find((s) => s.value === sort)?.label ?? 'Nilai Terbanyak';

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const rankEmoji = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : null;
    const isTop = item.rank <= 3;

    return (
      <View style={[styles.entryRow, isTop && styles.entryRowTop, item.rank === 1 && styles.entryRowFirst]}>
        <View style={styles.rankCell}>
          {rankEmoji ? <Text style={styles.rankEmoji}>{rankEmoji}</Text> : <Text style={styles.rankText}>#{item.rank}</Text>}
        </View>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, isTop && styles.avatarFallbackTop]}>
            <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
          </View>
        )}
        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>{item.name}</Text>
          {item.department ? <Text style={styles.entryDept} numberOfLines={1}>{item.department}</Text> : null}
        </View>
        <View style={[styles.pointsBubble, isTop && styles.pointsBubbleTop]}>
          <Text style={[styles.pointsValue, isTop && styles.pointsValueTop]}>{item.points}</Text>
          <Text style={[styles.pointsLabel, isTop && styles.pointsLabelTop]}>XP</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppNavbar title="Leaderboard" />
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterChip} onPress={() => setShowPeriodModal(true)}>
          <Text style={styles.filterChipText}>{currentPeriodLabel}</Text>
          <Text style={styles.filterChipArrow}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip} onPress={() => setShowSortModal(true)}>
          <Text style={styles.filterChipText}>{currentSortLabel}</Text>
          <Text style={styles.filterChipArrow}>▼</Text>
        </TouchableOpacity>
        <Text style={styles.headerCount}>{`Total ${total}`}</Text>
      </View>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama user..."
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadLeaderboard(1, false)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {isLoading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Memuat leaderboard...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.flatList}
          data={entries}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderEntry}
          contentContainerStyle={entries.length === 0 ? styles.emptyContainer : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            entries.length > 0 && page < lastPage ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? <ActivityIndicator color="#2563EB" /> : <Text style={styles.loadMoreText}>Muat Lagi</Text>}
              </TouchableOpacity>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyTitle}>Belum Ada Data</Text>
              <Text style={styles.emptySubtitle}>Leaderboard masih kosong untuk periode ini.</Text>
            </View>
          }
        />
      )}
      <Modal visible={showPeriodModal} transparent animationType="fade" onRequestClose={() => setShowPeriodModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPeriodModal(false)}>
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Pilih Periode</Text>
            {PERIODS.map((p) => (
              <TouchableOpacity key={p.value} style={[styles.filterOption, period === p.value && styles.filterOptionActive]} onPress={() => { setPeriod(p.value); setShowPeriodModal(false); }}>
                <Text style={[styles.filterOptionText, period === p.value && styles.filterOptionTextActive]}>{p.label}</Text>
                {period === p.value ? <Text style={styles.filterCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={showSortModal} transparent animationType="fade" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSortModal(false)}>
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>Urutkan</Text>
            {SORTS.map((s) => (
              <TouchableOpacity key={s.value} style={[styles.filterOption, sort === s.value && styles.filterOptionActive]} onPress={() => { setSort(s.value); setShowSortModal(false); }}>
                <Text style={[styles.filterOptionText, sort === s.value && styles.filterOptionTextActive]}>{s.label}</Text>
                {sort === s.value ? <Text style={styles.filterCheck}>✓</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  headerCount: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginLeft: 'auto', alignSelf: 'center' },
  filterBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, gap: 10, backgroundColor: '#fff' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipArrow: { fontSize: 10, color: '#9CA3AF' },
  searchWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  searchInput: { minHeight: 42, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 14, color: '#111827', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#9CA3AF', fontSize: 14 },
  errorBox: { margin: 16, backgroundColor: '#FEE2E2', borderRadius: 10, padding: 14, alignItems: 'center', gap: 8 },
  errorText: { color: '#DC2626', fontSize: 13 },
  retryBtn: { backgroundColor: '#EF4444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  flatList: { flex: 1 },
  list: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  separator: { height: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  loadMoreBtn: { marginTop: 14, marginBottom: 24, borderRadius: 12, backgroundColor: '#EFF6FF', paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: '#2563EB', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  entryRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  entryRowTop: { borderWidth: 1, borderColor: '#E5E7EB' },
  entryRowFirst: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  rankCell: { width: 36, alignItems: 'center' },
  rankEmoji: { fontSize: 24 },
  rankText: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarFallbackTop: { backgroundColor: '#BFDBFE' },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#3730A3' },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  entryDept: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  pointsBubble: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, minWidth: 52 },
  pointsBubbleTop: { backgroundColor: '#DBEAFE' },
  pointsValue: { fontSize: 17, fontWeight: '800', color: '#3B82F6' },
  pointsValueTop: { color: '#1D4ED8' },
  pointsLabel: { fontSize: 10, color: '#93C5FD', fontWeight: '600' },
  pointsLabelTop: { color: '#60A5FA' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  filterModal: { backgroundColor: '#fff', borderRadius: 16, width: 260, padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  filterModalTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10 },
  filterOptionActive: { backgroundColor: '#EFF6FF' },
  filterOptionText: { fontSize: 15, color: '#374151' },
  filterOptionTextActive: { color: '#3B82F6', fontWeight: '600' },
  filterCheck: { fontSize: 16, color: '#3B82F6' },
});
