import dayjs from 'dayjs';
import type {
  Crop,
  DayWeather,
  GrowthStage,
  IrrigationMethod,
  Plot,
  WaterRecord,
  WaterSource,
  WeatherType,
} from '@/types/watering';

/** 作物库 */
export const CROPS: Crop[] = [
  { id: 'c1', name: '冬小麦', icon: '🌾', dailyWaterBase: 3.5 },
  { id: 'c2', name: '玉米', icon: '🌽', dailyWaterBase: 4.5 },
  { id: 'c3', name: '水稻', icon: '🌱', dailyWaterBase: 5.5 },
  { id: 'c4', name: '大白菜', icon: '🥬', dailyWaterBase: 3.0 },
  { id: 'c5', name: '番茄', icon: '🍅', dailyWaterBase: 4.0 },
];

/** 生长期名称 */
export const STAGE_NAMES: Record<GrowthStage, string> = {
  seedling: '苗期',
  jointing: '拔节期',
  heading: '抽穗期',
  maturity: '成熟期',
};

/** 生长期需水系数 */
export const STAGE_FACTOR: Record<GrowthStage, number> = {
  seedling: 0.7,
  jointing: 1.2,
  heading: 1.5,
  maturity: 0.8,
};

/** 浇水方式 */
export const METHOD_NAMES: Record<IrrigationMethod, string> = {
  drip: '滴灌',
  sprinkler: '喷灌',
  flood: '漫灌',
  spray: '浇灌',
};

/** 水源 */
export const SOURCE_NAMES: Record<WaterSource, string> = {
  well: '井水',
  canal: '渠水',
  reservoir: '水库水',
  rain: '雨水',
};

/** 天气展示 */
export const WEATHER_META: Record<WeatherType, { emoji: string; label: string }> = {
  sunny: { emoji: '☀️', label: '晴' },
  cloudy: { emoji: '⛅', label: '多云' },
  overcast: { emoji: '☁️', label: '阴' },
  rain: { emoji: '🌧️', label: '小雨' },
  'heavy-rain': { emoji: '⛈️', label: '大雨' },
};

const NATURE_IDS = [1015, 1018, 1036, 1039, 1044];

/** 确定性伪随机（保证每次加载数据一致） */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 生成近 30 天天气 */
export function genWeather(days: number): DayWeather[] {
  const rnd = mulberry32(20261008);
  const out: DayWeather[] = [];
  const today = dayjs();
  for (let i = days - 1; i >= 0; i--) {
    const d = today.subtract(i, 'day');
    const r = rnd();
    let type: WeatherType;
    if (r < 0.42) type = 'sunny';
    else if (r < 0.66) type = 'cloudy';
    else if (r < 0.78) type = 'overcast';
    else if (r < 0.93) type = 'rain';
    else type = 'heavy-rain';
    const rainfall =
      type === 'rain' ? Math.round(2 + rnd() * 8) : type === 'heavy-rain' ? Math.round(12 + rnd() * 18) : 0;
    const tempHigh = Math.round(16 + rnd() * 12 + (type === 'sunny' ? 3 : -2));
    out.push({
      date: d.format('YYYY-MM-DD'),
      type,
      tempHigh,
      tempLow: tempHigh - Math.round(6 + rnd() * 4),
      rainfall,
    });
  }
  return out;
}

/** 生成初始地块数据 */
export function genPlots(): Plot[] {
  const defs = [
    { name: '东一号田', area: 12, cropId: 'c1', stage: 'jointing' as GrowthStage, lastDays: 3 },
    { name: '河湾地', area: 8, cropId: 'c2', stage: 'heading' as GrowthStage, lastDays: 1 },
    { name: '南坡旱田', area: 15, cropId: 'c4', stage: 'seedling' as GrowthStage, lastDays: 5 },
    { name: '温室大棚', area: 3, cropId: 'c5', stage: 'maturity' as GrowthStage, lastDays: 2 },
  ];
  return defs.map((p, i) => ({
    id: `p${i + 1}`,
    name: p.name,
    area: p.area,
    cropId: p.cropId,
    stage: p.stage,
    soilMoisture: 40 + (i % 3) * 10,
    lastWateredAt: dayjs().subtract(p.lastDays, 'day').hour(8).minute(30).toISOString(),
    cover: `https://picsum.photos/id/${NATURE_IDS[i % NATURE_IDS.length]}/300/200`,
  }));
}

/** 生成近 30 天历史浇水记录 */
export function genRecords(plots: Plot[], weather: DayWeather[]): WaterRecord[] {
  const rnd = mulberry32(7788);
  const methods: IrrigationMethod[] = ['drip', 'sprinkler', 'flood', 'spray'];
  const sources: WaterSource[] = ['well', 'canal', 'reservoir'];
  const out: WaterRecord[] = [];
  plots.forEach((plot, pi) => {
    let day = 29 - Math.floor(rnd() * 3);
    while (day >= 1) {
      const d = dayjs().subtract(day, 'day');
      const hour = 6 + Math.floor(rnd() * 12);
      const minute = Math.floor(rnd() * 6) * 10;
      out.push({
        id: `r-${plot.id}-${day}`,
        plotId: plot.id,
        date: d.format('YYYY-MM-DD'),
        time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        amount: Math.round((3 + rnd() * 9) * 10) / 10,
        method: methods[Math.floor(rnd() * 4)],
        source: sources[Math.floor(rnd() * 3)],
        photo: rnd() > 0.55 ? `https://picsum.photos/id/${NATURE_IDS[(pi + day) % NATURE_IDS.length]}/200/200` : undefined,
      });
      day -= 2 + Math.floor(rnd() * 3);
    }
  });
  // 今天为第一个地块补两条记录，便于首页展示"实际记录量"
  out.push({
    id: 'r-today-1',
    plotId: plots[0].id,
    date: dayjs().format('YYYY-MM-DD'),
    time: '07:30',
    amount: 3.5,
    method: 'drip',
    source: 'well',
  });
  out.push({
    id: 'r-today-2',
    plotId: plots[0].id,
    date: dayjs().format('YYYY-MM-DD'),
    time: '16:45',
    amount: 2,
    method: 'sprinkler',
    source: 'canal',
  });
  return out.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

/** 根据近 3 天降雨与浇水推算当前土壤湿度 */
export function computeSoil(plots: Plot[], weather: DayWeather[], records: WaterRecord[]): Plot[] {
  const today = dayjs();
  return plots.map((p) => {
    const rain3 = weather
      .filter((w) => dayjs(w.date).isAfter(today.subtract(3, 'day'), 'day'))
      .reduce((s, w) => s + w.rainfall, 0);
    const water3 = records
      .filter((r) => r.plotId === p.id && dayjs(r.date).isAfter(today.subtract(3, 'day'), 'day'))
      .reduce((s, r) => s + r.amount, 0);
    const moist = Math.min(92, Math.max(12, Math.round(p.soilMoisture + rain3 * 1.6 + water3 * 1.2 - 6)));
    return { ...p, soilMoisture: moist };
  });
}
