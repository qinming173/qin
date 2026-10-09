import React, { useEffect, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { todayStr } from '@/utils/irrigation';
import { WaterRecord } from '@/types/farm';

const RecordPage: React.FC = () => {
  const { plots, records, currentPlotIndex, hydrate, switchPlot, deleteRecord } = useFarmStore();

  useEffect(() => {
    hydrate();
  }, []);

  useDidShow(() => {
    hydrate();
  });

  const plot = plots[currentPlotIndex];
  const today = todayStr();

  const plotRecords: WaterRecord[] = useMemo(
    () =>
      records
        .filter((r) => r.plotId === (plot ? plot.id : ''))
        .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date))),
    [records, plot]
  );

  const todayAmount = plotRecords
    .filter((r) => r.date === today)
    .reduce((s, r) => s + r.amount, 0);

  const weekAmount = plotRecords
    .filter((r) => dayjs().diff(dayjs(r.date), 'day') < 7)
    .reduce((s, r) => s + r.amount, 0);

  const previewPhoto = (url: string): void => {
    Taro.previewImage({ current: url, urls: [url] });
  };

  const onLongPress = (rec: WaterRecord): void => {
    Taro.showModal({
      title: '删除记录',
      content: `确认删除 ${rec.date} ${rec.time} 的 ${rec.amount}L 记录？`,
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          deleteRecord(rec.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  if (!plot) return <View className={styles.page} />;

  return (
    <View className={styles.page}>
      {/* 顶部地块切换 */}
      <View className={styles.plotBar}>
        <View className={styles.plotSwitch}>
          <View className={styles.arrowBtn} onClick={() => switchPlot(-1)}>
            <Text className={styles.arrow}>‹</Text>
          </View>
          <Text className={styles.plotName}>{plot.name}</Text>
          <View className={styles.arrowBtn} onClick={() => switchPlot(1)}>
            <Text className={styles.arrow}>›</Text>
          </View>
        </View>
        <Text className={styles.plotMeta}>
          {plot.crop} · {plot.stage} · 共 {plotRecords.length} 条记录
        </Text>
      </View>

      {/* 汇总 */}
      <View className={styles.summary}>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue} style={{ color: '#1677ff' }}>
            {todayAmount}
          </Text>
          <Text className={styles.summaryLabel}>今日用水(L)</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{weekAmount}</Text>
          <Text className={styles.summaryLabel}>近7天(L)</Text>
        </View>
        <View className={styles.summaryItem}>
          <Text className={styles.summaryValue}>{plotRecords.length}</Text>
          <Text className={styles.summaryLabel}>记录条数</Text>
        </View>
      </View>

      <Text className={styles.listTitle}>记录明细（长按可删除）</Text>

      <View>
        {plotRecords.length === 0 && (
          <View className={styles.empty}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无浇水记录，点击下方按钮添加</Text>
          </View>
        )}
        {plotRecords.map((rec) => (
          <View
            className={styles.recordCard}
            key={rec.id}
            onLongPress={() => onLongPress(rec)}
          >
            <View className={styles.recordDate}>
              <Text className={styles.recordDay}>{dayjs(rec.date).format('D')}</Text>
              <Text className={styles.recordMonth}>{dayjs(rec.date).format('M月')}</Text>
            </View>
            <View className={styles.recordBody}>
              <View className={styles.recordTop}>
                <Text className={styles.recordAmount}>{rec.amount} L</Text>
                <Text className={styles.recordTime}>{rec.time}</Text>
              </View>
              <View className={styles.recordTags}>
                <Text className={styles.tag}>{rec.method}</Text>
                <Text className={`${styles.tag} ${styles.tagSource}`}>{rec.source}</Text>
                {rec.note && <Text className={styles.tag}>{rec.note}</Text>}
              </View>
            </View>
            {rec.photo && (
              <Image
                className={styles.recordPhoto}
                src={rec.photo}
                mode="aspectFill"
                onClick={() => previewPhoto(rec.photo as string)}
                onError={(e) => console.error('[Record] photo load error:', e)}
              />
            )}
          </View>
        ))}
      </View>

      {/* 添加按钮 */}
      <View
        className={styles.addBtn}
        onClick={() => Taro.navigateTo({ url: '/pages/water-add/index' })}
      >
        <Text className={styles.addIcon}>＋</Text>
        <Text className={styles.addText}>记录浇水</Text>
      </View>
    </View>
  );
};

export default RecordPage;
