import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../components/ScreenHeader';
import { adminApi } from '../../api/admin';
import { generateFilename } from '../../utils/fileDownload';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type ExportType = 'excel' | 'pdf';

interface ExportState {
  loading: boolean;
  progress: number; // 0–1, 0 means indeterminate
}

const INITIAL_STATE: ExportState = { loading: false, progress: 0 };

export default function ExportScreen() {
  const [excelState, setExcelState] = useState<ExportState>(INITIAL_STATE);
  const [pdfState, setPdfState]     = useState<ExportState>(INITIAL_STATE);

  const handleExport = async (type: ExportType) => {
    const setState = type === 'excel' ? setExcelState : setPdfState;
    setState({ loading: true, progress: 0 });

    try {
      const url     = adminApi.getExportUrl(type);
      const headers = await adminApi.getDownloadHeaders();

      if (!headers['Authorization']) {
        Alert.alert('Gagal', 'Token autentikasi tidak ditemukan. Silakan login ulang.');
        return;
      }

      const extension = type === 'pdf' ? 'pdf' : 'xlsx';
      const filename  = generateFilename('laporan_odob', extension);
      const fileUri   = (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '') + filename;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        { headers },
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setState({ loading: true, progress: totalBytesWritten / totalBytesExpectedToWrite });
          }
        },
      );

      const result = await downloadResumable.downloadAsync();

      if (!result?.uri) {
        Alert.alert('Gagal', 'Download file gagal, coba lagi.');
        return;
      }

      // Guard against server error bodies saved as files
      if (result.status && result.status >= 400) {
        Alert.alert('Gagal', `Server mengembalikan error ${result.status}. Coba lagi nanti.`);
        await FileSystem.deleteAsync(result.uri, { idempotent: true });
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(result.uri, {
          dialogTitle: `Laporan ${type.toUpperCase()}`,
          mimeType: type === 'pdf' ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        Alert.alert('Berhasil', `File ${type.toUpperCase()} berhasil diunduh ke perangkat.`);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Gagal', `Tidak dapat mengekspor file ${type.toUpperCase()}.`);
    } finally {
      setState(INITIAL_STATE);
    }
  };

  const isAnyLoading = excelState.loading || pdfState.loading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Ekspor Laporan" subtitle="Unduh data laporan violation room ini" />
      <View style={styles.content}>
        <View style={styles.cards}>

          {/* Excel card */}
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>📊</Text>
            <Text style={styles.cardTitle}>Excel</Text>
            <Text style={styles.cardDesc}>
              Data dalam format spreadsheet (.xlsx) yang dapat diedit.
            </Text>
            {excelState.loading && excelState.progress > 0 && (
              <ProgressBar progress={excelState.progress} />
            )}
            <TouchableOpacity
              style={[styles.exportBtn, styles.excelBtn, isAnyLoading && styles.disabledBtn]}
              onPress={() => handleExport('excel')}
              disabled={isAnyLoading}>
              {excelState.loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.exportBtnText}>Unduh Excel</Text>}
            </TouchableOpacity>
          </View>

          {/* PDF card */}
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>📄</Text>
            <Text style={styles.cardTitle}>PDF</Text>
            <Text style={styles.cardDesc}>Laporan siap cetak dalam format PDF.</Text>
            {pdfState.loading && pdfState.progress > 0 && (
              <ProgressBar progress={pdfState.progress} />
            )}
            <TouchableOpacity
              style={[styles.exportBtn, styles.pdfBtn, isAnyLoading && styles.disabledBtn]}
              onPress={() => handleExport('pdf')}
              disabled={isAnyLoading}>
              {pdfState.loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.exportBtnText}>Unduh PDF</Text>}
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            ⓘ Setelah download selesai, pilihan untuk menyimpan atau membagikan file akan muncul.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>
      <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F9FAFB' },
  content:         { flex: 1, padding: 20 },
  cards:           { gap: 14, marginTop: 4 },
  card:            { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardEmoji:       { fontSize: 40, marginBottom: 12 },
  cardTitle:       { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardDesc:        { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 16 },
  progressContainer: { marginBottom: 12 },
  progressTrack:   { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill:    { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressLabel:   { fontSize: 12, color: '#6B7280', textAlign: 'right', fontWeight: '600' },
  exportBtn:       { borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  excelBtn:        { backgroundColor: '#10B981' },
  pdfBtn:          { backgroundColor: '#EF4444' },
  disabledBtn:     { opacity: 0.6 },
  exportBtnText:   { color: '#fff', fontSize: 15, fontWeight: '600' },
  note:            { marginTop: 24, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 14 },
  noteText:        { fontSize: 13, color: '#3B82F6', lineHeight: 19 },
});
