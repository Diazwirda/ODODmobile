import { getClient } from './clients';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import type { Rule, CreateRulePayload } from '../types/rule';

const activeClient = () => {
  const { activeBackend } = useMultiAuthStore.getState();
  if (!activeBackend) {
    throw new Error('Belum login ke backend aktif.');
  }
  return getClient(activeBackend);
};

export const rulesApi = {
  list: (params?: { page?: number; per_page?: number }) => 
    activeClient().get<Rule[]>('/rules', { params }),

  create: (payload: CreateRulePayload) =>
    activeClient().post<Rule>('/admin/rules', payload),

  update: (id: number, payload: Partial<CreateRulePayload>) =>
    activeClient().put<Rule>(`/admin/rules/${id}`, payload),

  delete: (id: number) => activeClient().delete(`/admin/rules/${id}`),
};
