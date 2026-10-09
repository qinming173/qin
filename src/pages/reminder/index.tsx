import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { mockWeather } from '@/data/farm';
import { computeAdvice, todayStr } from '@/utils/irrigation';

const TIMES = ['06:30', '07:00', '18:00', '18:30'];
const REMIND_KEY = 'farm-remind-times';

const ReminderPage: React.FC = () => {
  const { plots, records, hydrate } = useFarmStore();
  const [enabled, setEnabled] = useState(true);
  const [times, setTimes] = useState<string[]>(['07:00', '18:00']);

  useEffect(() => {
    hydrate();
    try {
      const saved = Taro.getStorageSync(REMIND_KEY);
      if (saved) {
        const obj = JSON.parse(saved);
        setEnabled(!!obj.enabled);
        if (Array.isArray(obj.times)) setTimes(obj.times);
      }
    } catch (e) {
      console.error('[Reminder] load failed:', e);
    }
  }, []);
  useDidShow(() => hydrate());

  const save = (nextEnabled: boolean, nextTimes: string[]): void => {
    try {
      Taro.setStorageSync(REMIND_KEY, JSON.stringify({ enabled: nextEnabled, times: nextTimes }));
    } catch (e) {
      console.error('[Reminder] save failed:', e);
    }
  };

  const toggle = (): void => {
    const next = !enabled;
    setEnabled(next);
    save(next, times);
    if (next) Taro.showToast({ title: '提醒已开启', icon: 'success' });
  };

  const toggleTime = (t: string): void => {
    const next = times.includes(t) ? times.filter((x) => x !== t) : [...times, t];
    setTimes(next);
    save(enabled, next);
  };

  const today = todayStr();

  const alerts = useMemo(() => {
    return plots
      .map((p) => {
        const w = mockWeather.find((x) => x.date === today) || mockWeather[mockWeather.length - 1];
        return { plot: p, advice: computeAdvice(p, w, records) };
      })
      .filter((x) => x.advice.status !== 'none');
  }, [plots, records, today]);

  return (
    <View className={styles.page}>
      <View className={styles.intro}>
        <Text className={styles.introText}>
          开启提醒后，将在设定时间提示你查看今日浇水结论。异常墒情与用水超标也会在此列出。
        </Text>
      </View>

      <View className={styles.card}>
        <View className={styles.switchRow}>
          <Text className={styles.rowLabel}>每日浇水提醒</Text>
          <View
            className={classnames(styles.switchWrap, enabled && styles.switchOn)}
            onClick={toggle}
          >
            <View className={classnames(styles.switchKnob, enabled && styles.switchKnobOn)} />
          </View>
        </View>
        <Text className={styles.cardTitle} style={{ marginTop: '24rpx' }}>
          提醒时间
        </Text>
        <View className={styles.timeGroup}>
          {TIMES.map((t) => (
            <View
              key={t}
              className={classnames(styles.timeChip, times.includes(t) && styles.timeChipActive)}
              onClick={() => toggleTime(t)}
            >
              <Text className={classnames(styles.timeChipText, times.includes(t) && styles.timeChipTextActive)}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>当前提醒事项（{alerts.length}）</Text>
        {alerts.length === 0 && <Text className={styles.alertDesc}>暂无提醒，墒情良好 🎉</Text>}
        {alerts.map(({ plot, advice }) => {
          const level =
            advice.status === 'over' ? 'danger' : advice.status === 'good' ? 'warn' : 'info';
          const levelText =
            advice.status === 'over' ? '用水偏多' : advice.status === 'good' ? '需要浇水' : '少量补水';
          const days = dayjs().diff(dayjs(plot.lastWaterDate), 'day');
          return (
            <View className={styles.alertItem} key={plot.id}>
              <Text className={styles.alertIcon}>{advice.icon}</Text>
              <View className={styles.alertBody}>
                <Text className={styles.alertTitleText}>
                  {plot.name} · {levelText}
                </Text>
                <Text className={styles.alertDesc}>
                  {advice.reason}
                  {days > 2 ? ` ｜ 已 ${days} 天未浇水` : ''}
                </Text>
              </View>
              <Text
                className={classnames(
                  styles.alertLevel,
                  level === 'danger' && styles.levelDanger,
                  level === 'warn' && styles.levelWarn,
                  level === 'info' && styles.levelInfo
                )}
              >
                {levelText}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ReminderPage;
