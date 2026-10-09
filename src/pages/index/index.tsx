import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { mockWeather } from '@/data/farm';
import { computeAdvice, weatherIcon, weatherText, todayStr, soilColor, soilLabel } from '@/utils/irrigation';
import RingProgress from '@/components/RingProgress';
import TrendChart, { TrendPoint } from '@/components/TrendChart';

const IndexPage: React.FC = () => {
  const { plots, records, currentPlotIndex, hydrate, switchPlot } = useFarmStore();
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    hydrate();
  }, []);

  // 每次页面显示刷新（记录后返回同步）
  useDidShow(() => {
    hydrate();
  });

  const plot = plots[currentPlotIndex];
  const today = todayStr();
  const todayWeather = useMemo(
    () => mockWeather.find((w) => w.date === today) || mockWeather[mockWeather.length - 1],
    [today]
  );

  const advice = useMemo(
    () => (plot ? computeAdvice(plot, todayWeather, records) : null),
    [plot, todayWeather, records]
  );

  // 趋势数据（近 N 天用水量 + 降雨）
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

  const gotoRecord = (): void => {
    Taro.navigateTo({ url: '/pages/water-add/index' });
  };

  const gotoPage = (url: string, isTab = false): void => {
    if (isTab) Taro.switchTab({ url });
    else Taro.navigateTo({ url });
  };

  if (!plot || !advice) {
    return <View className={styles.page} />;
  }

  const conclBg = `linear-gradient(135deg, ${advice.color} 0%, ${advice.color}cc 100%)`;

  const funcs = [
    { icon: '🗺️', text: '地块管理', url: '/pages/plot-manage/index' },
    { icon: '📷', text: '拍照记录', url: '/pages/water-add/index' },
    { icon: '📜', text: '历史查询', url: '/pages/history/index' },
    { icon: '⛅', text: '天气关联', url: '/pages/trend/index', tab: true },
    { icon: '🔔', text: '定期提醒', url: '/pages/reminder/index' },
    { icon: '⚠️', text: '异常提示', url: '/pages/mine/index', tab: true }
  ];

  return (
    <View className={styles.page}>
      {/* 顶部地块信息栏 */}
      <View className={styles.plotBar}>
        <View className={styles.plotSwitch}>
          <View className={styles.arrowBtn} onClick={() => switchPlot(-1)}>
            <Text className={styles.arrow}>‹</Text>
          </View>
          <View className={styles.plotCenter}>
            <Text className={styles.plotName}>{plot.name}</Text>
            <Text className={styles.plotMeta}>
              {plot.crop} · {plot.stage} · {plot.area}亩 · {dayjs().format('M月D日')}
            </Text>
          </View>
          <View className={styles.arrowBtn} onClick={() => switchPlot(1)}>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
        <View className={styles.weatherRow}>
          <Text className={styles.weatherIcon}>{weatherIcon[todayWeather.condition]}</Text>
          <Text className={styles.weatherText}>{weatherText[todayWeather.condition]}</Text>
          <Text className={styles.tempText}>
            {todayWeather.tempLow}~{todayWeather.tempHigh}℃
          </Text>
          <Text className={styles.rainText}>降雨 {todayWeather.rainfall}mm</Text>
        </View>
      </View>

      {/* 今日浇水结论 */}
      <View className={styles.conclusion} style={{ background: conclBg }}>
        <View className={styles.conclTop}>
          <Text className={styles.conclIcon}>{advice.icon}</Text>
          <View className={styles.conclTitleWrap}>
            <Text className={styles.conclLabel}>{advice.label}</Text>
            <Text className={styles.conclSub}>今日浇水判断</Text>
          </View>
        </View>
        <View className={styles.conclReason}>
          <Text className={styles.conclReasonText}>
            <Text className={styles.conclTag}>原因</Text>
            {advice.reason}
          </Text>
        </View>
        <View className={styles.conclSug}>
          <Text className={styles.conclSugText}>
            <Text className={styles.conclTag}>建议</Text>
            {advice.suggestion}
          </Text>
        </View>
      </View>

      {/* 今日用水情况 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>今日用水情况</Text>
        <View className={styles.usageWrap}>
          <RingProgress
            percent={advice.percent}
            color={advice.status === 'over' ? '#f53f3f' : '#1677ff'}
            centerTop={`${advice.percent}%`}
            centerBottom="完成"
          />
          <View className={styles.usageStats}>
            <View className={styles.statRow}>
              <Text className={styles.statLabel}>建议用水量</Text>
              <Text className={styles.statValue}>{advice.recommended} L</Text>
            </View>
            <View className={styles.statRow}>
              <Text className={styles.statLabel}>实际记录量</Text>
              <Text className={classnames(styles.statValue, styles.statValueWater)}>{advice.actual} L</Text>
            </View>
            <View className={styles.progressTrack}>
              <View
                className={styles.progressFill}
                style={{ width: `${Math.min(advice.percent, 100)}%` }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 快速记录入口 */}
      <View className={styles.quickBtn} onClick={gotoRecord}>
        <Text className={styles.quickIcon}>💧</Text>
        <Text className={styles.quickText}>记录浇水</Text>
      </View>

      {/* 趋势与状态 */}
      <View className={styles.card}>
        <View className={styles.trendHead}>
          <Text className={styles.cardTitle} style={{ marginBottom: 0 }}>
            用水与降雨趋势
          </Text>
          <View className={styles.trendTabs}>
            <View
              className={classnames(styles.trendTab, range === 7 && styles.trendTabActive)}
              onClick={() => setRange(7)}
            >
              <Text className={classnames(styles.trendTabText, range === 7 && styles.trendTabTextActive)}>近7天</Text>
            </View>
            <View
              className={classnames(styles.trendTab, range === 30 && styles.trendTabActive)}
              onClick={() => setRange(30)}
            >
              <Text className={classnames(styles.trendTabText, range === 30 && styles.trendTabTextActive)}>近30天</Text>
            </View>
          </View>
        </View>
        <TrendChart data={trendData} compact={range === 30} height={240} />

        <View className={styles.statusGrid}>
          <View className={styles.statusCell}>
            <Text className={styles.statusCellIcon}>🌱</Text>
            <Text className={styles.statusCellValue} style={{ color: soilColor(plot.soilMoisture) }}>
              {plot.soilMoisture}%
            </Text>
            <Text className={styles.statusCellLabel}>土壤湿度·{soilLabel(plot.soilMoisture)}</Text>
          </View>
          <View className={styles.statusCell}>
            <Text className={styles.statusCellIcon}>🌾</Text>
            <Text className={styles.statusCellValue}>{plot.stage}</Text>
            <Text className={styles.statusCellLabel}>作物生长期</Text>
          </View>
          <View className={styles.statusCell}>
            <Text className={styles.statusCellIcon}>🕐</Text>
            <Text className={styles.statusCellValue}>
              {plot.lastWaterDate === today ? '今日' : `${dayjs().diff(dayjs(plot.lastWaterDate), 'day')}天前`}
            </Text>
            <Text className={styles.statusCellLabel}>上次浇水</Text>
          </View>
        </View>
      </View>

      {/* 常用功能 */}
      <View className={styles.card}>
        <Text className={styles.cardTitle}>常用功能</Text>
        <View className={styles.funcGrid}>
          {funcs.map((f) => (
            <View
              key={f.text}
              className={styles.funcItem}
              onClick={() => gotoPage(f.url, !!f.tab)}
            >
              <View className={styles.funcIconWrap}>
                <Text className={styles.funcIcon}>{f.icon}</Text>
              </View>
              <Text className={styles.funcText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default IndexPage;
