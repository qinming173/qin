import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { WaterRecord } from '@/types/farm';

type RangeKey = 'all' | '7' | '30';

const HistoryPage: React.FC = () => {
  const { plots, records, hydrate } = useFarmStore();
  const [plotId, setPlotId] = useState<string>('all');
  const [range, setRange] = useState<RangeKey>('30');

  useEffect(() => {
    hydrate();
  }, []);
  useDidShow(() => hydrate());

  const filtered: WaterRecord[] = useMemo(() => {
    return records
      .filter((r) => (plotId === 'all' ? true : r.plotId === plotId))
      .filter((r) => (range === 'all' ? true : dayjs().diff(dayjs(r.date), 'day') < Number(range)))
      .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));
  }, [records, plotId, range]);

  const grouped = useMemo(() => {
    const map = new Map<string, WaterRecord[]>();
    filtered.forEach((r) => {
      const key = dayjs(r.date).format('YYYY年M月D日');
      const arr = map.get(key) || [];
      arr.push(r);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const plotName = (id: string): string => plots.find((p) => p.id === id)?.name || id;
  const totalAmount = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <View className={styles.page}>
      {/* 地块筛选 */}
      <View className={styles.filterBar}>
        <View
          className={classnames(styles.chip, plotId === 'all' && styles.chipActive)}
          onClick={() => setPlotId('all')}
        >
          <Text className={classnames(styles.chipText, plotId === 'all' && styles.chipTextActive)}>全部地块</Text>
        </View>
        {plots.map((p) => (
          <View
            key={p.id}
            className={classnames(styles.chip, plotId === p.id && styles.chipActive)}
            onClick={() => setPlotId(p.id)}
          >
            <Text className={classnames(styles.chipText, plotId === p.id && styles.chipTextActive)}>{p.name}</Text>
          </View>
        ))}
      </View>

      {/* 时间筛选 */}
      <View className={styles.filterBar}>
        {(['7', '30', 'all'] as RangeKey[]).map((r) => (
          <View
            key={r}
            className={classnames(styles.chip, range === r && styles.chipActive)}
            onClick={() => setRange(r)}
          >
            <Text className={classnames(styles.chipText, range === r && styles.chipTextActive)}>
              {r === 'all' ? '全部时间' : `近${r}天`}
            </Text>
          </View>
        ))}
      </View>

      {/* 汇总 */}
      <View className={styles.sumCard}>
        <View className={styles.sumItem}>
          <Text className={styles.sumValue}>{filtered.length}</Text>
          <Text className={styles.sumLabel}>记录条数</Text>
        </View>
        <View className={styles.sumItem}>
          <Text className={styles.sumValue}>{totalAmount}</Text>
          <Text className={styles.sumLabel}>累计用水(L)</Text>
        </View>
        <View className={styles.sumItem}>
          <Text className={styles.sumValue}>{grouped.length}</Text>
          <Text className={styles.sumLabel}>浇水天数</Text>
        </View>
      </View>

      {/* 分组列表 */}
      {grouped.length === 0 && (
        <View className={styles.empty}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyText}>暂无符合条件的记录</Text>
        </View>
      )}
      {grouped.map(([dateLabel, list]) => (
        <View key={dateLabel}>
          <Text className={styles.groupTitle}>
            {dateLabel} · 共 {list.reduce((s, r) => s + r.amount, 0)}L
          </Text>
          {list.map((r) => (
            <View className={styles.row} key={r.id}>
              <View className={styles.rowDate}>
                <Text className={styles.rowDay}>{r.time}</Text>
              </View>
              <View className={styles.rowBody}>
                <Text className={styles.rowPlot}>{plotName(r.plotId)}</Text>
                <Text className={styles.rowMeta}>
                  {r.method} · {r.source}
                  {r.note ? ` · ${r.note}` : ''}
                </Text>
              </View>
              <Text className={styles.rowAmount}>{r.amount}L</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

export default HistoryPage;
