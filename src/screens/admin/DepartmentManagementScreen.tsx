import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import type { Department } from '../../types/admin';

export default function DepartmentManagementScreen() {
  const insets = useSafeAreaInsets();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getDepartments();
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const { data } = await adminApi.createDepartment(newName.trim());
      setDepartments(prev => [...prev, data]);
      setNewName('');
      setModalVisible(false);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menambahkan departemen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (dept: Department) => {
    Alert.alert('Hapus Departemen', `Hapus departemen "${dept.name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          try {
            await adminApi.deleteDepartment(dept.id);
            setDepartments(prev => prev.filter(d => d.id !== dept.id));
          } catch {
            Alert.alert('Gagal', 'Tidak dapat menghapus departemen.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Kelola Departemen"
        subtitle={`${departments.length} departemen`}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Tambah</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={departments}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada departemen.</Text>}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <View>
                <Text style={styles.deptName}>{item.name}</Text>
                {item.member_count !== undefined && (
                  <Text style={styles.memberCount}>{item.member_count} anggota</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Text style={styles.deleteText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
            <Text style={styles.sheetTitle}>Tambah Departemen</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama departemen"
              placeholderTextColor="#9CA3AF"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 8 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 48 },
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  deptName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  memberCount: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  deleteText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB', marginBottom: 14 },
  saveBtn: { backgroundColor: '#3B82F6', borderRadius: 8, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
