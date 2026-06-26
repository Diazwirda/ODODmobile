/**
 * DashboardScreen — Statistik room dan akses ke leaderboard.
 * Requirements: 11.1, 11.2, 14.3
 */
import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useDashboardStore } from '@stores/dashboardStore';
import { useRoomStore } from '@stores/roomStore';
import type { DashboardTabParamList } from '@navigation/types';

type Nav = StackNavigationProp<DashboardTabParamList>;

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statCard} accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom } = useRoomStore();
  const { stats, isLoading, fetchStats } = useDashboardStore();

  useEffect(() => {
    if (activeRoom) fetchStats(activeRoom.id);
  }, [activeRoom, fetchStats]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">Dashboard</Text>
        <Text style={styles.subtitle}>{activeRoom?.name ?? ''}</Text>

        {isLoading && !stats ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3B82F6" accessibilityLabel="Memuat statistik" />
          </View>
        ) : (
          <>
            {/* Stats grid */}
            <View style={styles.grid}>
              <StatCard label="Laporan Hari Ini" value={stats?.reports_today ?? 0} color="#3B82F6" />
              <StatCard label="Laporan Minggu Ini" value={stats?.reports_this_week ?? 0} color="#8B5CF6" />
              <StatCard label="Total Violations" value={stats?.total_violation ?? 0} />
              <StatCard label="Total Transaksi Poin" value={stats?.total_points_log ?? 0} />
            </View>

            {/* Leaderboard CTA */}
            <TouchableOpacity style={styles.leaderboardBtn}
              onPress={() => navigation.navigate('LeaderboardScreen')}
              accessibilityLabel="Lihat leaderboard" accessibilityRole="button">
              <View>
                <Text style={styles.leaderboardBtnTitle}>🏆 Leaderboard</Text>
                <Text style={styles.leaderboardBtnSub}>Lihat peringkat anggota room</Text>
              </View>
              <Text style={styles.leaderboardBtnArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 32 },
  centered: { paddingVertical: 60, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 2 },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  leaderboardBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  leaderboardBtnTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  leaderboardBtnSub: { fontSize: 13, color: '#9CA3AF' },
  leaderboardBtnArrow: { fontSize: 24, color: '#D1D5DB' },
});
