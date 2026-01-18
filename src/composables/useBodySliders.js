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
  
  // 简易模式滑块
  const simpleSliders = reactive([
    { key: 'gender', label: '性像', value: 0 },
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
    
    if (!model?.updateBlendShape) return;
    // gender 是 0-100 映射到 0-1，其他是 0-100 映射到 -1 到 1
    const normalized = slider.key === 'gender' 
      ? value / 100 
      : (value - 50) / 50;
    model.updateBlendShape(slider.key, normalized);
  };
  
  // 滑块拖动结束
  const onSlideEnd = (slider, value, model) => {
    slider.value = value;
    activeSlider.value = null;
    
    if (!model?.updateBlendShape) return;
    const normalized = slider.key === 'gender' 
      ? value / 100 
      : (value - 50) / 50;
    model.updateBlendShape(slider.key, normalized);
  };
  
  // 重置所有滑块
  const resetAll = (model) => {
    simpleSliders.forEach(s => {
      s.value = s.key === 'gender' ? 0 : 50;
      if (model?.updateBlendShape) {
        model.updateBlendShape(s.key, 0);
      }
    });
  };
  
  // 初始化模型状态（将当前滑块值同步到模型）
  const initModelState = (model) => {
    if (!model?.updateBlendShape) return;
    simpleSliders.forEach(s => {
      const normalized = s.key === 'gender' 
        ? s.value / 100 
        : (s.value - 50) / 50;
      model.updateBlendShape(s.key, normalized);
    });
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
