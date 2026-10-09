import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { TrendDay } from '@/types/watering';

interface Props {
  data: TrendDay[];
  height?: number; // rpx 柱区域高度
}

/** 用水量 + 降雨 双柱趋势图（纯 View 实现） */
export default function BarChart({ data, height = 240 }: Props) {
  const maxUsage = Math.max(...data.map((d) => d.usage), 1);
  const maxRain = Math.max(...data.map((d) => d.rainfall), 1);
  const step = data.length > 14 ? 5 : data.length > 7 ? 2 : 1;

  return (
    <View className={styles.chart}>
      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#1c7ed6' }} />
          <Text className={styles.legendText}>用水量(吨)</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ background: '#94c7f0' }} />
          <Text className={styles.legendText}>降雨(mm)</Text>
        </View>
      </View>

      <View className={styles.bars} style={{ height: `${height}rpx` }}>
        {data.map((d, i) => (
          <View className={styles.col} key={d.date}>
            <View className={styles.barPair}>
              <View
                className={styles.barUsage}
                style={{ height: `${Math.max(4, (d.usage / maxUsage) * height)}rpx` }}
              />
              <View
                className={styles.barRain}
                style={{ height: `${d.rainfall > 0 ? Math.max(4, (d.rainfall / maxRain) * height) : 0}rpx` }}
              />
            </View>
            <Text className={styles.label}>{i % step === 0 ? d.label : ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
