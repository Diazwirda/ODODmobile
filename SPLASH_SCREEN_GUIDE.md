# Splash Screen Guide

## ❌ Masalah Saat Ini

- Tidak ada file `splash.png` di `src/assets/`
- Config splash screen baru ditambahkan tapi file gambar belum ada
- Expo akan error saat build karena mencari file yang tidak ada

## ✅ Yang Perlu Dilakukan

### 1. Buat Splash Screen Image

**Spesifikasi:**
- **Ukuran**: 1284 x 2778 pixels (ukuran maksimal untuk iOS)
- **Format**: PNG dengan transparent background (atau background putih)
- **Konten**: Logo aplikasi Anda di tengah
- **Design**: Simple, clean, professional

**Tools untuk membuat:**
- Figma (online, gratis): https://figma.com
- Canva (online, gratis): https://canva.com
- Photoshop / Illustrator (desktop)
- Online generators: https://www.appicon.co

### 2. Simpan File

**Lokasi:**
```
src/assets/splash.png
```

**Alternatif cepat:** Copy `icon.png` sebagai `splash.png` sementara
```bash
copy src\assets\icon.png src\assets\splash.png
```

### 3. Konfigurasi (Sudah Diupdate)

`app.json` sudah diupdate dengan config:

```json
{
  "splash": {
    "image": "./src/assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  }
}
```

## 📐 Design Guidelines

### Splash Screen Best Practices:

1. **Keep it Simple**
   - Logo/brand di tengah
   - Minimal text
   - Clean background

2. **Safe Area**
   - Jangan taruh konten penting di pinggir
   - Keep main content di tengah (center 60%)
   - Sisakan margin ~200px dari edges

3. **Colors**
   - Gunakan brand colors
   - High contrast untuk visibility
   - Consider dark mode (optional)

4. **Duration**
   - Native splash akan muncul 1-2 detik
   - Tidak perlu animasi (handle by Expo)
   - Focus on branding

## 🎨 Template Sizes

Untuk berbagai devices:

| Device Type | Resolution | Aspect Ratio |
|-------------|------------|--------------|
| iPhone 14 Pro Max | 1284 x 2778 | 19.5:9 |
| Samsung Galaxy | 1440 x 3040 | ~19:9 |
| Universal | 1242 x 2688 | Safe for all |

**Rekomendasi**: Buat di **1284 x 2778** dengan logo/content di tengah.

## 🚀 Quick Start (Using Icon as Splash)

Untuk sementara, gunakan icon.png sebagai splash:

```bash
# Di PowerShell
copy src\assets\icon.png src\assets\splash.png
```

Kemudian rebuild APK untuk melihat perubahan:

```bash
npx eas-cli build --platform android --profile preview
```

## 🔄 Kapan Splash Screen Terlihat?

1. **Development Build**: 
   - Splash muncul saat pertama kali buka app
   - Setelah Metro connect, akan load JS bundle

2. **Preview/Production APK**:
   - Splash muncul saat app launch
   - Hilang setelah JavaScript bundle loaded
   - Duration: 1-3 detik (tergantung device)

## ✅ Testing Splash Screen

### Di Development:
- Close app completely
- Buka app lagi
- Lihat splash sebelum Metro connect

### Di Preview APK:
- Install APK baru (yang include splash config)
- Launch app
- Splash akan muncul sebelum login screen

## 📝 Checklist

- [ ] Buat atau design `splash.png` (1284 x 2778)
- [ ] Simpan di `src/assets/splash.png`
- [ ] Verify file exists: `dir src\assets\splash.png`
- [ ] Config app.json sudah update ✅ (sudah done)
- [ ] Rebuild APK untuk lihat perubahan
- [ ] Test di device

## 🎯 Next Steps

1. **Quick fix** (untuk test cepat):
   ```bash
   copy src\assets\icon.png src\assets\splash.png
   ```

2. **Proper design** (nanti):
   - Design splash screen yang proper
   - Replace `splash.png` dengan design baru
   - Rebuild APK

3. **Rebuild APK**:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```

---

**Note**: Splash screen adalah **native asset**, jadi perlu **rebuild APK** untuk melihat perubahan. Hot reload tidak akan update splash screen.
