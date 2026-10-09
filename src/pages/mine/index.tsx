import React, { useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { mockWeather } from '@/data/farm';
import { computeAdvice, todayStr } from '@/utils/irrigation';

const MinePage: React.FC = () => {
  const { plots, records, hydrate } = useFarmStore();

  useEffect(() => {
    hydrate();
  }, []);
  useDidShow(() => hydrate());

  const today = todayStr();

  const stats = useMemo(() => {
    const weekTotal = records
      .filter((r) => dayjs().diff(dayjs(r.date), 'day') < 7)
      .reduce((s, r) => s + r.amount, 0);
    const alerts = plots
      .map((p) => {
        const w = mockWeather.find((x) => x.date === today) || mockWeather[mockWeather.length - 1];
        return { plot: p, advice: computeAdvice(p, w, records) };
      })
      .filter((x) => x.advice.status === 'over' || x.advice.status === 'good');
    return { weekTotal, alerts };
  }, [plots, records, today]);

  const goto = (url: string, tab = false): void => {
    if (tab) Taro.switchTab({ url });
    else Taro.navigateTo({ url });
  };

  const menus = [
    { icon: '🗺️', text: '地块管理', url: '/pages/plot-manage/index', bg: 'rgba(28,163,94,0.1)' },
    { icon: '📜', text: '历史查询', url: '/pages/history/index', bg: 'rgba(22,119,255,0.1)' },
    { icon: '🔔', text: '定期提醒', url: '/pages/reminder/index', bg: 'rgba(255,125,0,0.1)' },
    { icon: '⛅', text: '天气关联', url: '/pages/trend/index', bg: 'rgba(142,155,255,0.12)', tab: true },
    { icon: 'ℹ️', text: '关于智灌', url: '', bg: 'rgba(134,144,156,0.1)' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userRow}>
          <View className={styles.avatar}>
            <Text className={styles.avatarIcon}>👨‍🌾</Text>
          </View>
          <View className={styles.userText}>
            <Text className={styles.userName}>张农户</Text>
            <Text className={styles.userDesc}>已管理 {plots.length} 块农田 · 用心灌溉每一天</Text>
          </View>
        </View>
      </View>

      <View className={styles.overview}>
        <View className={styles.ovItem}>
          <Text className={styles.ovValue}>{plots.length}</Text>
          <Text className={styles.ovLabel}>地块数</Text>
        </View>
        <View className={styles.ovItem}>
          <Text className={styles.ovValue}>{records.length}</Text>
          <Text className={styles.ovLabel}>总记录</Text>
        </View>
        <View className={styles.ovItem}>
          <Text className={styles.ovValue}>{stats.weekTotal}</Text>
          <Text className={styles.ovLabel}>近7天用水(L)</Text>
        </View>
      </View>

      {stats.alerts.length > 0 && (
        <View className={styles.alertCard}>
          <Text className={styles.alertTitle}>⚠️ 异常提示</Text>
          {stats.alerts.map((a) => (
            <Text key={a.plot.id} className={styles.alertText}>
              {a.plot.name}：{a.advice.reason}
            </Text>
          ))}
        </View>
      )}

      <View className={styles.menuGroup}>
        {menus.map((m) => (
          <View
            key={m.text}
            className={styles.menuItem}
            onClick={() => (m.url ? goto(m.url, !!m.tab) : Taro.showModal({
              title: '关于智灌',
              content: '智灌农田 v1.0.0\n记录农田用水，智能判断每日浇水是否合适。',
              showCancel: false
            }))}
          >
            <View className={styles.menuIconWrap} style={{ background: m.bg }}>
              <Text className={styles.menuIcon}>{m.icon}</Text>
            </View>
            <Text className={styles.menuText}>{m.text}</Text>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default MinePage;
