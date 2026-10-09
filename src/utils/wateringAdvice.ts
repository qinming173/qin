import dayjs from 'dayjs';
import type {
  DayWeather,
  Plot,
  WaterAdvice,
  WaterRecord,
} from '@/types/watering';
import { CROPS, STAGE_FACTOR } from '@/data/farm';

/** 建议用水量（吨）：作物基准 × 生长期系数 × 面积 × 天气修正 */
export function calcSuggestedAmount(
  plot: Plot,
  weather: DayWeather,
  weatherLink = true
): number {
  const crop = CROPS.find((c) => c.id === plot.cropId) || CROPS[0];
  const base = crop.dailyWaterBase * STAGE_FACTOR[plot.stage] * plot.area * 0.05;
  let factor = 1;
  if (weatherLink) {
    if (weather.type === 'sunny') factor = 1.25;
    else if (weather.type === 'cloudy') factor = 1.05;
    else if (weather.type === 'overcast') factor = 0.9;
    else if (weather.type === 'rain') factor = 0.45;
    else factor = 0.1;
  }
  // 土壤湿度修正
  const soilFactor = Math.max(0.2, 1 - plot.soilMoisture / 120);
  const v = base * factor * soilFactor;
  return Math.max(0.5, Math.round(v * 10) / 10);
}

/** 今日实际记录量（吨） */
export function calcTodayUsed(records: WaterRecord[], plotId: string): number {
  const today = dayjs().format('YYYY-MM-DD');
  return Math.round(
    records
      .filter((r) => r.plotId === plotId && r.date === today)
      .reduce((s, r) => s + r.amount, 0) * 10
  ) / 10;
}

/**
 * 浇水结论算法
 * 综合：土壤湿度、今日降雨、建议量 vs 实际量、作物需水
 */
export function getAdvice(
  plot: Plot,
  weather: DayWeather,
  records: WaterRecord[],
  weatherLink = true
): WaterAdvice {
  const suggested = calcSuggestedAmount(plot, weather, weatherLink);
  const used = calcTodayUsed(records, plot.id);
  const ratio = suggested > 0 ? used / suggested : 1;

  const rainToday = weatherLink ? weather.rainfall : 0;
  const drySoil = plot.soilMoisture < 35;
  const wetSoil = plot.soilMoisture >= 65;
  const daysSince = dayjs().diff(dayjs(plot.lastWateredAt), 'day');

  // 1. 用水偏多：实际量明显超过建议量
  if (ratio >= 1.2) {
    return {
      status: 'over',
      title: '用水偏多',
      reason: `今日已记录 ${used} 吨，超出建议量 ${suggested} 吨，土壤水分已充足`,
      suggestion: '暂停浇水，观察土壤墒情，避免积水烂根与水资源浪费',
      suggestedAmount: suggested,
    };
  }

  // 2. 暂不需要：有效降雨或土壤过湿
  if (rainToday >= 10 || (wetSoil && ratio >= 0.8)) {
    return {
      status: 'none',
      title: '暂不需要浇水',
      reason: rainToday >= 10
        ? `今日降雨 ${rainToday}mm，自然补水已满足作物需求`
        : `土壤湿度 ${plot.soilMoisture}%，墒情良好，无需额外补水`,
      suggestion: '今日无需浇水，注意雨后排水防涝',
      suggestedAmount: suggested,
    };
  }

  // 3. 适合浇水：土壤偏干且尚未浇够
  if (drySoil || (ratio < 0.8 && daysSince >= 2)) {
    return {
      status: 'good',
      title: '适合浇水',
      reason: drySoil
        ? `土壤湿度仅 ${plot.soilMoisture}%，低于适宜区间，作物需水明显`
        : `距上次浇水已 ${daysSince} 天，今日建议补水 ${suggested} 吨`,
      suggestion: `建议今日 ${weather.type === 'sunny' ? '早晚时段' : '上午'}完成浇水，目标 ${suggested} 吨`,
      suggestedAmount: suggested,
    };
  }

  // 4. 少量补水：墒情尚可，完成剩余量即可
  return {
    status: 'light',
    title: '少量补水',
    reason: `土壤湿度 ${plot.soilMoisture}% 处于适中区间，今日已完成 ${Math.round(ratio * 100)}%`,
    suggestion: `补足剩余约 ${Math.max(0.5, Math.round((suggested - used) * 10) / 10)} 吨即可，避免过量`,
    suggestedAmount: suggested,
  };
}

/** 状态视觉映射 */
export const STATUS_META: Record<
  WaterAdvice['status'],
  { color: string; bg: string; emoji: string; label: string }
> = {
  good: { color: '#2f9e44', bg: '#e6f6ea', emoji: '💧', label: '适合浇水' },
  none: { color: '#1c7ed6', bg: '#e3f1fd', emoji: '🌧️', label: '暂不需要' },
  light: { color: '#f59f00', bg: '#fdf3e0', emoji: '🌤️', label: '少量补水' },
  over: { color: '#e03131', bg: '#fdebec', emoji: '⚠️', label: '用水偏多' },
};
