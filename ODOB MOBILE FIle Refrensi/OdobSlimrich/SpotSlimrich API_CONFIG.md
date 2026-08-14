# API Configuration - Spot Slimrich

## 🌐 Production Environment

**Domain:** https://spot.slimrich.id  
**API Base URL:** https://spot.slimrich.id/api

### Production Endpoints Examples

```bash
# Authentication
POST   https://spot.slimrich.id/api/auth/login
POST   https://spot.slimrich.id/api/auth/register
GET    https://spot.slimrich.id/api/auth/me

# Rooms
GET    https://spot.slimrich.id/api/rooms
POST   https://spot.slimrich.id/api/rooms

# Dashboard
GET    https://spot.slimrich.id/api/dashboard/leaderboard
GET    https://spot.slimrich.id/api/dashboard/stats

# Violations
GET    https://spot.slimrich.id/api/violations
POST   https://spot.slimrich.id/api/violations

# Departments (Public - No Auth)
GET    https://spot.slimrich.id/api/slimrich/departments
```

---

## 💻 Development Environment

**Domain:** http://localhost:8000  
**API Base URL:** http://localhost:8000/api

### Development Setup

```bash
# Start local server
php artisan serve

# Server akan berjalan di:
# http://localhost:8000
```

### Development Endpoints Examples

```bash
# Authentication
POST   http://localhost:8000/api/auth/login
POST   http://localhost:8000/api/auth/register
GET    http://localhost:8000/api/auth/me

# Test with curl
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@humanplus.co.id","password":"password123"}'
```

---

## 📱 Mobile App Configuration

### Flutter Configuration

```dart
// lib/config/api_config.dart
class ApiConfig {
  // Change this based on environment
  static const bool isProduction = true;
  
  static const String productionBaseUrl = 'https://spot.slimrich.id/api';
  static const String developmentBaseUrl = 'http://localhost:8000/api';
  
  static String get baseUrl => isProduction ? productionBaseUrl : developmentBaseUrl;
  
  // For Android Emulator, use 10.0.2.2 instead of localhost
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:8000/api';
}

// Usage in ApiService
class ApiService {
  late Dio _dio;
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseURL: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }
}
```

### React Native Configuration

```javascript
// config/apiConfig.js
const __DEV__ = process.env.NODE_ENV === 'development';

export const API_CONFIG = {
  PRODUCTION_BASE_URL: 'https://spot.slimrich.id/api',
  DEVELOPMENT_BASE_URL: 'http://localhost:8000/api',
  
  // For Android Emulator, use 10.0.2.2 instead of localhost
  ANDROID_EMULATOR_BASE_URL: 'http://10.0.2.2:8000/api',
  
  get BASE_URL() {
    if (__DEV__) {
      // Check if running on Android Emulator
      if (Platform.OS === 'android') {
        return this.ANDROID_EMULATOR_BASE_URL;
      }
      return this.DEVELOPMENT_BASE_URL;
    }
    return this.PRODUCTION_BASE_URL;
  }
};

// Usage in apiService.js
import { API_CONFIG } from '../config/apiConfig';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 30000,
});
```

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Production
APP_URL=https://spot.slimrich.id
APP_ENV=production
APP_DEBUG=false

# Database
DB_CONNECTION=mysql
DB_HOST=your-production-db-host
DB_PORT=3306
DB_DATABASE=spot_slimrich
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

# Slimrich Integration
SLIMRICH_AUTH_ENABLED=true
SLIMRICH_BASE_URL=https://slimrich.id
SLIMRICH_APP_KEY=your_app_key
SLIMRICH_APP_SECRET=your_app_secret
SLIMRICH_API_TOKEN=your_api_token

# Optional: Bunny CDN
BUNNY_API_URL=https://storage.bunnycdn.com
BUNNY_PULL_URL=https://spot-slimrich.b-cdn.net
BUNNY_API_KEY=your_bunny_key
```

### Mobile App Environment

**Flutter (.env using flutter_dotenv)**
```env
# .env.production
API_BASE_URL=https://spot.slimrich.id/api
APP_ENV=production

# .env.development
API_BASE_URL=http://localhost:8000/api
APP_ENV=development
```

**React Native (.env using react-native-config)**
```env
# .env.production
API_BASE_URL=https://spot.slimrich.id/api
APP_ENV=production

# .env.development
API_BASE_URL=http://localhost:8000/api
APP_ENV=development
```

---

## 🔐 SSL/HTTPS Configuration

Production API menggunakan HTTPS. Pastikan:

1. **Certificate Valid** - Domain memiliki SSL certificate yang valid
2. **Mobile App Trust Certificate** - iOS/Android trust system certificates by default
3. **No Self-Signed Certificates** - Production harus pakai certificate dari CA terpercaya

### Testing HTTPS

```bash
# Test SSL certificate
curl -v https://spot.slimrich.id/api/slimrich/departments

# Check certificate details
openssl s_client -connect spot.slimrich.id:443 -servername spot.slimrich.id
```

---

## 🧪 Testing Different Environments

### Postman Environment Variables

```json
{
  "name": "Spot Slimrich - Production",
  "values": [
    {
      "key": "base_url",
      "value": "https://spot.slimrich.id/api",
      "enabled": true
    },
    {
      "key": "token",
      "value": "",
      "enabled": true
    },
    {
      "key": "room_id",
      "value": "1",
      "enabled": true
    }
  ]
}
```

```json
{
  "name": "Spot Slimrich - Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api",
      "enabled": true
    },
    {
      "key": "token",
      "value": "",
      "enabled": true
    },
    {
      "key": "room_id",
      "value": "1",
      "enabled": true
    }
  ]
}
```

---

## 📊 API Health Check

### Test Production API

```bash
# Test public endpoint (no auth required)
curl https://spot.slimrich.id/api/slimrich/departments

# Expected response: Array of department names
["PT ABC Indonesia", "PT XYZ Corporation", ...]
```

### Create Health Check Endpoint (Optional)

```php
// routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0',
    ]);
});
```

```bash
# Test health check
curl https://spot.slimrich.id/api/health
```

---

## 🚀 Deployment Checklist

### Backend Production
- [ ] SSL Certificate installed
- [ ] .env configured for production
- [ ] Database migrated
- [ ] File permissions set correctly
- [ ] PHP version compatible (8.1+)
- [ ] Composer dependencies installed (production)
- [ ] Cache cleared: `php artisan cache:clear`
- [ ] Config cached: `php artisan config:cache`
- [ ] Routes cached: `php artisan route:cache`
- [ ] API tested on production

### Mobile App Production
- [ ] API_BASE_URL set to production
- [ ] Debug mode disabled
- [ ] SSL certificate pinning (optional)
- [ ] Logging disabled/minimized
- [ ] Analytics integrated (optional)
- [ ] Error tracking enabled (Sentry, etc)
- [ ] App tested with production API
- [ ] Store listings ready (App Store, Play Store)

---

## 📞 Support

**API Issues:**
- Email: support@humanplus.co.id
- Domain: https://spot.slimrich.id
- API Version: 1.0

**Documentation:**
- API_DOCUMENTATION.md - Full reference
- API_SUMMARY.md - Quick reference
- CODE_EXAMPLES.md - Implementation examples

