import { getClient } from './clients';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import type {
  Violation,
  UpdateViolationStatusPayload,
} from '../types/violation';
import type { PaginatedResponse } from '../types/common';

const activeClient = () => {
  const { activeBackend } = useMultiAuthStore.getState();
  if (!activeBackend) {
    throw new Error('Belum login ke backend aktif.');
  }
  return getClient(activeBackend);
};

export const violationsApi = {
  list: (page = 1) =>
    activeClient().get<PaginatedResponse<Violation>>('/violations', {
      params: { page },
    }),

  my: (page = 1) =>
    activeClient().get<PaginatedResponse<Violation>>('/violations/my', {
      params: { page },
    }),

  create: (formData: FormData) =>
    activeClient().post<Violation>('/violations', formData),

  detail: (id: number) => activeClient().get<Violation>(`/violations/${id}`),

  updateStatus: (id: number, payload: UpdateViolationStatusPayload) =>
    activeClient().patch<Violation>(`/violations/${id}/status`, payload),
};
