# Code Examples untuk Mobile App Integration

## 📱 Flutter Examples

### 1. API Service Setup

```dart
// services/apiService.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://spot.slimrich.id/api';
  // static const String baseUrl = 'http://localhost:8000/api'; // For development
  late Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add JWT token
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        // Add room context
        final roomId = await _storage.read(key: 'active_room_id');
        if (roomId != null) {
          options.headers['X-Room-Id'] = roomId;
        }
        
        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 - Token expired
        if (error.response?.statusCode == 401) {
          await _storage.delete(key: 'jwt_token');
          // Navigate to login (implement your navigation logic)
        }
        
        return handler.next(error);
      },
    ));
  }
  
  Dio get dio => _dio;
}
```

### 2. Authentication Service

```dart
// lib/services/auth_service.dart
import 'package:dio/dio.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      
      final token = response.data['token'];
      final user = response.data['user'];
      
      // Save token
      await _storage.write(key: 'jwt_token', value: token);
      
      return {
        'success': true,
        'user': user,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Login failed',
      };
    }
  }
  
  // Register
  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String passwordConfirmation,
    String? department,
    String? position,
  }) async {
    try {
      final response = await _apiService.dio.post('/auth/register', data: {
        'name': name,
        'email': email,
        'password': password,
        'password_confirmation': passwordConfirmation,
        'department': department,
        'position': position,
      });
      
      final token = response.data['token'];
      await _storage.write(key: 'jwt_token', value: token);
      
      return {
        'success': true,
        'user': response.data['user'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Registration failed',
        'errors': e.response?.data['errors'],
      };
    }
  }
  
  // Get current user
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final response = await _apiService.dio.get('/auth/me');
      return response.data;
    } catch (e) {
      return null;
    }
  }
  
  // Logout
  Future<void> logout() async {
    try {
      await _apiService.dio.post('/auth/logout');
    } finally {
      await _storage.delete(key: 'jwt_token');
      await _storage.delete(key: 'active_room_id');
    }
  }
}
```

### 3. Room Service

```dart
// lib/services/room_service.dart
class RoomService {
  final ApiService _apiService = ApiService();
  
  // Get all rooms
  Future<List<dynamic>> getRooms() async {
    try {
      final response = await _apiService.dio.get('/rooms');
      return response.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }
  
  // Create room
  Future<Map<String, dynamic>> createRoom({
    required String name,
    String? description,
    File? logo,
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'name': name,
        'description': description,
      });
      
      if (logo != null) {
        formData.files.add(MapEntry(
          'logo',
          await MultipartFile.fromFile(logo.path),
        ));
      }
      
      final response = await _apiService.dio.post('/rooms', data: formData);
      
      return {
        'success': true,
        'room': response.data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Failed to create room',
      };
    }
  }
  
  // Join room
  Future<Map<String, dynamic>> joinRoom(String code) async {
    try {
      final response = await _apiService.dio.post('/rooms/join', data: {
        'code': code,
      });
      
      return {
        'success': true,
        'room': response.data['room'],
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Failed to join room',
      };
    }
  }
}
```


### 4. Violation Service

```dart
// lib/services/violation_service.dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:image/image.dart' as img;

class ViolationService {
  final ApiService _apiService = ApiService();
  
  // Get users for violation report
  Future<List<dynamic>> getUsers() async {
    try {
      final response = await _apiService.dio.get('/users');
      return response.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }
  
  // Get rules
  Future<List<dynamic>> getRules() async {
    try {
      final response = await _apiService.dio.get('/rules');
      return response.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }
  
  // Compress image
  Future<File> compressImage(File file) async {
    final image = img.decodeImage(file.readAsBytesSync());
    if (image == null) return file;
    
    // Resize if too large
    img.Image resized = image;
    if (image.width > 1920 || image.height > 1080) {
      resized = img.copyResize(image, width: 1920);
    }
    
    // Compress
    final compressed = img.encodeJpg(resized, quality: 85);
    
    // Save to temp file
    final tempFile = File('${file.path}_compressed.jpg');
    await tempFile.writeAsBytes(compressed);
    
    return tempFile;
  }
  
  // Create violation report
  Future<Map<String, dynamic>> createViolation({
    required int ruleId,
    required List<int> violatorIds,
    String? description,
    required List<File> photos,
  }) async {
    try {
      FormData formData = FormData.fromMap({
        'rule_id': ruleId,
        'description': description,
      });
      
      // Add violator IDs
      for (var id in violatorIds) {
        formData.fields.add(MapEntry('violator_ids[]', id.toString()));
      }
      
      // Compress and add photos
      for (var photo in photos) {
        final compressed = await compressImage(photo);
        formData.files.add(MapEntry(
          'photos[]',
          await MultipartFile.fromFile(compressed.path),
        ));
      }
      
      final response = await _apiService.dio.post('/violations', data: formData);
      
      return {
        'success': true,
        'violation': response.data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Failed to create violation',
        'errors': e.response?.data['errors'],
      };
    }
  }
  
  // Get my reports
  Future<List<dynamic>> getMyReports() async {
    try {
      final response = await _apiService.dio.get('/violations/my');
      return response.data as List<dynamic>;
    } catch (e) {
      return [];
    }
  }
  
  // Update violation status (admin only)
  Future<Map<String, dynamic>> updateViolationStatus({
    required int violationId,
    required String status,
    String? rejectReason,
  }) async {
    try {
      final response = await _apiService.dio.patch(
        '/admin/violations/$violationId/status',
        data: {
          'status': status,
          'reject_reason': rejectReason,
        },
      );
      
      return {
        'success': true,
        'violation': response.data,
      };
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'Failed to update status',
      };
    }
  }
}
```

### 5. Leaderboard Service

```dart
// lib/services/leaderboard_service.dart
class LeaderboardService {
  final ApiService _apiService = ApiService();
  
  // Get leaderboard
  Future<Map<String, dynamic>> getLeaderboard({
    String period = 'all-time',
    String department = 'all',
    String? search,
    int page = 1,
    int perPage = 10,
    String sort = 'desc',
    Map<String, dynamic>? periodParams,
  }) async {
    try {
      Map<String, dynamic> queryParams = {
        'period': period,
        'department': department,
        'page': page,
        'per_page': perPage,
        'sort': sort,
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      
      // Add period-specific params
      if (periodParams != null) {
        queryParams.addAll(periodParams);
      }
      
      final response = await _apiService.dio.get(
        '/dashboard/leaderboard',
        queryParameters: queryParams,
      );
      
      return response.data;
    } catch (e) {
      return {
        'data': [],
        'current_page': 1,
        'last_page': 1,
        'total': 0,
      };
    }
  }
  
  // Get statistics
  Future<Map<String, dynamic>> getStats() async {
    try {
      final response = await _apiService.dio.get('/dashboard/stats');
      return response.data;
    } catch (e) {
      return {
        'reports_today': 0,
        'reports_this_week': 0,
        'total_violation': 0,
        'total_points_log': 0,
        'departments': [],
      };
    }
  }
}
```

### 6. Login Screen Example

```dart
// lib/screens/login_screen.dart
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  
  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    final result = await _authService.login(
      _emailController.text,
      _passwordController.text,
    );
    
    setState(() => _isLoading = false);
    
    if (result['success']) {
      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'])),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  hintText: 'user@humanplus.co.id',
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Email wajib diisi';
                  }
                  if (!value.contains('@humanplus.co.id')) {
                    return 'Gunakan email @humanplus.co.id';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Password wajib diisi';
                  }
                  if (value.length < 8) {
                    return 'Password minimal 8 karakter';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              _isLoading
                  ? CircularProgressIndicator()
                  : ElevatedButton(
                      onPressed: _login,
                      child: Text('Login'),
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(double.infinity, 50),
                      ),
                    ),
              SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(context, '/register');
                },
                child: Text('Belum punya akun? Daftar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```


---

## 📱 React Native Examples

### 1. API Service Setup

```javascript
// services/apiService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://spot.slimrich.id/api';
// const API_BASE_URL = 'http://localhost:8000/api'; // For development

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Add JWT token
    const token = await AsyncStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add room context
    const roomId = await AsyncStorage.getItem('active_room_id');
    if (roomId) {
      config.headers['X-Room-Id'] = roomId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired
      await AsyncStorage.removeItem('jwt_token');
      // Navigate to login (implement your navigation logic)
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Authentication Service

```javascript
// services/authService.js
import apiClient from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    const { token, user } = response.data;
    
    // Save token
    await AsyncStorage.setItem('jwt_token', token);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Login failed',
    };
  }
};

export const register = async (data) => {
  try {
    const response = await apiClient.post('/auth/register', data);
    
    const { token, user } = response.data;
    await AsyncStorage.setItem('jwt_token', token);
    
    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Registration failed',
      errors: error.response?.data?.errors,
    };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    await AsyncStorage.removeItem('jwt_token');
    await AsyncStorage.removeItem('active_room_id');
  }
};
```

### 3. Violation Service

```javascript
// services/violationService.js
import apiClient from './apiService';
import ImageResizer from 'react-native-image-resizer';

export const getUsers = async () => {
  try {
    const response = await apiClient.get('/users');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getRules = async () => {
  try {
    const response = await apiClient.get('/rules');
    return response.data;
  } catch (error) {
    return [];
  }
};

// Compress image
const compressImage = async (imageUri) => {
  try {
    const resized = await ImageResizer.createResizedImage(
      imageUri,
      1920, // maxWidth
      1080, // maxHeight
      'JPEG',
      85, // quality
      0, // rotation
    );
    return resized.uri;
  } catch (error) {
    return imageUri;
  }
};

export const createViolation = async (data) => {
  try {
    const formData = new FormData();
    
    formData.append('rule_id', data.ruleId);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Add violator IDs
    data.violatorIds.forEach((id) => {
      formData.append('violator_ids[]', id);
    });
    
    // Compress and add photos
    for (let photo of data.photos) {
      const compressed = await compressImage(photo.uri);
      formData.append('photos[]', {
        uri: compressed,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
    }
    
    const response = await apiClient.post('/violations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return {
      success: true,
      violation: response.data,
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to create violation',
      errors: error.response?.data?.errors,
    };
  }
};

export const getMyReports = async () => {
  try {
    const response = await apiClient.get('/violations/my');
    return response.data;
  } catch (error) {
    return [];
  }
};
```

### 4. Login Screen Example

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { login } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password wajib diisi');
      return;
    }
    
    if (!email.endsWith('@humanplus.co.id')) {
      Alert.alert('Error', 'Gunakan email @humanplus.co.id');
      return;
    }
    
    setLoading(true);
    
    const result = await login(email, password);
    
    setLoading(false);
    
    if (result.success) {
      navigation.replace('Home');
    } else {
      Alert.alert('Login Gagal', result.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Belum punya akun? Daftar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 15,
  },
});

export default LoginScreen;
```


### 5. Create Violation Screen Example

```javascript
// screens/CreateViolationScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { getRules, getUsers, createViolation } from '../services/violationService';

const CreateViolationScreen = ({ navigation }) => {
  const [rules, setRules] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);
  const [selectedViolators, setSelectedViolators] = useState([]);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    const [rulesData, usersData] = await Promise.all([
      getRules(),
      getUsers(),
    ]);
    setRules(rulesData);
    setUsers(usersData);
  };
  
  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Maksimal 3 Foto', 'Anda hanya bisa upload maksimal 3 foto');
      return;
    }
    
    try {
      const image = await ImagePicker.openPicker({
        width: 1920,
        height: 1080,
        cropping: true,
        compressImageQuality: 0.85,
      });
      
      setPhotos([...photos, image]);
    } catch (error) {
      // User cancelled
    }
  };
  
  const takePhoto = async () => {
    if (photos.length >= 3) {
      Alert.alert('Maksimal 3 Foto', 'Anda hanya bisa upload maksimal 3 foto');
      return;
    }
    
    try {
      const image = await ImagePicker.openCamera({
        width: 1920,
        height: 1080,
        cropping: true,
        compressImageQuality: 0.85,
      });
      
      setPhotos([...photos, image]);
    } catch (error) {
      // User cancelled
    }
  };
  
  const toggleViolator = (userId) => {
    if (selectedViolators.includes(userId)) {
      setSelectedViolators(selectedViolators.filter(id => id !== userId));
    } else {
      setSelectedViolators([...selectedViolators, userId]);
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedRule) {
      Alert.alert('Error', 'Pilih jenis lupa terlebih dahulu');
      return;
    }
    
    if (photos.length === 0) {
      Alert.alert('Error', 'Upload minimal 1 foto');
      return;
    }
    
    setLoading(true);
    
    const result = await createViolation({
      ruleId: selectedRule,
      violatorIds: selectedViolators,
      description,
      photos,
    });
    
    setLoading(false);
    
    if (result.success) {
      Alert.alert('Berhasil', 'Laporan berhasil dibuat', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Gagal', result.message);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Pilih Jenis Lupa</Text>
      <FlatList
        data={rules}
        horizontal
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.ruleItem,
              selectedRule === item.id && styles.ruleItemSelected,
            ]}
            onPress={() => setSelectedRule(item.id)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      
      <Text style={styles.sectionTitle}>Pilih Pelanggar</Text>
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => toggleViolator(item.id)}
          >
            <Text>{item.name}</Text>
            <Text style={styles.checkbox}>
              {selectedViolators.includes(item.id) ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
      
      <Text style={styles.sectionTitle}>Upload Foto ({photos.length}/3)</Text>
      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Text>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          <Text>Galeri</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={photos}
        horizontal
        renderItem={({ item, index }) => (
          <View style={styles.photoPreview}>
            <Image source={{ uri: item.path }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removePhoto}
              onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
            >
              <Text style={styles.removePhotoText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      
      <TextInput
        style={styles.textarea}
        placeholder="Deskripsi (opsional)"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Mengirim...' : 'Kirim Laporan'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  ruleItem: {
    padding: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  ruleItemSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  checkbox: {
    fontSize: 20,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  photoPreview: {
    position: 'relative',
    marginRight: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhoto: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: 'white',
    fontWeight: 'bold',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateViolationScreen;
```

---

## 🔧 Utility Functions

### Image Compression

```javascript
// utils/imageCompression.js

// For React Native
import ImageResizer from 'react-native-image-resizer';

export const compressImage = async (imageUri) => {
  try {
    const resized = await ImageResizer.createResizedImage(
      imageUri,
      1920, // maxWidth
      1080, // maxHeight
      'JPEG',
      85, // quality
      0, // rotation
    );
    return resized.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return imageUri;
  }
};
```

```dart
// For Flutter
// utils/image_compression.dart
import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';

Future<File?> compressImage(File file) async {
  try {
    final result = await FlutterImageCompress.compressAndGetFile(
      file.absolute.path,
      '${file.absolute.path}_compressed.jpg',
      quality: 85,
      minWidth: 1920,
      minHeight: 1080,
    );
    return result;
  } catch (e) {
    print('Error compressing image: $e');
    return file;
  }
}
```

### Error Handler

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        return 'Sesi Anda telah berakhir. Silakan login kembali.';
      case 403:
        return 'Anda tidak memiliki akses untuk melakukan ini.';
      case 404:
        return 'Data tidak ditemukan.';
      case 422:
        if (data.errors) {
          const errors = Object.values(data.errors).flat();
          return errors.join('\n');
        }
        return data.message || 'Data tidak valid.';
      case 500:
        return 'Terjadi kesalahan pada server. Silakan coba lagi.';
      case 502:
        return 'Server sedang bermasalah. Silakan coba lagi nanti.';
      default:
        return data.message || 'Terjadi kesalahan. Silakan coba lagi.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  } else {
    // Something else happened
    return 'Terjadi kesalahan. Silakan coba lagi.';
  }
};
```

---

**Happy Coding! 🚀**

