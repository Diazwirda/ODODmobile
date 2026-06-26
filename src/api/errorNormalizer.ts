import type { AxiosError } from 'axios';
import type { NormalizedError } from '../types/common';

/**
 * Normalizes an AxiosError into a user-friendly NormalizedError.
 *
 * Status code → Indonesian message mapping:
 *   401 — session expired
 *   403 — forbidden
 *   404 — not found
 *   422 — validation failed (uses server message when available)
 *   502 — server error
 *   null — network / no connection
 */
export function normalizeError(error: AxiosError): NormalizedError {
  const status = error.response?.status ?? null;
  const data = error.response?.data as Record<string, unknown> | undefined;

  const messageMap: Record<number, string> = {
    401: 'Sesi Anda telah berakhir. Silakan login kembali.',
    403: 'Anda tidak memiliki akses untuk melakukan aksi ini.',
    404: 'Data yang diminta tidak ditemukan.',
    422:
      typeof data?.message === 'string'
        ? data.message
        : 'Data yang dikirimkan tidak valid.',
    502: 'Server sedang bermasalah. Silakan coba lagi beberapa saat lagi.',
  };

  const message = status
    ? (messageMap[status] ?? 'Terjadi kesalahan yang tidak terduga.')
    : 'Tidak ada koneksi internet. Periksa jaringan Anda.';

  const validationErrors =
    data?.errors != null &&
    typeof data.errors === 'object' &&
    !Array.isArray(data.errors)
      ? (data.errors as Record<string, string[]>)
      : null;

  return {
    message,
    statusCode: status,
    validationErrors,
  };
}
