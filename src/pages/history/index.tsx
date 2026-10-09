import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import { METHOD_NAMES, SOURCE_NAMES } from '@/data/farm';

function HistoryPage() {
  const { plots, records } = useFarmStore();
  const [plotFilter, setPlotFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return records.filter((r) => plotFilter === 'all' || r.plotId === plotFilter);
  }, [records, plotFilter]);

  const total = useMemo(
    () => Math.round(filtered.reduce((s, r) => s + r.amount, 0) * 10) / 10,
    [filtered]
  );

  const plotName = (id: string) => plots.find((p) => p.id === id)?.name || '未知地块';

  return (
    <ScrollView scrollY className={styles.page}>
      {/* 筛选 */}
      <View className={styles.filterRow}>
        <View
          className={classnames(styles.chip, plotFilter === 'all' && styles.chipActive)}
          onClick={() => setPlotFilter('all')}
        >
          全部地块
        </View>
        {plots.map((p) => (
          <View
            key={p.id}
            className={classnames(styles.chip, plotFilter === p.id && styles.chipActive)}
            onClick={() => setPlotFilter(p.id)}
          >
            {p.name}
          </View>
        ))}
      </View>

      {/* 汇总 */}
      <View className={styles.summaryBar}>
        <Text className={styles.summaryText}>
          共 <Text className={styles.summaryStrong}>{filtered.length}</Text> 条记录
        </Text>
        <Text className={styles.summaryText}>
          累计用水 <Text className={styles.summaryStrong}>{total}</Text> 吨
        </Text>
      </View>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>💧</Text>
          <Text className={styles.emptyText}>暂无浇水记录</Text>
        </View>
      ) : (
        <View className={styles.list}>
          {filtered.map((r) => (
            <View className={styles.item} key={r.id}>
              {r.photo ? (
                <Image
                  className={styles.itemPhoto}
                  src={r.photo}
                  mode="aspectFill"
                  onError={(e) => console.error('[History] image load failed:', r.id, e.detail)}
                />
              ) : (
                <View className={styles.itemIcon}>💧</View>
              )}
              <View className={styles.itemBody}>
                <View className={styles.itemTop}>
                  <Text className={styles.itemPlot}>{plotName(r.plotId)}</Text>
                  <Text className={styles.itemAmount}>{r.amount} 吨</Text>
                </View>
                <Text className={styles.itemMeta}>
                  {dayjs(r.date).format('MM月DD日')} {r.time}
                </Text>
                <View className={styles.itemTags}>
                  <Text className={styles.tag}>{METHOD_NAMES[r.method]}</Text>
                  <Text className={styles.tag}>{SOURCE_NAMES[r.source]}</Text>
                  {r.note && <Text className={styles.tag}>{r.note}</Text>}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

export default HistoryPage;
