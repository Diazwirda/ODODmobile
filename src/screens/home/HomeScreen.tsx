import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PromptModal from '../../components/PromptModal';
import ImageViewerModal from '../../components/ImageViewerModal';
import AppNavbar from '../../components/AppNavbar';
import { adminApi } from '../../api/admin';
import { dashboardApi } from '../../api/dashboard';
import { profileApi } from '../../api/profile';
import { rulesApi } from '../../api/rules';
import { useMultiAuthStore } from '../../stores/multiAuthStore';
import { useRoomStore } from '../../stores/roomStore';
import type { AppStackParamList } from '../../navigation/types';
import type { AdminUser } from '../../types/admin';
import type { DashboardStats, LeaderboardEntry } from '../../types/dashboard';
import type { UserProfile } from '../../types/profile';
import type { Rule } from '../../types/rule';
import type { Violation } from '../../types/violation';

type StackNav = NativeStackNavigationProp<AppStackParamList>;

function firstName(name?: string): string {
  if (!name) return '-';
  return name.trim().split(/\s+/)[0] ?? name;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
}

function normalizeList<T>(payload: T[] | { data?: T[] } | any): T[] {
  return Array.isArray(payload) ? payload : payload?.data ?? [];
}

function pointsOf(item?: LeaderboardEntry | null): number {
  return Number(item?.points ?? item?.total_points ?? 0);
}

export default function HomeScreen() {
  const parentNavigation = useNavigation<StackNav>();
  const { activeRoom, activeRoomRole } = useRoomStore();
  const { spot } = useMultiAuthStore();
  const isAdmin = activeRoomRole === 'admin' || activeRoom?.can_manage === true;
  const currentUser = spot.user;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [pendingReports, setPendingReports] = useState<Violation[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Violation | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const leaderboardReq = dashboardApi.leaderboard({ period: 'all-time', sort: 'desc', limit: 3 });
      if (isAdmin) {
        const [usersRes, pendingRes, rulesRes, leaderboardRes] = await Promise.all([
          adminApi.getUsers(1),
          adminApi.getPendingReports(1),
          rulesApi.list(),
          leaderboardReq,
        ]);
        setAdminUsers(normalizeList<AdminUser>(usersRes.data));
        setPendingReports(normalizeList<Violation>(pendingRes.data));
        setRules(normalizeList<Rule>(rulesRes.data).filter((rule) => !rule.is_deleted));
        const rawTop = normalizeList<LeaderboardEntry>(leaderboardRes.data).slice(0, 3);
        setTopUsers(rawTop.map((item, index) => ({ ...item, points: Number(item.points ?? item.total_points ?? 0), rank: Number(item.rank ?? index + 1) })));
      } else {
        const [profileRes, statsRes, leaderboardRes] = await Promise.all([
          profileApi.get(),
          dashboardApi.stats(),
          leaderboardReq,
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
        const rawTop = normalizeList<LeaderboardEntry>(leaderboardRes.data).slice(0, 3);
        setTopUsers(rawTop.map((item, index) => ({ ...item, points: Number(item.points ?? item.total_points ?? 0), rank: Number(item.rank ?? index + 1) })));
      }
    } catch (err) {
      if (__DEV__) console.log('[HomeScreen] Failed to load dashboard', err);
      setTopUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadDashboard(); }, [loadDashboard, activeRoom?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const handleVerify = async (report: Violation) => {
    setProcessingId(report.id);
    try {
      await adminApi.updateViolationStatus(report.id, { status: 'verified' });
      setPendingReports((prev) => prev.filter((item) => item.id !== report.id));
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memverifikasi laporan.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (report: Violation) => {
    setRejectTarget(report);
  };

  const submitReject = async (reason: string) => {
    const report = rejectTarget;
    if (!report) return;
    setRejectTarget(null);
    setProcessingId(report.id);
    try {
      await adminApi.updateViolationStatus(report.id, { status: 'rejected', reject_reason: reason });
      setPendingReports((prev) => prev.filter((item) => item.id !== report.id));
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menolak laporan.');
    } finally {
      setProcessingId(null);
    }
  };

  const podium = useMemo(() => [topUsers[1], topUsers[0], topUsers[2]], [topUsers]);
  const adminCount = adminUsers.filter((user) => user.membership_role === 'admin' || (user as any).role === 'admin').length;
  const employeeCount = adminUsers.filter((user) => user.membership_role !== 'admin' && (user as any).role !== 'admin').length;

  if (isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <AppNavbar title={activeRoom?.name ?? 'Beranda'} />
        <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />}>
          <View style={styles.adminHero}>
            <View>
              <Text style={styles.adminHeroTitle}>Admin Dashboard</Text>
              <Text style={styles.adminHeroText}>Halaman ini khusus admin untuk verifikasi laporan pending dan monitoring data sistem.</Text>
            </View>
            <View style={styles.heroCircle} />
          </View>

          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color="#2563EB" /></View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={[styles.adminStatCard, styles.statCyan]}>
                <Text style={styles.adminStatIcon}>👥</Text>
                <Text style={styles.adminStatValue}>{employeeCount}</Text>
                <Text style={styles.adminStatLabel}>Total Karyawan</Text>
              </View>
              <View style={[styles.adminStatCard, styles.statGreen]}>
                <Text style={styles.adminStatIcon}>⏳</Text>
                <Text style={styles.adminStatValue}>{pendingReports.length}</Text>
                <Text style={styles.adminStatLabel}>Laporan Pending</Text>
              </View>
              <View style={styles.adminStatCard}>
                <Text style={styles.adminStatIcon}>🛡️</Text>
                <Text style={styles.adminStatValue}>{adminCount}</Text>
                <Text style={styles.adminStatLabel}>Admin Aktif</Text>
              </View>
              <View style={[styles.adminStatCard, styles.statPink]}>
                <Text style={styles.adminStatIcon}>📋</Text>
                <Text style={styles.adminStatValue}>{rules.length}</Text>
                <Text style={styles.adminStatLabel}>Total Rules</Text>
              </View>
            </View>
          )}

          <View style={styles.adminPanel}>
            <Text style={styles.panelTitle}>🔔 Verifikasi Laporan Pending</Text>
            {pendingReports.length === 0 ? (
              <View style={styles.adminEmpty}>
                <Text style={styles.adminEmptyIcon}>✅</Text>
                <Text style={styles.adminEmptyText}>Mantap! Tidak ada laporan pending</Text>
              </View>
            ) : (
              pendingReports.slice(0, 3).map((report) => (
                <View key={report.id} style={styles.pendingItem}>
                  <Text style={styles.pendingRule}>{report.rule?.name ?? 'Laporan'}</Text>
                  <Text style={styles.pendingMeta}>
                    Pelapor: {report.reporter?.name ?? '-'} • Pelanggar: {report.violators?.map((user) => user.name).join(', ') || '-'}
                  </Text>
                  {report.description ? <Text style={styles.pendingDesc}>{report.description}</Text> : null}
                  {report.photos && report.photos.length > 0 ? (
                    <View style={styles.pendingPhotoRow}>
                      {report.photos.map((photoUri, index) => (
                        <TouchableOpacity key={index} onPress={() => setViewingPhoto(photoUri)}>
                          <Image source={{ uri: photoUri }} style={styles.pendingPhotoThumb} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.pendingActions}>
                    <TouchableOpacity style={[styles.verifyBtn, processingId === report.id && styles.disabledButton]} onPress={() => handleVerify(report)} disabled={processingId === report.id}>
                      <Text style={styles.verifyText}>Verifikasi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.rejectBtn, processingId === report.id && styles.disabledButton]} onPress={() => handleReject(report)} disabled={processingId === report.id}>
                      <Text style={styles.rejectText}>Tolak</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {topUsers.length > 0 ? <LeaderboardPodium podium={podium} /> : null}
        </ScrollView>

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppNavbar title={activeRoom?.name ?? 'Beranda'} />
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}>

        <View style={styles.spotCard}>
          <Text style={styles.spotTitle}>Spot Teman Lupa</Text>
          <Text style={styles.spotSubtitle}>Tangkap teman yang lupa melakukan kebiasaan. Poin akan mengikuti rule yang dipilih.</Text>
          <TouchableOpacity style={styles.spotButton} onPress={() => parentNavigation.navigate('SpotModal')} activeOpacity={0.85}>
            <Text style={styles.spotButtonText}>📷 Mulai Spotting</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}><ActivityIndicator color="#2563EB" /></View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statGreen]}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{profile?.points ?? stats?.my_points ?? 0}</Text>
              <Text style={styles.statLabel}>Total Skor</Text>
            </View>
            <View style={[styles.statCard, styles.statPink]}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{(profile as any)?.streak_days ?? 0}</Text>
              <Text style={styles.statLabel}>Hari Streak</Text>
            </View>
            <View style={[styles.statCard, styles.statCyan]}>
              <Text style={styles.statIcon}>📌</Text>
              <Text style={styles.statValue}>{(profile as any)?.total_spots ?? stats?.total_violations ?? stats?.total_violation ?? 0}</Text>
              <Text style={styles.statLabel}>Total Spot</Text>
            </View>
            <View style={[styles.statCard, styles.statPurple]}>
              <Text style={styles.statIcon}>🏅</Text>
              <Text style={styles.statValue}>#{profile?.rank ?? stats?.my_rank ?? '-'}</Text>
              <Text style={styles.statLabel}>Rank Saya</Text>
            </View>
          </View>
        )}

        <LeaderboardPodium podium={podium} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LeaderboardPodium({ podium }: { podium: Array<LeaderboardEntry | undefined> }) {
  const hasData = podium.some(Boolean);
  return (
    <View style={styles.leaderboardPanel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>🏆 Top 3 Leaderboard</Text>
        <Text style={styles.panelMeta}>Top 3 All Time</Text>
      </View>
      {!hasData ? (
        <Text style={styles.emptyText}>Belum ada data leaderboard.</Text>
      ) : (
        <View style={styles.podiumWrap}>
          {podium.map((user, index) => {
            if (!user) return <View key={index} style={styles.podiumSlot} />;
            const rank = user.rank;
            const height = rank === 1 ? 116 : rank === 2 ? 92 : 76;
            return (
              <View key={user.id} style={styles.podiumSlot}>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumInitials}>{initials(user.name)}</Text>
                  <View style={styles.podiumRank}><Text style={styles.podiumRankText}>{rank}</Text></View>
                </View>
                <View style={[styles.podiumBar, { height }, rank === 1 ? styles.podiumFirst : rank === 2 ? styles.podiumSecond : styles.podiumThird]}>
                  <Text style={styles.podiumName} numberOfLines={1}>{firstName(user.name)}</Text>
                  <Text style={styles.podiumPoints}>{pointsOf(user)}</Text>
                  <Text style={styles.podiumXp}>XP</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 20, gap: 12 },
  adminHero: {
    minHeight: 106, backgroundColor: '#EFF6FF', borderRadius: 12, padding: 18, overflow: 'hidden', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  adminHeroTitle: { color: '#1E3A8A', fontSize: 20, fontWeight: '700' },
  adminHeroText: { color: '#4B5563', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 240 },
  heroCircle: { position: 'absolute', width: 128, height: 128, borderRadius: 64, backgroundColor: '#DBEAFE', right: -24, top: -18 },
  loadingBox: { paddingVertical: 24 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  adminStatCard: {
    width: '48%', minHeight: 90, borderRadius: 12, backgroundColor: '#fff', padding: 14, justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  adminStatIcon: { position: 'absolute', left: 18, top: 35, fontSize: 18 },
  adminStatValue: { color: '#111827', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  adminStatLabel: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 6, fontWeight: '600' },
  adminPanel: {
    minHeight: 196, backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  adminEmpty: { flex: 1, minHeight: 138, alignItems: 'center', justifyContent: 'center' },
  adminEmptyIcon: { fontSize: 42, marginBottom: 14 },
  adminEmptyText: { color: '#6B7280', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  pendingItem: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB', paddingVertical: 12 },
  pendingRule: { color: '#111827', fontSize: 14, fontWeight: '700' },
  pendingMeta: { color: '#6B7280', fontSize: 11, marginTop: 4 },
  pendingDesc: { color: '#374151', fontSize: 12, marginTop: 6 },
  pendingPhotoRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pendingPhotoThumb: { width: 56, height: 56, borderRadius: 8 },
  pendingActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  verifyBtn: { flex: 1, backgroundColor: '#DCFCE7', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  verifyText: { color: '#065F46', fontSize: 12, fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  rejectText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  spotCard: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  spotTitle: { color: '#1E3A8A', fontSize: 18, fontWeight: '700' },
  spotSubtitle: { color: '#374151', fontSize: 13, lineHeight: 19, maxWidth: 260 },
  spotButton: {
    marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#3B82F6', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 11,
  },
  spotButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statCard: {
    width: '48%', minHeight: 92, borderRadius: 12, backgroundColor: '#fff', padding: 14, justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statGreen: { backgroundColor: '#DCFCE7' },
  statPink: { backgroundColor: '#FCE7F3' },
  statCyan: { backgroundColor: '#DBEAFE' },
  statPurple: { backgroundColor: '#EDE9FE' },
  statIcon: { position: 'absolute', left: 16, top: 30, fontSize: 20 },
  statValue: { color: '#111827', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  statLabel: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 5, fontWeight: '600' },
  leaderboardPanel: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  panelMeta: { color: '#6B7280', fontSize: 10, fontWeight: '600' },
  emptyText: { color: '#6B7280', fontSize: 13, paddingVertical: 24, textAlign: 'center' },
  podiumWrap: { height: 178, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginTop: 16 },
  podiumSlot: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  podiumAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', marginBottom: -5, zIndex: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  podiumInitials: { color: '#111827', fontSize: 13, fontWeight: '700' },
  podiumRank: {
    position: 'absolute', bottom: -8, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
  },
  podiumRankText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  podiumBar: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  podiumFirst: { backgroundColor: '#DBEAFE' },
  podiumSecond: { backgroundColor: '#DCFCE7' },
  podiumThird: { backgroundColor: '#FCE7F3' },
  podiumName: { color: '#111827', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  podiumPoints: { color: '#111827', fontSize: 18, fontWeight: '700', marginTop: 5 },
  podiumXp: { color: '#6B7280', fontSize: 9, fontWeight: '600' },
});
