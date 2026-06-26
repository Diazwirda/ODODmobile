import { create } from 'zustand';
import apiClient from '@api/client';
import type {
  Violation,
  CreateViolationPayload,
  UpdateViolationStatusPayload,
} from '@/types/violation';

interface ViolationStore {
  violations: Violation[];
  myReports: Violation[];
  isLoading: boolean;
  isSubmitting: boolean;

  fetchViolations: (roomId: number) => Promise<void>;
  fetchMyReports: (roomId: number) => Promise<void>;
  createViolation: (roomId: number, data: CreateViolationPayload) => Promise<void>;
  updateViolationStatus: (
    roomId: number,
    violationId: number,
    data: UpdateViolationStatusPayload
  ) => Promise<void>;
}

export const useViolationStore = create<ViolationStore>()((set) => ({
  violations: [],
  myReports: [],
  isLoading: false,
  isSubmitting: false,

  fetchViolations: async (roomId: number): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get<Violation[]>(`/rooms/${roomId}/violations`);
      set({ violations: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMyReports: async (roomId: number): Promise<void> => {
    set({ isLoading: true });
    try {
      const { data } = await apiClient.get<Violation[]>(`/rooms/${roomId}/violations/my-reports`);
      set({ myReports: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createViolation: async (roomId: number, data: CreateViolationPayload): Promise<void> => {
    set({ isSubmitting: true });
    try {
      const formData = new FormData();
      formData.append('rule_id', String(data.rule_id));
      data.violator_ids.forEach((id, i) => formData.append(`violator_ids[${i}]`, String(id)));
      if (data.description) formData.append('description', data.description);
      data.photos.forEach((photo, i) =>
        formData.append(`photos[${i}]`, {
          uri: photo.uri,
          type: photo.type,
          name: photo.name,
        } as any)
      );

      const { data: newViolation } = await apiClient.post<Violation>(
        `/rooms/${roomId}/violations`,
        formData
      );
      set((state) => ({
        violations: [newViolation, ...state.violations],
        isSubmitting: false,
      }));
    } catch (error) {
      set({ isSubmitting: false });
      throw error;
    }
  },

  updateViolationStatus: async (
    roomId: number,
    violationId: number,
    data: UpdateViolationStatusPayload
  ): Promise<void> => {
    const { data: updated } = await apiClient.patch<Violation>(
      `/rooms/${roomId}/violations/${violationId}/status`,
      data
    );
    set((state) => ({
      violations: state.violations.map((v) => (v.id === violationId ? updated : v)),
    }));
  },
}));
