// 农田浇水核心类型定义

export type WeatherCondition = 'sunny' | 'cloudy' | 'overcast' | 'rainy';

export interface Plot {
  id: string;
  name: string;
  crop: string;
  stage: string; // 作物生长期
  area: number; // 亩
  soilMoisture: number; // 土壤湿度 0-100
  lastWaterDate: string; // 上次浇水日期 YYYY-MM-DD
  cover: string; // 地块照片
  dailyDemand: number; // 建议日用水量 L
}

export interface WeatherDay {
  date: string;
  condition: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  rainfall: number; // mm
}

export type WaterMethod = '滴灌' | '喷灌' | '漫灌' | '微喷';
export type WaterSource = '井水' | '河水' | '雨水' | '自来水';

export interface WaterRecord {
  id: string;
  plotId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  amount: number; // L
  method: WaterMethod;
  source: WaterSource;
  photo?: string;
  note?: string;
}

export type AdviceStatus = 'good' | 'none' | 'light' | 'over';

export interface Advice {
  status: AdviceStatus;
  label: string;
  icon: string;
  color: string;
  reason: string;
  suggestion: string;
  recommended: number; // 建议用水量 L
  actual: number; // 实际记录量 L
  percent: number; // 完成比例 0-999
}
