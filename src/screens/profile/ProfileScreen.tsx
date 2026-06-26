/**
 * ProfileScreen — Profil user dalam konteks room aktif.
 * Requirements: 12.1, 12.2, 12.3, 12.6, 12.9, 17.7
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, FlatList,
  ActivityIndicator, Alert, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { launchImageLibrary, type Asset } from 'react-native-image-picker';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import { getInitials } from '@utils/avatar';
import { validateImageFile } from '@utils/imageValidation';
import type { ProfileResponse } from '@/types/profile';
import type { Violation } from '@/types/violation';
import type { ProfileTabParamList } from '@navigation/types';
import type { ImageFile } from '@/types/common';

type Nav = StackNavigationProp<ProfileTabParamList>;

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B', verified: '#10B981', rejected: '#EF4444',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', verified: 'Terverifikasi', rejected: 'Ditolak',
};

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom } = useRoomStore();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!activeRoom) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<ProfileResponse>(`/rooms/${activeRoom.id}/profile`);
      setProfile(data);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memuat profil.');
    } finally {
      setLoading(false);
    }
  }, [activeRoom]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleChangePhoto = useCallback(async () => {
    if (!activeRoom) return;
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
    if (result.didCancel || !result.assets?.length) return;
    const asset: Asset = result.assets[0];
    const file: ImageFile = {
      uri: asset.uri ?? '',
      type: (asset.type ?? 'image/jpeg') as ImageFile['type'],
      name: asset.fileName ?? 'photo.jpg',
      size: asset.fileSize ?? 0,
    };
    const validation = validateImageFile(file, 3);
    if (!validation.valid) {
      Alert.alert('Foto Tidak Valid', validation.error ?? '');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('photo', { uri: file.uri, type: file.type, name: file.name } as any);
      await apiClient.post(`/rooms/${activeRoom.id}/profile/photo`, formData);
      fetchProfile();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mengunggah foto.');
    }
  }, [activeRoom, fetchProfile]);

  const handleDeletePhoto = useCallback(() => {
    if (!activeRoom) return;
    Alert.alert('Hapus Foto', 'Hapus foto profil Anda?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/rooms/${activeRoom.id}/profile/photo`);
            fetchProfile();
          } catch {
            Alert.alert('Gagal', 'Tidak dapat menghapus foto.');
          }
        },
      },
    ]);
  }, [activeRoom, fetchProfile]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>;
  if (!profile) return <View style={styles.centered}><Text style={styles.emptyText}>Profil tidak tersedia.</Text></View>;

  const { profile: p, stats, history } = profile;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {p.photo
            ? <Image source={{ uri: p.photo }} style={styles.avatarLarge} accessibilityLabel="Foto profil" />
            : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{getInitials(p.name)}</Text>
              </View>
            )}
          <View style={styles.photoActions}>
            <TouchableOpacity onPress={handleChangePhoto} style={styles.photoBtn}
              accessibilityLabel="Ganti foto profil" accessibilityRole="button">
              <Text style={styles.photoBtnText}>Ganti Foto</Text>
            </TouchableOpacity>
            {p.photo && (
              <TouchableOpacity onPress={handleDeletePhoto} style={styles.photoBtnDanger}
                accessibilityLabel="Hapus foto profil" accessibilityRole="button">
                <Text style={styles.photoBtnDangerText}>Hapus Foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.name}>{p.name}</Text>
          {p.department ? <Text style={styles.meta}>{p.department}</Text> : null}
          {p.position ? <Text style={styles.meta}>{p.position}</Text> : null}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.total_reports}</Text><Text style={styles.statLbl}>Total Laporan</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.points}</Text><Text style={styles.statLbl}>Poin</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>#{stats.rank}</Text><Text style={styles.statLbl}>Peringkat</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.streak_days}</Text><Text style={styles.statLbl}>Streak Hari</Text></View>
          <View style={styles.statItem}><Text style={styles.statVal}>{stats.reports_today}</Text><Text style={styles.statLbl}>Laporan Hari Ini</Text></View>
        </View>

        {/* Edit Profile */}
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfileScreen')}
          accessibilityLabel="Edit profil" accessibilityRole="button">
          <Text style={styles.editBtnText}>Edit Profil</Text>
        </TouchableOpacity>

        {/* History */}
        <Text style={styles.historyTitle}>Riwayat Laporan</Text>
        {history.length === 0
          ? <Text style={styles.emptyText}>Belum ada riwayat laporan.</Text>
          : history.map((v: Violation) => (
            <View key={v.id} style={styles.historyItem}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyRule}>{v.rule.name}</Text>
                <Text style={styles.historyDate}>
                  {new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[v.status] + '22' }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[v.status] }]}>{STATUS_LABEL[v.status]}</Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarLarge: { width: 96, height: 96, borderRadius: 48, marginBottom: 10 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarInitials: { fontSize: 32, fontWeight: '700', color: '#1D4ED8' },
  photoActions: { flexDirection: 'row', gap: 10 },
  photoBtn: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8 },
  photoBtnText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },
  photoBtnDanger: { paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#EF4444', borderRadius: 8 },
  photoBtnDangerText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statItem: { flex: 1, minWidth: '28%', backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  statVal: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLbl: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  editBtn: { backgroundColor: '#3B82F6', borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginBottom: 24 },
  editBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  historyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  historyLeft: { flex: 1, marginRight: 10 },
  historyRule: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
});
