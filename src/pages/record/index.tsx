import React, { useState } from 'react';
import { View, Text, Input, Picker, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import { METHOD_NAMES, SOURCE_NAMES } from '@/data/farm';
import type { IrrigationMethod, WaterSource } from '@/types/watering';

const METHODS: IrrigationMethod[] = ['drip', 'sprinkler', 'flood', 'spray'];
const SOURCES: WaterSource[] = ['well', 'canal', 'reservoir', 'rain'];
const QUICK = [1, 2, 5, 10];

function RecordPage() {
  const { plots, currentPlotIndex, addRecord } = useFarmStore();

  const [plotIndex, setPlotIndex] = useState(currentPlotIndex);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(dayjs().format('HH:mm'));
  const [method, setMethod] = useState<IrrigationMethod>('drip');
  const [source, setSource] = useState<WaterSource>('well');
  const [photo, setPhoto] = useState('');
  const [note, setNote] = useState('');

  const plot = plots[plotIndex];

  const choosePhoto = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] });
      const path = res.tempFilePaths[0];
      if (path) {
        setPhoto(path);
        console.info('[Record] photo selected', path);
      }
    } catch (e) {
      console.error('[Record] chooseImage cancelled/failed:', e);
    }
  };

  const submit = () => {
    const val = parseFloat(amount);
    if (!plot) {
      Taro.showToast({ title: '请选择地块', icon: 'none' });
      return;
    }
    if (!val || val <= 0) {
      Taro.showToast({ title: '请输入有效用水量', icon: 'none' });
      return;
    }
    addRecord({
      plotId: plot.id,
      date,
      time,
      amount: Math.round(val * 10) / 10,
      method,
      source,
      photo: photo || undefined,
      note: note || undefined,
    });
    Taro.showToast({ title: '记录成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 700);
  };

  return (
    <View className={styles.page}>
      {/* 地块 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>选择地块<Text className={styles.required}>*</Text></Text>
        <View className={styles.chips}>
          {plots.map((p, i) => (
            <View
              key={p.id}
              className={classnames(styles.chip, i === plotIndex && styles.chipActive)}
              onClick={() => setPlotIndex(i)}
            >
              {p.name}
            </View>
          ))}
        </View>
      </View>

      {/* 用水量 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>用水量（吨）<Text className={styles.required}>*</Text></Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            type="digit"
            placeholder="请输入用水量"
            value={amount}
            onInput={(e) => setAmount(e.detail.value)}
          />
          <Text className={styles.unit}>吨</Text>
        </View>
        <View className={styles.quickRow}>
          {QUICK.map((q) => (
            <View key={q} className={styles.quickBtn} onClick={() => setAmount(String(q))}>
              +{q} 吨
            </View>
          ))}
        </View>
      </View>

      {/* 时间 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>浇水时间</Text>
        <View className={styles.timeRow}>
          <Picker
            mode="date"
            value={date}
            end={dayjs().format('YYYY-MM-DD')}
            onChange={(e) => setDate(e.detail.value)}
          >
            <View className={styles.inputWrap}>
              <Text className={styles.timeValue}>{date}</Text>
            </View>
          </Picker>
          <View style={{ width: '24rpx' }} />
          <Picker mode="time" value={time} onChange={(e) => setTime(e.detail.value)}>
            <View className={styles.inputWrap}>
              <Text className={styles.timeValue}>{time}</Text>
            </View>
          </Picker>
        </View>
      </View>

      {/* 方式 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>浇水方式</Text>
        <View className={styles.chips}>
          {METHODS.map((m) => (
            <View
              key={m}
              className={classnames(styles.chip, m === method && styles.chipActive)}
              onClick={() => setMethod(m)}
            >
              {METHOD_NAMES[m]}
            </View>
          ))}
        </View>
      </View>

      {/* 水源 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>水源</Text>
        <View className={styles.chips}>
          {SOURCES.map((s) => (
            <View
              key={s}
              className={classnames(styles.chip, s === source && styles.chipActive)}
              onClick={() => setSource(s)}
            >
              {SOURCE_NAMES[s]}
            </View>
          ))}
        </View>
      </View>

      {/* 照片 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>现场照片</Text>
        <View className={styles.photoWrap}>
          {photo ? (
            <View className={styles.photoItem}>
              <Image className={styles.photoImg} src={photo} mode="aspectFill" onClick={choosePhoto} />
              <View className={styles.photoDel} onClick={() => setPhoto('')}>×</View>
            </View>
          ) : (
            <View className={styles.photoAdd} onClick={choosePhoto}>
              <Text className={styles.photoAddIcon}>📷</Text>
              <Text className={styles.photoAddText}>拍照/上传</Text>
            </View>
          )}
        </View>
      </View>

      {/* 备注 */}
      <View className={styles.formCard}>
        <Text className={styles.label}>备注</Text>
        <View className={styles.inputWrap}>
          <Input
            className={styles.input}
            placeholder="选填，如作物状态、特殊情况"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.submitBtn} onClick={submit}>保存记录</View>
    </View>
  );
}

export default RecordPage;
