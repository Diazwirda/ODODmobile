# Requirements Document

## Introduction

Dokumen ini mendefinisikan persyaratan fungsional untuk **Mobile App React Native** yang berfungsi sebagai antarmuka pengguna (frontend) dari sistem **One Day One Behavior Spot Slimrich**. Aplikasi ini mengonsumsi REST API dari backend Laravel 12 dan mendukung autentikasi JWT serta Google OAuth.

Sistem ini dirancang untuk memfasilitasi pencatatan dan pelaporan pelanggaran perilaku (_behavior spotting_) di dalam lingkungan organisasi. Pengguna dapat bergabung dalam _room_, melaporkan pelanggaran terhadap aturan yang berlaku, melihat statistik, dan memantau leaderboard poin.

---

## Glossary

- **App**: Aplikasi mobile React Native yang sedang didefinisikan.
- **Backend_API**: REST API Laravel 12 yang menjadi sumber data utama.
- **User**: Pengguna yang telah terdaftar dan terautentikasi dalam sistem.
- **Admin_Room**: Anggota room dengan peran `admin` yang berwenang mengelola room, rules, dan memverifikasi violations.
- **Reporter**: Anggota room dengan peran `reporter` yang dapat membuat laporan violation.
- **Room**: Ruang kolaborasi yang berisi sekumpulan anggota, aturan, dan data pelanggaran.
- **Rule**: Aturan perilaku yang berlaku di dalam sebuah room.
- **Violation**: Laporan pelanggaran terhadap sebuah rule yang dibuat oleh reporter.
- **Violator**: Anggota room yang dilaporkan melakukan pelanggaran.
- **PointLog**: Catatan perubahan poin yang terjadi akibat verifikasi violation.
- **JWT_Token**: Token JSON Web Token yang digunakan untuk autentikasi ke Backend_API.
- **Invite_Code**: Kode unik yang digunakan untuk bergabung ke sebuah room.
- **Leaderboard**: Daftar peringkat anggota room berdasarkan total poin.
- **Tutorial**: Serangkaian layar panduan yang ditampilkan kepada User baru.
- **Department**: Divisi atau departemen tempat User bekerja.
- **Onboarding**: Proses pertama kali User menggunakan App, mencakup tutorial.
- **Slimrich**: Sistem eksternal yang digunakan sebagai sumber autentikasi karyawan.
- **Streak**: Jumlah hari berturut-turut di mana User berhasil membuat laporan yang terverifikasi.

---

## Requirements

### Requirement 1: Autentikasi dengan Email dan Password

**User Story:** Sebagai User baru, saya ingin mendaftar dan masuk menggunakan email dan password, sehingga saya dapat mengakses sistem secara aman.

#### Acceptance Criteria

1. THE App SHALL menampilkan layar registrasi dengan field: nama lengkap, email, password, konfirmasi password, departemen (opsional), dan jabatan (opsional).
2. WHEN User mengisi semua field wajib dan menekan tombol daftar, THE App SHALL mengirimkan permintaan `POST /api/auth/register` ke Backend_API dan menyimpan JWT_Token yang diterima.
3. IF Backend_API mengembalikan status 422 pada saat registrasi, THEN THE App SHALL menampilkan pesan kesalahan validasi di bawah field yang bermasalah.
4. THE App SHALL menampilkan layar login dengan field email dan password.
5. WHEN User mengisi email dan password yang valid lalu menekan tombol masuk, THE App SHALL mengirimkan permintaan `POST /api/auth/login` ke Backend_API dan menyimpan JWT_Token yang diterima di penyimpanan aman perangkat.
6. IF Backend_API mengembalikan status 422 pada saat login, THEN THE App SHALL menampilkan pesan "Email atau password salah" kepada User.
7. WHEN User menekan tombol logout, THE App SHALL menghapus JWT_Token dari penyimpanan perangkat dan mengarahkan User ke layar login.
8. WHILE User memiliki JWT_Token yang valid tersimpan di perangkat, THE App SHALL melakukan refresh token secara otomatis via `POST /api/auth/refresh` sebelum token kedaluwarsa.
9. IF JWT_Token kedaluwarsa dan gagal di-refresh, THEN THE App SHALL mengarahkan User ke layar login dan menampilkan pesan "Sesi Anda telah berakhir. Silakan login kembali."


### Requirement 2: Autentikasi dengan Google OAuth

**User Story:** Sebagai User, saya ingin masuk menggunakan akun Google saya, sehingga saya tidak perlu mengingat password tambahan.

#### Acceptance Criteria

1. THE App SHALL menampilkan tombol "Masuk dengan Google" di layar login.
2. WHEN User menekan tombol "Masuk dengan Google", THE App SHALL membuka browser in-app yang mengarahkan ke endpoint `/api/auth/google/redirect` di Backend_API.
3. WHEN Google OAuth berhasil dan Backend_API mengembalikan `google_token` melalui URL fragment (`#google_token=...`), THE App SHALL mengekstrak token tersebut dan menyimpannya sebagai JWT_Token di penyimpanan aman perangkat.
4. IF Backend_API mengembalikan parameter `google_error=auth_failed` atau `google_error=no_email`, THEN THE App SHALL menutup browser in-app dan menampilkan pesan "Login dengan Google gagal. Silakan coba lagi." kepada User.
5. WHEN login Google berhasil untuk pertama kali, THE App SHALL mengarahkan User ke alur Onboarding.


### Requirement 3: Onboarding dan Tutorial

**User Story:** Sebagai User baru, saya ingin mendapatkan panduan cara menggunakan aplikasi, sehingga saya dapat langsung memahami fitur-fitur utama tanpa kebingungan.

#### Acceptance Criteria

1. WHEN User berhasil login untuk pertama kali dan `company_tutorial_completed` bernilai `false`, THE App SHALL menampilkan layar tutorial pengenalan perusahaan/sistem.
2. WHEN User menyelesaikan tutorial perusahaan, THE App SHALL mengirimkan `POST /api/tutorials/complete` dengan `key: "company_tutorial_completed"` ke Backend_API.
3. WHEN User berhasil login dan `user_tutorial_completed` bernilai `false`, THE App SHALL menampilkan layar tutorial cara melakukan spotting (membuat violation).
4. WHEN User menyelesaikan tutorial spotting, THE App SHALL mengirimkan `POST /api/tutorials/complete` dengan `key: "user_tutorial_completed"` ke Backend_API.
5. WHERE User memiliki peran Admin_Room dan `admin_tutorial_completed` bernilai `false`, THE App SHALL menampilkan layar tutorial panduan admin room.
6. WHEN Admin_Room menyelesaikan tutorial admin, THE App SHALL mengirimkan `POST /api/tutorials/complete` dengan `key: "admin_tutorial_completed"` ke Backend_API.
7. THE App SHALL menampilkan indikator kemajuan pada setiap layar tutorial.
8. WHEN User menekan tombol "Lewati" pada layar tutorial, THE App SHALL menandai tutorial tersebut sebagai selesai dan melanjutkan ke layar utama.


### Requirement 4: Manajemen Room — Membuat dan Bergabung

**User Story:** Sebagai User, saya ingin membuat room baru atau bergabung ke room yang sudah ada menggunakan kode undangan, sehingga saya dapat berpartisipasi dalam kegiatan spotting kelompok saya.

#### Acceptance Criteria

1. THE App SHALL menampilkan layar daftar room yang menampilkan semua room di mana User terdaftar sebagai anggota.
2. WHEN User menekan tombol "Buat Room", THE App SHALL menampilkan formulir pembuatan room dengan field: nama room (wajib), deskripsi (opsional), foto room (opsional), tipe kode undangan (`generated` atau `manual`), dan kode undangan manual (jika tipe `manual`).
3. WHEN User mengisi formulir dan menekan tombol simpan, THE App SHALL mengirimkan `POST /api/rooms` ke Backend_API dan menampilkan room baru di daftar room.
4. IF Backend_API mengembalikan status 422 saat pembuatan room, THEN THE App SHALL menampilkan pesan kesalahan yang sesuai pada formulir.
5. THE App SHALL menampilkan tombol "Gabung Room" di layar daftar room.
6. WHEN User menekan tombol "Gabung Room" dan memasukkan Invite_Code, THE App SHALL mengirimkan `POST /api/rooms/join` ke Backend_API.
7. IF Backend_API mengembalikan status 422 karena kode tidak valid atau nonaktif, THEN THE App SHALL menampilkan pesan "Kode room tidak valid atau sedang nonaktif." kepada User.
8. WHEN User berhasil bergabung ke room, THE App SHALL menambahkan room tersebut ke daftar room User dan mengarahkan ke halaman utama room.


### Requirement 5: Manajemen Room — Pengaturan oleh Admin Room

**User Story:** Sebagai Admin_Room, saya ingin mengelola pengaturan room, menambah admin lain, dan menghapus room, sehingga saya dapat menjaga room tetap terorganisir.

#### Acceptance Criteria

1. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan menu pengaturan room yang dapat diakses dari halaman room.
2. WHEN Admin_Room menekan menu pengaturan, THE App SHALL menampilkan formulir pengeditan room: nama, deskripsi, foto, status dan tipe kode undangan, serta opsi regenerasi kode.
3. WHEN Admin_Room menyimpan perubahan, THE App SHALL mengirimkan `PUT /api/rooms/{id}` ke Backend_API dan memperbarui tampilan room.
4. WHEN Admin_Room menekan "Tambah Admin", THE App SHALL menampilkan field input email dan mengirimkan `POST /api/rooms/{id}/admins` ke Backend_API.
5. IF Backend_API mengembalikan status 404 saat penambahan admin, THEN THE App SHALL menampilkan pesan "User dengan email tersebut belum terdaftar." kepada Admin_Room.
6. WHEN Admin_Room menekan tombol hapus room, THE App SHALL menampilkan dialog konfirmasi sebelum mengirimkan `DELETE /api/rooms/{id}` ke Backend_API.
7. WHEN room berhasil dihapus, THE App SHALL mengarahkan User ke layar daftar room dan menampilkan pesan konfirmasi penghapusan.
8. THE App SHALL menampilkan daftar admin room beserta nama, email, departemen, dan foto profil masing-masing admin.
9. WHERE `invite_code_enabled` bernilai `true`, THE App SHALL menampilkan Invite_Code yang dapat disalin ke clipboard oleh Admin_Room.


### Requirement 6: Melihat Rules Room

**User Story:** Sebagai User, saya ingin melihat daftar aturan yang berlaku di dalam room saya, sehingga saya tahu pelanggaran apa saja yang dapat dilaporkan.

#### Acceptance Criteria

1. THE App SHALL menampilkan halaman daftar rules yang dapat diakses dari dalam halaman room.
2. WHEN halaman rules dibuka, THE App SHALL mengambil data rules dari `GET /api/rooms/{room}/rules` dan menampilkannya dalam bentuk daftar.
3. THE App SHALL menampilkan nama, deskripsi, dan kategori untuk setiap rule.
4. WHILE User memiliki peran Reporter, THE App SHALL menyembunyikan rules dengan `admin_only` bernilai `true`.
5. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan semua rules termasuk yang `admin_only`, dengan penanda visual khusus untuk rules tersebut.


### Requirement 7: Manajemen Rules oleh Admin Room

**User Story:** Sebagai Admin_Room, saya ingin membuat, mengedit, menghapus, dan memulihkan rules di room saya, sehingga aturan yang berlaku selalu relevan.

#### Acceptance Criteria

1. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan tombol "Tambah Rule" pada halaman daftar rules.
2. WHEN Admin_Room menekan "Tambah Rule", THE App SHALL menampilkan formulir dengan field: nama rule (wajib), deskripsi (opsional), kategori (opsional), dan opsi `admin_only` (toggle).
3. WHEN Admin_Room menyimpan rule baru, THE App SHALL mengirimkan `POST /api/rooms/{room}/rules` ke Backend_API dan menampilkan rule baru di daftar.
4. WHEN Admin_Room menekan ikon edit pada sebuah rule, THE App SHALL menampilkan formulir pengeditan yang terisi dengan data rule yang ada.
5. WHEN Admin_Room menyimpan perubahan rule, THE App SHALL mengirimkan `PUT /api/rooms/{room}/rules/{rule}` ke Backend_API dan memperbarui tampilan daftar.
6. WHEN Admin_Room menekan ikon hapus pada sebuah rule, THE App SHALL menampilkan dialog konfirmasi, lalu mengirimkan `DELETE /api/rooms/{room}/rules/{rule}` ke Backend_API.
7. THE App SHALL menampilkan pesan bahwa rule yang dihapus dapat dipulihkan dalam 30 hari.
8. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan menu "Arsip Rules" yang berisi daftar rules yang telah dihapus beserta sisa hari sebelum terhapus permanen.
9. WHEN Admin_Room menekan "Pulihkan" pada sebuah rule di arsip, THE App SHALL mengirimkan `POST /api/rooms/{room}/rules/{id}/restore` ke Backend_API dan memindahkan rule tersebut kembali ke daftar aktif.


### Requirement 8: Membuat Laporan Violation (Spotting)

**User Story:** Sebagai Reporter, saya ingin melaporkan pelanggaran yang saya saksikan dengan menyertakan foto bukti, sehingga pelanggaran tersebut dapat dicatat dan diverifikasi.

#### Acceptance Criteria

1. THE App SHALL menampilkan tombol "Spot!" atau "Laporkan" yang mudah diakses dari halaman utama room.
2. WHEN User menekan tombol laporan, THE App SHALL menampilkan formulir spotting dengan field: pilihan rule (wajib), pilihan violator — minimal 1 anggota non-admin (wajib), deskripsi kejadian (opsional, maks 1200 karakter), dan unggahan foto (wajib, 1–3 foto).
3. THE App SHALL mengambil daftar anggota yang dapat dilaporkan dari `GET /api/rooms/{room}/violations/users` dan menampilkannya dalam format yang mudah dipilih.
4. THE App SHALL memungkinkan User memilih lebih dari satu Violator dalam satu laporan.
5. WHEN User memilih foto dari galeri atau kamera, THE App SHALL memvalidasi bahwa ukuran setiap foto tidak melebihi 5 MB dan format file adalah jpg, jpeg, png, atau webp.
6. IF foto yang dipilih melebihi 5 MB, THEN THE App SHALL menampilkan pesan "Ukuran foto maksimal 5 MB per file." dan mencegah pengiriman laporan.
7. WHEN User menekan tombol kirim dan semua field valid, THE App SHALL mengirimkan `POST /api/rooms/{room}/violations` ke Backend_API dengan format `multipart/form-data`.
8. WHEN Backend_API mengembalikan status 201, THE App SHALL menutup formulir dan menampilkan konfirmasi bahwa laporan berhasil dikirim dan sedang menunggu verifikasi.
9. IF Backend_API mengembalikan status 422, THEN THE App SHALL menampilkan pesan kesalahan validasi yang spesifik kepada User.


### Requirement 9: Melihat Daftar Violations

**User Story:** Sebagai User, saya ingin melihat semua laporan violation di room saya, sehingga saya dapat memantau aktivitas spotting yang terjadi.

#### Acceptance Criteria

1. THE App SHALL menampilkan halaman daftar violations yang dapat diakses dari dalam halaman room.
2. WHEN halaman violations dibuka, THE App SHALL mengambil data dari `GET /api/rooms/{room}/violations` dan menampilkan setiap violation dengan: nama rule, nama reporter, nama violator(s), status, dan waktu laporan.
3. THE App SHALL menampilkan status violation dengan label visual: "Menunggu" (pending), "Terverifikasi" (verified), dan "Ditolak" (rejected).
4. WHEN User menekan sebuah violation, THE App SHALL menampilkan detail lengkap termasuk: foto bukti, deskripsi, nama reporter, daftar violator dengan foto profil, alasan penolakan (jika status rejected).
5. THE App SHALL menampilkan tab atau filter "Laporan Saya" yang memuat data dari `GET /api/rooms/{room}/violations/my-reports`.
6. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan semua violations dari semua anggota room.
7. WHILE User memiliki peran Reporter, THE App SHALL menampilkan semua violations yang ada di room (read-only) dan menampilkan tab "Laporan Saya" untuk laporan yang dibuat oleh User tersebut.


### Requirement 10: Verifikasi Violation oleh Admin Room

**User Story:** Sebagai Admin_Room, saya ingin memverifikasi atau menolak laporan violation yang masuk, sehingga hanya pelanggaran yang valid yang dicatat dan memengaruhi poin anggota.

#### Acceptance Criteria

1. WHILE User memiliki peran Admin_Room dan sebuah violation berstatus `pending`, THE App SHALL menampilkan tombol "Verifikasi" dan tombol "Tolak" pada halaman detail violation.
2. WHEN Admin_Room menekan "Verifikasi", THE App SHALL mengirimkan `PATCH /api/rooms/{room}/violations/{violation}/status` dengan `status: "verified"` ke Backend_API.
3. WHEN Backend_API mengonfirmasi verifikasi, THE App SHALL memperbarui status violation menjadi "Terverifikasi" dan menampilkan notifikasi bahwa poin telah disesuaikan.
4. WHEN Admin_Room menekan "Tolak", THE App SHALL menampilkan dialog input untuk alasan penolakan (wajib diisi).
5. WHEN Admin_Room mengisi alasan penolakan dan mengonfirmasi, THE App SHALL mengirimkan `PATCH /api/rooms/{room}/violations/{violation}/status` dengan `status: "rejected"` dan `reject_reason` ke Backend_API.
6. IF Admin_Room mencoba menolak violation tanpa mengisi alasan penolakan, THEN THE App SHALL mencegah pengiriman dan menampilkan pesan "Alasan penolakan wajib diisi." kepada Admin_Room.
7. WHEN Backend_API mengonfirmasi penolakan, THE App SHALL memperbarui status violation menjadi "Ditolak" dan menampilkan alasan penolakan pada detail violation.


### Requirement 11: Dashboard dan Leaderboard

**User Story:** Sebagai User, saya ingin melihat statistik room dan leaderboard poin anggota, sehingga saya dapat memantau performa saya dan rekan-rekan saya.

#### Acceptance Criteria

1. THE App SHALL menampilkan halaman dashboard yang dapat diakses dari navigasi utama dalam room.
2. WHEN halaman dashboard dibuka, THE App SHALL mengambil data statistik dari `GET /api/rooms/{room}/dashboard/stats` dan menampilkan: jumlah laporan hari ini, jumlah laporan minggu ini, total violations sepanjang waktu, dan total transaksi poin.
3. THE App SHALL menampilkan Leaderboard yang mengambil data dari `GET /api/rooms/{room}/dashboard/leaderboard` dengan paginasi per 10 anggota.
4. THE App SHALL menampilkan informasi setiap anggota di Leaderboard: peringkat, nama, departemen, foto profil, total poin, dan badge (emas/perak/perunggu untuk peringkat 1–3).
5. THE App SHALL menyediakan filter Leaderboard berdasarkan departemen dengan opsi "Semua Departemen" sebagai default.
6. THE App SHALL menyediakan filter periode Leaderboard dengan pilihan: semua waktu, harian, mingguan, bulanan, dan tahunan.
7. WHEN User memilih filter periode "Harian", THE App SHALL menampilkan pemilih tanggal untuk memilih tanggal spesifik.
8. WHEN User memilih filter periode "Mingguan", THE App SHALL menampilkan pemilih bulan dan minggu ke-berapa dalam bulan tersebut.
9. WHEN User memilih filter periode "Bulanan", THE App SHALL menampilkan pemilih bulan dan tahun.
10. WHEN User memilih filter periode "Tahunan", THE App SHALL menampilkan pemilih tahun.
11. THE App SHALL menampilkan opsi pengurutan Leaderboard antara nilai poin tertinggi ke terendah dan terendah ke tertinggi.


### Requirement 12: Profil User

**User Story:** Sebagai User, saya ingin melihat dan memperbarui profil saya, serta melihat statistik kontribusi saya di dalam room, sehingga informasi akun saya selalu akurat.

#### Acceptance Criteria

1. THE App SHALL menampilkan halaman profil yang dapat diakses dari navigasi utama.
2. WHEN halaman profil dibuka dalam konteks room, THE App SHALL mengambil data dari `GET /api/rooms/{room}/profile` dan menampilkan: foto profil, nama, departemen, jabatan, total laporan, total poin, peringkat, streak hari, dan laporan hari ini.
3. THE App SHALL menampilkan riwayat laporan yang dibuat oleh User di dalam halaman profil, terurut dari yang terbaru.
4. WHEN User menekan tombol "Edit Profil", THE App SHALL menampilkan formulir pengeditan dengan field: nama (wajib), usia (opsional, 17–90 tahun), departemen (opsional), dan jabatan (opsional).
5. WHEN User menyimpan perubahan profil, THE App SHALL mengirimkan `PUT /api/rooms/{room}/profile` ke Backend_API dan memperbarui tampilan profil.
6. THE App SHALL menampilkan opsi untuk mengganti foto profil melalui kamera atau galeri perangkat.
7. WHEN User memilih foto baru dan mengonfirmasi, THE App SHALL mengirimkan `POST /api/rooms/{room}/profile/photo` ke Backend_API dengan format `multipart/form-data` dan memvalidasi bahwa ukuran foto tidak melebihi 3 MB dengan format jpg, jpeg, png, atau webp.
8. IF foto profil yang dipilih melebihi 3 MB, THEN THE App SHALL menampilkan pesan kesalahan dan mencegah pengunggahan.
9. THE App SHALL menampilkan opsi "Hapus Foto Profil" yang mengirimkan `DELETE /api/rooms/{room}/profile/photo` ke Backend_API.


### Requirement 13: Navigasi Berbasis Peran (Role-Based UI)

**User Story:** Sebagai User dengan peran berbeda, saya ingin antarmuka aplikasi menyesuaikan tampilan dan fitur yang tersedia berdasarkan peran saya, sehingga saya hanya melihat menu yang relevan dengan tanggung jawab saya.

#### Acceptance Criteria

1. WHILE User memiliki peran Reporter di sebuah room, THE App SHALL menampilkan menu navigasi: Beranda, Spot (Buat Laporan), Violations, Leaderboard, dan Profil.
2. WHILE User memiliki peran Admin_Room di sebuah room, THE App SHALL menampilkan menu navigasi tambahan: Manajemen Rules, Verifikasi Laporan, dan Pengaturan Room.
3. WHILE User memiliki peran Reporter, THE App SHALL menyembunyikan tombol verifikasi/penolakan pada halaman detail violation.
4. WHILE User memiliki peran Admin_Room, THE App SHALL menampilkan peringatan visual pada violations berstatus `pending` yang belum diverifikasi.
5. THE App SHALL mengambil data peran User dari field `membership_role` pada respons API room dan menyimpannya di state lokal selama sesi dalam room berlangsung.
6. WHEN User berpindah ke room lain, THE App SHALL memperbarui peran yang berlaku sesuai dengan keanggotaan User di room tersebut.


### Requirement 14: Pengelolaan State dan Konektivitas Jaringan

**User Story:** Sebagai User, saya ingin aplikasi menangani kondisi jaringan yang tidak stabil secara elegan, sehingga saya mendapatkan umpan balik yang jelas ketika koneksi bermasalah.

#### Acceptance Criteria

1. WHEN App gagal terhubung ke Backend_API karena tidak ada koneksi internet, THE App SHALL menampilkan pesan "Tidak ada koneksi internet. Periksa jaringan Anda." kepada User.
2. IF Backend_API mengembalikan status 502 (server autentikasi tidak tersedia), THEN THE App SHALL menampilkan pesan "Server sedang bermasalah. Silakan coba lagi beberapa saat lagi." kepada User.
3. WHEN App sedang memuat data dari Backend_API, THE App SHALL menampilkan indikator loading kepada User.
4. THE App SHALL menyimpan JWT_Token dan data sesi di penyimpanan aman perangkat (Keychain untuk iOS, Keystore untuk Android).
5. WHEN User menekan tombol kirim pada formulir mana pun, THE App SHALL menonaktifkan tombol tersebut selama proses pengiriman berlangsung untuk mencegah pengiriman ganda.
6. IF Backend_API mengembalikan status 403, THEN THE App SHALL menampilkan pesan "Anda tidak memiliki akses untuk melakukan aksi ini." dan tidak melanjutkan operasi.
7. IF Backend_API mengembalikan status 404, THEN THE App SHALL menampilkan pesan "Data yang diminta tidak ditemukan." kepada User.


### Requirement 15: Pemilihan dan Konteks Room Aktif

**User Story:** Sebagai User yang terdaftar di lebih dari satu room, saya ingin berpindah antar room dengan mudah, sehingga saya dapat mengelola aktivitas di masing-masing room secara terpisah.

#### Acceptance Criteria

1. THE App SHALL menampilkan daftar semua room yang diikuti User pada layar pemilihan room.
2. WHEN User memilih sebuah room dari daftar, THE App SHALL menetapkan room tersebut sebagai konteks room aktif dan memuat semua data (violations, rules, leaderboard, profil) dalam konteks room tersebut.
3. THE App SHALL menampilkan nama room aktif pada header navigasi selama User berada di dalam room.
4. WHEN User ingin berpindah room, THE App SHALL menyediakan tombol atau gestur untuk kembali ke layar pemilihan room.
5. THE App SHALL menampilkan foto, nama, deskripsi, peran User, dan tanggal bergabung pada kartu setiap room di daftar room.
6. WHEN Backend_API mengembalikan `can_manage: true` untuk sebuah room, THE App SHALL menampilkan penanda "Admin" pada kartu room tersebut di daftar room.


### Requirement 16: Komunikasi Aman dengan Backend API

**User Story:** Sebagai pengelola sistem, saya ingin semua komunikasi antara App dan Backend_API dilakukan secara aman dan terautentikasi, sehingga data pengguna terlindungi.

#### Acceptance Criteria

1. THE App SHALL menyertakan JWT_Token dalam header `Authorization: Bearer {token}` pada setiap permintaan ke endpoint Backend_API yang membutuhkan autentikasi.
2. THE App SHALL mengirimkan header `Content-Type: application/json` untuk semua permintaan body JSON dan `Content-Type: multipart/form-data` untuk permintaan yang menyertakan file.
3. THE App SHALL menggunakan HTTPS untuk semua komunikasi jaringan dengan Backend_API.
4. THE App SHALL menyimpan Base URL Backend_API sebagai konfigurasi yang dapat diubah per environment (development/production) tanpa mengubah kode sumber.
5. WHEN Backend_API mengembalikan status 401, THE App SHALL menghapus JWT_Token yang tersimpan dan mengarahkan User ke layar login.


### Requirement 17: Pengalaman Pengguna dan Aksesibilitas

**User Story:** Sebagai User dari berbagai latar belakang, saya ingin aplikasi mudah digunakan di perangkat iOS maupun Android, sehingga saya dapat menggunakannya tanpa kesulitan teknis.

#### Acceptance Criteria

1. THE App SHALL mendukung platform iOS (versi 14 ke atas) dan Android (API level 24 ke atas).
2. THE App SHALL menampilkan teks dan label dalam Bahasa Indonesia untuk semua elemen antarmuka pengguna.
3. THE App SHALL mendukung orientasi layar potret (portrait) sebagai orientasi utama pada semua layar.
4. THE App SHALL menggunakan komponen aksesibel dengan label `accessibilityLabel` yang deskriptif pada tombol, ikon, dan elemen interaktif.
5. WHEN pengguna membuka App dan sebelumnya telah login, THE App SHALL mengarahkan langsung ke layar daftar room tanpa meminta login ulang, selama JWT_Token masih valid.
6. THE App SHALL menampilkan foto violation dalam tampilan galeri yang dapat diperbesar (zoomable) pada halaman detail violation.
7. THE App SHALL menampilkan avatar atau inisial nama sebagai fallback ketika foto profil User tidak tersedia.
