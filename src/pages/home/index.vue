<template>
  <view class="home-container">
    <view class="home">
      <!-- 顶部安全区 -->
      <view class="safe-top" :style="{ height: statusBarHeight + 'px' }"></view>

      <!-- 头部 -->
      <view class="header">
        <view class="brand-pill">BETA 1.0</view>
        <text class="title">BODY LAB</text>
        <text class="subtitle">体态实验室 · 3D 可视化</text>
      </view>

      <!-- 功能卡片 -->
      <view class="cards">
        <view class="card main-card" @click="goToLab">
          <view class="card-bg-glow"></view>
          <view class="card-content">
            <view class="card-icon-box">
              <text class="card-icon">🧬</text>
            </view>
            <view class="card-info">
              <text class="card-title">开始构建</text>
              <text class="card-desc">建立您的 3D 人体模型</text>
            </view>
            <view class="card-arrow-box">
              <text class="card-arrow">→</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 免责声明 -->
      <scroll-view class="disclaimer" scroll-y>
        <view class="disclaimer-content">
          <text class="disclaimer-header">使用须知</text>

          <view class="info-group">
            <view class="info-item">
              <text class="info-icon">⚖️</text>
              <view class="info-box">
                <text class="info-title">非医疗诊断工具</text>
                <text class="info-text"
                  >模型基于通用算法 (BMI 等) 估算，仅供视觉参考。严禁用于医疗诊断或处方依据。</text
                >
              </view>
            </view>

            <view class="info-item">
              <text class="info-icon">👁️</text>
              <view class="info-box">
                <text class="info-title">视觉极限预警</text>
                <text class="info-text">极端参数通过算法生成，可能产生不自然的视觉效果 (穿模/扭曲)，请适度调节。</text>
              </view>
            </view>

            <view class="info-item">
              <text class="info-icon">⚡</text>
              <view class="info-box">
                <text class="info-title">高性能需求</text>
                <text class="info-text">WebGL 实时渲染消耗算力，长时间使用可能导致设备发热，建议开启性能模式。</text>
              </view>
            </view>
          </view>

          <view class="footer-spacer"></view>
        </view>
      </scroll-view>

      <view class="footer-bar">
        <text class="footer-text">Copyright © 2024 BodyLab Pro</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from "vue";

const statusBarHeight = ref(20);

onMounted(() => {
  try {
    const sysInfo = uni.getSystemInfoSync();
    statusBarHeight.value = sysInfo.statusBarHeight || 20;
  } catch (e) {}
});

const goToLab = () => {
  uni.navigateTo({ url: "/pages/lab/index" });
};
</script>

<style scoped>
/* 全局容器：适配 PC 居中 */
.home-container {
  min-height: 100vh;
  background: #0f1115;
  display: flex;
  justify-content: center;
  align-items: center; /* 增加在大屏时的垂直居中 */
}

.home {
  width: 100%;
  /* 基础样式不强制 max-width，由媒体查询控制 */
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1d24 0%, #0f1115 100%);
  display: flex;
  flex-direction: column;
  color: #fff;
  position: relative;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

/* 移动端默认样式 (通常竖屏) */
@media screen and (max-width: 767px) {
  .home {
    max-width: 480px;
  }
}

/* Pad 和 PC 端宽屏适配 */
@media screen and (min-width: 768px) {
  .home {
    max-width: min(1200px, 90vw); /* 放宽最大宽度 */
    height: 90vh; /* 桌面端视窗感 */
    max-height: 900px;
    border-radius: 24px; /* 增加圆角 */
    border: 1px solid rgba(255, 255, 255, 0.05);

    /* Grid 布局 */
    display: grid;
    grid-template-columns: 380px 1fr;
    grid-template-rows: auto auto 1fr;
    grid-template-areas:
      "header list"
      "cards list"
      "footer list";
    gap: 0 40px;
    padding: 40px;
    box-sizing: border-box; /* 确保 padding 包含在尺寸内 */
  }

  /* 隐藏不需要的移动端元素 */
  .safe-top {
    display: none;
  }
  .brand-pill {
    margin-top: 10px;
  }

  /* 调整各区域位置 */
  .header {
    grid-area: header;
    padding: 0;
    margin-bottom: 20px;
  }

  .cards {
    grid-area: cards;
    padding: 0;
  }

  .disclaimer {
    grid-area: list;
    height: 100%;
    overflow: hidden; /* 内部滚动 */
    background: rgba(255, 255, 255, 0.02);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.02);
  }

  .disclaimer-content {
    height: 100%;
    box-sizing: border-box;
    /* 在大屏下让 disclaimer 里的内容也更紧凑或更好看 */
  }

  .footer-bar {
    grid-area: footer;
    align-self: end;
    text-align: left;
    padding: 0;
    border-top: none;
    background: transparent;
  }
}

.safe-top {
  flex-shrink: 0;
}

.header {
  padding: 40px 30px 30px;
  flex-shrink: 0;
}

.brand-pill {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
  color: #88ccff;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.title {
  display: block;
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -1px;
  margin-bottom: 8px;
  background: linear-gradient(120deg, #fff 0%, #a0aab9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  display: block;
  font-size: 15px;
  color: #6c7689;
  font-weight: 500;
}

.cards {
  padding: 0 24px;
  flex-shrink: 0;
}

.card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  transition: transform 0.2s;
}

.card:active {
  transform: scale(0.98);
}

.main-card {
  background: linear-gradient(135deg, #2b3240 0%, #1e222b 100%);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-bg-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.15) 0%, transparent 60%);
  opacity: 0.6;
  pointer-events: none;
}

.card-content {
  position: relative;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1;
}

.card-icon-box {
  width: 56px;
  height: 56px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-icon {
  font-size: 28px;
}

.card-info {
  flex: 1;
}

.card-title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.card-desc {
  display: block;
  font-size: 13px;
  color: #8da0b6;
}

.card-arrow-box {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3a86ff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(58, 134, 255, 0.3);
}

.card-arrow {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.disclaimer {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.disclaimer-content {
  padding: 30px 24px;
}

.disclaimer-header {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.info-icon {
  font-size: 20px;
  padding-top: 2px;
}

.info-box {
  flex: 1;
}

.info-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 6px;
}

.info-text {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.footer-spacer {
  height: 40px;
}

.footer-bar {
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  background: #0f1115; /* Ensure background to cover scrolling content if z-indexed */
  z-index: 10;
}

.footer-text {
  font-size: 10px;
  color: #4b5563;
}
</style>
