# Implementation Plan: React Native Mobile App

## Overview

Implementasi aplikasi mobile React Native (Expo bare workflow) untuk sistem One Day One Behavior Spot Slimrich. Aplikasi ini mengonsumsi REST API dari backend Laravel 12 dan mendukung autentikasi JWT serta Google OAuth, manajemen room, pelaporan violation, dashboard, leaderboard, dan profil pengguna.

Stack: React Native + TypeScript, React Navigation v6, Zustand ^4, Axios ^1.6, NativeWind v4, React Hook Form + Zod, react-native-keychain, react-native-image-picker, react-native-inappbrowser-reborn, fast-check + Jest.

---

## Tasks

- [x] 1. Setup & Infrastruktur Proyek
  - [x] 1.1 Inisialisasi proyek Expo bare workflow dengan TypeScript
    - Jalankan `npx create-expo-app --template` dengan bare workflow
    - Konfigurasi `tsconfig.json` dengan `strict: true`, `paths`, dan `baseUrl`
    - Setup ESLint (`@typescript-eslint/eslint-plugin`) dan Prettier dengan konfigurasi standar
    - Tambahkan `.editorconfig` dan `.prettierrc`
    - _Requirements: 17.1_

  - [x] 1.2 Instalasi dan konfigurasi dependencies utama
    - Install React Navigation v6: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`
    - Install Zustand ^4: `zustand`
    - Install Axios ^1.6: `axios`
    - Install NativeWind v4: `nativewind`, `tailwindcss` — konfigurasi `tailwind.config.js` dan `babel.config.js`
    - Install React Hook Form + Zod: `react-hook-form`, `zod`, `@hookform/resolvers`
    - Install `react-native-keychain`, `react-native-image-picker`, `react-native-inappbrowser-reborn`
    - Install testing: `jest`, `@types/jest`, `fast-check`, `@testing-library/react-native`
    - _Requirements: 17.1_

  - [x] 1.3 Setup konfigurasi environment dan struktur folder proyek
    - Install dan konfigurasi `react-native-config` untuk env vars (`API_BASE_URL`, dll.)
    - Buat file `.env`, `.env.example`, `.env.production`
    - Buat struktur folder: `src/api/`, `src/stores/`, `src/screens/`, `src/components/`, `src/utils/`, `src/types/`, `src/navigation/`, `src/hooks/`
    - Konfigurasi Jest di `jest.config.js` dengan transform untuk NativeWind dan module aliases
    - _Requirements: 16.4_


- [x] 2. TypeScript Interfaces & Types
  - [x] 2.1 Definisikan semua interfaces dan types data model
    - Buat `src/types/auth.ts`: `AuthUser`, `AuthResponse`, `RegisterPayload`, `LoginPayload`
    - Buat `src/types/room.ts`: `Room`, `RoomAdmin`, `MembershipRole`, `InviteCodeType`, `CreateRoomPayload`, `UpdateRoomPayload`
    - Buat `src/types/rule.ts`: `Rule`, `ArchivedRule`, `CreateRulePayload`
    - Buat `src/types/violation.ts`: `Violation`, `ViolationUser`, `ViolationStatus`, `CreateViolationPayload`, `UpdateViolationStatusPayload`
    - Buat `src/types/dashboard.ts`: `DashboardStats`, `LeaderboardEntry`, `LeaderboardResponse`, `LeaderboardFilters`, `LeaderboardPeriod`, `BadgeTier`
    - Buat `src/types/profile.ts`: `UserProfile`, `ProfileStats`, `ProfileResponse`
    - Buat `src/types/common.ts`: `ImageFile`, `Department`, `NormalizedError`
    - Buat `src/types/index.ts` sebagai barrel export
    - _Requirements: 1.1–1.9, 4.1–4.8, 6.1–6.5, 8.1–8.9, 9.1–9.7, 11.1–11.11, 12.1–12.9_


- [x] 3. API Client Layer
  - [x] 3.1 Implementasikan Axios instance dan request interceptor
    - Buat `src/api/client.ts` dengan `axios.create({ baseURL: Config.API_BASE_URL, timeout: 30000 })`
    - Implementasikan request interceptor yang membaca token dari Keychain dan menyertakan `Authorization: Bearer {token}`
    - Tangani `Content-Type: multipart/form-data` otomatis ketika `config.data instanceof FormData`
    - Buat `navigationRef` di `src/navigation/navigationRef.ts` untuk navigasi imperatif dari luar komponen
    - _Requirements: 16.1, 16.2, 16.3_

  - [ ]* 3.2 Tulis property test untuk injeksi Authorization header (P6)
    - **Property 6: Injeksi Authorization header pada setiap request**
    - Gunakan `fc.string()` untuk nilai token — verifikasi header selalu terset dengan nilai persis
    - Verifikasi tidak ada header `Authorization` ketika token null/kosong
    - **Validates: Requirements 16.1, 16.2**

  - [x] 3.3 Implementasikan response interceptor dan error normalizer
    - Implementasikan `normalizeError(error: AxiosError): NormalizedError` di `src/api/errorNormalizer.ts`
    - Petakan status 401, 403, 404, 422, 502, dan network error ke pesan Bahasa Indonesia
    - Implementasikan response interceptor: 401 → coba refresh token → retry, gagal → clear session → navigate Login
    - Tandai request dengan `_retry: boolean` untuk mencegah infinite refresh loop
    - _Requirements: 1.8, 1.9, 14.1, 14.2, 14.6, 14.7, 16.5_


- [x] 4. Secure Storage Service
  - [x] 4.1 Implementasikan wrapper Keychain untuk secure storage
    - Buat `src/services/secureStorage.ts` dengan fungsi `saveToken(token: string)`, `getToken(): Promise<string | null>`, `removeToken(): Promise<void>`
    - Gunakan `react-native-keychain` — `setGenericPassword` / `getGenericPassword` / `resetGenericPassword`
    - Ekspor fungsi `checkTokenNeedsRefresh(remainingSeconds: number, threshold?: number): boolean` dengan threshold default 300 detik
    - _Requirements: 1.5, 1.7, 1.8, 14.4_

  - [ ]* 4.2 Tulis property test untuk token refresh threshold check (P1)
    - **Property 1: Token refresh berdasarkan expiry**
    - Gunakan `fc.integer({ min: 0, max: 3600 })` untuk sisa waktu token dalam detik
    - Verifikasi `checkTokenNeedsRefresh(remainingSeconds)` mengembalikan `true` jika dan hanya jika `remainingSeconds <= 300`
    - **Validates: Requirements 1.8, 1.9**


- [x] 5. Setup Navigasi
  - [x] 5.1 Implementasikan struktur navigator root
    - Buat `src/navigation/RootNavigator.tsx` sebagai Stack Navigator utama
    - Buat `src/navigation/AuthStack.tsx` dengan screens: `LoginScreen`, `RegisterScreen`, `OnboardingStack`
    - Buat `src/navigation/OnboardingStack.tsx` dengan screens: `CompanyTutorialScreen`, `UserTutorialScreen`, `AdminTutorialScreen`
    - Buat `src/navigation/AppStack.tsx` dengan screens: `RoomListScreen`, `JoinRoomScreen`, `CreateRoomScreen`, `RoomTabNavigator`
    - Implementasikan logika di `RootNavigator` untuk menampilkan `AuthStack` atau `AppStack` berdasarkan `isAuthenticated` dari `authStore`
    - _Requirements: 1.7, 1.9, 3.1–3.6, 15.1–15.6, 17.5_

  - [x] 5.2 Implementasikan RoomTabNavigator (Bottom Tab per room)
    - Buat `src/navigation/RoomTabNavigator.tsx` dengan 5 tab: Home, Spot, Dashboard, Rules (admin only), Profil
    - Sembunyikan tab Rules ketika `activeRoomRole === 'reporter'` sesuai Requirements 13.1–13.2
    - Definisikan semua screen di dalam masing-masing tab sesuai hierarki di design: `ViolationDetailScreen`, `LeaderboardScreen`, dll.
    - Buat file `src/navigation/types.ts` untuk typed navigation params seluruh stack
    - _Requirements: 13.1, 13.2, 13.5, 13.6_


- [x] 6. Utility Functions
  - [x] 6.1 Implementasikan utility functions untuk role, avatar, dan validasi file
    - Buat `src/utils/role.ts`: `isAdmin(role)`, `isReporter(role)`, `filterRulesForRole(rules, role)` (sembunyikan `admin_only` rules untuk reporter)
    - Buat `src/utils/avatar.ts`: `getInitials(name: string): string` — ambil 1–2 karakter pertama kata dalam nama
    - Buat `src/utils/imageValidation.ts`: `validateImageFile(file: ImageFile, maxSizeMB: number): { valid: boolean; error?: string }` — validasi ukuran dan MIME type
    - Buat `src/utils/googleOAuth.ts`: `extractGoogleToken(url: string): string | null` — ekstrak `#google_token=...` dari URL fragment
    - _Requirements: 2.3, 2.4, 6.4, 6.5, 8.5, 8.6, 12.7, 12.8, 17.7_

  - [ ]* 6.2 Tulis property test untuk filterRulesForRole (P3)
    - **Property 3: Filter rules berdasarkan role**
    - Gunakan `fc.array(fc.record({ id: fc.nat(), name: fc.string(), admin_only: fc.boolean(), created_at: fc.string() }))`
    - Verifikasi: jika role `reporter`, tidak ada rule dengan `admin_only: true` di hasil; jika role `admin`, hasil sama persis dengan input
    - **Validates: Requirements 6.4, 6.5**

  - [ ]* 6.3 Tulis property test untuk validateImageFile (P4)
    - **Property 4: Validasi ukuran dan format file foto**
    - Gunakan `fc.integer({ min: 0 })` untuk ukuran file dan `fc.string()` untuk MIME type
    - Verifikasi `valid: false` untuk ukuran > maxSizeMB * 1024 * 1024 dan untuk MIME type bukan `image/jpeg`, `image/png`, `image/webp`
    - Verifikasi `valid: true` untuk file yang memenuhi kedua kriteria
    - **Validates: Requirements 8.5, 8.6, 12.7, 12.8**

  - [ ]* 6.4 Tulis property test untuk extractGoogleToken (P2)
    - **Property 2: Ekstraksi Google OAuth token dari URL**
    - Gunakan `fc.string()` untuk nilai token; verifikasi URL `#google_token={token}` selalu menghasilkan nilai token yang tepat
    - Verifikasi URL dengan `?google_error=...` atau fragment tidak dikenal mengembalikan `null`
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 6.5 Tulis property test untuk getInitials (P7)
    - **Property 7: Avatar fallback dari inisial nama**
    - Gunakan `fc.string()` untuk nama user; verifikasi nama yang sama selalu menghasilkan inisial yang sama (deterministik)
    - Verifikasi inisial tidak pernah kosong untuk nama dengan setidaknya satu karakter non-whitespace
    - **Validates: Requirements 17.7**


- [x] 7. Checkpoint — Pastikan semua tests utility lulus
  - Jalankan `jest --testPathPattern="utils|services"` untuk memverifikasi semua unit test dan property test pada utility functions lulus sebelum melanjutkan ke store dan screen.

- [x] 8. State Management — authStore
  - [x] 8.1 Implementasikan authStore dengan Zustand
    - Buat `src/stores/authStore.ts` dengan interface `AuthStore`
    - Implementasikan `login(email, password)`: POST `/api/auth/login` → simpan token ke Keychain → set `user` dan `isAuthenticated`
    - Implementasikan `register(data)`: POST `/api/auth/register` → simpan token → set state
    - Implementasikan `loginWithGoogle(token)`: simpan token ke Keychain → set state dari decoded user atau fetch profile
    - Implementasikan `logout()`: DELETE `/api/auth/logout` → hapus token dari Keychain → reset state
    - Implementasikan `refreshToken()`: POST `/api/auth/refresh` → update token di Keychain
    - Implementasikan `clearAuth()`: reset state tanpa API call (digunakan interceptor saat refresh gagal)
    - _Requirements: 1.2, 1.5, 1.7, 1.8, 1.9, 2.3_

  - [ ]* 8.2 Tulis unit tests untuk authStore
    - Test `login` dengan mock Axios: skenario sukses dan error 422
    - Test `logout` menghapus token dari Keychain
    - Test `clearAuth` mereset state tanpa side effect
    - _Requirements: 1.2, 1.5, 1.6, 1.7_


- [x] 9. State Management — roomStore
  - [x] 9.1 Implementasikan roomStore dengan Zustand
    - Buat `src/stores/roomStore.ts` dengan interface `RoomStore`
    - Implementasikan `fetchRooms()`: GET `/api/rooms` → set `rooms`
    - Implementasikan `setActiveRoom(room)`: set `activeRoom` dan `activeRoomRole` dari `room.membership_role`
    - Implementasikan `createRoom(data)`: POST `/api/rooms` (multipart jika ada foto) → append ke `rooms`
    - Implementasikan `joinRoom(code)`: POST `/api/rooms/join` → append ke `rooms` → return room
    - Implementasikan `updateRoom(id, data)`: PUT `/api/rooms/{id}` → update `rooms` dan `activeRoom`
    - Implementasikan `deleteRoom(id)`: DELETE `/api/rooms/{id}` → remove dari `rooms` → `clearActiveRoom()`
    - _Requirements: 4.1–4.8, 5.1–5.9, 15.1–15.6_

  - [ ]* 9.2 Tulis unit tests untuk roomStore
    - Test `fetchRooms` mengisi state dengan data rooms
    - Test `setActiveRoom` menetapkan `activeRoomRole` dari `membership_role`
    - Test `joinRoom` dengan mock error 422 (kode tidak valid)
    - _Requirements: 4.6, 4.7, 15.2_


- [x] 10. State Management — violationStore
  - [x] 10.1 Implementasikan violationStore dengan Zustand
    - Buat `src/stores/violationStore.ts` dengan interface `ViolationStore`
    - Implementasikan `fetchViolations(roomId)`: GET `/api/rooms/{room}/violations` → set `violations`
    - Implementasikan `fetchMyReports(roomId)`: GET `/api/rooms/{room}/violations/my-reports` → set `myReports`
    - Implementasikan `createViolation(roomId, data)`: POST multipart `/api/rooms/{room}/violations` → prepend ke `violations`
    - Implementasikan `updateViolationStatus(roomId, violationId, data)`: PATCH `/api/rooms/{room}/violations/{violation}/status` → update item di `violations`
    - _Requirements: 8.1–8.9, 9.1–9.7, 10.1–10.7_

  - [ ]* 10.2 Tulis unit tests untuk violationStore
    - Test `updateViolationStatus` dengan `status: "verified"` — verifikasi state violations terupdate
    - Test `createViolation` dengan status 201 dan 422
    - _Requirements: 8.7, 8.8, 8.9, 10.2, 10.5_

- [x] 11. State Management — dashboardStore
  - [x] 11.1 Implementasikan dashboardStore dengan Zustand
    - Buat `src/stores/dashboardStore.ts` dengan interface `DashboardStore`
    - Implementasikan `fetchStats(roomId)`: GET `/api/rooms/{room}/dashboard/stats` → set `stats`
    - Implementasikan `fetchLeaderboard(roomId, filters)`: GET `/api/rooms/{room}/dashboard/leaderboard` dengan query params dari `filters` → set `leaderboard`
    - Implementasikan `setFilters(filters)`: merge partial filters ke `leaderboardFilters` → tidak otomatis fetch
    - Default filters: `{ period: 'all-time', department: '', sort: 'desc', per_page: 10, page: 1 }`
    - _Requirements: 11.1–11.11_


- [x] 12. Layar Autentikasi
  - [x] 12.1 Implementasikan LoginScreen
    - Buat `src/screens/auth/LoginScreen.tsx`
    - Form dengan React Hook Form + Zod: field email (required, email format) dan password (required, min 8)
    - Tombol "Masuk" memanggil `authStore.login()` — disable tombol saat `isLoading`
    - Tampilkan error 422 per field di bawah masing-masing input
    - Tampilkan toast untuk error 502 dan network error
    - Tombol "Masuk dengan Google" membuka `InAppBrowser.open(baseUrl/api/auth/google/redirect)`
    - Navigasi ke `RegisterScreen`
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 14.3, 14.5_

  - [x] 12.2 Implementasikan Google OAuth flow di LoginScreen
    - Setelah `InAppBrowser.open()`, pantau URL melalui `onNavigationStateChange`
    - Deteksi URL yang mengandung `#google_token=` → ekstrak token menggunakan `extractGoogleToken(url)` → `authStore.loginWithGoogle(token)`
    - Deteksi URL yang mengandung `?google_error=auth_failed` atau `?google_error=no_email` → tutup browser → tampilkan pesan "Login dengan Google gagal. Silakan coba lagi."
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 12.3 Implementasikan RegisterScreen
    - Buat `src/screens/auth/RegisterScreen.tsx`
    - Form dengan React Hook Form + Zod: nama lengkap (required), email (required), password (required, min 8), konfirmasi password (match), departemen (optional), jabatan (optional)
    - Field departemen menggunakan dropdown/picker yang mengambil data dari `GET /api/departments`
    - Tombol "Daftar" memanggil `authStore.register()` — disable saat `isLoading`
    - Tampilkan validasi error 422 per field
    - _Requirements: 1.1, 1.2, 1.3, 14.5_


- [x] 13. Layar Onboarding & Tutorial
  - [x] 13.1 Implementasikan CompanyTutorialScreen
    - Buat `src/screens/onboarding/CompanyTutorialScreen.tsx`
    - Tampilkan carousel tutorial pengenalan perusahaan/sistem dengan indikator kemajuan (dots)
    - Tombol "Selanjutnya" / "Selesai" dan tombol "Lewati" di setiap slide
    - Ketika selesai atau lewati: POST `/api/tutorials/complete` dengan `key: "company_tutorial_completed"` → navigasi ke tutorial berikutnya atau `RoomListScreen`
    - _Requirements: 3.1, 3.2, 3.7, 3.8_

  - [x] 13.2 Implementasikan UserTutorialScreen dan AdminTutorialScreen
    - Buat `src/screens/onboarding/UserTutorialScreen.tsx` — panduan cara spotting
    - Ketika selesai: POST `/api/tutorials/complete` dengan `key: "user_tutorial_completed"`
    - Buat `src/screens/onboarding/AdminTutorialScreen.tsx` — panduan admin room
    - Tampilkan hanya jika `activeRoomRole === 'admin'` dan `admin_tutorial_completed === false`
    - Ketika selesai: POST `/api/tutorials/complete` dengan `key: "admin_tutorial_completed"`
    - Kedua screen: tampilkan indikator kemajuan dan tombol "Lewati"
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_


- [x] 14. Layar Manajemen Room
  - [x] 14.1 Implementasikan RoomListScreen
    - Buat `src/screens/room/RoomListScreen.tsx`
    - Panggil `roomStore.fetchRooms()` saat mount — tampilkan FlatList dengan loading indicator
    - Setiap kartu room menampilkan: foto room, nama, deskripsi, peran user, tanggal bergabung
    - Tampilkan badge "Admin" jika `room.can_manage === true` — _Requirements: 15.5, 15.6_
    - Tombol "Buat Room" navigasi ke `CreateRoomScreen`; tombol "Gabung Room" navigasi ke `JoinRoomScreen`
    - Tap room → `roomStore.setActiveRoom(room)` → navigasi ke `RoomTabNavigator`
    - _Requirements: 4.1, 4.5, 15.1, 15.2, 15.5, 15.6_

  - [x] 14.2 Implementasikan CreateRoomScreen
    - Buat `src/screens/room/CreateRoomScreen.tsx`
    - Form: nama room (required), deskripsi (optional), foto room (optional, image picker), tipe kode undangan (radio: `generated` / `manual`), kode undangan manual (conditional, visible jika `manual`)
    - Tombol foto menggunakan `react-native-image-picker` → validasi dengan `validateImageFile(file, 5)`
    - Submit: `roomStore.createRoom(data)` dengan FormData jika ada foto → navigasi kembali ke `RoomListScreen` setelah sukses
    - Tampilkan error 422 per field
    - _Requirements: 4.2, 4.3, 4.4, 14.5_

  - [x] 14.3 Implementasikan JoinRoomScreen
    - Buat `src/screens/room/JoinRoomScreen.tsx`
    - Input field untuk Invite_Code dengan tombol "Gabung"
    - Submit: `roomStore.joinRoom(code)` → jika sukses navigasi ke `RoomTabNavigator` dengan room baru sebagai aktif
    - Jika error 422: tampilkan "Kode room tidak valid atau sedang nonaktif."
    - _Requirements: 4.5, 4.6, 4.7, 4.8_


  - [x] 14.4 Implementasikan RoomHomeScreen
    - Buat `src/screens/room/RoomHomeScreen.tsx`
    - Tampilkan info room aktif: nama, foto, deskripsi
    - Tampilkan tombol "Spot!" (navigasi ke `CreateViolationScreen`) yang selalu terlihat
    - Tampilkan nama room aktif di header navigasi — _Requirements: 15.3_
    - Tampilkan indikator visual untuk pending violations jika `activeRoomRole === 'admin'` — _Requirements: 13.4_
    - _Requirements: 8.1, 13.4, 15.3_

  - [x] 14.5 Implementasikan RoomSettingsScreen (Admin)
    - Buat `src/screens/room/RoomSettingsScreen.tsx`
    - Tampilkan hanya ketika `isAdmin(activeRoomRole)` — jika reporter, blokir navigasi ke screen ini
    - Form edit room: nama, deskripsi, foto (image picker), status invite_code (toggle), tipe kode undangan, tombol regenerasi kode
    - Tampilkan Invite_Code yang dapat disalin ke clipboard jika `invite_code_enabled === true` — _Requirements: 5.9_
    - Daftar admin room dengan nama, email, departemen, foto profil — _Requirements: 5.8_
    - Tombol "Tambah Admin" → input email → POST `/api/rooms/{id}/admins` → error 404: "User dengan email tersebut belum terdaftar." — _Requirements: 5.4, 5.5_
    - Tombol "Hapus Room" → dialog konfirmasi → `roomStore.deleteRoom(id)` → navigasi ke `RoomListScreen` — _Requirements: 5.6, 5.7_
    - _Requirements: 5.1–5.9_


- [x] 15. Layar Violations
  - [x] 15.1 Implementasikan ViolationListScreen
    - Buat `src/screens/violation/ViolationListScreen.tsx`
    - Panggil `violationStore.fetchViolations(roomId)` saat mount
    - FlatList dengan kartu violation: nama rule, nama reporter, nama violator(s), status, waktu laporan
    - Tampilkan label status dengan warna berbeda: "Menunggu" (kuning), "Terverifikasi" (hijau), "Ditolak" (merah)
    - Tab filter "Semua" dan "Laporan Saya" — tab "Laporan Saya" memanggil `violationStore.fetchMyReports(roomId)`
    - Tap violation → navigasi ke `ViolationDetailScreen` dengan violation item sebagai params
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6, 9.7_

  - [x] 15.2 Implementasikan ViolationDetailScreen
    - Buat `src/screens/violation/ViolationDetailScreen.tsx`
    - Terima violation dari navigation params atau fetch ulang dari API
    - Tampilkan: foto bukti dalam galeri zoomable, deskripsi, nama reporter, daftar violator dengan foto profil, alasan penolakan (jika rejected)
    - Jika `isAdmin(activeRoomRole)` dan `violation.status === 'pending'`: tampilkan tombol "Verifikasi" dan "Tolak"
    - Tap "Verifikasi" → PATCH status `verified` → update state → tampilkan notifikasi "Poin telah disesuaikan"
    - Tap "Tolak" → dialog input alasan (required) → PATCH status `rejected` → update state
    - Validasi alasan penolakan dengan Zod: tidak boleh kosong/whitespace — _Requirements: 10.4, 10.6_
    - _Requirements: 9.4, 10.1–10.7, 13.3_

  - [x] 15.3 Implementasikan CreateViolationScreen
    - Buat `src/screens/violation/CreateViolationScreen.tsx`
    - Ambil daftar rules dari `GET /api/rooms/{room}/rules` — filter menggunakan `filterRulesForRole(rules, activeRoomRole)` untuk menyembunyikan admin-only rules dari reporter
    - Ambil daftar violators dari `GET /api/rooms/{room}/violations/users`
    - Form: pilih rule (required, dropdown), pilih violator(s) (multi-select, min 1, hanya non-admin), deskripsi (optional, max 1200 karakter), unggah foto (1–3 foto, required)
    - Setiap foto divalidasi dengan `validateImageFile(file, 5)` sebelum ditambahkan
    - Submit dengan `multipart/form-data` via `violationStore.createViolation(roomId, data)` — disable tombol saat `isSubmitting`
    - Sukses 201: tutup form, tampilkan konfirmasi "Laporan berhasil dikirim dan sedang menunggu verifikasi"
    - _Requirements: 8.1–8.9, 13.3_


- [x] 16. Layar Rules
  - [x] 16.1 Implementasikan RuleListScreen
    - Buat `src/screens/rules/RuleListScreen.tsx`
    - Ambil rules dari GET `/api/rooms/{room}/rules` — filter via `filterRulesForRole(rules, activeRoomRole)`
    - Tampilkan FlatList dengan nama, deskripsi, dan kategori setiap rule
    - Untuk admin: tampilkan semua rules termasuk `admin_only: true` dengan penanda visual khusus (misal badge "Admin Only")
    - Tombol "Tambah Rule" hanya visible jika `isAdmin(activeRoomRole)`
    - Tap ikon edit → navigasi ke `EditRuleScreen`; tap ikon hapus → dialog konfirmasi → DELETE rule
    - Tampilkan pesan "Rule yang dihapus dapat dipulihkan dalam 30 hari" saat konfirmasi hapus
    - Tombol "Arsip Rules" (admin only) → navigasi ke `ArchivedRulesScreen`
    - _Requirements: 6.1–6.5, 7.1, 7.6, 7.7, 7.8_

  - [x] 16.2 Implementasikan CreateRuleScreen dan EditRuleScreen
    - Buat `src/screens/rules/CreateRuleScreen.tsx`
    - Form: nama rule (required), deskripsi (optional), kategori (optional), toggle `admin_only`
    - Submit: POST `/api/rooms/{room}/rules` → append ke list → navigasi kembali
    - Buat `src/screens/rules/EditRuleScreen.tsx`
    - Terima rule dari navigation params, isi form dengan data yang ada
    - Submit: PUT `/api/rooms/{room}/rules/{rule}` → update list → navigasi kembali
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [x] 16.3 Implementasikan ArchivedRulesScreen
    - Buat `src/screens/rules/ArchivedRulesScreen.tsx`
    - Ambil dari GET `/api/rooms/{room}/rules?deleted=true`
    - Tampilkan FlatList dengan nama rule dan sisa hari sebelum terhapus permanen
    - Tombol "Pulihkan" per rule → POST `/api/rooms/{room}/rules/{id}/restore` → update list
    - _Requirements: 7.8, 7.9_


- [x] 17. Layar Dashboard & Leaderboard
  - [x] 17.1 Implementasikan DashboardScreen
    - Buat `src/screens/dashboard/DashboardScreen.tsx`
    - Panggil `dashboardStore.fetchStats(roomId)` saat mount
    - Tampilkan kartu statistik: jumlah laporan hari ini, minggu ini, total violations, total transaksi poin
    - Tampilkan indikator loading saat fetch
    - Tombol/tab untuk navigasi ke `LeaderboardScreen`
    - _Requirements: 11.1, 11.2, 14.3_

  - [x] 17.2 Implementasikan LeaderboardScreen dengan filter
    - Buat `src/screens/dashboard/LeaderboardScreen.tsx`
    - Panggil `dashboardStore.fetchLeaderboard(roomId, filters)` saat mount dan saat filter berubah
    - FlatList dengan paginasi per 10 anggota — setiap entry: peringkat, nama, departemen, foto profil, total poin, badge (emas/perak/perunggu untuk rank 1-3)
    - Avatar menggunakan `getInitials(name)` sebagai fallback jika tidak ada foto
    - Filter departemen: dropdown dengan opsi "Semua Departemen" dari `stats.departments`
    - Filter periode: `all-time`, `daily`, `weekly`, `monthly`, `yearly`
    - Filter `daily` → date picker; `weekly` → bulan + minggu ke-n; `monthly` → bulan + tahun; `yearly` → tahun
    - Toggle sorting: poin tertinggi ke terendah / terendah ke tertinggi
    - Setiap perubahan filter memanggil `dashboardStore.setFilters(...)` lalu `fetchLeaderboard(...)`
    - _Requirements: 11.3–11.11_


- [x] 18. Layar Profil
  - [x] 18.1 Implementasikan ProfileScreen
    - Buat `src/screens/profile/ProfileScreen.tsx`
    - Ambil data dari GET `/api/rooms/{room}/profile`
    - Tampilkan: foto profil (dengan `getInitials(name)` sebagai fallback), nama, departemen, jabatan
    - Tampilkan stats: total laporan, total poin, peringkat, streak hari, laporan hari ini
    - Tampilkan riwayat violations yang dibuat user dalam FlatList (terurut terbaru)
    - Tombol "Edit Profil" → navigasi ke `EditProfileScreen`
    - Tombol ganti/hapus foto profil — _Requirements: 12.6, 12.9_
    - _Requirements: 12.1, 12.2, 12.3, 12.6, 12.9, 17.7_

  - [x] 18.2 Implementasikan EditProfileScreen
    - Buat `src/screens/profile/EditProfileScreen.tsx`
    - Form dengan React Hook Form + Zod: nama (required), usia (optional, 17-90, number), departemen (optional), jabatan (optional)
    - Submit: PUT `/api/rooms/{room}/profile` → update profil → navigasi kembali ke `ProfileScreen`
    - Tombol ganti foto profil: buka image picker → validasi `validateImageFile(file, 3)` → POST multipart `/api/rooms/{room}/profile/photo`
    - Tombol "Hapus Foto Profil": konfirmasi → DELETE `/api/rooms/{room}/profile/photo`
    - Jika foto > 3 MB: tampilkan pesan "Ukuran foto maksimal 3 MB." dan cegah upload
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_


- [x] 19. Checkpoint — Pastikan semua layar terintegrasi
  - Pastikan semua tests lulus, navigasi antar layar berjalan sesuai alur di design, dan tidak ada komponen yang berdiri sendiri tanpa integrasi ke navigator. Tanyakan kepada user jika ada pertanyaan sebelum melanjutkan ke property-based tests akhir.

- [ ] 20. Property-Based Tests — Validasi Alasan Penolakan Violation (P5)
  - [ ]* 20.1 Tulis property test untuk validasi reject_reason (P5)
    - Buat `src/utils/__tests__/rejectReasonValidation.test.ts`
    - Implementasikan Zod schema `rejectReasonSchema` di `src/utils/violationValidation.ts`: field `reject_reason` wajib string non-empty non-whitespace
    - **Property 5: Validasi alasan penolakan violation**
    - Gunakan `fc.constantFrom('', ' ', '\t', '\n', '   ')` — verifikasi semua kasus menghasilkan error validasi
    - Gunakan `fc.string().filter(s => s.trim().length > 0)` — verifikasi semua kasus lolos validasi
    - **Validates: Requirements 10.6**

- [x] 21. Final Checkpoint — Pastikan semua tests lulus
  - Jalankan seluruh test suite (`jest --runInBand`) dan pastikan semua unit tests, property-based tests (P1–P7), dan integration tests lulus tanpa error. Tanyakan kepada user jika ada pertanyaan.


---

## Notes

- Task bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi bertahap sebelum melanjutkan ke fase berikutnya
- Property tests (P1–P7) memvalidasi correctness properties universal yang didefinisikan di design.md
- Unit tests memvalidasi skenario dan edge case spesifik
- Semua property tests dikonfigurasi dengan `numRuns: 100` menggunakan fast-check + Jest
- Semua teks UI ditulis dalam Bahasa Indonesia sesuai Requirement 17.2
- Task implementasi layar diasumsikan memiliki akses ke semua context: stores, types, utilities, dan navigator

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1", "4.1", "5.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "4.2", "5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "6.5"] },
    { "id": 6, "tasks": ["8.1", "9.1", "10.1", "11.1"] },
    { "id": 7, "tasks": ["8.2", "9.2", "10.2"] },
    { "id": 8, "tasks": ["12.1", "12.3", "13.1"] },
    { "id": 9, "tasks": ["12.2", "13.2", "14.1"] },
    { "id": 10, "tasks": ["14.2", "14.3", "14.4", "14.5"] },
    { "id": 11, "tasks": ["15.1", "16.1", "17.1"] },
    { "id": 12, "tasks": ["15.2", "15.3", "16.2", "17.2"] },
    { "id": 13, "tasks": ["16.3", "18.1"] },
    { "id": 14, "tasks": ["18.2"] },
    { "id": 15, "tasks": ["20.1"] }
  ]
}
```
