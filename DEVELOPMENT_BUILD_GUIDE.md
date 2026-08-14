# Development Build - Panduan Lengkap

## Apa itu Development Build?

Development Build adalah APK khusus untuk development yang:
- ✅ Include semua native modules project Anda
- ✅ Support hot reload seperti Expo Go
- ✅ Bisa connect ke Metro bundler di laptop
- ✅ **Tidak perlu rebuild setiap kali update code JavaScript/TypeScript**

## Setup Awal (1x saja)

### 1. Build Development APK
```bash
npx eas-cli build --profile development --platform android
```

**Status Build Saat Ini**: Sedang berjalan di EAS servers
**Cek Status**: Jalankan perintah di bawah atau cek email dari EAS

```bash
npx eas-cli build:list
```

### 2. Install APK di HP Anda
- Setelah build selesai, Anda akan dapat link download APK
- Download dan install APK di HP Android Anda
- **Simpan APK ini** - hanya perlu install 1x kecuali ada perubahan native code

## Workflow Development Harian

### Setiap Kali Coding:

1. **Jalankan Metro Bundler** di laptop:
   ```bash
   npx expo start --dev-client
   ```

2. **Buka app** di HP Anda (app yang sudah diinstall dari development build)

3. **Kode otomatis reload** setiap kali Anda save file!

### Koneksi Metro Bundler ke HP

Pastikan laptop dan HP dalam **1 WiFi yang sama**, lalu:

**Opsi 1: Scan QR Code**
- Metro bundler akan tampilkan QR code
- Buka development app di HP
- Scan QR code

**Opsi 2: Manual URL**
- Metro bundler akan tampilkan URL seperti: `exp://192.168.x.x:8081`
- Buka development app di HP
- Masukkan URL manual

**Opsi 3: USB (jika WiFi bermasalah)**
```bash
npx expo start --dev-client --localhost --android
```

## Kapan Perlu Rebuild Development APK?

Rebuild development APK **hanya** jika:
- ❌ Ada perubahan native code (android/, ios/)
- ❌ Install/uninstall native modules (library baru)
- ❌ Update Expo SDK version
- ❌ Update package.json dependencies yang native

**TIDAK perlu rebuild** jika:
- ✅ Update JavaScript/TypeScript code
- ✅ Update React components
- ✅ Update styling
- ✅ Update business logic
- ✅ Update API calls

## Perbandingan Build Profiles

| Profile | Tujuan | Reload | Native Modules | Update Code |
|---------|--------|--------|----------------|-------------|
| **development** | Daily coding | ✅ Hot reload | ✅ Full support | Metro bundler |
| **preview** | QA testing | ❌ No | ✅ Full support | Rebuild APK |
| **production** | Play Store | ❌ No | ✅ Full support | Rebuild bundle |

## Troubleshooting

### "Could not connect to Metro bundler"
- Pastikan laptop dan HP dalam WiFi yang sama
- Check firewall Windows tidak block port 8081
- Coba mode USB: `npx expo start --dev-client --localhost --android`

### "App crashes on launch"
- Check Metro bundler sedang running
- Reload app: Shake HP → "Reload"
- Clear cache: `npx expo start --dev-client --clear`

### "Build failed"
- Check build logs di EAS dashboard
- Coba rebuild: `npx eas-cli build --profile development --platform android --clear-cache`

## Summary Commands

```bash
# Setup (1x)
npx eas-cli build --profile development --platform android

# Daily development
npx expo start --dev-client

# Check build status
npx eas-cli build:list

# QA testing APK
npx eas-cli build --platform android --profile preview
```

## Tips Pro

1. **Simpan Development APK** - Anda bisa share ke team member lain
2. **Gunakan USB debug** jika WiFi tidak stabil
3. **Metro bundler bisa running 24/7** di background
4. **Shake HP** untuk access developer menu (reload, debug, etc)

---

**Next Steps:**
1. ⏳ Tunggu development build selesai (cek email atau `npx eas-cli build:list`)
2. 📱 Download dan install APK di HP
3. 💻 Jalankan `npx expo start --dev-client`
4. 🚀 Mulai coding dengan hot reload!
