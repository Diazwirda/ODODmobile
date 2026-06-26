# Design Document — React Native Mobile App

## Gambaran Umum

Aplikasi mobile **One Day One Behavior Spot Slimrich** adalah antarmuka pengguna berbasis React Native yang mengonsumsi REST API dari backend Laravel 12. Aplikasi ini memfasilitasi pencatatan pelanggaran perilaku (_behavior spotting_) dalam lingkungan organisasi, memungkinkan pengguna bergabung ke room, melaporkan pelanggaran, memantau statistik, dan melihat leaderboard poin.

Dokumen ini menjelaskan arsitektur, desain komponen, model data, alur autentikasi, strategi penanganan error, dan correctness properties untuk implementasi aplikasi.

---

## Arsitektur

### Diagram Komponen Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────┐
│                      React Native App                        │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  Auth Layer │   │  Navigation  │   │   State Layer    │  │
│  │             │   │  (React Nav) │   │   (Zustand)      │  │
│  │ - JWT mgmt  │   │              │   │                  │  │
│  │ - Keychain  │   │ - Root Stack │   │ - authStore      │  │
│  │ - Google    │   │ - Tab Nav    │   │ - roomStore      │  │
│  │   OAuth     │   │ - Room Stack │   │ - violationStore │  │
│  └──────┬──────┘   └──────┬───────┘   └────────┬─────────┘  │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼──────────┐  │
│  │                    Screen Layer                         │  │
│  │  Auth Screens │ Room Screens │ Violation │ Dashboard   │  │
│  └─────────────────────────────┬───────────────────────────┘  │
│                                │                            │
│  ┌─────────────────────────────▼───────────────────────────┐  │
│  │                    API Client Layer                      │  │
│  │  Axios Instance + Request/Response Interceptors          │  │
│  └─────────────────────────────┬───────────────────────────┘  │
└────────────────────────────────┼─────────────────────────────┘
                                 │ HTTPS
                    ┌────────────▼──────────────┐
                    │   Backend Laravel 12 API   │
                    │   /api/auth | /api/rooms   │
                    │   /api/.../violations      │
                    └───────────────────────────┘
```

### Tech Stack

| Lapisan | Teknologi | Versi |
|---|---|---|
| Framework | React Native (Expo bare workflow) | >= 0.73 |
| Navigation | React Navigation | v6 |
| State Management | Zustand | ^4 |
| HTTP Client | Axios | ^1.6 |
| Secure Storage | react-native-keychain | ^8 |
| Image Picker | react-native-image-picker | ^7 |
| In-App Browser | react-native-inappbrowser-reborn | ^3 |
| Form | React Hook Form + Zod | ^7 / ^3 |
| UI | NativeWind (TailwindCSS) | ^4 |
| Language | TypeScript | ^5 |

---

## Struktur Navigasi

### Hierarki Navigasi

```
RootNavigator (Stack)
├── AuthStack (unauthenticated)
│   ├── LoginScreen
│   ├── RegisterScreen
│   └── OnboardingStack
│       ├── CompanyTutorialScreen
│       ├── UserTutorialScreen
│       └── AdminTutorialScreen
│
└── AppStack (authenticated)
    ├── RoomListScreen           ← Layar utama setelah login
    ├── JoinRoomScreen
    ├── CreateRoomScreen
    │
    └── RoomTabNavigator (Bottom Tab — konteks room aktif)
        ├── HomeTab
        │   └── RoomHomeScreen
        ├── SpotTab
        │   ├── CreateViolationScreen
        │   └── ViolationListScreen
        │       └── ViolationDetailScreen
        ├── DashboardTab
        │   └── DashboardScreen
        │       └── LeaderboardScreen
        ├── RulesTab (Admin only)
        │   ├── RuleListScreen
        │   ├── CreateRuleScreen
        │   ├── EditRuleScreen
        │   └── ArchivedRulesScreen
        └── ProfileTab
            ├── ProfileScreen
            └── EditProfileScreen
```

### Alur Navigasi

```
App Start
    │
    ▼
Cek JWT di Keychain
    │
    ├─ Tidak ada / Expired ──► LoginScreen
    │
    └─ Ada & Valid ──────────► RoomListScreen
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                    Pilih Room          Buat/Gabung Room
                         │
                    RoomTabNavigator
                    (semua tab tersedia)
```

---

## Desain State Management

### Struktur Zustand Store

Terdapat empat store utama yang dipisahkan berdasarkan domain:

#### 1. `authStore`

```typescript
interface AuthStore {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setToken: (token: string) => void;
  clearAuth: () => void;
}
```

#### 2. `roomStore`

```typescript
interface RoomStore {
  rooms: Room[];
  activeRoom: Room | null;
  activeRoomRole: MembershipRole | null;
  isLoading: boolean;

  fetchRooms: () => Promise<void>;
  setActiveRoom: (room: Room) => void;
  createRoom: (data: CreateRoomPayload) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room>;
  updateRoom: (id: number, data: UpdateRoomPayload) => Promise<void>;
  deleteRoom: (id: number) => Promise<void>;
  clearActiveRoom: () => void;
}
```

#### 3. `violationStore`

```typescript
interface ViolationStore {
  violations: Violation[];
  myReports: Violation[];
  isLoading: boolean;
  isSubmitting: boolean;

  fetchViolations: (roomId: number) => Promise<void>;
  fetchMyReports: (roomId: number) => Promise<void>;
  createViolation: (roomId: number, data: CreateViolationPayload) => Promise<void>;
  updateViolationStatus: (roomId: number, violationId: number, data: UpdateViolationStatusPayload) => Promise<void>;
}
```

#### 4. `dashboardStore`

```typescript
interface DashboardStore {
  stats: DashboardStats | null;
  leaderboard: LeaderboardResponse | null;
  leaderboardFilters: LeaderboardFilters;
  isLoading: boolean;

  fetchStats: (roomId: number) => Promise<void>;
  fetchLeaderboard: (roomId: number, filters: LeaderboardFilters) => Promise<void>;
  setFilters: (filters: Partial<LeaderboardFilters>) => void;
}
```

### Keputusan Desain: Zustand vs Redux Toolkit

Zustand dipilih karena:
- Bundle size lebih kecil (tidak ada boilerplate action/reducer)
- API lebih sederhana dan cocok untuk tim kecil
- Mendukung middleware (devtools, persist) yang setara
- Integrasi TypeScript native tanpa konfigurasi tambahan

---

## Desain API Client

### Axios Instance

```typescript
// src/api/client.ts
const apiClient = axios.create({
  baseURL: Config.API_BASE_URL, // dari react-native-config
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
  },
});
```

### Request Interceptor — JWT Injection

```typescript
apiClient.interceptors.request.use(async (config) => {
  const token = await Keychain.getGenericPassword();
  if (token) {
    config.headers.Authorization = `Bearer ${token.password}`;
  }
  // Set Content-Type otomatis berdasarkan tipe data
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  } else {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});
```

### Response Interceptor — 401 Handler & Error Normalizer

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        await Keychain.setGenericPassword('token', data.token);
        originalRequest.headers!.Authorization = `Bearer ${data.token}`;
        return apiClient(originalRequest);
      } catch {
        await Keychain.resetGenericPassword();
        useAuthStore.getState().clearAuth();
        // Navigate ke login
        navigationRef.current?.reset({ index: 0, routes: [{ name: 'Login' }] });
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);
```

### Error Normalizer

```typescript 
interface NormalizedError {
  message: string;
  statusCode: number | null;
  validationErrors: Record<string, string[]> | null;
}

function normalizeError(error: AxiosError): NormalizedError {
  const status = error.response?.status ?? null;
  const data = error.response?.data as any;

  const messageMap: Record<number, string> = {
    401: 'Sesi Anda telah berakhir. Silakan login kembali.',
    403: 'Anda tidak memiliki akses untuk melakukan aksi ini.',
    404: 'Data yang diminta tidak ditemukan.',
    422: data?.message ?? 'Data yang dikirimkan tidak valid.',
    502: 'Server sedang bermasalah. Silakan coba lagi beberapa saat lagi.',
  };

  return {
    message: status ? (messageMap[status] ?? 'Terjadi kesalahan yang tidak terduga.') : 'Tidak ada koneksi internet. Periksa jaringan Anda.',
    statusCode: status,
    validationErrors: data?.errors ?? null,
  };
}
```

---

## Inventaris Layar

| Layar | Komponen | Data yang Dibutuhkan | Role |
|---|---|---|---|
| `LoginScreen` | Form email/password, tombol Google | — | — |
| `RegisterScreen` | Form registrasi | — | — |
| `CompanyTutorialScreen` | Carousel tutorial | tutorial flags | All |
| `RoomListScreen` | FlatList room cards | `GET /api/rooms` | All |
| `CreateRoomScreen` | Form + image picker | — | All |
| `JoinRoomScreen` | Input kode undangan | — | All |
| `RoomHomeScreen` | Info room, quick actions | active room | All |
| `ViolationListScreen` | FlatList violations, tab filter | `GET /{room}/violations` | All |
| `ViolationDetailScreen` | Detail + foto galeri | violation item | All |
| `CreateViolationScreen` | Form + multi-select + image picker | `/violations/users`, rules | Reporter |
| `DashboardScreen` | Stats cards | `GET /{room}/dashboard/stats` | All |
| `LeaderboardScreen` | List + filters | `GET /{room}/dashboard/leaderboard` | All |
| `RuleListScreen` | FlatList rules | `GET /{room}/rules` | All |
| `CreateRuleScreen` | Form rule | — | Admin |
| `EditRuleScreen` | Form pre-filled | rule item | Admin |
| `ArchivedRulesScreen` | FlatList arsip | `GET /{room}/rules?deleted=true` | Admin |
| `RoomSettingsScreen` | Form edit room + admin list | room data | Admin |
| `ProfileScreen` | Stats + riwayat | `GET /{room}/profile` | All |
| `EditProfileScreen` | Form edit + image picker | profile data | All |


---

## Model Data (TypeScript Interfaces)

### Autentikasi

```typescript
interface AuthUser {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
  photo?: string;
  tutorial_flags: {
    company_tutorial_completed: boolean;
    user_tutorial_completed: boolean;
    admin_tutorial_completed: boolean;
  };
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  department?: string;
  position?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}
```

### Room

```typescript
type MembershipRole = 'admin' | 'reporter';
type InviteCodeType = 'generated' | 'manual';

interface Room {
  id: number;
  name: string;
  slug: string;
  description?: string;
  photo?: string;
  invite_code: string;
  invite_code_enabled: boolean;
  invite_code_type: InviteCodeType;
  membership_role: MembershipRole;
  can_manage: boolean;
  admins: RoomAdmin[];
  joined_at: string;
  created_at: string;
}

interface RoomAdmin {
  id: number;
  name: string;
  email: string;
  department?: string;
  photo?: string;
}

interface CreateRoomPayload {
  name: string;
  description?: string;
  photo?: ImageFile;
  invite_code_type: InviteCodeType;
  invite_code?: string;
}
```

### Rule

```typescript
interface Rule {
  id: number;
  name: string;
  description?: string;
  category?: string;
  admin_only: boolean;
  created_at: string;
}

interface ArchivedRule {
  id: number;
  name: string;
  days_left: number;
  purge_at: string;
}

interface CreateRulePayload {
  name: string;
  description?: string;
  category?: string;
  admin_only: boolean;
}
```

### Violation

```typescript
type ViolationStatus = 'pending' | 'verified' | 'rejected';

interface ViolationUser {
  id: number;
  name: string;
  department?: string;
  photo?: string;
}

interface Violation {
  id: number;
  rule: Rule;
  reporter: ViolationUser;
  violator: ViolationUser;
  violators: ViolationUser[];
  status: ViolationStatus;
  description?: string;
  photos: string[];
  reject_reason?: string;
  created_at: string;
}

interface CreateViolationPayload {
  rule_id: number;
  violator_ids: number[];
  description?: string;
  photos: ImageFile[];  // 1–3 file, max 5 MB each
}

interface UpdateViolationStatusPayload {
  status: 'verified' | 'rejected';
  reject_reason?: string;
}
```

### Dashboard & Leaderboard

```typescript
interface DashboardStats {
  reports_today: number;
  reports_this_week: number;
  total_violation: number;
  total_points_log: number;
  departments: Department[];
}

type LeaderboardPeriod = 'all-time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
type BadgeTier = 'gold' | 'silver' | 'bronze' | null;

interface LeaderboardEntry {
  id: number;
  name: string;
  department?: string;
  photo?: string;
  total_points: number;
  rank: number;
  badge: BadgeTier;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface LeaderboardFilters {
  period: LeaderboardPeriod;
  department: string;
  sort: 'asc' | 'desc';
  per_page: number;
  page: number;
}
```

### Profil

```typescript
interface UserProfile {
  id: number;
  name: string;
  age?: number;
  department?: string;
  position?: string;
  photo?: string;
}

interface ProfileStats {
  total_reports: number;
  points: number;
  rank: number;
  streak_days: number;
  reports_today: number;
}

interface ProfileResponse {
  profile: UserProfile;
  stats: ProfileStats;
  history: Violation[];
}
```

### Umum

```typescript
interface ImageFile {
  uri: string;
  type: 'image/jpeg' | 'image/png' | 'image/webp';
  name: string;
  size: number;  // dalam bytes
}

interface Department {
  id: number;
  name: string;
}
```

---

## Alur Autentikasi

### Sequence Diagram: Login dengan Email/Password

```
User          App              Keychain        Backend API
 │             │                  │                │
 │──tap Login──►│                  │                │
 │             │──POST /auth/login────────────────►│
 │             │                  │  {token, user} │
 │             │◄────────────────────────────────── │
 │             │──setGenericPassword(token)──►│     │
 │             │                  │◄──────────│     │
 │──navigasi RoomList──◄│          │                │
```

### Sequence Diagram: Google OAuth

```
User          App              InAppBrowser    Backend API
 │             │                  │                │
 │─tap Google──►│                  │                │
 │             │──open(baseUrl/api/auth/google/redirect)──►│
 │             │                  │──redirect Google OAuth─►│
 │             │                  │◄──callback #google_token=XXX│
 │             │◄──onNavigationStateChange(url)──┤  │
 │             │ (url contains #google_token)     │  │
 │             │──extractToken(url.fragment)      │  │
 │             │──setGenericPassword(token)       │  │
 │─navigasi────◄│                  │                │
```

### Sequence Diagram: Token Refresh Otomatis

```
App (Interceptor)   Keychain        Backend API
       │               │                │
       │  [Response 401]│                │
       │──getToken──────►│               │
       │◄──token─────────│               │
       │──POST /auth/refresh────────────►│
       │                 │  {token, user}│
       │◄────────────────────────────────│
       │──setToken──────►│               │
       │──retry original request────────►│
       │◄──success───────────────────────│
```

### Sequence Diagram: Token Expired (Gagal Refresh)

```
App (Interceptor)   Keychain        Backend API     Navigation
       │               │                │               │
       │  [Response 401]│                │               │
       │──POST /auth/refresh────────────►│               │
       │◄──401 (refresh juga expired)────│               │
       │──resetGenericPassword──►│       │               │
       │──clearAuth()            │       │               │
       │──navigate('Login')──────────────────────────────►│
```

---

## Alur File Upload (Foto Violation & Profil)

### Alur Pemilihan dan Validasi Foto

```typescript
// Pseudocode: handleImageSelection
async function handleImageSelection(source: 'camera' | 'gallery', maxSizeMB: number): Promise<ImageFile | null> {
  const result = await launchImagePicker(source);

  if (result.didCancel) return null;

  const file = result.assets[0];

  // Validasi format
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showError('Format foto harus jpg, jpeg, png, atau webp.');
    return null;
  }

  // Validasi ukuran
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.fileSize > maxBytes) {
    showError(`Ukuran foto maksimal ${maxSizeMB} MB per file.`);
    return null;
  }

  return { uri: file.uri, type: file.type, name: file.fileName, size: file.fileSize };
}
```

### Membangun FormData untuk Upload

```typescript
// Pseudocode: buildViolationFormData
function buildViolationFormData(payload: CreateViolationPayload): FormData {
  const formData = new FormData();
  formData.append('rule_id', String(payload.rule_id));

  payload.violator_ids.forEach((id, index) => {
    formData.append(`violator_ids[${index}]`, String(id));
  });

  if (payload.description) {
    formData.append('description', payload.description);
  }

  payload.photos.forEach((photo, index) => {
    formData.append(`photos[${index}]`, {
      uri: photo.uri,
      type: photo.type,
      name: photo.name,
    } as any);
  });

  return formData;
}
```

---

## Pola Role-Based Rendering

### Utilitas Pemeriksaan Peran

```typescript
// src/utils/role.ts
export const isAdmin = (role: MembershipRole | null): boolean => role === 'admin';
export const isReporter = (role: MembershipRole | null): boolean => role === 'reporter';
```

### Penggunaan di Komponen

```typescript
// Contoh penggunaan di ViolationDetailScreen
const { activeRoomRole } = useRoomStore();

return (
  <View>
    <ViolationInfo violation={violation} />

    {/* Hanya tampil untuk Admin */}
    {isAdmin(activeRoomRole) && violation.status === 'pending' && (
      <View style={styles.actionButtons}>
        <Button title="Verifikasi" onPress={handleVerify} />
        <Button title="Tolak" onPress={handleReject} />
      </View>
    )}

    {/* Hanya tampil untuk Reporter */}
    {isReporter(activeRoomRole) && (
      <Text>Status: {getStatusLabel(violation.status)}</Text>
    )}
  </View>
);
```

### Pola Penyembunyian Rule Admin-Only

```typescript
// src/utils/rules.ts
export function filterRulesForRole(rules: Rule[], role: MembershipRole): Rule[] {
  if (role === 'admin') return rules;
  return rules.filter(rule => !rule.admin_only);
}
```

---

## Strategi Penanganan Error

### Hierarki Penanganan Error

```
HTTP Error
    │
    ▼
Response Interceptor (Axios)
    │
    ├── 401 → Coba refresh token
    │         ├── Berhasil → Retry original request
    │         └── Gagal → Clear session → Navigate Login
    │
    ├── 422 → Extract validationErrors → Tampilkan di bawah field (React Hook Form)
    │
    ├── 403, 404, 502 → Tampilkan toast/alert dengan pesan yang sesuai
    │
    └── Network Error (timeout/no connection) → Tampilkan pesan koneksi
```

### Custom Hook untuk Error Handling di Form

```typescript
function useFormError(form: UseFormReturn<any>) {
  function handleApiError(error: NormalizedError) {
    if (error.validationErrors) {
      // Set error per field di React Hook Form
      Object.entries(error.validationErrors).forEach(([field, messages]) => {
        form.setError(field as any, { message: messages[0] });
      });
    } else {
      // Error umum: tampilkan sebagai toast
      showToast(error.message, 'error');
    }
  }

  return { handleApiError };
}
```

### Status HTTP dan Pesan Error

| Status | Konteks | Pesan Tampil |
|---|---|---|
| 401 | Token invalid/expired | "Sesi Anda telah berakhir. Silakan login kembali." |
| 403 | Tidak punya akses | "Anda tidak memiliki akses untuk melakukan aksi ini." |
| 404 | Data tidak ditemukan | "Data yang diminta tidak ditemukan." |
| 422 | Validasi gagal | Pesan per field dari `errors` response |
| 502 | Server error | "Server sedang bermasalah. Silakan coba lagi beberapa saat lagi." |
| Network | Tidak ada koneksi | "Tidak ada koneksi internet. Periksa jaringan Anda." |

---

## Correctness Properties

*A property adalah karakteristik atau perilaku yang harus berlaku pada semua eksekusi sistem yang valid — pada dasarnya, pernyataan formal tentang apa yang seharusnya dilakukan sistem. Properties berfungsi sebagai jembatan antara spesifikasi yang dapat dibaca manusia dan jaminan kebenaran yang dapat diverifikasi oleh mesin.*

---

### Refleksi Properti (Eliminasi Redundansi)

Sebelum menulis properties final, berikut adalah hasil refleksi untuk menghilangkan redundansi:

- **Token refresh threshold** (1.8) dan **expired token edge case** (1.9) dapat digabungkan menjadi satu property yang menguji kedua kondisi dengan generator yang menghasilkan berbagai waktu expiry.
- **Validasi ukuran foto violation** (8.5-8.6) dan **validasi ukuran foto profil** (12.7-12.8) dapat digabungkan karena logika validasinya sama — parameter maxSizeMB yang bervariasi.
- **Role-based rule filtering** (6.4) dan **Authorization header** (16.1) adalah properti independen yang tidak tumpang tindih.
- **Google token extraction** (2.3) adalah property parsing URL yang unik.
- **Reject reason validation** (10.6) adalah property validasi input yang unik.
- **Auth header injection** (16.1) mencakup semua request, sehingga cukup satu property.

Setelah refleksi, diperoleh **7 properties final** yang unik dan tidak redundan.

---

### Property 1: Token Refresh Berdasarkan Expiry

*Untuk semua* JWT token yang tersimpan di Keychain dengan waktu expiry yang bervariasi, fungsi pengecekan token expiry harus mengembalikan `true` (perlu refresh) jika dan hanya jika sisa waktu token kurang dari atau sama dengan threshold refresh (misalnya 300 detik / 5 menit sebelum exp).

**Validates: Requirements 1.8, 1.9**

---

### Property 2: Ekstraksi Google OAuth Token dari URL

*Untuk semua* URL callback yang mengandung fragment `#google_token=TOKEN`, fungsi ekstraksi token harus selalu mengembalikan nilai TOKEN yang tepat. *Untuk semua* URL yang mengandung `?google_error=...` atau fragment yang tidak dikenal, fungsi ekstraksi harus mengembalikan `null`.

**Validates: Requirements 2.3, 2.4**

---

### Property 3: Filter Rules Berdasarkan Role

*Untuk semua* daftar rules dengan kombinasi `admin_only: true` dan `admin_only: false`, fungsi `filterRulesForRole` harus memastikan bahwa:
- Jika role adalah `reporter`, semua rule dengan `admin_only: true` tidak ada dalam hasil filter.
- Jika role adalah `admin`, semua rule dikembalikan tanpa pengurangan.

**Validates: Requirements 6.4, 6.5**

---

### Property 4: Validasi Ukuran dan Format File Foto

*Untuk semua* file yang diberikan ke fungsi validasi foto dengan parameter `maxSizeMB`, fungsi harus mengembalikan `valid: false` jika ukuran file `> maxSizeMB * 1024 * 1024` bytes, dan mengembalikan `valid: false` jika tipe MIME file bukan salah satu dari `['image/jpeg', 'image/png', 'image/webp']`. *Untuk semua* file yang memenuhi kedua kriteria (ukuran ≤ max dan tipe valid), fungsi harus mengembalikan `valid: true`.

**Validates: Requirements 8.5, 8.6, 12.7, 12.8**

---

### Property 5: Validasi Alasan Penolakan Violation

*Untuk semua* payload penolakan violation di mana `reject_reason` adalah string kosong, string berisi hanya whitespace, atau `undefined`/`null`, fungsi validasi form harus mengembalikan error (yaitu mencegah submission). *Untuk semua* payload di mana `reject_reason` mengandung setidaknya satu karakter non-whitespace, validasi harus lolos.

**Validates: Requirements 10.6**

---

### Property 6: Injeksi Authorization Header pada Setiap Request

*Untuk semua* permintaan API yang dikirim melalui Axios instance ketika token tersedia di Keychain, request interceptor harus selalu menyertakan header `Authorization: Bearer {token}` dengan nilai token yang persis sama dengan yang tersimpan. *Untuk semua* permintaan ketika tidak ada token tersimpan, header `Authorization` tidak boleh ada.

**Validates: Requirements 16.1, 16.2**

---

### Property 7: Avatar Fallback dari Inisial Nama

*Untuk semua* objek user yang dirender oleh komponen avatar, jika field `photo` adalah `null`, `undefined`, atau string kosong, komponen harus menampilkan inisial nama (diambil dari satu atau dua karakter pertama kata dalam `name`). Inisial yang ditampilkan harus selalu konsisten dengan nama yang diberikan — nama yang sama selalu menghasilkan inisial yang sama.

**Validates: Requirements 17.7**

---

## Penanganan Error

Penanganan error sudah dijelaskan secara rinci di bagian **Desain API Client**. Di sini dirangkum prinsip utamanya:

1. **Sentralisasi di Interceptor**: Semua error HTTP diproses satu kali di response interceptor Axios, bukan di setiap komponen layar.
2. **401 dengan Auto-Retry**: Token expired ditangani transparan dengan sekali percobaan refresh sebelum mengarahkan ke login.
3. **Validasi Error ke Form**: Error 422 diurai menjadi per-field error yang di-set langsung ke React Hook Form, sehingga pesan muncul di bawah field yang bermasalah.
4. **Pesan User-Friendly**: Semua kode HTTP dipetakan ke pesan dalam Bahasa Indonesia yang dapat dipahami pengguna non-teknis.
5. **Double-Submit Prevention**: Semua tombol submit dinonaktifkan selama `isSubmitting: true` di store atau form state, mencegah pengiriman ganda.

---

## Strategi Pengujian

### Pendekatan Dual Testing

Strategi pengujian menggabungkan dua pendekatan yang saling melengkapi:

- **Unit Test berbasis contoh**: Menguji skenario spesifik, edge case, dan kondisi error
- **Property-Based Test**: Menguji properti universal yang berlaku untuk semua input

### Library Property-Based Testing

Proyek ini menggunakan **[fast-check](https://github.com/dubzzz/fast-check)** untuk JavaScript/TypeScript, dijalankan bersama **Jest** sebagai test runner.

```bash
npm install --save-dev fast-check jest @types/jest
```

Setiap property test dikonfigurasi dengan minimum **100 iterasi** untuk memastikan coverage yang baik melalui randomisasi.

### Konfigurasi Property Tests

```typescript
import fc from 'fast-check';

// Tag format untuk setiap property test:
// Feature: react-native-mobile-app, Property {nomor}: {deskripsi singkat}

test('Property 1: Token refresh berdasarkan expiry', () => {
  // Feature: react-native-mobile-app, Property 1: token refresh threshold
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 3600 }), // sisa detik token
      (remainingSeconds) => {
        const REFRESH_THRESHOLD = 300;
        const needsRefresh = checkTokenNeedsRefresh(remainingSeconds);
        return needsRefresh === (remainingSeconds <= REFRESH_THRESHOLD);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Fokus Unit Test

Unit test difokuskan pada:
- Integrasi antar komponen (layar → store → API client)
- Alur navigasi setelah auth events (login sukses, logout, token expired)
- Kasus spesifik validasi form (field kosong, format tidak valid)
- Error handling untuk setiap kode HTTP

### Fokus Property Test

Setiap dari 7 Correctness Properties di atas diimplementasikan sebagai satu property-based test dengan `numRuns: 100`. Generator fast-check yang digunakan:

| Property | Generator |
|---|---|
| P1: Token expiry | `fc.integer()` untuk sisa waktu token |
| P2: Google URL extraction | `fc.string()` untuk token value, `fc.constantFrom()` untuk error types |
| P3: Rule filtering | `fc.array(fc.record({admin_only: fc.boolean()}))` |
| P4: File validation | `fc.integer()` untuk ukuran file, `fc.string()` untuk MIME type |
| P5: Reject reason validation | `fc.string()`, `fc.constantFrom('', ' ', '\t', '\n')` |
| P6: Auth header injection | `fc.string()` untuk token value |
| P7: Avatar fallback | `fc.string()` untuk nama user |

### Integration Tests

Test integrasi menggunakan **MSW (Mock Service Worker)** untuk mock endpoint API:
- Alur login end-to-end dengan mock backend
- Token refresh cycle
- Upload foto violation dengan FormData

---
