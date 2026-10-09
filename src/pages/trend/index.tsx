import React, { useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import BarChart from '@/components/BarChart';
import SectionCard from '@/components/SectionCard';
import { CROPS, STAGE_NAMES } from '@/data/farm';

function TrendPage() {
  const { plots, records, weather, currentPlotIndex } = useFarmStore();
  const [days, setDays] = useState<7 | 30>(7);
  const [plotIndex, setPlotIndex] = useState(currentPlotIndex);

  const plot = plots[plotIndex];
  const crop = CROPS.find((c) => c.id === plot?.cropId) || CROPS[0];

  const trendData = useMemo(() => {
    if (!plot) return [];
    const slice = weather.slice(-days);
    return slice.map((w) => {
      const usage =
        Math.round(
          records
            .filter((r) => r.plotId === plot.id && r.date === w.date)
            .reduce((s, r) => s + r.amount, 0) * 10
        ) / 10;
      return {
        date: w.date,
        label: dayjs(w.date).format('MM-DD'),
        usage,
        rainfall: w.rainfall,
        soilMoisture: plot.soilMoisture,
      };
    });
  }, [weather, records, plot, days]);

  const totalUsage = useMemo(
    () => Math.round(trendData.reduce((s, d) => s + d.usage, 0) * 10) / 10,
    [trendData]
  );
  const totalRain = useMemo(
    () => Math.round(trendData.reduce((s, d) => s + d.rainfall, 0)),
    [trendData]
  );
  const avgDaily = trendData.length
    ? Math.round((totalUsage / trendData.length) * 10) / 10
    : 0;

  const moistLevel =
    (plot?.soilMoisture || 0) < 35
      ? '偏干，建议补水'
      : (plot?.soilMoisture || 0) >= 65
      ? '偏湿，注意排水'
      : '墒情适宜';

  if (!plot) {
    return <View className={styles.page}><Text>暂无地块数据</Text></View>;
  }

  return (
    <View className={styles.page}>
      {/* 地块选择 */}
      <View className={styles.plotSelect}>
        {plots.map((p, i) => (
          <View
            key={p.id}
            className={classnames(styles.plotChip, i === plotIndex && styles.plotChipActive)}
            onClick={() => setPlotIndex(i)}
          >
            {p.name}
          </View>
        ))}
      </View>

      {/* 时间范围切换 */}
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, days === 7 && styles.tabActive)}
          onClick={() => setDays(7)}
        >
          近 7 天
        </View>
        <View
          className={classnames(styles.tab, days === 30 && styles.tabActive)}
          onClick={() => setDays(30)}
        >
          近 30 天
        </View>
      </View>

      {/* 汇总 */}
      <View className={styles.summaryRow}>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#1c7ed6' }}>{totalUsage}</Text>
          <Text className={styles.summaryLabel}>累计用水(吨)</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#5c7cfa' }}>{totalRain}</Text>
          <Text className={styles.summaryLabel}>累计降雨(mm)</Text>
        </View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryValue} style={{ color: '#2f9e44' }}>{avgDaily}</Text>
          <Text className={styles.summaryLabel}>日均用水(吨)</Text>
        </View>
      </View>

      {/* 趋势图 */}
      <SectionCard title={`用水量与降雨（${days} 天）`} icon="📊">
        <BarChart data={trendData} height={260} />
      </SectionCard>

      {/* 墒情与作物 */}
      <SectionCard title="墒情与作物状态" icon="🌱">
        <View className={styles.moistRow}>
          <Text className={styles.moistLabel}>土壤湿度</Text>
          <View className={styles.moistTrack}>
            <View className={styles.moistFill} style={{ width: `${plot.soilMoisture}%` }} />
          </View>
          <Text className={styles.moistValue}>{plot.soilMoisture}%</Text>
        </View>
        <Text className={styles.moistHint}>{moistLevel}</Text>

        <View className={styles.summaryRow} style={{ marginTop: '24rpx', marginBottom: 0 }}>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{crop.icon} {crop.name}</Text>
            <Text className={styles.summaryLabel}>当前作物</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>{STAGE_NAMES[plot.stage]}</Text>
            <Text className={styles.summaryLabel}>生长期</Text>
          </View>
          <View className={styles.summaryCard}>
            <Text className={styles.summaryValue}>
              {dayjs().diff(dayjs(plot.lastWateredAt), 'day')} 天前
            </Text>
            <Text className={styles.summaryLabel}>上次浇水</Text>
          </View>
        </View>
      </SectionCard>
    </View>
  );
}

export default TrendPage;
