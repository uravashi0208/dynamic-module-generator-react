import { create } from 'zustand';
import api from '../utils/api';

const useVisitorStore = create((set) => ({
  stats:    null,
  visitors: [],
  total:    0,
  isLoading: false,
  error:    null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get('/visitors/stats');
      set({ stats: data.data, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to load visitor stats.' });
    }
  },

  fetchVisitors: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v) query.append(k, v); });
      const { data } = await api.get(`/visitors?${query}`);
      set({ visitors: data.data.visitors, total: data.data.total, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to load visitors.' });
    }
  },
}));

export default useVisitorStore;