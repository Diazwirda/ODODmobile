import { getClient } from './clients';
import { useMultiAuthStore } from '../stores/multiAuthStore';
import type { UserProfile, UpdateProfilePayload } from '../types/profile';
import type { Department } from '../types/admin';

const activeClient = () => {
  const { activeBackend } = useMultiAuthStore.getState();
  if (!activeBackend) {
    throw new Error('Belum login ke backend aktif.');
  }
  return getClient(activeBackend);
};

export const profileApi = {
  get: () => activeClient().get<UserProfile>('/profile'),

  update: (payload: UpdateProfilePayload) =>
    activeClient().put<UserProfile>('/profile', payload),

  uploadPhoto: (formData: FormData) =>
    activeClient().post<UserProfile>('/profile/photo', formData),

  deletePhoto: () => activeClient().delete('/profile/photo'),

  getDepartments: () => activeClient().get<Department[]>('/departments'),
};
