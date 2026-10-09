import React, { useState } from 'react';
import { View, Text, Input, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/useFarmStore';
import { CROPS, STAGE_NAMES } from '@/data/farm';
import type { GrowthStage } from '@/types/watering';

const STAGES: GrowthStage[] = ['seedling', 'jointing', 'heading', 'maturity'];

interface FormState {
  id?: string;
  name: string;
  area: string;
  cropId: string;
  stage: GrowthStage;
}

const emptyForm: FormState = { name: '', area: '', cropId: CROPS[0].id, stage: 'seedling' };

function PlotPage() {
  const { plots, addPlot, updatePlot, removePlot } = useFarmStore();
  const [visible, setVisible] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openAdd = () => {
    setForm(emptyForm);
    setVisible(true);
  };

  const openEdit = (id: string) => {
    const p = plots.find((x) => x.id === id);
    if (!p) return;
    setForm({ id: p.id, name: p.name, area: String(p.area), cropId: p.cropId, stage: p.stage });
    setVisible(true);
  };

  const onDel = (id: string, name: string) => {
    Taro.showModal({
      title: '删除地块',
      content: `确定删除「${name}」吗？该地块的历史记录将保留但不再显示结论。`,
      confirmColor: '#e03131',
      success: (res) => {
        if (res.confirm) {
          removePlot(id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  };

  const onSave = () => {
    const area = parseFloat(form.area);
    if (!form.name.trim()) {
      Taro.showToast({ title: '请输入地块名称', icon: 'none' });
      return;
    }
    if (!area || area <= 0) {
      Taro.showToast({ title: '请输入有效面积', icon: 'none' });
      return;
    }
    if (form.id) {
      updatePlot(form.id, {
        name: form.name.trim(),
        area,
        cropId: form.cropId,
        stage: form.stage,
      });
      Taro.showToast({ title: '已保存', icon: 'success' });
    } else {
      addPlot({
        name: form.name.trim(),
        area,
        cropId: form.cropId,
        stage: form.stage,
      });
      Taro.showToast({ title: '已添加', icon: 'success' });
    }
    setVisible(false);
  };

  const cropName = (id: string) => CROPS.find((c) => c.id === id);

  return (
    <View className={styles.page}>
      {plots.map((p) => {
        const crop = cropName(p.cropId);
        return (
          <View className={styles.item} key={p.id}>
            <View className={styles.itemTop}>
              <Image
                className={styles.cover}
                src={p.cover}
                mode="aspectFill"
                onError={(e) => console.error('[Plot] cover load failed:', p.id, e.detail)}
              />
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{crop?.icon} {p.name}</Text>
                <Text className={styles.itemSub}>
                  {crop?.name} · {STAGE_NAMES[p.stage]} · {p.area} 亩
                </Text>
              </View>
            </View>

            <View className={styles.itemStats}>
              <View className={styles.stat}>
                <Text className={styles.statValue} style={{ color: '#1c7ed6' }}>{p.soilMoisture}%</Text>
                <Text className={styles.statLabel}>土壤湿度</Text>
              </View>
              <View className={styles.stat}>
                <Text className={styles.statValue} style={{ color: '#2f9e44' }}>{p.area}</Text>
                <Text className={styles.statLabel}>面积(亩)</Text>
              </View>
              <View className={styles.stat}>
                <Text className={styles.statValue}>{crop?.icon || '🌱'}</Text>
                <Text className={styles.statLabel}>作物</Text>
              </View>
            </View>

            <View className={styles.actions}>
              <View className={classnames(styles.actionBtn, styles.editBtn)} onClick={() => openEdit(p.id)}>
                编辑
              </View>
              <View className={classnames(styles.actionBtn, styles.delBtn)} onClick={() => onDel(p.id, p.name)}>
                删除
              </View>
            </View>
          </View>
        );
      })}

      <View className={styles.addBtn} onClick={openAdd}>＋ 新增地块</View>

      {visible && (
        <View className={styles.mask} onClick={() => setVisible(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.sheetTitle}>{form.id ? '编辑地块' : '新增地块'}</Text>

            <View className={styles.field}>
              <Text className={styles.label}>地块名称</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  placeholder="如：东三号田"
                  value={form.name}
                  onInput={(e) => setForm({ ...form, name: e.detail.value })}
                />
              </View>
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>面积</Text>
              <View className={styles.inputWrap}>
                <Input
                  className={styles.input}
                  type="digit"
                  placeholder="请输入面积"
                  value={form.area}
                  onInput={(e) => setForm({ ...form, area: e.detail.value })}
                />
                <Text className={styles.unit}>亩</Text>
              </View>
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>作物</Text>
              <View className={styles.chips}>
                {CROPS.map((c) => (
                  <View
                    key={c.id}
                    className={classnames(styles.chip, form.cropId === c.id && styles.chipActive)}
                    onClick={() => setForm({ ...form, cropId: c.id })}
                  >
                    {c.icon} {c.name}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.field}>
              <Text className={styles.label}>生长期</Text>
              <View className={styles.chips}>
                {STAGES.map((s) => (
                  <View
                    key={s}
                    className={classnames(styles.chip, form.stage === s && styles.chipActive)}
                    onClick={() => setForm({ ...form, stage: s })}
                  >
                    {STAGE_NAMES[s]}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.sheetBtns}>
              <View className={styles.cancelBtn} onClick={() => setVisible(false)}>取消</View>
              <View className={styles.saveBtn} onClick={onSave}>保存</View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

export default PlotPage;
