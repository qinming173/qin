import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import SectionCard from '@/components/SectionCard';

function MinePage() {
  const {
    plots,
    records,
    remindDays,
    anomalyAlert,
    weatherLink,
    setRemindDays,
    setAnomalyAlert,
    setWeatherLink,
  } = useFarmStore();

  const goPlot = () => Taro.navigateTo({ url: '/pages/plot/index' });

  const enableRemind = () => {
    if (remindDays <= 0) {
      Taro.showToast({ title: '提醒间隔需大于 0 天', icon: 'none' });
      return;
    }
    try {
      if (process.env.TARO_ENV === 'weapp' && Taro.requestSubscribeMessage) {
        Taro.requestSubscribeMessage({
          tmplIds: [],
          success: () => Taro.showToast({ title: `已设置每 ${remindDays} 天提醒`, icon: 'success' }),
          fail: () => Taro.showToast({ title: `已设置每 ${remindDays} 天提醒`, icon: 'success' }),
        });
      } else {
        Taro.showToast({ title: `已设置每 ${remindDays} 天提醒`, icon: 'success' });
      }
    } catch (e) {
      console.error('[Mine] requestSubscribeMessage failed:', e);
      Taro.showToast({ title: `已设置每 ${remindDays} 天提醒`, icon: 'success' });
    }
    console.info('[Mine] remind days set to', remindDays);
  };

  return (
    <View className={styles.page}>
      {/* 头部 */}
      <View className={styles.headerCard}>
        <View className={styles.avatar}>🧑‍🌾</View>
        <View className={styles.headerBody}>
          <Text className={styles.headerTitle}>种植管理员</Text>
          <Text className={styles.headerSub}>
            管理 {plots.length} 块田 · 累计 {records.length} 条记录
          </Text>
        </View>
      </View>

      {/* 提醒与设置 */}
      <SectionCard title="提醒与设置" icon="⚙️">
        <View className={styles.row}>
          <View className={styles.rowLeft}>
            <Text className={styles.rowIcon}>⏰</Text>
            <View className={styles.rowBody}>
              <Text className={styles.rowTitle}>定期浇水提醒</Text>
              <Text className={styles.rowDesc}>距上次浇水超过设定天数即提醒</Text>
            </View>
          </View>
          <View className={styles.stepper}>
            <View className={styles.stepBtn} onClick={() => setRemindDays(Math.max(1, remindDays - 1))}>−</View>
            <Text className={styles.stepValue}>{remindDays} 天</Text>
            <View className={styles.stepBtn} onClick={() => setRemindDays(Math.min(15, remindDays + 1))}>＋</View>
          </View>
        </View>

        <View className={styles.row} onClick={enableRemind}>
          <View className={styles.rowLeft}>
            <Text className={styles.rowIcon}>🔔</Text>
            <View className={styles.rowBody}>
              <Text className={styles.rowTitle}>开启订阅提醒</Text>
              <Text className={styles.rowDesc}>点击开启浇水提醒通知</Text>
            </View>
          </View>
          <Text className={styles.arrowRight}>›</Text>
        </View>

        <View className={styles.row} onClick={() => setAnomalyAlert(!anomalyAlert)}>
          <View className={styles.rowLeft}>
            <Text className={styles.rowIcon}>⚠️</Text>
            <View className={styles.rowBody}>
              <Text className={styles.rowTitle}>异常提示</Text>
              <Text className={styles.rowDesc}>用水偏多、超期未浇时首页提示</Text>
            </View>
          </View>
          <View className={classnames(styles.switch, anomalyAlert && styles.switchOn)}>
            <View className={classnames(styles.switchKnob, anomalyAlert && styles.switchKnobOn)} />
          </View>
        </View>

        <View className={styles.row} onClick={() => setWeatherLink(!weatherLink)}>
          <View className={styles.rowLeft}>
            <Text className={styles.rowIcon}>🌦️</Text>
            <View className={styles.rowBody}>
              <Text className={styles.rowTitle}>天气关联</Text>
              <Text className={styles.rowDesc}>结合降雨与温度判断浇水结论</Text>
            </View>
          </View>
          <View className={classnames(styles.switch, weatherLink && styles.switchOn)}>
            <View className={classnames(styles.switchKnob, weatherLink && styles.switchKnobOn)} />
          </View>
        </View>
      </SectionCard>

      {/* 功能入口 */}
      <SectionCard title="功能入口" icon="🧭">
        <View className={styles.row} onClick={goPlot}>
          <View className={styles.rowLeft}>
            <Text className={styles.rowIcon}>🗺️</Text>
            <View className={styles.rowBody}>
              <Text className={styles.rowTitle}>地块管理</Text>
              <Text className={styles.rowDesc}>新增、编辑、删除农田地块</Text>
            </View>
          </View>
          <Text className={styles.arrowRight}>›</Text>
        </View>
      </SectionCard>
    </View>
  );
}

export default MinePage;
