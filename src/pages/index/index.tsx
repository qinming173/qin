import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import { getAdvice, calcTodayUsed, STATUS_META } from '@/utils/wateringAdvice';
import { CROPS, STAGE_NAMES, WEATHER_META } from '@/data/farm';
import WaterRing from '@/components/WaterRing';
import BarChart from '@/components/BarChart';
import SectionCard from '@/components/SectionCard';

function HomePage() {
  const {
    plots,
    records,
    weather,
    currentPlotIndex,
    switchPlot,
    remindDays,
    anomalyAlert,
    weatherLink,
  } = useFarmStore();

  const plot = plots[currentPlotIndex];
  const today = dayjs().format('YYYY-MM-DD');
  const todayWeather = useMemo(
    () => weather.find((w) => w.date === today) || weather[weather.length - 1],
    [weather, today]
  );

  const advice = useMemo(
    () => (plot ? getAdvice(plot, todayWeather, records, weatherLink) : null),
    [plot, todayWeather, records, weatherLink]
  );
  const used = plot ? calcTodayUsed(records, plot.id) : 0;
  const suggested = advice?.suggestedAmount || 0;
  const percent = suggested > 0 ? Math.min(100, Math.round((used / suggested) * 100)) : 0;

  const crop = CROPS.find((c) => c.id === plot?.cropId) || CROPS[0];
  const meta = advice ? STATUS_META[advice.status] : STATUS_META.good;

  // 近 7 天趋势
  const trend7 = useMemo(() => {
    return weather.slice(-7).map((w) => {
      const usage = Math.round(
        records
          .filter((r) => r.plotId === plot?.id && r.date === w.date)
          .reduce((s, r) => s + r.amount, 0) * 10
      ) / 10;
      return {
        date: w.date,
        label: dayjs(w.date).format('MM-DD'),
        usage,
        rainfall: w.rainfall,
        soilMoisture: plot?.soilMoisture || 0,
      };
    });
  }, [weather, records, plot]);

  const daysSince = plot ? dayjs().diff(dayjs(plot.lastWateredAt), 'day') : 0;

  // 异常提示：超过提醒天数未浇水
  const showAlert = anomalyAlert && plot && daysSince >= remindDays;

  const goRecord = () => Taro.navigateTo({ url: '/pages/record/index' });
  const goPlot = () => Taro.navigateTo({ url: '/pages/plot/index' });
  const goTrend = () => Taro.switchTab({ url: '/pages/trend/index' });
  const goHistory = () => Taro.switchTab({ url: '/pages/history/index' });
  const goMine = () => Taro.switchTab({ url: '/pages/mine/index' });

  if (!plot || !advice) {
    return <View className={styles.page}><Text>暂无地块，请前往地块管理添加</Text></View>;
  }

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 顶部地块信息栏 */}
      <View className={styles.plotBar}>
        <View className={styles.arrow} onClick={() => switchPlot(-1)}>‹</View>
        <View className={styles.plotCenter}>
          <Text className={styles.plotName}>{crop.icon} {plot.name}</Text>
          <Text className={styles.plotMeta}>
            {dayjs().format('MM月DD日')} · {plot.area}亩 · {STAGE_NAMES[plot.stage]}
          </Text>
          <View className={styles.dots}>
            {plots.map((p, i) => (
              <View
                key={p.id}
                className={classnames(styles.dot, i === currentPlotIndex && styles.dotActive)}
              />
            ))}
          </View>
        </View>
        <View className={styles.arrow} onClick={() => switchPlot(1)}>›</View>
      </View>

      {/* 天气条 */}
      <View className={styles.weatherBar}>
        <View className={styles.weatherItem}>
          <Text className={styles.weatherEmoji}>{WEATHER_META[todayWeather.type].emoji}</Text>
          <Text className={styles.weatherText}>{WEATHER_META[todayWeather.type].label}</Text>
        </View>
        <View className={styles.weatherItem}>
          <Text className={styles.weatherText}>
            <Text className={styles.weatherStrong}>{todayWeather.tempHigh}°</Text>
            /{todayWeather.tempLow}°
          </Text>
        </View>
        <View className={styles.weatherItem}>
          <Text className={styles.weatherText}>
            降雨 <Text className={styles.weatherStrong}>{todayWeather.rainfall}mm</Text>
          </Text>
        </View>
      </View>

      <View className={styles.content}>
        {/* 今日浇水结论 */}
        <View className={styles.adviceCard} style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}dd 100%)` }}>
          <View className={styles.adviceTop}>
            <Text className={styles.adviceLabel}>今日浇水结论</Text>
            <Text className={styles.adviceEmoji}>{meta.emoji}</Text>
          </View>
          <Text className={styles.adviceTitle}>{advice.title}</Text>
          <Text className={styles.adviceReason}>{advice.reason}</Text>
          <View className={styles.adviceSug}>
            <Text className={styles.adviceSugIcon}>💡</Text>
            <Text className={styles.adviceSugText}>{advice.suggestion}</Text>
          </View>
        </View>

        {/* 今日用水情况 */}
        <SectionCard title="今日用水" icon="💦">
          <View className={styles.usageRow}>
            <View className={styles.ringWrap}>
              <WaterRing
                percent={percent}
                color={meta.color}
                centerTop={`${percent}%`}
                centerBottom="完成"
              />
            </View>
            <View className={styles.usageStats}>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>建议用水</Text>
                <Text className={styles.statValue}>{suggested}</Text>
                <Text className={styles.statUnit}>吨</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>实际记录</Text>
                <Text className={styles.statValue}>{used}</Text>
                <Text className={styles.statUnit}>吨</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statLabel}>剩余建议</Text>
                <Text className={styles.statValue}>{Math.max(0, Math.round((suggested - used) * 10) / 10)}</Text>
                <Text className={styles.statUnit}>吨</Text>
              </View>
            </View>
          </View>
          <View className={styles.recordBtn} onClick={goRecord}>
            <Text className={styles.recordBtnIcon}>➕</Text>
            <Text>记录浇水</Text>
          </View>
        </SectionCard>

        {/* 异常提示 */}
        {showAlert && (
          <View className={styles.alertBar}>
            <Text className={styles.alertIcon}>⚠️</Text>
            <Text className={styles.alertText}>
              已 {daysSince} 天未浇水，超过提醒阈值 {remindDays} 天，请及时补水
            </Text>
          </View>
        )}

        {/* 趋势与状态 */}
        <SectionCard
          title="近 7 天趋势"
          icon="📈"
          extra={
            <View className={styles.trendLink} onClick={goTrend}>
              <Text className={styles.trendLinkText}>查看30天</Text>
              <Text className={styles.trendArrow}>›</Text>
            </View>
          }
        >
          <BarChart data={trend7} height={200} />
        </SectionCard>

        {/* 状态网格 */}
        <SectionCard title="墒情与作物" icon="🌱">
          <View className={styles.statusGrid}>
            <View className={styles.statusCell}>
              <Text className={styles.statusCellIcon}>🟦</Text>
              <Text className={styles.statusCellLabel}>土壤湿度</Text>
              <Text className={styles.statusCellValue}>{plot.soilMoisture}%</Text>
            </View>
            <View className={styles.statusCell}>
              <Text className={styles.statusCellIcon}>{crop.icon}</Text>
              <Text className={styles.statusCellLabel}>作物生长期</Text>
              <Text className={styles.statusCellValue}>{crop.name}·{STAGE_NAMES[plot.stage]}</Text>
            </View>
            <View className={styles.statusCell}>
              <Text className={styles.statusCellIcon}>🕐</Text>
              <Text className={styles.statusCellLabel}>上次浇水</Text>
              <Text className={styles.statusCellValue}>
                {daysSince === 0 ? '今天' : `${daysSince} 天前`}
              </Text>
            </View>
            <View className={styles.statusCell}>
              <Text className={styles.statusCellIcon}>🌧️</Text>
              <Text className={styles.statusCellLabel}>今日降雨</Text>
              <Text className={styles.statusCellValue}>{todayWeather.rainfall} mm</Text>
            </View>
          </View>
        </SectionCard>

        {/* 常用功能 */}
        <SectionCard title="常用功能" icon="🧰">
          <View className={styles.funcGrid}>
            <View className={styles.funcItem} onClick={goPlot}>
              <View className={styles.funcIcon} style={{ background: '#e6f6ea' }}>🗺️</View>
              <Text className={styles.funcText}>地块管理</Text>
            </View>
            <View className={styles.funcItem} onClick={goRecord}>
              <View className={styles.funcIcon} style={{ background: '#e3f1fd' }}>📷</View>
              <Text className={styles.funcText}>拍照记录</Text>
            </View>
            <View className={styles.funcItem} onClick={goHistory}>
              <View className={styles.funcIcon} style={{ background: '#fdf3e0' }}>📋</View>
              <Text className={styles.funcText}>历史查询</Text>
            </View>
            <View className={styles.funcItem} onClick={goMine}>
              <View className={styles.funcIcon} style={{ background: '#fdebec' }}>⏰</View>
              <Text className={styles.funcText}>定期提醒</Text>
            </View>
          </View>
        </SectionCard>
      </View>
    </ScrollView>
  );
}

export default HomePage;
