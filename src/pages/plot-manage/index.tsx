import React, { useEffect, useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useFarmStore } from '@/store/farmStore';
import { Plot } from '@/types/farm';
import { todayStr } from '@/utils/irrigation';

const CROP_COVERS: Record<string, string> = {
  水稻: '1015',
  玉米: '1036',
  蔬菜: '1044',
  小麦: '1018',
  大豆: '1039'
};

const askText = (title: string, placeholder: string, defaultValue = ''): Promise<string | null> =>
  new Promise((resolve) => {
    Taro.showModal({
      title,
      editable: true,
      placeholderText: placeholder,
      content: defaultValue,
      success: (res) => resolve(res.confirm ? (res.content || '') : null),
      fail: () => resolve(null)
    });
  });

const PlotManagePage: React.FC = () => {
  const { plots, hydrate, addPlot, updatePlot, deletePlot, setCurrentPlot } = useFarmStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, []);
  useDidShow(() => hydrate());

  const createPlot = async (): Promise<void> => {
    const name = await askText('地块名称', '如：北五号田');
    if (!name) return;
    const crop = (await askText('种植作物', '如：水稻 / 玉米 / 蔬菜')) || '水稻';
    const stage = (await askText('生长期', '如：苗期 / 拔节期')) || '苗期';
    const areaStr = await askText('面积（亩）', '如：10');
    const demandStr = await askText('日建议用水量（L）', '如：400');
    const coverId = CROP_COVERS[crop] || '1015';
    const plot: Plot = {
      id: `p-${Date.now()}`,
      name,
      crop,
      stage,
      area: Number(areaStr) || 5,
      soilMoisture: 50,
      lastWaterDate: todayStr(),
      cover: `https://picsum.photos/id/${coverId}/750/400`,
      dailyDemand: Number(demandStr) || 400
    };
    addPlot(plot);
    Taro.showToast({ title: '地块已创建', icon: 'success' });
  };

  const editPlot = async (plot: Plot): Promise<void> => {
    const name = await askText('地块名称', '地块名称', plot.name);
    if (name === null) return;
    const crop = (await askText('种植作物', '作物', plot.crop)) || plot.crop;
    const stage = (await askText('生长期', '生长期', plot.stage)) || plot.stage;
    const areaStr = await askText('面积（亩）', '面积', String(plot.area));
    const demandStr = await askText('日建议用水量（L）', '建议水量', String(plot.dailyDemand));
    updatePlot({
      ...plot,
      name: name || plot.name,
      crop,
      stage,
      area: Number(areaStr) || plot.area,
      dailyDemand: Number(demandStr) || plot.dailyDemand
    });
    Taro.showToast({ title: '已保存', icon: 'success' });
  };

  const removePlot = (plot: Plot): void => {
    Taro.showModal({
      title: '删除地块',
      content: `确认删除「${plot.name}」？相关记录将不再显示。`,
      confirmColor: '#f53f3f',
      success: (res) => {
        if (res.confirm) {
          deletePlot(plot.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const selectPlot = (index: number): void => {
    setCurrentPlot(index);
    Taro.showToast({ title: '已设为当前地块', icon: 'success' });
  };

  if (!ready) return <View className={styles.page} />;

  return (
    <View className={styles.page}>
      {plots.map((plot, i) => (
        <View className={styles.plotCard} key={plot.id}>
          <Image
            className={styles.plotCover}
            src={plot.cover}
            mode="aspectFill"
            onError={(e) => console.error('[PlotManage] cover error:', e)}
          />
          <View className={styles.plotBody}>
            <View className={styles.plotHead}>
              <Text className={styles.plotName}>{plot.name}</Text>
              <Text className={styles.plotBadge}>{plot.crop} · {plot.stage}</Text>
            </View>
            <Text className={styles.plotInfo}>面积：{plot.area} 亩 ｜ 日建议用水：{plot.dailyDemand} L</Text>
            <Text className={styles.plotInfo}>土壤湿度：{plot.soilMoisture}% ｜ 上次浇水：{plot.lastWaterDate}</Text>
            <View className={styles.plotActions}>
              <View className={styles.actionBtn} onClick={() => selectPlot(i)}>
                <Text className={styles.actionText}>设为当前</Text>
              </View>
              <View className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => editPlot(plot)}>
                <Text className={`${styles.actionText} ${styles.actionTextPrimary}`}>编辑</Text>
              </View>
              <View className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={() => removePlot(plot)}>
                <Text className={`${styles.actionText} ${styles.actionTextDanger}`}>删除</Text>
              </View>
            </View>
          </View>
        </View>
      ))}

      <View className={styles.addBtn} onClick={createPlot}>
        <Text className={styles.addText}>＋ 新增地块</Text>
      </View>
    </View>
  );
};

export default PlotManagePage;
