import dayjs from 'dayjs';
import { Advice, AdviceStatus, Plot, WaterRecord, WeatherDay, WeatherCondition } from '@/types/farm';

// 状态视觉元信息
export const statusMeta: Record<AdviceStatus, { label: string; icon: string; color: string }> = {
  good: { label: '适合浇水', icon: '💧', color: '#00b42a' },
  none: { label: '暂不需要', icon: '🌧️', color: '#86909c' },
  light: { label: '少量补水', icon: '💦', color: '#ff7d00' },
  over: { label: '用水偏多', icon: '⚠️', color: '#f53f3f' }
};

export const weatherIcon: Record<WeatherCondition, string> = {
  sunny: '☀️',
  cloudy: '⛅',
  overcast: '☁️',
  rainy: '🌧️'
};

export const weatherText: Record<WeatherCondition, string> = {
  sunny: '晴',
  cloudy: '多云',
  overcast: '阴',
  rainy: '雨'
};

export const todayStr = (): string => dayjs().format('YYYY-MM-DD');

export const recordsOfPlotOnDate = (records: WaterRecord[], plotId: string, date: string): WaterRecord[] =>
  records.filter((r) => r.plotId === plotId && r.date === date);

/**
 * 浇水结论引擎：综合作物需水、天气、降雨、土壤湿度、当日已记录用水量
 */
export const computeAdvice = (plot: Plot, today: WeatherDay, records: WaterRecord[]): Advice => {
  const todayRecords = recordsOfPlotOnDate(records, plot.id, today.date);
  const actual = todayRecords.reduce((s, r) => s + r.amount, 0);
  const recommended = plot.dailyDemand;
  const percent = recommended > 0 ? Math.round((actual / recommended) * 100) : 0;
  const soil = plot.soilMoisture;
  const rain = today.rainfall;
  const hot = today.tempHigh >= 28;

  let status: AdviceStatus;
  let reason = '';
  let suggestion = '';

  if (actual >= recommended * 1.2) {
    status = 'over';
    reason = `今日已记录 ${actual}L，超过建议量 ${recommended}L 的 20%`;
    suggestion = '暂停浇水，观察土壤墒情，避免积水烂根与浪费';
  } else if (rain >= 10 || soil >= 70) {
    status = 'none';
    reason = rain >= 10 ? `今日降雨 ${rain}mm，墒情充足` : `土壤湿度 ${soil}%，水分充足`;
    suggestion = '无需人工浇水，雨后注意排水防涝';
  } else if (soil < 40) {
    status = 'good';
    reason = `土壤湿度仅 ${soil}%，低于适宜区间（40%-70%）${hot ? '，且今日高温蒸发快' : ''}`;
    suggestion = `建议在早晚凉爽时段浇足 ${recommended}L，优先滴灌节水`;
  } else if (soil < 55 || !hot) {
    status = 'light';
    reason = `土壤湿度 ${soil}% 处于临界区间${hot ? '，高温略有蒸发' : '，墒情尚可'}`;
    suggestion = `少量补水约 ${Math.round(recommended * 0.4)}L 即可，避免大水漫灌`;
  } else {
    status = 'good';
    reason = `高温 ${today.tempHigh}℃ 蒸发量大，土壤湿度 ${soil}% 偏干`;
    suggestion = `建议浇水 ${recommended}L，分早晚两次施用`;
  }

  const meta = statusMeta[status];
  return {
    status,
    label: meta.label,
    icon: meta.icon,
    color: meta.color,
    reason,
    suggestion,
    recommended,
    actual,
    percent
  };
};

// 土壤湿度状态色
export const soilColor = (v: number): string => {
  if (v < 40) return '#f53f3f';
  if (v < 55) return '#ff7d00';
  if (v <= 70) return '#00b42a';
  return '#1677ff';
};

export const soilLabel = (v: number): string => {
  if (v < 40) return '偏干';
  if (v < 55) return '临界';
  if (v <= 70) return '适宜';
  return '偏湿';
};
