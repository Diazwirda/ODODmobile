# Changelog - Perbaikan Fitur Export

## Tanggal: 2026-08-14

### ✅ Masalah yang Diperbaiki

1. **HTTP Method tidak didukung untuk Update Room**
   - Error: `The PUT method is not supported for route api/rooms/15`
   - Solusi: Mengubah method dari `PUT` ke `PATCH` di `src/api/admin.ts`

2. **Fitur Export tidak berfungsi di React Native**
   - Download file dengan `responseType: 'blob'` tidak bekerja sempurna di React Native
   - File tidak tersimpan ke device setelah download
   - Tidak ada mekanisme untuk membuka/share file setelah download

### 🔧 Perubahan yang Dilakukan

#### 1. Instalasi Dependencies
```bash
npx expo install expo-file-system expo-sharing
```

#### 2. File Baru
- **`src/utils/fileDownload.ts`** - Helper utilities untuk download dan sharing file:
  - `downloadFile()` - Download file dari URL dengan progress tracking
  - `shareFile()` - Share file menggunakan native share dialog
  - `downloadAndShare()` - Download dan langsung share
  - `generateFilename()` - Generate nama file dengan timestamp

#### 3. Perubahan pada `src/api/admin.ts`
- ✅ Ubah `updateRoom()` dari `PUT` ke `PATCH`
- ✅ Hapus `exportExcel()` dan `exportPdf()` yang menggunakan blob
- ✅ Tambah `getExportUrl()` - Generate URL download dengan query params
- ✅ Tambah `getAuthToken()` - Get token untuk auth header saat download

#### 4. Perubahan pada `src/screens/admin/ExportScreen.tsx`
- ✅ Menggunakan `expo-file-system/legacy` untuk download
- ✅ Implementasi progress bar untuk menampilkan progress download
- ✅ Download file dengan auth header (Bearer token)
- ✅ Otomatis share file setelah selesai download
- ✅ Filename dengan timestamp (format: `laporan_odob_YYYY-MM-DDTHH-mm-ss.xlsx`)

#### 5. Perubahan pada `src/screens/admin/ReportSummaryScreen.tsx`
- ✅ Update `handleExportPdf()` menggunakan FileSystem download
- ✅ Support parameter filter (month/year) pada export
- ✅ Otomatis share file setelah download

### 📱 Cara Kerja Sekarang

1. User klik tombol "Unduh Excel" atau "Unduh PDF"
2. App menampilkan loading indicator dan progress bar
3. File diunduh ke cache directory dengan nama unik (timestamp)
4. File ditambahkan auth header (Bearer token) otomatis
5. Setelah download selesai, native share dialog muncul
6. User bisa save ke Files, share ke app lain, atau cancel

### 🔐 Keamanan

- Auth token otomatis ditambahkan ke request header
- File download menggunakan HTTPS
- File disimpan di app cache directory (tidak accessible oleh app lain tanpa sharing)

### 🎯 Testing Checklist

- [ ] Test export Excel dari Export Screen
- [ ] Test export PDF dari Export Screen
- [ ] Test export PDF dengan filter bulanan dari Report Summary
- [ ] Test export PDF dengan filter tahunan dari Report Summary
- [ ] Test progress bar muncul saat download
- [ ] Test share dialog muncul setelah download
- [ ] Test file bisa dibuka dari share menu
- [ ] Test update room (Pengaturan Room) tidak error lagi

### 📝 Catatan

- File tersimpan di cache directory dan bisa otomatis dihapus sistem saat storage penuh
- Share dialog native berbeda antara iOS dan Android
- Expo v56 menggunakan API legacy untuk FileSystem (backward compatibility)
