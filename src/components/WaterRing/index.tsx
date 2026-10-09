import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface Props {
  /** 0-100 */
  percent: number;
  size?: number; // rpx
  stroke?: number; // rpx
  color: string;
  bg?: string;
  centerTop: string;
  centerBottom: string;
}

/** 环形进度（纯 View 实现，兼容多端） */
export default function WaterRing({
  percent,
  size = 220,
  stroke = 26,
  color,
  bg = '#eef2ea',
  centerTop,
  centerBottom,
}: Props) {
  const p = Math.max(0, Math.min(100, percent));
  // 半圆拼接模拟环形：左半 + 右半遮罩
  const deg = (p / 100) * 360;
  return (
    <View className={styles.ring} style={{ width: `${size}rpx`, height: `${size}rpx` }}>
      <View className={styles.track} style={{ background: bg, width: `${size}rpx`, height: `${size}rpx` }} />
      <View
        className={styles.fill}
        style={{
          width: `${size}rpx`,
          height: `${size}rpx`,
          background: `conic-gradient(${color} 0deg, ${color} ${deg}deg, transparent ${deg}deg, transparent 360deg)`,
        }}
      />
      <View
        className={styles.hole}
        style={{
          width: `${size - stroke * 2}rpx`,
          height: `${size - stroke * 2}rpx`,
          background: '#ffffff',
        }}
      >
        <Text className={styles.centerTop}>{centerTop}</Text>
        <Text className={styles.centerBottom}>{centerBottom}</Text>
      </View>
    </View>
  );
}
