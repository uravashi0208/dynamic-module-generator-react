import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Lazy import to avoid circular dependency
const refreshSidebarCount = () => {
  import('./moduleStore').then(({ default: useModuleStore }) => {
    useModuleStore.getState().fetchModules();
  });
};

const useModuleDataStore = create((set, get) => ({
  records: [],
  currentRecord: null,
  pagination: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchRecords: async (moduleSlug, page = 1, limit = 20) => {
    if (get().isLoading) return;
    // KEY FIX: Don't clear records here — keep old records visible during page transition
    // ModuleDataPage uses useTransition + prevRecordsRef to show skeleton without layout shift
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/${moduleSlug}?page=${page}&limit=${limit}`);
      set({
        records: data.data.records,
        pagination: { total: data.data.total, page: data.data.page, limit: data.data.limit },
        isLoading: false,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load records.';
      // On error: keep existing records visible, just show error toast
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchRecord: async (moduleSlug, id) => {
    set({ isLoading: true, currentRecord: null });
    try {
      const { data } = await api.get(`/${moduleSlug}/${id}`);
      set({ currentRecord: data.data.record, isLoading: false });
      return data.data.record;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'Record not found.');
      return null;
    }
  },

  createRecord: async (moduleSlug, payload) => {
    set({ isSubmitting: true });
    try {
      const { data } = await api.post(`/${moduleSlug}`, payload);
      set((state) => ({
        records: [data.data.record, ...state.records],
        pagination: state.pagination
          ? { ...state.pagination, total: state.pagination.total + 1 }
          : null,
        isSubmitting: false,
      }));
      toast.success(data.message || 'Record created.');
      refreshSidebarCount();
      return { success: true, record: data.data.record };
    } catch (error) {
      set({ isSubmitting: false });
      const message = error.response?.data?.message || 'Failed to create record.';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updateRecord: async (moduleSlug, id, payload) => {
    set({ isSubmitting: true });
    try {
      const { data } = await api.put(`/${moduleSlug}/${id}`, payload);
      set((state) => ({
        records: state.records.map((r) => (r._id === id ? data.data.record : r)),
        currentRecord: data.data.record,
        isSubmitting: false,
      }));
      toast.success(data.message || 'Record updated.');
      return { success: true, record: data.data.record };
    } catch (error) {
      set({ isSubmitting: false });
      const message = error.response?.data?.message || 'Failed to update record.';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  deleteRecord: async (moduleSlug, id) => {
    try {
      const { data } = await api.delete(`/${moduleSlug}/${id}`);
      set((state) => ({
        records: state.records.filter((r) => r._id !== id),
        pagination: state.pagination
          ? { ...state.pagination, total: Math.max(0, state.pagination.total - 1) }
          : null,
      }));
      toast.success(data.message || 'Record deleted.');
      refreshSidebarCount();
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete record.');
      return { success: false };
    }
  },

  clearRecords: () => set({ records: [], currentRecord: null, pagination: null }),
}));

export default useModuleDataStore;