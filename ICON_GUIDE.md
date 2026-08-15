# App Icon Guide

## ❌ Masalah Saat Ini

Icon yang ada di `src/assets/icon.png`:
- **Size**: Terlalu kecil (~1.4KB)
- **Hasil**: EAS Build pakai default Expo icon (Android robot hijau)
- **Perlu**: Icon 1024x1024 dengan logo ODOB

## ✅ Spesifikasi Icon yang Benar

### Size Requirements:
- **iOS**: 1024 x 1024 pixels
- **Android**: 1024 x 1024 pixels (akan di-resize otomatis untuk berbagai density)
- **Format**: PNG
- **Color Mode**: RGB
- **Background**: Bisa transparent atau solid color

### Design Guidelines:
1. **Square format** (1:1 ratio)
2. **Logo di tengah** dengan padding ~10%
3. **High contrast** untuk visibility
4. **No text** kalau bisa (icon lebih recognizable tanpa text)
5. **Simple** - harus terlihat jelas di ukuran kecil (48x48)

---

## 🎨 Cara Membuat Icon

### Opsi 1: Online Generator (Paling Mudah)

**1. Appicon.co** (Recommended)
- Website: https://www.appicon.co
- Upload logo/design Anda
- Download semua size sekaligus
- Gratis

**2. IconKitchen**
- Website: https://icon.kitchen
- Buat icon dengan logo
- Preview langsung
- Export untuk Android/iOS

**3. Figma**
- Website: https://figma.com
- Template: 1024x1024 canvas
- Design logo
- Export as PNG

### Opsi 2: Tools Desktop

**Photoshop / Illustrator:**
```
1. New Document: 1024 x 1024 px
2. Design logo di tengah
3. Export: PNG, RGB, 1024x1024
4. Save as: icon.png
```

**Canva:**
```
1. Create Design: Custom Size 1024x1024
2. Add logo/brand elements
3. Download: PNG
4. Rename to: icon.png
```

---

## 📋 Langkah-langkah Setup

### 1. Buat/Download Icon (1024x1024)

**Jika Anda punya logo:**
- Resize ke 1024x1024
- Add padding ~100px dari edges
- Export as PNG

**Jika belum punya:**
- Gunakan https://www.appicon.co
- Atau sementara pakai placeholder

### 2. Replace Icon File

```bash
# Backup icon lama
copy src\assets\icon.png src\assets\icon-old.png

# Copy icon baru Anda ke:
# src\assets\icon.png (1024x1024)
```

### 3. Verify Icon Size

```bash
# Cek ukuran file (minimal ~50KB untuk 1024x1024)
Get-Item src\assets\icon.png | Select Length
```

Icon 1024x1024 yang proper biasanya **50KB - 500KB** (tergantung complexity).

### 4. Update Splash (Opsional)

Kalau mau splash screen berbeda dari icon:
```bash
# Design splash.png (1284 x 2778)
# Copy ke src\assets\splash.png
```

Atau pakai icon sebagai splash:
```bash
copy src\assets\icon.png src\assets\splash.png
```

### 5. Commit Changes

```bash
git add src/assets/icon.png
git add src/assets/splash.png
git commit -m "feat: update app icon to ODOB logo"
```

### 6. Rebuild APK dengan Clear Cache

```bash
# Build dengan clear cache (penting!)
npx eas-cli build --platform android --profile preview --clear-cache
```

**Note**: `--clear-cache` penting agar EAS tidak pakai cached icon lama!

---

## 🧪 Testing Icon

### Preview Sebelum Build:

Anda bisa preview icon dengan Expo:
```bash
npx expo prebuild --clean
```

Ini akan generate native folders dengan icon.

### Setelah Build:

1. Download APK baru
2. Install di device
3. Cek app launcher - icon harus muncul
4. Cek app drawer - icon harus ada juga

---

## 🎯 Quick Fix: Placeholder Icon

Jika Anda belum punya logo, gunakan placeholder dulu:

### Download Placeholder Icon:

1. **Flaticon**: https://www.flaticon.com
   - Search "building" atau "company"
   - Download PNG 1024x1024

2. **Icons8**: https://icons8.com
   - Free icons
   - Download 1024x1024

3. **Or use colored square**:
   - Buat square 1024x1024 dengan brand color
   - Add text "ODOB" di tengah
   - Simple tapi profesional

---

## 📱 Android Adaptive Icon

Di `app.json` ada config:

```json
"adaptiveIcon": {
  "foregroundImage": "./src/assets/icon.png",
  "backgroundColor": "#FFFFFF"
}
```

**Adaptive Icon** = Icon yang bisa berbentuk (circle, square, rounded) tergantung device.

**Best Practice:**
- `foregroundImage`: Logo dengan transparent background
- `backgroundColor`: Brand color atau putih
- Logo harus di "safe zone" (center 66%)

---

## ✅ Checklist

- [ ] Punya file icon.png (1024x1024)
- [ ] File size minimal ~50KB
- [ ] Logo di tengah dengan padding
- [ ] Replace `src/assets/icon.png`
- [ ] Commit changes
- [ ] Build dengan `--clear-cache`
- [ ] Test di device

---

## 🚀 Commands Summary

```bash
# 1. Verify icon size
Get-Item src\assets\icon.png | Select Length

# 2. Replace icon (jika sudah punya yang baru)
# Copy icon baru ke src\assets\icon.png

# 3. Commit
git add src/assets/icon.png
git commit -m "feat: update app icon"

# 4. Build dengan clear cache (PENTING!)
npx eas-cli build --platform android --profile preview --clear-cache
```

---

## 💡 Tips

1. **Test icon di berbagai sizes**: Icon harus jelas dari 48x48 sampai 512x512
2. **Avoid gradients**: Flat colors lebih sharp
3. **High contrast**: Agar terlihat di light/dark backgrounds
4. **No text if possible**: Icons lebih universal tanpa text
5. **Brand colors**: Gunakan brand colors untuk consistency

---

**Next Steps:**
1. Siapkan icon 1024x1024 (design atau download)
2. Replace `src/assets/icon.png`
3. Build ulang dengan `--clear-cache`
4. Icon ODOB akan muncul! 🎉
