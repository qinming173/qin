import { create } from 'zustand';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import type { Plot, WaterRecord, DayWeather } from '@/types/watering';
import { genPlots, genRecords, genWeather, computeSoil } from '@/data/farm';

const STORAGE_KEY = 'farm_state_v1';

interface FarmState {
  plots: Plot[];
  records: WaterRecord[];
  weather: DayWeather[];
  currentPlotIndex: number;
  /** 定期提醒（小时）：距上次浇水超过 N 天提醒 */
  remindDays: number;
  anomalyAlert: boolean;
  weatherLink: boolean;

  switchPlot: (dir: 1 | -1) => void;
  setPlotIndex: (i: number) => void;
  addRecord: (r: Omit<WaterRecord, 'id'>) => void;
  addPlot: (p: Omit<Plot, 'id' | 'cover' | 'lastWateredAt' | 'soilMoisture'>) => void;
  updatePlot: (id: string, patch: Partial<Plot>) => void;
  removePlot: (id: string) => void;
  setRemindDays: (n: number) => void;
  setAnomalyAlert: (v: boolean) => void;
  setWeatherLink: (v: boolean) => void;
}

function loadInitial() {
  try {
    const cached = Taro.getStorageSync(STORAGE_KEY);
    if (cached && cached.plots?.length) {
      const weather = genWeather(30);
      return {
        plots: computeSoil(cached.plots, weather, cached.records || []),
        records: cached.records || [],
        weather,
        currentPlotIndex: 0,
        remindDays: cached.remindDays ?? 3,
        anomalyAlert: cached.anomalyAlert ?? true,
        weatherLink: cached.weatherLink ?? true,
      };
    }
  } catch (e) {
    console.error('[FarmStore] load cached failed:', e);
  }
  const plots = genPlots();
  const weather = genWeather(30);
  const records = genRecords(plots, weather);
  return {
    plots: computeSoil(plots, weather, records),
    records,
    weather,
    currentPlotIndex: 0,
    remindDays: 3,
    anomalyAlert: true,
    weatherLink: true,
  };
}

function persist(state: FarmState) {
  try {
    Taro.setStorageSync(STORAGE_KEY, {
      plots: state.plots,
      records: state.records,
      remindDays: state.remindDays,
      anomalyAlert: state.anomalyAlert,
      weatherLink: state.weatherLink,
    });
  } catch (e) {
    console.error('[FarmStore] persist failed:', e);
  }
}

const initial = loadInitial();

export const useFarmStore = create<FarmState>((set, get) => ({
  ...initial,

  switchPlot: (dir) => {
    const { plots, currentPlotIndex } = get();
    const next = (currentPlotIndex + dir + plots.length) % plots.length;
    console.info(`[FarmStore] switch plot -> index ${next}`);
    set({ currentPlotIndex: next });
  },

  setPlotIndex: (i) => set({ currentPlotIndex: i }),

  addRecord: (r) => {
    const rec: WaterRecord = { ...r, id: `r-${Date.now()}` };
    const state = get();
    const plots = state.plots.map((p) =>
      p.id === rec.plotId
        ? {
            ...p,
            lastWateredAt: dayjs().toISOString(),
            soilMoisture: Math.min(92, p.soilMoisture + Math.round(rec.amount * 2)),
          }
        : p
    );
    const records = [rec, ...state.records];
    set({ plots, records });
    persist({ ...state, plots, records });
    console.info('[FarmStore] addRecord', rec);
  },

  addPlot: (p) => {
    const state = get();
    const plot: Plot = {
      ...p,
      id: `p-${Date.now()}`,
      soilMoisture: 50,
      lastWateredAt: dayjs().subtract(2, 'day').toISOString(),
      cover: `https://picsum.photos/id/${1015 + (state.plots.length % 5)}/300/200`,
    };
    const plots = [...state.plots, plot];
    const next = { ...state, plots };
    set({ plots });
    persist(next);
    console.info('[FarmStore] addPlot', plot);
  },

  updatePlot: (id, patch) => {
    const state = get();
    const plots = state.plots.map((p) => (p.id === id ? { ...p, ...patch } : p));
    const next = { ...state, plots };
    set({ plots });
    persist(next);
  },

  removePlot: (id) => {
    const state = get();
    const plots = state.plots.filter((p) => p.id !== id);
    const currentPlotIndex = Math.min(state.currentPlotIndex, plots.length - 1);
    const next = { ...state, plots, currentPlotIndex: Math.max(0, currentPlotIndex) };
    set({ plots, currentPlotIndex: next.currentPlotIndex });
    persist(next);
  },

  setRemindDays: (n) => {
    const state = get();
    set({ remindDays: n });
    persist({ ...state, remindDays: n });
  },

  setAnomalyAlert: (v) => {
    const state = get();
    set({ anomalyAlert: v });
    persist({ ...state, anomalyAlert: v });
  },

  setWeatherLink: (v) => {
    const state = get();
    set({ weatherLink: v });
    persist({ ...state, weatherLink: v });
  },
}));
