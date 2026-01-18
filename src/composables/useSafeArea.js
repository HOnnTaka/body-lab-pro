/**
 * 安全区域适配
 */
import { ref, computed } from 'vue';

export function useSafeArea(getWindowInfo) {
  const statusBarHeight = ref(0);
  const menuButtonInfo = ref(null);
  
  // 初始化安全区域
  const init = () => {
    try {
      const sysInfo = uni.getSystemInfoSync();
      statusBarHeight.value = sysInfo.statusBarHeight || 0;
      
      // #ifdef MP-WEIXIN
      const menuButton = uni.getMenuButtonBoundingClientRect();
      if (menuButton) {
        menuButtonInfo.value = menuButton;
      }
      // #endif
      
      // #ifdef APP-PLUS
      statusBarHeight.value = sysInfo.statusBarHeight || 25;
      // #endif
    } catch (e) {
      console.warn('获取安全区域信息失败:', e);
      statusBarHeight.value = 20;
    }
  };
  
  // 顶部栏样式
  const topBarStyle = computed(() => {
    // #ifdef MP-WEIXIN
    if (menuButtonInfo.value) {
      const { top, height, right } = menuButtonInfo.value;
      const { windowWidth } = getWindowInfo();
      return {
        paddingTop: `${top}px`,
        paddingRight: `${windowWidth - right + 10}px`,
        height: `${top + height + 8}px`
      };
    }
    // #endif
    return {
      paddingTop: `${statusBarHeight.value + 8}px`
    };
  });
  
  return {
    statusBarHeight,
    menuButtonInfo,
    topBarStyle,
    init,
  };
}
