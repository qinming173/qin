import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface RingProgressProps {
  percent: number; // 0-999
  color: string;
  size?: number; // rpx
  strokeWidth?: number; // rpx
  centerTop: string;
  centerBottom: string;
}

const RingProgress: React.FC<RingProgressProps> = ({
  percent,
  color,
  size = 220,
  strokeWidth = 26,
  centerTop,
  centerBottom
}) => {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const ringStyle: React.CSSProperties = {
    width: `${size}rpx`,
    height: `${size}rpx`,
    background: `conic-gradient(${color} ${clamped * 3.6}deg, #eef1f0 ${clamped * 3.6}deg)`
  };
  const innerSize = size - strokeWidth * 2;

  return (
    <View className={styles.wrap} style={ringStyle}>
      <View className={styles.inner} style={{ width: `${innerSize}rpx`, height: `${innerSize}rpx` }}>
        <Text className={styles.top}>{centerTop}</Text>
        <Text className={styles.bottom}>{centerBottom}</Text>
      </View>
    </View>
  );
};

export default RingProgress;
