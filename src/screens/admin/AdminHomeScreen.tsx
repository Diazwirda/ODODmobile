import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppNavbar from '../../components/AppNavbar';
import { useRoomStore } from '../../stores/roomStore';
import type { AdminStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const MENU: Array<{
  title: string;
  subtitle: string;
  icon: string;
  route: keyof AdminStackParamList;
  color: string;
}> = [
  { title: 'Verifikasi Pending', subtitle: 'Proses laporan spotting yang menunggu.', icon: '🔔', route: 'PendingReportsScreen', color: '#A7F3F8' },
  { title: 'Input Poin Manual', subtitle: 'Tambah atau kurangi poin reporter.', icon: '🏅', route: 'ManualPointsScreen', color: '#86EFAC' },
  { title: 'Manajemen User', subtitle: 'Lihat user, role, poin, dan hapus akses.', icon: '👥', route: 'AdminUsersScreen', color: '#FBCFE8' },
  { title: 'Master Rules', subtitle: 'Tambah, edit, hapus, dan atur poin rule.', icon: '📋', route: 'RulesScreen', color: '#E0E7FF' },
  { title: 'Restore Rules', subtitle: 'Pulihkan rule yang terhapus sebelum 30 hari.', icon: '♻️', route: 'RestoreRulesScreen', color: '#FEF3C7' },
  { title: 'Laporan Aktivitas', subtitle: 'Ringkasan bulanan/tahunan aktivitas admin.', icon: '📊', route: 'ReportSummaryScreen', color: '#DCFCE7' },
  { title: 'Export Data', subtitle: 'Unduh laporan Excel atau PDF.', icon: '📤', route: 'ExportScreen', color: '#DBEAFE' },
  { title: 'Pengaturan Room', subtitle: 'Profil perusahaan, admin, dan kode undangan.', icon: '⚙️', route: 'RoomSettingsScreen', color: '#FDE2E2' },
];

export default function AdminHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom } = useRoomStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppNavbar title={activeRoom?.name ?? 'Admin'} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Admin Room</Text>
          <Text style={styles.heroText}>Kelola member, rules, poin, laporan, dan pengaturan perusahaan dari satu tempat.</Text>
        </View>

        <View style={styles.grid}>
          {MENU.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(item.route as never)}>
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { padding: 20, gap: 16 },
  hero: {
    borderRadius: 14, backgroundColor: '#EFF6FF', padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  heroTitle: { color: '#1E3A8A', fontSize: 20, fontWeight: '700' },
  heroText: { color: '#4B5563', fontSize: 13, lineHeight: 19, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%', minHeight: 154, borderRadius: 12, backgroundColor: '#fff', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  icon: { fontSize: 21 },
  title: { color: '#111827', fontSize: 14, fontWeight: '700' },
  subtitle: { color: '#6B7280', fontSize: 11, lineHeight: 16, marginTop: 6 },
});
