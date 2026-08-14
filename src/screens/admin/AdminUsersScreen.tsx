import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import { useRoomStore } from '../../stores/roomStore';
import { handleApiError } from '../../utils/toast';
import type { AdminUser } from '../../types/admin';
import type { AdminStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

export default function AdminUsersScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom } = useRoomStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : (data as any).data ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRemove = useCallback((user: AdminUser) => {
    if (!activeRoom) return;
    Alert.alert(
      'Hapus Pengguna',
      `Hapus "${user.name}" dari room ini? Pengguna akan kehilangan akses ke room ini.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setRemovingId(user.id);
            try {
              await adminApi.removeMember(activeRoom.id, user.id);
              setUsers((prev) => prev.filter((item) => item.id !== user.id));
            } catch (err) {
              Alert.alert('Gagal', handleApiError(err));
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  }, [activeRoom]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Kelola Pengguna" subtitle={`${users.length} anggota`} />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={users}
          keyExtractor={item => String(item.id)}
          onRefresh={fetchUsers}
          refreshing={loading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada anggota.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.photo
                ? <Image source={{ uri: item.photo }} style={styles.avatar} />
                : <View style={styles.avatarFallback}><Text style={styles.avatarText}>{getInitials(item.name)}</Text></View>}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.department ? <Text style={styles.dept}>{item.department}</Text> : null}
              </View>
              <View style={styles.right}>
                <Text style={styles.points}>{item.points} poin</Text>
                <TouchableOpacity
                  style={styles.pointBtn}
                  onPress={() => navigation.navigate('ManualPointsScreen', { userId: item.id, userName: item.name })}>
                  <Text style={styles.pointBtnText}>+ Poin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  disabled={removingId === item.id}
                  onPress={() => handleRemove(item)}>
                  {removingId === item.id
                    ? <ActivityIndicator size="small" color="#DC2626" />
                    : <Text style={styles.removeBtnText}>Hapus</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 48 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#111827' },
  email: { fontSize: 12, color: '#6B7280' },
  dept: { fontSize: 12, color: '#9CA3AF' },
  right: { alignItems: 'flex-end', gap: 6 },
  points: { fontSize: 13, fontWeight: '700', color: '#3B82F6' },
  pointBtn: { backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  pointBtnText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  removeBtn: { backgroundColor: '#FEF2F2', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, minWidth: 52, alignItems: 'center' },
  removeBtnText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
});
