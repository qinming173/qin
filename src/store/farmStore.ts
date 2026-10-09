import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { Plot, WaterRecord } from '@/types/farm';
import { mockPlots, mockRecords } from '@/data/farm';
import { todayStr } from '@/utils/irrigation';

const STORAGE_KEY = 'farm-water-store-v1';

interface FarmState {
  plots: Plot[];
  records: WaterRecord[];
  currentPlotIndex: number;
  hydrated: boolean;
  hydrate: () => void;
  persist: () => void;
  setCurrentPlot: (index: number) => void;
  switchPlot: (delta: number) => void;
  addRecord: (record: WaterRecord) => void;
  deleteRecord: (id: string) => void;
  addPlot: (plot: Plot) => void;
  updatePlot: (plot: Plot) => void;
  deletePlot: (id: string) => void;
}

const loadLocal = (): Partial<Pick<FarmState, 'plots' | 'records' | 'currentPlotIndex'>> => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('[FarmStore] hydrate failed:', e);
  }
  return {};
};

export const useFarmStore = create<FarmState>((set, get) => ({
  plots: mockPlots,
  records: mockRecords,
  currentPlotIndex: 0,
  hydrated: false,

  hydrate: () => {
    const saved = loadLocal();
    set({
      plots: saved.plots?.length ? saved.plots : mockPlots,
      records: saved.records?.length ? saved.records : mockRecords,
      currentPlotIndex: saved.currentPlotIndex ?? 0,
      hydrated: true
    });
  },

  persist: () => {
    try {
      const { plots, records, currentPlotIndex } = get();
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify({ plots, records, currentPlotIndex }));
    } catch (e) {
      console.error('[FarmStore] persist failed:', e);
    }
  },

  setCurrentPlot: (index) => {
    set({ currentPlotIndex: index });
    get().persist();
  },

  switchPlot: (delta) => {
    const { plots, currentPlotIndex } = get();
    const next = (currentPlotIndex + delta + plots.length) % plots.length;
    set({ currentPlotIndex: next });
    get().persist();
  },

  addRecord: (record) => {
    set((s) => ({ records: [...s.records, record] }));
    get().persist();
  },

  deleteRecord: (id) => {
    set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
    get().persist();
  },

  addPlot: (plot) => {
    set((s) => ({ plots: [...s.plots, plot] }));
    get().persist();
  },

  updatePlot: (plot) => {
    set((s) => ({ plots: s.plots.map((p) => (p.id === plot.id ? plot : p)) }));
    get().persist();
  },

  deletePlot: (id) => {
    const { plots, currentPlotIndex } = get();
    const nextPlots = plots.filter((p) => p.id !== id);
    set({
      plots: nextPlots,
      currentPlotIndex: Math.min(currentPlotIndex, Math.max(0, nextPlots.length - 1))
    });
    get().persist();
  }
}));

export const currentPlot = (): Plot => {
  const s = useFarmStore.getState();
  return s.plots[s.currentPlotIndex];
};

export const todayRecordsOfPlot = (plotId: string): WaterRecord[] =>
  useFarmStore.getState().records.filter((r) => r.plotId === plotId && r.date === todayStr());
