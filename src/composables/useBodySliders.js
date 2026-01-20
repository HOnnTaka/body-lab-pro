/**
 * 体型滑块控制
 */
import { ref, reactive } from 'vue';

export function useBodySliders() {
  const mode = ref('simple');
  const activeSlider = ref(null);
  const tooltipLeft = ref('50%');
  
  const modes = [
    { key: 'simple', label: '简易' },
    { key: 'normal', label: '普通' },
    { key: 'advanced', label: '高级' }
  ];
  
  // 内部：获取当前所有参数的归一化值 (-1 到 1)
  const getParams = () => {
    const params = {};
    simpleSliders.forEach(s => {
      // Gender 0(Min) 50(Base) 100(Max) -> -1 to 1
      // Others 0(Min) 50(Base) 100(Max) -> -1 to 1
      params[s.key] = (s.value - 50) / 50;
    });
    return params;
  };

  // 简易模式滑块
  const simpleSliders = reactive([
    { key: 'gender', label: '性像', value: 50 }, // 默认值改为 50
    { key: 'height', label: '骨像', value: 50 },
    { key: 'weight', label: '量像', value: 50 },
    { key: 'muscle', label: '塑像', value: 50 },
    { key: 'proportion', label: '比例', value: 50 },
    { key: 'age', label: '龄像', value: 50 },
  ]);
  
  // 滑块拖动中
  const onSliding = (slider, value, model) => {
    slider.value = value;
    activeSlider.value = slider.key;
    tooltipLeft.value = `${value}%`;
    
    if (!model?.updateBodyMorphs) return;
    model.updateBodyMorphs(getParams());
  };
  
  // 滑块拖动结束
  const onSlideEnd = (slider, value, model) => {
    slider.value = value;
    activeSlider.value = null;
    
    if (!model?.updateBodyMorphs) return;
    model.updateBodyMorphs(getParams());
  };
  
  // 重置所有滑块
  const resetAll = (model) => {
    simpleSliders.forEach(s => {
      s.value = 50;
    });
    if (model?.updateBodyMorphs) {
      model.updateBodyMorphs(getParams());
    }
  };
  
  // 初始化模型状态（将当前滑块值同步到模型）
  const initModelState = (model) => {
    if (!model?.updateBodyMorphs) return;
    model.updateBodyMorphs(getParams());
  };
  
  // 保存预设
  const savePreset = () => {
    const list = uni.getStorageSync('presets') || [];
    const preset = {
      mode: mode.value,
      time: Date.now(),
      sliders: simpleSliders.map(s => ({ key: s.key, value: s.value }))
    };
    list.unshift(preset);
    if (list.length > 10) list.pop();
    uni.setStorageSync('presets', list);
    uni.showToast({ title: '已保存', icon: 'none' });
  };
  
  return {
    mode,
    modes,
    activeSlider,
    tooltipLeft,
    simpleSliders,
    onSliding,
    onSlideEnd,
    resetAll,
    initModelState,
    savePreset,
  };
}
