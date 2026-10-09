import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { mockWeather } from '@/data/farm';
import { weatherIcon, weatherText, soilColor, soilLabel, todayStr } from '@/utils/irrigation';
import TrendChart, { TrendPoint } from '@/components/TrendChart';

const TrendPage: React.FC = () => {
  const { plots, records, currentPlotIndex, hydrate, switchPlot } = useFarmStore();
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    hydrate();
  }, []);
  useDidShow(() => hydrate());

  const plot = plots[currentPlotIndex];
  const today = todayStr();

  const trendData: TrendPoint[] = useMemo(() => {
    if (!plot) return [];
    const days: TrendPoint[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const water = records
        .filter((r) => r.plotId === plot.id && r.date === date)
        .reduce((s, r) => s + r.amount, 0);
      const w = mockWeather.find((x) => x.date === date);
      days.push({ label: dayjs(date).format('M/D'), water, rain: w ? w.rainfall : 0 });
    }
    return days;
  }, [plot, records, range]);

  const stats = useMemo(() => {
    const total = trendData.reduce((s, d) => s + d.water, 0);
    const avg = trendData.length ? Math.round(total / trendData.length) : 0;
    const rainTotal = trendData.reduce((s, d) => s + d.rain, 0);
    return { total, avg, rainTotal };
  }, [trendData]);

  // 未来/近期天气（取最近 5 天）
  const weatherDays = useMemo(() => {
    return mockWeather.slice(-5);
  }, []);

  if (!plot) return <View className={styles.page} />;

  return (
    <View className={styles.page}>
      {/* 地块切换 */}
      <View className={styles.card}>
        <View className={styles.cardHead} style={{ marginBottom: 0 }}>
          <View className={styles.arrowBtn} onClick={() => switchPlot(-1)}>
            <Text className={styles.arrow}>‹</Text>
          </View>
          <Text className={styles.cardTitle}>
            {plot.name} · {plot.crop}
          </Text>
          <View className={styles.arrowBtn} onClick={() => switchPlot(1)}>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
      </View>

      {/* 用水趋势 */}
      <View className={styles.card}>
        <View className={styles.cardHead}>
          <Text className={styles.cardTitle}>用水量与降雨趋势</Text>
          <View className={styles.tabs}>
            <View
              className={classnames(styles.tab, range === 7 && styles.tabActive)}
              onClick={() => setRange(7)}
            >
              <Text className={classnames(styles.tabText, range === 7 && styles.tabTextActive)}>近7天</Text>
            </View>
            <View
              className={classnames(styles.tab, range === 30 && styles.tabActive)}
              onClick={() => setRange(30)}
            >
              <Text className={classnames(styles.tabText, range === 30 && styles.tabTextActive)}>近30天</Text>
            </View>
          </View>
        </View>

        <View className={styles.statGrid}>
          <View className={styles.statCell}>
            <Text className={styles.statValue} style={{ color: '#1677ff' }}>
              {stats.total}
            </Text>
            <Text className={styles.statLabel}>累计用水(L)</Text>
          </View>
          <View className={styles.statCell}>
            <Text className={styles.statValue}>{stats.avg}</Text>
            <Text className={styles.statLabel}>日均用水(L)</Text>
          </View>
          <View className={styles.statCell}>
            <Text className={styles.statValue} style={{ color: '#8e9bff' }}>
              {stats.rainTotal}
            </Text>
            <Text className={styles.statLabel}>累计降雨(mm)</Text>
          </View>
        </View>

        <TrendChart data={trendData} compact={range === 30} height={280} />
      </View>

      {/* 天气关联 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle} style={{ display: 'block', marginBottom: '24rpx' }}>
          天气关联
        </Text>
        <View className={styles.weatherList}>
          {weatherDays.map((w) => (
            <View
              key={w.date}
              className={classnames(styles.weatherItem, w.date === today && styles.weatherItemToday)}
            >
              <Text className={styles.weatherDay}>
                {w.date === today ? '今天' : dayjs(w.date).format('M/D')}
              </Text>
              <Text className={styles.weatherEmoji}>{weatherIcon[w.condition]}</Text>
              <Text className={styles.weatherTemp}>{weatherText[w.condition]}</Text>
              <Text className={styles.weatherTemp}>
                {w.tempLow}~{w.tempHigh}℃
              </Text>
              <Text className={styles.weatherRain}>{w.rainfall > 0 ? `${w.rainfall}mm` : '无雨'}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 土壤与作物状态 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle} style={{ display: 'block', marginBottom: '24rpx' }}>
          土壤与作物状态
        </Text>
        <View className={styles.moistureRow}>
          <Text className={styles.moistureLabel}>🌱 土壤湿度</Text>
          <View className={styles.moistureTrack}>
            <View
              className={styles.moistureFill}
              style={{
                width: `${plot.soilMoisture}%`,
                background: soilColor(plot.soilMoisture)
              }}
            />
          </View>
          <Text className={styles.moistureValue} style={{ color: soilColor(plot.soilMoisture) }}>
            {plot.soilMoisture}% {soilLabel(plot.soilMoisture)}
          </Text>
        </View>
        <View className={styles.moistureRow} style={{ marginBottom: 0 }}>
          <Text className={styles.moistureLabel}>🌾 生长期</Text>
          <Text className={styles.moistureValue} style={{ width: 'auto', color: '#1d2129' }}>
            {plot.stage}
          </Text>
        </View>
        <View className={styles.moistureRow} style={{ marginBottom: 0, marginTop: '24rpx' }}>
          <Text className={styles.moistureLabel}>🕐 上次浇水</Text>
          <Text className={styles.moistureValue} style={{ width: 'auto', color: '#1d2129' }}>
            {plot.lastWaterDate === today ? '今天' : plot.lastWaterDate}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TrendPage;
