/**
 * RuleListScreen — Daftar rules room dengan fitur admin.
 * Requirements: 6.1–6.5, 7.1, 7.6, 7.7, 7.8
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import apiClient from '@api/client';
import { useRoomStore } from '@stores/roomStore';
import { isAdmin, filterRulesForRole } from '@utils/role';
import type { Rule } from '@/types/rule';
import type { RulesTabParamList } from '@navigation/types';

type Nav = StackNavigationProp<RulesTabParamList>;

export default function RuleListScreen() {
  const navigation = useNavigation<Nav>();
  const { activeRoom, activeRoomRole } = useRoomStore();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    if (!activeRoom) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<Rule[]>(`/rooms/${activeRoom.id}/rules`);
      setRules(data);
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memuat rules.');
    } finally {
      setLoading(false);
    }
  }, [activeRoom]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const handleDelete = useCallback((rule: Rule) => {
    if (!activeRoom) return;
    Alert.alert(
      'Hapus Rule',
      `Hapus rule "${rule.name}"?\n\nRule yang dihapus dapat dipulihkan dalam 30 hari.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/rooms/${activeRoom.id}/rules/${rule.id}`);
              setRules(prev => prev.filter(r => r.id !== rule.id));
            } catch {
              Alert.alert('Gagal', 'Tidak dapat menghapus rule.');
            }
          },
        },
      ]
    );
  }, [activeRoom]);

  const displayRules = isAdmin(activeRoomRole) ? rules : filterRulesForRole(rules, activeRoomRole);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Rules</Text>
        {isAdmin(activeRoomRole) && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.archiveBtn}
              onPress={() => navigation.navigate('ArchivedRulesScreen')}
              accessibilityLabel="Arsip rules" accessibilityRole="button">
              <Text style={styles.archiveBtnText}>Arsip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn}
              onPress={() => navigation.navigate('CreateRuleScreen')}
              accessibilityLabel="Tambah rule" accessibilityRole="button">
              <Text style={styles.addBtnText}>+ Tambah</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
        <FlatList
          data={displayRules}
          keyExtractor={r => String(r.id)}
          contentContainerStyle={displayRules.length === 0 ? styles.emptyContainer : styles.list}
          onRefresh={fetchRules}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Belum ada rules di room ini.</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.ruleName}>{item.name}</Text>
                  {item.category ? <Text style={styles.ruleCategory}>{item.category}</Text> : null}
                </View>
                {isAdmin(activeRoomRole) && item.admin_only && (
                  <View style={styles.adminOnlyBadge}>
                    <Text style={styles.adminOnlyText}>Admin Only</Text>
                  </View>
                )}
              </View>
              {item.description ? <Text style={styles.ruleDesc}>{item.description}</Text> : null}
              {isAdmin(activeRoomRole) && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('EditRuleScreen')}
                    accessibilityLabel={`Edit rule ${item.name}`} accessibilityRole="button">
                    <Text style={styles.editBtn}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}
                    accessibilityLabel={`Hapus rule ${item.name}`} accessibilityRole="button">
                    <Text style={styles.deleteBtn}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', gap: 8 },
  archiveBtn: { paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8 },
  archiveBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  addBtn: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#3B82F6', borderRadius: 8 },
  addBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  list: { padding: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  cardInfo: { flex: 1, marginRight: 8 },
  ruleName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  ruleCategory: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  ruleDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginTop: 4 },
  adminOnlyBadge: { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  adminOnlyText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  cardActions: { flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#F3F4F6' },
  editBtn: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  deleteBtn: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
});
