/**
 * ViolationDetailScreen — Detail lengkap sebuah violation.
 * Requirements: 9.4, 10.1–10.7, 13.3
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  Alert, ActivityIndicator, Image, StyleSheet, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { z } from 'zod';

import { useViolationStore } from '@stores/violationStore';
import { useRoomStore } from '@stores/roomStore';
import { isAdmin } from '@utils/role';
import { getInitials } from '@utils/avatar';
import type { SpotTabParamList } from '@navigation/types';
import type { Violation } from '@/types/violation';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Verifikasi',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  verified: '#10B981',
  rejected: '#EF4444',
};

const rejectSchema = z.string().trim().min(1, 'Alasan penolakan wajib diisi.');

function AvatarSmall({ name, photo }: { name: string; photo?: string }) {
  if (photo) return <Image source={{ uri: photo }} style={styles.avatar} />;
  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
    </View>
  );
}

export default function ViolationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<SpotTabParamList, 'ViolationDetailScreen'>>();
  const { activeRoom, activeRoomRole } = useRoomStore();
  const { violations, updateViolationStatus } = useViolationStore();

  // Try to get violation from store (passed by list screen) or from route params
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get violation from store — the list screen navigates without params, so use first pending or last
  const violation: Violation | undefined = violations[0];

  if (!violation || !activeRoom) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Data laporan tidak ditemukan.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Kembali</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const canVerify = isAdmin(activeRoomRole) && violation.status === 'pending';

  const handleVerify = useCallback(async () => {
    if (!activeRoom) return;
    setIsSubmitting(true);
    try {
      await updateViolationStatus(activeRoom.id, violation.id, { status: 'verified' });
      Alert.alert('Berhasil', 'Laporan terverifikasi. Poin telah disesuaikan.');
      navigation.goBack();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat memverifikasi laporan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [activeRoom, violation.id, updateViolationStatus, navigation]);

  const handleRejectSubmit = useCallback(async () => {
    const result = rejectSchema.safeParse(rejectReason);
    if (!result.success) {
      setRejectError(result.error.errors[0].message);
      return;
    }
    if (!activeRoom) return;
    setIsSubmitting(true);
    try {
      await updateViolationStatus(activeRoom.id, violation.id, {
        status: 'rejected',
        reject_reason: rejectReason.trim(),
      });
      setRejectModalVisible(false);
      Alert.alert('Ditolak', 'Laporan telah ditolak.');
      navigation.goBack();
    } catch {
      Alert.alert('Gagal', 'Tidak dapat menolak laporan. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  }, [rejectReason, activeRoom, violation.id, updateViolationStatus, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_COLOR[violation.status] + '18' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[violation.status] }]}>
            {STATUS_LABEL[violation.status]}
          </Text>
        </View>

        {/* Rule */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Aturan yang Dilanggar</Text>
          <Text style={styles.sectionValue}>{violation.rule.name}</Text>
          {violation.rule.description ? (
            <Text style={styles.sectionSub}>{violation.rule.description}</Text>
          ) : null}
        </View>

        {/* Reporter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pelapor</Text>
          <View style={styles.userRow}>
            <AvatarSmall name={violation.reporter.name} photo={violation.reporter.photo} />
            <View>
              <Text style={styles.userName}>{violation.reporter.name}</Text>
              {violation.reporter.department ? (
                <Text style={styles.userDept}>{violation.reporter.department}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Violators */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pelanggar</Text>
          {violation.violators.map(v => (
            <View key={v.id} style={styles.userRow}>
              <AvatarSmall name={v.name} photo={v.photo} />
              <View>
                <Text style={styles.userName}>{v.name}</Text>
                {v.department ? <Text style={styles.userDept}>{v.department}</Text> : null}
              </View>
            </View>
          ))}
        </View>

        {/* Description */}
        {violation.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Deskripsi</Text>
            <Text style={styles.sectionValue}>{violation.description}</Text>
          </View>
        ) : null}

        {/* Photos */}
        {violation.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Foto Bukti</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {violation.photos.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={styles.photo}
                  accessibilityLabel={`Foto bukti ${i + 1}`}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reject reason */}
        {violation.status === 'rejected' && violation.reject_reason ? (
          <View style={[styles.section, styles.rejectReasonBox]}>
            <Text style={styles.sectionLabel}>Alasan Penolakan</Text>
            <Text style={styles.rejectReasonText}>{violation.reject_reason}</Text>
          </View>
        ) : null}

        {/* Date */}
        <Text style={styles.date}>
          Dilaporkan:{' '}
          {new Date(violation.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
          })}
        </Text>

        {/* Admin actions */}
        {canVerify && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.verifyBtn]}
              onPress={handleVerify}
              disabled={isSubmitting}
              accessibilityLabel="Verifikasi laporan"
              accessibilityRole="button">
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Verifikasi</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => setRejectModalVisible(true)}
              disabled={isSubmitting}
              accessibilityLabel="Tolak laporan"
              accessibilityRole="button">
              <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Tolak</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Reject modal */}
      <Modal visible={rejectModalVisible} animationType="slide" transparent onRequestClose={() => setRejectModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRejectModalVisible(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Alasan Penolakan</Text>
            <TextInput
              style={[styles.modalInput, rejectError ? styles.inputError : null]}
              placeholder="Tulis alasan penolakan..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={rejectReason}
              onChangeText={t => { setRejectReason(t); setRejectError(''); }}
              accessibilityLabel="Alasan penolakan"
            />
            {rejectError ? <Text style={styles.errorText}>{rejectError}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, isSubmitting && { opacity: 0.6 }]}
                onPress={handleRejectSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalSubmitText}>Tolak Laporan</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 40 },
  emptyText: { fontSize: 15, color: '#9CA3AF', marginBottom: 16 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  statusBanner: { borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  sectionValue: { fontSize: 15, color: '#111827', lineHeight: 22 },
  sectionSub: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 13, fontWeight: '700', color: '#1D4ED8' },
  userName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  userDept: { fontSize: 12, color: '#9CA3AF' },
  photo: { width: 180, height: 180, borderRadius: 8, marginRight: 10, resizeMode: 'cover' },
  rejectReasonBox: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  rejectReasonText: { fontSize: 14, color: '#991B1B', lineHeight: 20 },
  date: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginVertical: 8 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  verifyBtn: { backgroundColor: '#10B981' },
  rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 14 },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top', minHeight: 100, backgroundColor: '#F9FAFB', marginBottom: 4 },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  modalSubmit: { flex: 1, backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
