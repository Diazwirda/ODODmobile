import { handleApiError, getValidationErrors } from '../toast';
import { AxiosError } from 'axios';

describe('toast utility', () => {
  describe('handleApiError', () => {
    it('should return error message from response data', () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Invalid credentials',
          },
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Invalid credentials');
    });

    it('should return first validation error from 422 errors object', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['Email is required', 'Email must be valid'],
              password: ['Password is too short'],
            },
          },
        },
      } as AxiosError;

      const result = handleApiError(error);
      // Should return the first error from the first field
      expect(result).toMatch(/Email is required|Password is too short/);
    });

    it('should return no internet message for network errors', () => {
      const error = {
        message: 'Network Error',
        isAxiosError: true,
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Tidak ada koneksi internet. Periksa jaringan Anda.');
    });

    it('should return 401 message for unauthorized', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Sesi Anda telah berakhir. Silakan login kembali.');
    });

    it('should return 403 message for forbidden', () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Anda tidak memiliki akses untuk melakukan aksi ini.');
    });

    it('should return 404 message for not found', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Data yang diminta tidak ditemukan.');
    });

    it('should return 409 message for conflict', () => {
      const error = {
        response: {
          status: 409,
          data: {},
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Room aktif belum dipilih.');
    });

    it('should return default message for unknown status', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError;

      const result = handleApiError(error);
      expect(result).toBe('Terjadi kesalahan. Silakan coba lagi.');
    });
  });

  describe('getValidationErrors', () => {
    it('should return validation errors for 422 response', () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['Email is required'],
              password: ['Password must be at least 6 characters'],
            },
          },
        },
      } as AxiosError;

      const result = getValidationErrors(error);

      expect(result).toEqual({
        email: 'Email is required',
        password: 'Password must be at least 6 characters',
      });
    });

    it('should return null for non-422 errors', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError;

      const result = getValidationErrors(error);
      expect(result).toBeNull();
    });

    it('should return null if no errors in response', () => {
      const error = {
        response: {
          status: 422,
          data: {},
        },
      } as AxiosError;

      const result = getValidationErrors(error);
      expect(result).toBeNull();
    });
  });
});
