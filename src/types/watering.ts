// 农田浇水助手核心类型定义

/** 浇水结论状态 */
export type AdviceStatus = 'good' | 'none' | 'light' | 'over';

/** 浇水方式 */
export type IrrigationMethod = 'drip' | 'sprinkler' | 'flood' | 'spray';

/** 水源 */
export type WaterSource = 'well' | 'canal' | 'reservoir' | 'rain';

/** 天气类型 */
export type WeatherType = 'sunny' | 'cloudy' | 'overcast' | 'rain' | 'heavy-rain';

/** 作物生长期 */
export type GrowthStage = 'seedling' | 'jointing' | 'heading' | 'maturity';

/** 作物类型 */
export interface Crop {
  id: string;
  name: string;
  icon: string;
  /** 每日需水基准 L/㎡ */
  dailyWaterBase: number;
}

/** 地块 */
export interface Plot {
  id: string;
  name: string;
  area: number; // 亩
  cropId: string;
  stage: GrowthStage;
  soilMoisture: number; // 0-100
  lastWateredAt: string; // ISO
  cover: string; // 图片 URL
}

/** 每日天气 */
export interface DayWeather {
  date: string; // YYYY-MM-DD
  type: WeatherType;
  tempHigh: number;
  tempLow: number;
  rainfall: number; // mm
}

/** 浇水记录 */
export interface WaterRecord {
  id: string;
  plotId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  amount: number; // 吨
  method: IrrigationMethod;
  source: WaterSource;
  photo?: string;
  note?: string;
}

/** 浇水结论 */
export interface WaterAdvice {
  status: AdviceStatus;
  title: string;
  reason: string;
  suggestion: string;
  /** 建议用水量(吨) */
  suggestedAmount: number;
}

/** 趋势单日数据 */
export interface TrendDay {
  date: string;
  label: string; // MM-DD
  usage: number; // 吨
  rainfall: number; // mm
  soilMoisture: number;
}
