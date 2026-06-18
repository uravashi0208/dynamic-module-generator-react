import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

const useModuleStore = create((set, get) => ({
  modules: [],
  currentModule: null,
  pagination: null,
  stats: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  filters: {
    page: 1, limit: 10, search: '', isActive: undefined,
    sortBy: 'createdAt', sortOrder: 'desc',
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } }));
    get().fetchModules();
  },

  setPage: (page) => {
    set((state) => ({ filters: { ...state.filters, page } }));
    get().fetchModules();
  },

  fetchModules: async () => {
    // Prevent concurrent / duplicate calls
    if (get().isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.append(k, v);
      });

      const { data } = await api.get(`/modules?${params}`);
      set({
        modules: data.data.modules,
        pagination: data.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Server unreachable. Is backend running?';
      // Only toast if we didn't already have this error (avoid 6x toasts on navigation)
      const alreadyErrored = get().error === message;
      set({ error: message, isLoading: false });
      if (!alreadyErrored) toast.error(message);
    }
  },

  fetchModule: async (id) => {
    set({ isLoading: true, currentModule: null });
    try {
      const { data } = await api.get(`/modules/${id}`);
      set({ currentModule: data.data.module, isLoading: false });
      return data.data.module;
    } catch (error) {
      const message = error.response?.data?.message || 'Module not found.';
      set({ isLoading: false });
      toast.error(message);
      return null;
    }
  },

  createModule: async (moduleData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await api.post('/modules', moduleData);
      // ✅ Add to store immediately for instant sidebar update
      set((state) => ({
        modules: [data.data.module, ...state.modules],
        isSubmitting: false,
      }));
      toast.success(data.message);
      return { success: true, module: data.data.module };
    } catch (error) {
      set({ isSubmitting: false });
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Failed to create module.';

      // Duplicate moduleName (409) — return as field-level error so form shows inline
      if (status === 409 || message.toLowerCase().includes('already exists')) {
        return {
          success: false,
          error: message,
          fieldError: { field: 'moduleName', message: 'A module with this name already exists. Please choose a different name.' },
        };
      }

      const errors = error.response?.data?.errors;
      if (!errors) toast.error(message);
      return { success: false, error: message, errors };
    }
  },

  updateModule: async (id, moduleData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await api.put(`/modules/${id}`, moduleData);
      set((state) => ({
        modules: state.modules.map((m) => m._id === id ? data.data.module : m),
        currentModule: data.data.module,
        isSubmitting: false,
      }));
      toast.success(data.message);
      return { success: true, module: data.data.module };
    } catch (error) {
      set({ isSubmitting: false });
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Failed to update module.';

      // Duplicate moduleName (409) — return as field-level error so form shows inline
      if (status === 409 || message.toLowerCase().includes('already exists')) {
        return {
          success: false,
          error: message,
          fieldError: { field: 'moduleName', message: 'A module with this name already exists. Please choose a different name.' },
        };
      }

      const errors = error.response?.data?.errors;
      if (!errors) toast.error(message);
      return { success: false, error: message, errors };
    }
  },

  deleteModule: async (id) => {
    try {
      const { data } = await api.delete(`/modules/${id}`);
      // ✅ Remove from sidebar immediately
      set((state) => ({
        modules: state.modules.filter((m) => m._id !== id),
      }));
      toast.success(data.message);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete module.';
      toast.error(message);
      return { success: false };
    }
  },

  toggleStatus: async (id) => {
    try {
      const { data } = await api.patch(`/modules/${id}/toggle-status`);
      set((state) => ({
        modules: state.modules.map((m) =>
          m._id === id ? { ...m, isActive: data.data.isActive } : m
        ),
      }));
      toast.success(data.message);
      return { success: true };
    } catch (error) {
      toast.error('Failed to update status.');
      return { success: false };
    }
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get('/modules/stats/summary');
      set({ stats: data.data });
    } catch (_) {}
  },

  clearCurrentModule: () => set({ currentModule: null }),
}));

export default useModuleStore;