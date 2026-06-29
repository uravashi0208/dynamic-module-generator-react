import { create } from 'zustand';
import api from '../utils/api';

const usePageVisitStore = create((set, get) => ({
  visits:    [],
  summary:   null,
  total:     0,
  isLoading: false,
  error:     null,

  // Fetch paginated list (used by PageVisitsPage)
  fetchVisits: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') query.append(k, v);
      });
      const { data } = await api.get(`/page-visits?${query}`);
      set({
        visits:    data.data.visits,
        total:     data.data.total,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.message || 'Failed to load page visits.' });
    }
  },

  // Fetch summary totals (used by dashboard widget preview + PageVisitsPage cards)
  fetchSummary: async () => {
    try {
      const { data } = await api.get('/page-visits/summary');
      set({ summary: data.data });
    } catch (_) {}
  },

  // Top N visits for dashboard widget (just first page sorted by views)
  fetchTop: async (limit = 5) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/page-visits?limit=${limit}&sortBy=views&sortOrder=desc`);
      set({ visits: data.data.visits, isLoading: false });
    } catch (_) {
      set({ isLoading: false });
    }
  },
}));

export default usePageVisitStore;