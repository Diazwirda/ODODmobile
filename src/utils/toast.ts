import { Alert } from 'react-native';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types/common';

export function showToast(title: string, message?: string): void {
  Alert.alert(title, message);
}

export function handleApiError(error: unknown): string {
  const axiosError = error as AxiosError<ApiError>;

  if (!axiosError.response) {
    return 'Tidak ada koneksi internet. Periksa jaringan Anda.';
  }

  const { status, data } = axiosError.response;

  switch (status) {
    case 401:
      return 'Sesi Anda telah berakhir. Silakan login kembali.';
    case 403:
      return 'Anda tidak memiliki akses untuk melakukan aksi ini.';
    case 404:
      return 'Data yang diminta tidak ditemukan.';
    case 409:
      return 'Room aktif belum dipilih.';
    case 422: {
      if (data?.errors) {
        const firstField = Object.values(data.errors)[0];
        if (firstField && firstField.length > 0) {
          return firstField[0];
        }
      }
      return data?.message ?? 'Data yang Anda masukkan tidak valid.';
    }
    case 502:
      return 'Server sedang bermasalah. Silakan coba lagi beberapa saat lagi.';
    default:
      return data?.message ?? 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

export function getValidationErrors(
  error: unknown,
): Record<string, string> | null {
  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
    const result: Record<string, string> = {};
    for (const [field, messages] of Object.entries(
      axiosError.response.data.errors,
    )) {
      result[field] = messages[0];
    }
    return result;
  }
  return null;
}
