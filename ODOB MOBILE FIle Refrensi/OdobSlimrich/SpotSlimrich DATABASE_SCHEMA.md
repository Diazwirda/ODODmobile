# Database Schema - Spot Slimrich & OdobDaily

## 📊 Overview

Database MySQL yang sama digunakan oleh:
1. **Spot Slimrich** - Department manual
2. **OdobDaily** - Department dari Slimrich API

Kedua aplikasi menggunakan tabel yang sama dengan struktur identik.

---

## 🗄️ Database Tables

### 1. users
Tabel untuk menyimpan semua user (dari Spot Slimrich dan OdobDaily)

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'reporter') DEFAULT 'reporter',
    department VARCHAR(255) NULL,
    position VARCHAR(255) NULL,
    points INT DEFAULT 0,
    photo TEXT NULL,
    age INT NULL,
    tutorial_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

**Fields:**
- `id`: Primary key
- `email`: Unique, untuk login
- `role`: admin atau reporter (role global, bukan per room)
- `department`: Department name (bisa manual atau dari Slimrich)
- `points`: Total poin user (dihitung otomatis)
- `tutorial_completed`: Flag onboarding tutorial

---

### 2. rooms
Tabel untuk menyimpan room/perusahaan

```sql
CREATE TABLE rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT NULL,
    logo TEXT NULL,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `code`: Unique code untuk join room (contoh: "HPL2026")
- `created_by`: User yang membuat room
- `deleted_at`: Soft delete

---

### 3. room_members
Tabel untuk menyimpan membership user di room (many-to-many)

```sql
CREATE TABLE room_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('admin', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY unique_room_user (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `role`: admin atau member (role dalam room tertentu)
- User bisa jadi admin di room A dan member di room B

---

### 4. departments
Tabel untuk menyimpan department manual (untuk Spot Slimrich)

```sql
CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY unique_room_department (room_id, name),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

**Notes:**
- Digunakan oleh Spot Slimrich untuk custom departments
- OdobDaily tidak menggunakan tabel ini (pakai Slimrich API)

---

### 5. rules
Tabel untuk menyimpan jenis pelanggaran

```sql
CREATE TABLE rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    reporter_points INT DEFAULT 1,
    violator_points INT DEFAULT -1,
    icon VARCHAR(50) NULL,
    color VARCHAR(20) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);
```

**Fields:**
- `reporter_points`: Poin yang didapat reporter jika verified
- `violator_points`: Poin yang dikurangi dari violator (biasanya negatif)
- `icon`: Icon name untuk UI
- `color`: Color code untuk UI
- `deleted_at`: Soft delete

---

### 6. violations
Tabel untuk menyimpan laporan pelanggaran

```sql
CREATE TABLE violations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    rule_id BIGINT UNSIGNED NOT NULL,
    reporter_id BIGINT UNSIGNED NOT NULL,
    violator_id BIGINT UNSIGNED NULL,
    violator_ids JSON NULL,
    description TEXT NULL,
    photos JSON NOT NULL,
    status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    reject_reason TEXT NULL,
    incident_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (violator_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `violator_id`: Single violator (backward compatibility)
- `violator_ids`: Array of violator IDs (JSON) - support multiple violators
- `photos`: Array of photo URLs (JSON)
- `status`: pending → verified/rejected
- `reject_reason`: Alasan jika ditolak admin
- `incident_at`: Waktu kejadian pelanggaran

---

### 7. points_log
Tabel untuk menyimpan history perubahan poin

```sql
CREATE TABLE points_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    violation_id BIGINT UNSIGNED NOT NULL,
    points INT NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE
);
```

**Fields:**
- `points`: Bisa positif (reporter) atau negatif (violator)
- Created ketika violation di-verify
- Deleted ketika violation status berubah (untuk re-calculate)

---

## 🔄 How Data Flows

### Create Violation Report
```
1. User submit violation
   → INSERT INTO violations (status='pending')
   
2. Admin verify
   → UPDATE violations SET status='verified'
   → INSERT INTO points_log (reporter +points)
   → INSERT INTO points_log (violator -points)
   → UPDATE users SET points = SUM(points_log)
   
3. Admin reject
   → UPDATE violations SET status='rejected', reject_reason='...'
   → No points_log created
```

### Multi-Room Data Isolation
```
User A di Room 1 (Spot Slimrich):
- room_members: {user_id: A, room_id: 1, role: 'admin'}
- violations hanya untuk room_id = 1
- leaderboard hanya dari room_id = 1

User A di Room 2 (OdobDaily):
- room_members: {user_id: A, room_id: 2, role: 'member'}
- violations hanya untuk room_id = 2
- leaderboard hanya dari room_id = 2
```

---

## 🔒 Data Security & Isolation

### Room-Based Access Control
```php
// Middleware: EnsureRoomMember
// Check if user is member of the room

SELECT * FROM room_members 
WHERE room_id = ? AND user_id = ?
```

### Admin-Only Actions
```php
// Middleware: EnsureRoomAdmin
// Check if user is admin in the room

SELECT * FROM room_members 
WHERE room_id = ? AND user_id = ? AND role = 'admin'
```

### Query Isolation
```php
// Semua query HARUS include room_id filter

// ✅ CORRECT
SELECT * FROM violations WHERE room_id = 1 AND status = 'pending'

// ❌ WRONG (could leak data from other rooms)
SELECT * FROM violations WHERE status = 'pending'
```

---

## 📊 Example Data

### Sample Users
```sql
INSERT INTO users (name, email, password, role, department) VALUES
('Admin User', 'admin@humanplus.co.id', '$2y$12$...', 'admin', 'HR'),
('John Doe', 'john@humanplus.co.id', '$2y$12$...', 'reporter', 'Teknologi'),
('Jane Smith', 'jane@client.com', '$2y$12$...', 'reporter', 'PT ABC Indonesia');
```

### Sample Rooms
```sql
INSERT INTO rooms (name, code, description, created_by) VALUES
('PT Human Plus', 'HPL2026', 'Internal tracking', 1),
('PT ABC Indonesia', 'ABC2026', 'Client company', 1);
```

### Sample Room Members
```sql
INSERT INTO room_members (room_id, user_id, role) VALUES
(1, 1, 'admin'),   -- Admin di Room HPL
(1, 2, 'member'),  -- John member di Room HPL
(2, 1, 'admin'),   -- Admin juga di Room ABC
(2, 3, 'member');  -- Jane member di Room ABC
```

### Sample Rules
```sql
INSERT INTO rules (room_id, name, reporter_points, violator_points, icon, color) VALUES
(1, 'Lupa Presensi', 5, -10, 'clock', '#FF6B6B'),
(1, 'Tidak Pakai Seragam', 3, -5, 'shirt', '#4ECDC4'),
(2, 'Datang Terlambat', 5, -10, 'alarm', '#95E1D3');
```

---

## 🔍 Common Queries

### Get Leaderboard for Room
```sql
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    u.photo,
    COALESCE(SUM(CASE WHEN v.status = 'verified' THEN pl.points ELSE 0 END), 0) as total_points
FROM users u
JOIN room_members rm ON u.id = rm.user_id
LEFT JOIN points_log pl ON u.id = pl.user_id
LEFT JOIN violations v ON pl.violation_id = v.id AND v.room_id = ?
WHERE rm.room_id = ? AND rm.role != 'admin'
GROUP BY u.id
ORDER BY total_points DESC;
```

### Get Pending Violations for Admin
```sql
SELECT 
    v.*,
    r.name as rule_name,
    reporter.name as reporter_name,
    violator.name as violator_name
FROM violations v
JOIN rules r ON v.rule_id = r.id
JOIN users reporter ON v.reporter_id = reporter.id
LEFT JOIN users violator ON v.violator_id = violator.id
WHERE v.room_id = ? AND v.status = 'pending'
ORDER BY v.created_at DESC;
```

### Get User's Total Points in Room
```sql
SELECT 
    u.id,
    u.name,
    COALESCE(SUM(CASE WHEN v.status = 'verified' THEN pl.points ELSE 0 END), 0) as total_points
FROM users u
LEFT JOIN points_log pl ON u.id = pl.user_id
LEFT JOIN violations v ON pl.violation_id = v.id AND v.room_id = ?
WHERE u.id = ?
GROUP BY u.id;
```

---

## 🚀 Migration Files

Migrations sudah tersedia di folder `database/migrations/`:

```
2026_02_25_090000_create_rules_table.php
2026_02_25_090100_create_violations_table.php
2026_02_25_090200_create_points_log_table.php
2026_02_26_230000_add_deleted_at_to_rooms_table.php
2026_02_26_230001_add_deleted_at_to_rules_table.php
2026_02_27_000000_create_room_members_table.php
2026_02_27_000001_add_room_id_to_violations_and_rules.php
2026_02_27_000002_add_reject_reason_to_violations.php
2026_02_27_120000_add_violator_ids_to_violations.php
2026_03_01_000000_create_departments_table.php
```

### Run Migrations
```bash
php artisan migrate
```

### Reset Database
```bash
php artisan migrate:fresh
```

---

## 🔄 Spot Slimrich vs OdobDaily

### Shared Components
✅ **Same database tables:**
- users
- rooms
- room_members
- rules
- violations
- points_log

✅ **Same workflows:**
- Authentication
- Room management
- Violation reporting
- Points calculation
- Leaderboard

### Different Components

| Feature | Spot Slimrich | OdobDaily |
|---------|---------------|-----------|
| **Departments** | Fixed dari Slimrich API | Manual via `departments` table |
| **Department CRUD** | Read-only from API | Users can create/delete |
| **Use Case** | Khusus untuk client Slimrich | Flexible untuk berbagai organisasi |
| **API Integration** | Required | Optional |

---

## 💾 Database Configuration

### .env Configuration
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spotting_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

### Charset & Collation
```sql
ALTER DATABASE spotting_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

---

## 📈 Performance Optimization

### Indexes
```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);

-- Room members
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);

-- Violations
CREATE INDEX idx_violations_room ON violations(room_id);
CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_violations_reporter ON violations(reporter_id);
CREATE INDEX idx_violations_created ON violations(created_at);

-- Points log
CREATE INDEX idx_points_user ON points_log(user_id);
CREATE INDEX idx_points_violation ON points_log(violation_id);
```

### Query Optimization Tips
1. Always filter by `room_id` first
2. Use eager loading untuk relationships
3. Cache leaderboard untuk room yang besar
4. Paginate long lists
5. Use indexes untuk sering di-query columns

---

## 🔐 Backup Strategy

### Daily Backup
```bash
mysqldump -u root -p spotting_db > backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
mysql -u root -p spotting_db < backup_20260723.sql
```

### Recommended Backup Schedule
- **Daily:** Full database backup
- **Hourly:** Incremental backup (production only)
- **Weekly:** Off-site backup storage

---

## 📝 Notes

1. **Data Isolation:** Setiap room memiliki data yang terisolasi melalui `room_id`
2. **Soft Delete:** Rooms dan rules menggunakan soft delete untuk audit trail
3. **JSON Fields:** `photos` dan `violator_ids` menggunakan JSON untuk flexibility
4. **Points Calculation:** Dilakukan di application layer, bukan database trigger
5. **Role System:** Dual role system (global user.role + room-specific room_members.role)

---

**Database Schema Version:** 1.0  
**Last Updated:** July 23, 2026  
**Compatible With:** 
- Spot Slimrich v1.0
- OdobDaily v1.0

