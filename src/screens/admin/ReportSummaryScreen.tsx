import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import { handleApiError } from '../../utils/toast';

interface SummaryData {
  total_violations: number;
  verified_violations: number;
  rejected_violations: number;
  pending_violations: number;
  total_reporters: number;
  top_reporters?: { name: string; count: number }[];
  top_violators?: { name: string; count: number }[];
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function num(...values: Array<number | string | undefined | null>): number {
  for (const value of values) {
    if (value !== undefined && value !== null && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return 0;
}

/** Backend field names for this endpoint have drifted before (see DashboardStats'
 * total_violation/total_violations split) — unwrap possible nesting and accept
 * a few likely aliases instead of trusting one exact shape. */
function normalizeSummary(payload: any): SummaryData {
  const raw = payload?.data ?? payload ?? {};
  return {
    total_violations: num(raw.total_violations, raw.total_violation, raw.total),
    verified_violations: num(raw.verified_violations, raw.verified, raw.total_verified),
    rejected_violations: num(raw.rejected_violations, raw.rejected, raw.total_rejected),
    pending_violations: num(raw.pending_violations, raw.pending, raw.total_pending),
    total_reporters: num(raw.total_reporters, raw.total_reporter, raw.reporter_count, raw.new_users, raw.total_new_users),
    top_reporters: raw.top_reporters ?? raw.top_reporter ?? [],
    top_violators: raw.top_violators ?? raw.top_violator ?? [],
  };
}

function StatRow({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

export default function ReportSummaryScreen() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.getReportSummary(
        period === 'monthly' ? { period, month, year } : { period, year },
      );
      setSummary(normalizeSummary(data));
    } catch (err) {
      // Unsure whether the backend actually accepts period/month/year on
      // this endpoint yet — fall back to the unfiltered call rather than
      // showing nothing if the filtered one is rejected.
      try {
        const { data } = await adminApi.getReportSummary();
        setSummary(normalizeSummary(data));
      } catch {
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  }, [period, month, year]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Ringkasan Laporan" />

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.periodChip, period === 'monthly' && styles.periodChipActive]}
          onPress={() => setPeriod('monthly')}>
          <Text style={[styles.periodChipText, period === 'monthly' && styles.periodChipTextActive]}>Bulanan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.periodChip, period === 'yearly' && styles.periodChipActive]}
          onPress={() => setPeriod('yearly')}>
          <Text style={[styles.periodChipText, period === 'yearly' && styles.periodChipTextActive]}>Tahunan</Text>
        </TouchableOpacity>
        {period === 'monthly' && (
          <TouchableOpacity style={styles.filterChip} onPress={() => setShowMonthPicker(true)}>
            <Text style={styles.filterChipText}>{MONTHS[month - 1]}</Text>
            <Text style={styles.filterChipArrow}>▼</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.filterChip} onPress={() => setShowYearPicker(true)}>
          <Text style={styles.filterChipText}>{year}</Text>
          <Text style={styles.filterChipArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#3B82F6" /></View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {summary ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Statistik Violations</Text>
              <StatRow label="Total Laporan" value={summary.total_violations} />
              <StatRow label="Terverifikasi" value={summary.verified_violations} color="#10B981" />
              <StatRow label="Ditolak" value={summary.rejected_violations} color="#EF4444" />
              <StatRow label="Menunggu" value={summary.pending_violations} color="#F59E0B" />
            </View>

            <View style={styles.card}>
              <StatRow label="Total Reporter" value={summary.total_reporters} />
            </View>

            {summary.top_reporters && summary.top_reporters.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Reporter</Text>
                {summary.top_reporters.map((r, i) => (
                  <View key={i} style={styles.rankRow}>
                    <Text style={styles.rank}>#{i + 1}</Text>
                    <Text style={styles.rankName}>{r.name}</Text>
                    <Text style={styles.rankCount}>{r.count} laporan</Text>
                  </View>
                ))}
              </View>
            )}

            {summary.top_violators && summary.top_violators.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Top Pelanggar</Text>
                {summary.top_violators.map((v, i) => (
                  <View key={i} style={styles.rankRow}>
                    <Text style={styles.rank}>#{i + 1}</Text>
                    <Text style={styles.rankName}>{v.name}</Text>
                    <Text style={styles.rankCount}>{v.count}×</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>Data ringkasan tidak tersedia.</Text>
        )}

        <TouchableOpacity style={styles.refreshBtn} onPress={fetchSummary}>
          <Text style={styles.refreshBtnText}>↻ Muat Ulang</Text>
        </TouchableOpacity>
      </ScrollView>
      )}

      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowMonthPicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Pilih Bulan</Text>
            {MONTHS.map((label, index) => (
              <TouchableOpacity
                key={label}
                style={[styles.pickerOption, month === index + 1 && styles.pickerOptionActive]}
                onPress={() => { setMonth(index + 1); setShowMonthPicker(false); }}>
                <Text style={[styles.pickerOptionText, month === index + 1 && styles.pickerOptionTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearPicker(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Pilih Tahun</Text>
            {YEAR_OPTIONS.map((y) => (
              <TouchableOpacity
                key={y}
                style={[styles.pickerOption, year === y && styles.pickerOptionActive]}
                onPress={() => { setYear(y); setShowYearPicker(false); }}>
                <Text style={[styles.pickerOptionText, year === y && styles.pickerOptionTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8, backgroundColor: '#fff' },
  periodChip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  periodChipActive: { backgroundColor: '#3B82F6' },
  periodChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  periodChipTextActive: { color: '#fff', fontWeight: '700' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  filterChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterChipArrow: { fontSize: 10, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  statLabel: { fontSize: 14, color: '#6B7280' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  rank: { width: 32, fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  rankName: { flex: 1, fontSize: 14, color: '#111827' },
  rankCount: { fontSize: 13, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', padding: 48 },
  refreshBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  refreshBtnText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  pickerSheet: { backgroundColor: '#fff', borderRadius: 16, width: 260, maxHeight: '70%', padding: 6 },
  pickerTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 10 },
  pickerOptionActive: { backgroundColor: '#EFF6FF' },
  pickerOptionText: { fontSize: 15, color: '#374151' },
  pickerOptionTextActive: { color: '#3B82F6', fontWeight: '600' },
});
