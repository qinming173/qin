import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

export interface TrendPoint {
  label: string; // 日期标签 M/D
  water: number; // 用水量 L
  rain: number; // 降雨 mm
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number; // 图表高度 rpx
  compact?: boolean; // 首页迷你模式
}

const TrendChart: React.FC<TrendChartProps> = ({ data, height = 260, compact = false }) => {
  const maxWater = Math.max(...data.map((d) => d.water), 1);
  const maxRain = Math.max(...data.map((d) => d.rain), 1);
  const chartH = height;
  const barAreaH = chartH - (compact ? 0 : 36);

  return (
    <View className={styles.chart}>
      <View className={styles.legend} hidden={compact}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#1677ff' }} />
          <Text className={styles.legendText}>用水量(L)</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#8e9bff' }} />
          <Text className={styles.legendText}>降雨(mm)</Text>
        </View>
      </View>

      <View className={styles.plot} style={{ height: `${chartH}rpx` }}>
        {data.map((d, i) => {
          const waterH = Math.max((d.water / maxWater) * (barAreaH - 40), d.water > 0 ? 8 : 2);
          const rainH = Math.max((d.rain / maxRain) * (barAreaH - 40), d.rain > 0 ? 8 : 0);
          return (
            <View className={styles.col} key={`${d.label}-${i}`}>
              <View className={styles.bars}>
                <View className={styles.waterBar} style={{ height: `${waterH}rpx` }} />
                {d.rain > 0 && <View className={styles.rainBar} style={{ height: `${rainH}rpx` }} />}
              </View>
              {!compact && <Text className={styles.label}>{d.label}</Text>}
              {compact && i % 3 === 0 && <Text className={styles.labelMini}>{d.label}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default TrendChart;
