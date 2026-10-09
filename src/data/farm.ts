import dayjs from 'dayjs';
import { Plot, WaterRecord, WeatherDay, WaterMethod, WaterSource } from '@/types/farm';

const d = (offset: number): string => dayjs().subtract(offset, 'day').format('YYYY-MM-DD');

// 3 个示例地块
export const mockPlots: Plot[] = [
  {
    id: 'p1',
    name: '东一号田',
    crop: '水稻',
    stage: '分蘖期',
    area: 12,
    soilMoisture: 36,
    lastWaterDate: d(1),
    cover: 'https://picsum.photos/id/1015/750/400',
    dailyDemand: 480
  },
  {
    id: 'p2',
    name: '南二号田',
    crop: '玉米',
    stage: '拔节期',
    area: 8,
    soilMoisture: 52,
    lastWaterDate: d(2),
    cover: 'https://picsum.photos/id/1036/750/400',
    dailyDemand: 360
  },
  {
    id: 'p3',
    name: '西三号田',
    crop: '蔬菜（番茄）',
    stage: '开花结果期',
    area: 5,
    soilMoisture: 68,
    lastWaterDate: d(0),
    cover: 'https://picsum.photos/id/1044/750/400',
    dailyDemand: 240
  }
];

// 近 30 天天气（旧→新，最后一条为今日）
const conditions: WeatherDay['condition'][] = ['sunny', 'cloudy', 'sunny', 'overcast', 'rainy', 'cloudy', 'sunny'];
export const mockWeather: WeatherDay[] = Array.from({ length: 30 }, (_, i) => {
  const c = conditions[i % conditions.length];
  const rainy = c === 'rainy';
  const base = 24 + (i % 7);
  return {
    date: d(29 - i),
    condition: c,
    tempHigh: rainy ? base - 4 : base + 4,
    tempLow: rainy ? base - 10 : base - 6,
    rainfall: rainy ? 12 + (i % 3) * 6 : i % 9 === 3 ? 4 : 0
  };
});

// 近 30 天浇水记录
const methods: WaterMethod[] = ['滴灌', '喷灌', '漫灌', '微喷'];
const sources: WaterSource[] = ['井水', '河水', '雨水', '自来水'];

const genRecords = (): WaterRecord[] => {
  const list: WaterRecord[] = [];
  mockPlots.forEach((plot, pi) => {
    for (let i = 0; i < 30; i++) {
      const day = d(29 - i);
      // 每 2~3 天浇一次，跳过部分天
      if ((i + pi) % 3 === 0) continue;
      const w = mockWeather.find((x) => x.date === day);
      // 雨天少浇或不浇
      if (w && w.rainfall >= 10 && (i + pi) % 2 === 0) continue;
      const factor = w && w.condition === 'sunny' ? 1 : 0.7;
      list.push({
        id: `r-${plot.id}-${i}`,
        plotId: plot.id,
        date: day,
        time: (i % 2 === 0 ? '07:' : '18:') + String(10 + (i % 40)).padStart(2, '0'),
        amount: Math.round(plot.dailyDemand * factor * (0.7 + ((i * 7 + pi * 3) % 10) / 25)),
        method: methods[(i + pi) % methods.length],
        source: sources[(i * 2 + pi) % sources.length],
        photo: (i + pi) % 4 === 0 ? `https://picsum.photos/id/${292 + ((i + pi) % 8) * 12}/300/300` : undefined
      });
    }
  });
  // 今日给 p1 加一条记录，体现"进行中"
  list.push({
    id: 'r-today-1',
    plotId: 'p1',
    date: d(0),
    time: '07:20',
    amount: 200,
    method: '滴灌',
    source: '井水',
    note: '早晨滴灌一轮'
  });
  return list;
};

export const mockRecords: WaterRecord[] = genRecords();
