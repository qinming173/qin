import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Input, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { mockWeather } from '@/data/farm';
import { computeAdvice, todayStr } from '@/utils/irrigation';
import { WaterMethod, WaterRecord, WaterSource } from '@/types/farm';

const METHODS: WaterMethod[] = ['滴灌', '喷灌', '微喷', '漫灌'];
const SOURCES: WaterSource[] = ['井水', '河水', '雨水', '自来水'];
const QUICK_AMOUNTS = [100, 200, 300, 500];

const WaterAddPage: React.FC = () => {
  const { plots, records, currentPlotIndex, hydrate, addRecord } = useFarmStore();
  const [plotId, setPlotId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr());
  const [time, setTime] = useState<string>(dayjs().format('HH:mm'));
  const [method, setMethod] = useState<WaterMethod>('滴灌');
  const [source, setSource] = useState<WaterSource>('井水');
  const [photo, setPhoto] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    hydrate();
  }, []);
  useDidShow(() => hydrate());

  useEffect(() => {
    if (!plotId && plots.length) setPlotId(plots[currentPlotIndex]?.id || plots[0].id);
  }, [plots, currentPlotIndex, plotId]);

  const plot = useMemo(() => plots.find((p) => p.id === plotId) || plots[0], [plots, plotId]);

  const advice = useMemo(() => {
    if (!plot) return null;
    const w = mockWeather.find((x) => x.date === date) || mockWeather[mockWeather.length - 1];
    return computeAdvice(plot, w, records);
  }, [plot, date, records]);

  const pickDate = (): void => {
    Taro.showModal({
      title: '选择日期',
      editable: true,
      placeholderText: 'YYYY-MM-DD',
      content: date,
      success: (res) => {
        if (res.confirm && res.content && dayjs(res.content).isValid()) {
          setDate(dayjs(res.content).format('YYYY-MM-DD'));
        }
      }
    });
  };

  const pickTime = (): void => {
    Taro.showModal({
      title: '选择时间',
      editable: true,
      placeholderText: 'HH:mm',
      content: time,
      success: (res) => {
        if (res.confirm && res.content && /^\d{1,2}:\d{2}$/.test(res.content.trim())) {
          const [h, m] = res.content.trim().split(':');
          setTime(`${h.padStart(2, '0')}:${m}`);
        }
      }
    });
  };

  const choosePhoto = (): void => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const path = res.tempFilePaths[0];
        console.log('[WaterAdd] photo picked:', path);
        setPhoto(path);
      },
      fail: (err) => console.error('[WaterAdd] chooseImage failed:', err)
    });
  };

  const submit = (): void => {
    const num = Number(amount);
    if (!plot) return;
    if (!amount || isNaN(num) || num <= 0) {
      Taro.showToast({ title: '请输入有效用水量', icon: 'none' });
      return;
    }
    const record: WaterRecord = {
      id: `r-${Date.now()}`,
      plotId: plot.id,
      date,
      time,
      amount: Math.round(num),
      method,
      source,
      photo: photo || undefined,
      note: note.trim() || undefined
    };
    addRecord(record);
    console.log('[WaterAdd] record saved:', record);
    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 600);
  };

  if (!plot) return <View className={styles.page} />;

  return (
    <View className={styles.page}>
      {/* 地块选择 */}
      <View className={styles.plotSelect}>
        {plots.map((p) => (
          <View
            key={p.id}
            className={classnames(styles.plotChip, p.id === plotId && styles.plotChipActive)}
            onClick={() => setPlotId(p.id)}
          >
            <Text className={classnames(styles.plotChipText, p.id === plotId && styles.plotChipTextActive)}>
              {p.name}
            </Text>
          </View>
        ))}
      </View>

      {/* 建议提示 */}
      {advice && (
        <View className={styles.tipBar}>
          <Text className={styles.tipText}>
            {advice.icon} {advice.label} · 建议 {advice.recommended}L · 已记录 {advice.actual}L
          </Text>
        </View>
      )}

      {/* 表单 */}
      <View className={styles.formCard}>
        <View className={styles.formItem}>
          <Text className={styles.label}>
            用水量 <Text className={styles.required}>*</Text>
          </Text>
          <View className={styles.inputRow}>
            <Input
              className={styles.input}
              type="number"
              placeholder="0"
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
            <Text className={styles.unit}>升 (L)</Text>
          </View>
          <View className={styles.quickAmounts}>
            {QUICK_AMOUNTS.map((q) => (
              <View key={q} className={styles.quickChip} onClick={() => setAmount(String(q))}>
                <Text className={styles.quickChipText}>{q}L</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItem} onClick={pickDate}>
          <Text className={styles.label}>浇水日期</Text>
          <Text className={styles.valueText}>{date}</Text>
        </View>

        <View className={styles.formItem} onClick={pickTime}>
          <Text className={styles.label}>浇水时间</Text>
          <Text className={styles.valueText}>{time}</Text>
        </View>

        <View className={styles.formItemCol}>
          <Text className={styles.label}>浇水方式</Text>
          <View className={styles.optGroup}>
            {METHODS.map((m) => (
              <View
                key={m}
                className={classnames(styles.opt, m === method && styles.optActive)}
                onClick={() => setMethod(m)}
              >
                <Text className={classnames(styles.optText, m === method && styles.optTextActive)}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItemCol}>
          <Text className={styles.label}>水源</Text>
          <View className={styles.optGroup}>
            {SOURCES.map((s) => (
              <View
                key={s}
                className={classnames(styles.opt, s === source && styles.optActive)}
                onClick={() => setSource(s)}
              >
                <Text className={classnames(styles.optText, s === source && styles.optTextActive)}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formItemCol}>
          <Text className={styles.label}>现场照片</Text>
          <View className={styles.photoWrap}>
            {photo ? (
              <>
                <Image
                  className={styles.photoImg}
                  src={photo}
                  mode="aspectFill"
                  onClick={choosePhoto}
                  onError={(e) => console.error('[WaterAdd] photo error:', e)}
                />
                <Text className={styles.photoDel} onClick={() => setPhoto('')}>
                  删除
                </Text>
              </>
            ) : (
              <View className={styles.photoAdd} onClick={choosePhoto}>
                <Text className={styles.photoAddIcon}>📷</Text>
                <Text className={styles.photoAddText}>拍照/选图</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.formItemCol}>
          <Text className={styles.label}>备注</Text>
          <Input
            className={styles.input}
            placeholder="选填，如：浇透一轮"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.submitBtn} onClick={submit}>
        <Text className={styles.submitText}>保存浇水记录</Text>
      </View>
    </View>
  );
};

export default WaterAddPage;
