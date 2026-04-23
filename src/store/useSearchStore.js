import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSearchStore = create(
  persist(
    (set) => ({
      filters: {
        price: { min: 0, max: 100000 },
        brand: [],
        fuel: [],
        year: { min: 1990, max: new Date().getFullYear() },
        tireSize: { width: '', ratio: '', diameter: '' }
      },
      searchMode: 'advanced', // 'advanced' ali 'tires'
      
      setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
      
      resetFilters: () => set({
        filters: { 
          price: { min: 0, max: 100000 }, 
          brand: [], 
          fuel: [], 
          year: { min: 1990, max: new Date().getFullYear() }, 
          tireSize: { width: '', ratio: '', diameter: '' }
        }
      }),
      
      setSearchMode: (mode) => set({ searchMode: mode }),

      viewMode: 'list',
      setViewMode: (mode) => set({ viewMode: mode })
    }),
    {
      name: 'mojavto-search-storage',
    }
  )
);
