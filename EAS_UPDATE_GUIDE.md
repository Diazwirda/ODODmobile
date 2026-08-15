# EAS Update - Update Tanpa Rebuild APK

## 🎯 Masalah yang Dipecahkan

**SEBELUM (Tanpa EAS Update):**
```
Ada bug kecil → Build APK baru (~15 menit) → Share ke QA → Install lagi
Update UI → Build APK baru (~15 menit) → Share ke QA → Install lagi
Fix typo → Build APK baru (~15 menit) → Share ke QA → Install lagi
```
❌ Boros waktu!

**SESUDAH (Dengan EAS Update):**
```
Ada bug kecil → Push update (~30 detik) → QA buka app → Auto update ✅
Update UI → Push update (~30 detik) → QA buka app → Auto update ✅
Fix typo → Push update (~30 detik) → QA buka app → Auto update ✅
```
✅ Hemat waktu!

---

## 📋 Workflow Lengkap

### PERTAMA KALI: Build APK (1x saja)

```bash
# Build APK preview untuk QA (sudah dilakukan)
npx eas-cli build --platform android --profile preview

# Share APK ke QA
# QA install APK ini
```

**APK ini akan dipakai terus**, tidak perlu reinstall!

---

### UPDATE KE-1, KE-2, KE-3, dst: Push Update (30 detik)

#### Update Code Anda:
```bash
# Edit file
code src/screens/LoginScreen.tsx

# Commit
git add .
git commit -m "fix: perbaiki validasi email"
```

#### Push Update ke QA:
```bash
# Push update ke channel preview (untuk QA)
npx eas-cli update --branch preview --message "Fix validasi email"
```

**Proses:**
```
1. Upload bundle JS       (~10 detik)
2. Publish update         (~5 detik)
3. ✅ Selesai!
```

#### QA Terima Update:
```
QA tutup app → Buka lagi → Update auto download → Restart app → Lihat perubahan!
```

**Atau force check update:**
```
QA shake HP → "Check for updates"
```

---

## 🔄 Kapan Pakai EAS Update vs Rebuild APK?

### ✅ Pakai EAS Update (Cepat - 30 detik)

Untuk perubahan **JavaScript/TypeScript** saja:
- ✅ Fix bug di logic
- ✅ Update UI/styling
- ✅ Perubahan text/wording
- ✅ Update API calls
- ✅ Perubahan state management
- ✅ Update navigation flow
- ✅ Tambah/edit screens
- ✅ Update validation rules

**Command:**
```bash
npx eas-cli update --branch preview --message "Deskripsi update"
```

### ❌ Harus Rebuild APK (Lama - 15 menit)

Untuk perubahan **native code**:
- ❌ Install library native baru
- ❌ Update Expo SDK version
- ❌ Perubahan `android/` atau `ios/` folder
- ❌ Update native dependencies
- ❌ Perubahan `app.json` config (permissions, dll)

**Command:**
```bash
npx eas-cli build --platform android --profile preview
```

---

## 📊 Contoh Skenario Nyata

### Skenario 1: Fix Bug Kecil

```bash
# Senin pagi - QA report bug
10:00 - QA: "Login error jika email ada spasi"

# Senin pagi - Anda fix
10:05 - Edit: src/screens/LoginScreen.tsx (trim email)
10:06 - git commit -m "fix: trim email input"
10:07 - npx eas-cli update --branch preview --message "Fix email trim"
10:08 - ✅ Selesai!

# Senin siang - QA test
10:10 - QA buka app → Auto update
10:11 - QA test → Bug fixed! ✅
```

**Hemat waktu: 15 menit → 30 detik**

### Skenario 2: Update UI

```bash
# Selasa - Ubah warna button
14:00 - Edit styling di LoginScreen
14:01 - git commit -m "style: ubah warna button"
14:02 - npx eas-cli update --branch preview
14:03 - QA buka app → Lihat perubahan

# Selasa - Ubah text label
15:00 - Edit label "Masuk" jadi "Login"
15:01 - npx eas-cli update --branch preview
15:02 - QA buka app → Lihat perubahan
```

**Bisa update berkali-kali dalam 1 hari!**

### Skenario 3: Install Library Baru (Perlu Rebuild)

```bash
# Rabu - Install react-native-maps (native library)
09:00 - npm install react-native-maps
09:01 - git commit -m "feat: add maps"
09:02 - npx eas-cli build --platform android --profile preview
09:17 - ✅ Build selesai, share ke QA

# Kenapa rebuild? 
# Karena react-native-maps butuh native code
```

---

## 🎯 Command Reference

### Daily Updates (JavaScript only):

```bash
# Update untuk QA (preview channel)
npx eas-cli update --branch preview --message "Deskripsi update"

# Update untuk production (production channel)
npx eas-cli update --branch production --message "Release v1.2.0"

# Lihat history updates
npx eas-cli update:list --branch preview
```

### Native Changes (Perlu rebuild):

```bash
# Build preview untuk QA
npx eas-cli build --platform android --profile preview

# Build production untuk Play Store
npx eas-cli build --platform android --profile production
```

---

## 🔍 Monitoring Updates

### Cek Update History:
```bash
npx eas-cli update:list --branch preview
```

Output:
```
ID                       Created          Message
abc123def456             5 minutes ago    Fix validasi email
789ghi012jkl             2 hours ago      Update button color
```

### Rollback jika Ada Bug:
```bash
# Rollback ke update sebelumnya
npx eas-cli update:rollback --branch preview
```

---

## 📱 Testing Updates

### Sebagai Developer (Test Sendiri):
```bash
# 1. Install preview APK di HP
# 2. Push update:
npx eas-cli update --branch preview --message "Test update"

# 3. Buka app di HP
# 4. Tutup & buka lagi → Update terdownload
```

### Force Check Update (Manual):
```bash
# Di app, tambahkan button "Check Update" (optional)
# Atau: Shake device → Developer Menu → "Check for updates"
```

---

## 🚨 Troubleshooting

### "Update tidak terdownload"
```bash
# Pastikan:
1. APK yang terinstall dari build yang punya channel
2. Internet HP nyala
3. Tutup app completely, buka lagi
4. Check: npx eas-cli update:list --branch preview
```

### "Error saat push update"
```bash
# Clear cache dan retry:
npx eas-cli update --branch preview --message "Update" --clear-cache
```

---

## 💡 Best Practices

### 1. Message yang Jelas
```bash
# ❌ Bad
npx eas-cli update --branch preview --message "update"

# ✅ Good
npx eas-cli update --branch preview --message "Fix login validation bug"
```

### 2. Test di Development Build Dulu
```bash
# 1. Test dengan development build + hot reload
npx expo start --dev-client

# 2. Setelah yakin, push update ke QA
npx eas-cli update --branch preview --message "..."
```

### 3. Commit Sebelum Push Update
```bash
# Selalu commit dulu
git add .
git commit -m "fix: something"

# Baru push update
npx eas-cli update --branch preview
```

---

## 📈 Manfaat EAS Update

| Aspek | Tanpa EAS Update | Dengan EAS Update |
|-------|-----------------|-------------------|
| **Waktu update** | 15 menit | 30 detik |
| **QA harus reinstall** | Ya | Tidak |
| **Update per hari** | 1-2x | Unlimited |
| **Fix hotfix** | Lama | Cepat |
| **User experience** | Download APK baru | Buka app, auto update |

---

## ✅ Summary

**Setup (Sudah Selesai):**
- ✅ `expo-updates` installed
- ✅ `eas.json` configured
- ✅ Channels setup (development, preview, production)

**Workflow Baru:**
1. **Pertama kali**: Build APK → Share ke QA → QA install
2. **Update JavaScript**: Push update → QA buka app → Auto update ✅
3. **Update native**: Rebuild APK → Share ke QA → QA install (jarang)

**Next Steps:**
1. Build preview APK baru (yang sudah include expo-updates)
2. Share ke QA untuk install
3. Dari sekarang: update cukup `npx eas-cli update` saja!

---

**Build Preview Baru (Include EAS Update):**
```bash
npx eas-cli build --platform android --profile preview
```

Setelah APK ini di-install QA, semua update selanjutnya cukup:
```bash
npx eas-cli update --branch preview --message "Your update message"
```

🎉 **Selamat! Workflow development Anda sekarang jauh lebih efisien!**
