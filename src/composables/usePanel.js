/**
 * 控制面板状态管理
 */
import { ref, computed } from 'vue';

export function usePanel(getWindowInfo) {
  const layout = ref('stack'); // stack | float
  const collapsed = ref(false);
  const height = ref(42); // 百分比
  const isDragging = ref(false);
  
  let dragStartY = 0;
  let dragStartHeight = 0;
  
  const layoutClass = computed(() => `layout-${layout.value}`);
  
  const style = computed(() => {
    if (layout.value === 'stack') {
      return { height: `${height.value}%` };
    }
    return {};
  });
  
  // 更新布局：窄屏堆叠，宽屏浮动
  const updateLayout = () => {
    const { windowWidth: w } = getWindowInfo();
    if (w < 600) {
      layout.value = 'stack';
    } else {
      layout.value = 'float';
      collapsed.value = false;
    }
  };
  
  // 触摸拖动开始
  const onDragStart = (e) => {
    isDragging.value = true;
    dragStartY = e.touches[0].clientY;
    
    if (collapsed.value) {
      const { windowHeight } = getWindowInfo();
      const collapsedPercent = (28 / windowHeight) * 100;
      height.value = collapsedPercent;
      collapsed.value = false;
      dragStartHeight = collapsedPercent;
    } else {
      dragStartHeight = height.value;
    }
  };
  
  // 触摸拖动中
  const onDragMove = (e) => {
    if (!isDragging.value) return;
    e.preventDefault?.();
    
    const currentY = e.touches[0].clientY;
    const { windowHeight } = getWindowInfo();
    const deltaPercent = ((dragStartY - currentY) / windowHeight) * 100;
    height.value = Math.min(85, Math.max(5, dragStartHeight + deltaPercent));
  };
  
  // 触摸拖动结束
  const onDragEnd = () => {
    isDragging.value = false;
    if (height.value < 20) {
      collapsed.value = true;
    }
  };
  
  // 鼠标拖动
  const onMouseDragStart = (e) => {
    e.preventDefault();
    isDragging.value = true;
    dragStartY = e.clientY;
    
    if (collapsed.value) {
      const { windowHeight } = getWindowInfo();
      const collapsedPercent = (28 / windowHeight) * 100;
      height.value = collapsedPercent;
      collapsed.value = false;
      dragStartHeight = collapsedPercent;
    } else {
      dragStartHeight = height.value;
    }
    
    const onMove = (ev) => {
      if (!isDragging.value) return;
      const { windowHeight } = getWindowInfo();
      const deltaPercent = ((dragStartY - ev.clientY) / windowHeight) * 100;
      height.value = Math.min(85, Math.max(5, dragStartHeight + deltaPercent));
    };
    
    const onUp = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      if (height.value < 15) {
        collapsed.value = true;
      }
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
  
  return {
    layout,
    collapsed,
    height,
    isDragging,
    layoutClass,
    style,
    updateLayout,
    onDragStart,
    onDragMove,
    onDragEnd,
    onMouseDragStart,
  };
}
