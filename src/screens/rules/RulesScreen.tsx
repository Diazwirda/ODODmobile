import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { rulesApi } from '../../api/rules';
import { handleApiError } from '../../utils/toast';
import { useRoomStore } from '../../stores/roomStore';
import type { CreateRulePayload, Rule } from '../../types/rule';

export default function RulesScreen() {
  const insets = useSafeAreaInsets();
  const { activeRoomRole, activeRoom } = useRoomStore();
  const isAdmin = activeRoomRole === 'admin' || activeRoom?.can_manage === true;
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [reporterPoints, setReporterPoints] = useState('1');
  const [violatorPoints, setViolatorPoints] = useState('-1');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const normalizeRules = (payload: any): { list: Rule[]; current: number; last: number } => ({
    list: (Array.isArray(payload) ? payload : payload?.data ?? []).filter((rule: Rule) => !rule.is_deleted),
    current: Array.isArray(payload) ? 1 : payload?.current_page ?? 1,
    last: Array.isArray(payload) ? 1 : payload?.last_page ?? 1,
  });

  const loadRules = useCallback(async (nextPage = 1, append = false) => {
    if (nextPage === 1) setLoading(true);
    try {
      const { data } = await rulesApi.list({ page: nextPage, per_page: 10 });
      const normalized = normalizeRules(data);
      setRules((prev) => append ? [...prev, ...normalized.list] : normalized.list);
      setPage(normalized.current);
      setLastPage(normalized.last);
    } catch (err) {
      Alert.alert('Gagal', handleApiError(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRules(1, false);
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditingRule(null);
    setName('');
    setCategory('');
    setDescription('');
    setReporterPoints('1');
    setViolatorPoints('-1');
    setFormError(null);
    setModalVisible(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setName(rule.name ?? '');
    setCategory(rule.category ?? '');
    setDescription(rule.description ?? '');
    setReporterPoints(String(rule.reporter_points ?? 1));
    setViolatorPoints(String(rule.violator_points ?? -1));
    setFormError(null);
    setModalVisible(true);
  };

  const validatePayload = (): CreateRulePayload | null => {
    const reporter = parseInt(reporterPoints, 10);
    const violator = parseInt(violatorPoints, 10);
    if (!name.trim()) {
      setFormError('Nama rule wajib diisi.');
      return null;
    }
    if (!Number.isInteger(reporter) || !Number.isInteger(violator)) {
      setFormError('Poin pelapor dan pelanggar wajib angka bulat.');
      return null;
    }
    if (reporter === 0 || violator === 0) {
      setFormError('Poin tidak boleh 0.');
      return null;
    }
    if (reporter < -1000 || reporter > 1000 || violator < -1000 || violator > 1000) {
      setFormError('Poin harus di antara -1000 sampai 1000.');
      return null;
    }
    return {
      name: name.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      reporter_points: reporter,
      violator_points: violator,
    };
  };

  const saveRule = async () => {
    const payload = validatePayload();
    if (!payload) return;
    setSaving(true);
    setFormError(null);
    try {
      const { data } = editingRule
        ? await rulesApi.update(editingRule.id, payload)
        : await rulesApi.create(payload);
      setRules((prev) => editingRule
        ? prev.map((rule) => rule.id === editingRule.id ? data : rule)
        : [data, ...prev]);
      setModalVisible(false);
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = (rule: Rule) => {
    Alert.alert('Hapus Rule', `Hapus rule "${rule.name}"? Rule masih bisa direstore selama 30 hari.`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await rulesApi.delete(rule.id);
            setRules((prev) => prev.filter((item) => item.id !== rule.id));
          } catch (err) {
            Alert.alert('Gagal', handleApiError(err));
          }
        },
      },
    ]);
  };

  const loadMore = async () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    await loadRules(page + 1, true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Master Rules"
        subtitle="Daftar rule aktif di room ini"
        right={
          isAdmin ? (
            <TouchableOpacity style={styles.addButton} onPress={openCreate}>
              <Text style={styles.addText}>+ Rule</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#2563EB" /></View>
      ) : (
        <FlatList
          style={styles.flex}
          data={rules}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
          contentContainerStyle={rules.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada rule aktif.</Text>}
          ListFooterComponent={page < lastPage ? (
            <TouchableOpacity style={styles.moreButton} onPress={loadMore}>
              {loadingMore ? <ActivityIndicator color="#2563EB" /> : <Text style={styles.moreText}>Muat Lagi</Text>}
            </TouchableOpacity>
          ) : null}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
                  <Text style={styles.ruleName}>{item.name}</Text>
                  {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
                </View>
                {isAdmin ? (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => openEdit(item)}><Text style={styles.iconText}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.iconButton, styles.deleteButton]} onPress={() => deleteRule(item)}><Text style={styles.deleteText}>Hapus</Text></TouchableOpacity>
                  </View>
                ) : null}
              </View>
              <View style={styles.pointRow}>
                <Text style={styles.pointText}>Pelapor: {item.reporter_points ?? 1}</Text>
                <Text style={styles.pointText}>Pelanggar: {item.violator_points ?? -1}</Text>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{editingRule ? 'Edit Rule' : 'Tambah Rule'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.closeText}>Tutup</Text></TouchableOpacity>
            </View>
            {formError ? <Text style={styles.formError}>{formError}</Text> : null}
            <Text style={styles.label}>Nama Rule</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama rule" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Kategori</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Kategori" placeholderTextColor="#9CA3AF" />
            <Text style={styles.label}>Deskripsi</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Deskripsi rule" placeholderTextColor="#9CA3AF" />
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.label}>Poin Pelapor</Text>
                <TextInput style={styles.input} value={reporterPoints} onChangeText={setReporterPoints} keyboardType="numeric" />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.label}>Poin Pelanggar</Text>
                <TextInput style={styles.input} value={violatorPoints} onChangeText={setViolatorPoints} keyboardType="numeric" />
              </View>
            </View>
            <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={saveRule} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Simpan Rule</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  addButton: { borderRadius: 10, backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 9 },
  addText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyText: { color: '#64748B', textAlign: 'center', padding: 24 },
  card: {
    borderRadius: 12, backgroundColor: '#fff', padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 10 },
  cardInfo: { flex: 1 },
  category: { color: '#2563EB', fontSize: 11, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  ruleName: { color: '#111827', fontSize: 16, fontWeight: '700' },
  desc: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 5 },
  actions: { gap: 8 },
  iconButton: { borderRadius: 8, backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center' },
  iconText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  deleteButton: { backgroundColor: '#FEE2E2' },
  deleteText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
  pointRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pointText: { color: '#1E3A8A', fontSize: 12, fontWeight: '600', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  moreButton: { marginTop: 10, borderRadius: 10, backgroundColor: '#EFF6FF', paddingVertical: 12, alignItems: 'center' },
  moreText: { color: '#2563EB', fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,24,39,0.35)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, maxHeight: '88%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { color: '#111827', fontSize: 18, fontWeight: '700' },
  closeText: { color: '#2563EB', fontWeight: '700' },
  formError: { color: '#DC2626', fontSize: 13, marginBottom: 10 },
  label: { color: '#111827', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#F9FAFB', paddingHorizontal: 14, color: '#111827', fontSize: 15, marginBottom: 12 },
  textArea: { minHeight: 84, paddingTop: 12 },
  formRow: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  saveButton: { minHeight: 52, borderRadius: 12, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.65 },
});
