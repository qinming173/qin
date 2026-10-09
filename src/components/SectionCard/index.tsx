import React, { ReactNode } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface Props {
  title: string;
  icon?: string;
  extra?: ReactNode;
  children: ReactNode;
}

/** 通用区块卡片：标题 + 内容 */
export default function SectionCard({ title, icon, extra, children }: Props) {
  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View className={styles.titleWrap}>
          {icon && <Text className={styles.icon}>{icon}</Text>}
          <Text className={styles.title}>{title}</Text>
        </View>
        {extra && <View className={styles.extra}>{extra}</View>}
      </View>
      <View className={styles.body}>{children}</View>
    </View>
  );
}
