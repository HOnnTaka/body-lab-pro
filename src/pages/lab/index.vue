<template>
  <view class="app" :class="panel.layoutClass.value">
    <!-- 3D 画布 -->
    <view class="canvas-layer">
      <!-- #ifdef H5 -->
      <view class="canvas-wrap" id="canvasWrap"></view>
      <!-- #endif -->
      <!-- #ifndef H5 -->
      <canvas 
        type="webgl" 
        id="webglCanvas" 
        class="webgl-canvas"
        @touchstart="mpTouch.onTouchStart"
        @touchmove="mpTouch.onTouchMove"
        @touchend="mpTouch.onTouchEnd"
      ></canvas>
      <!-- #endif -->

      <view v-if="isLoading" class="loader">
        <view class="loader-ring"></view>
        <text class="loader-text">{{ loadingText }}</text>
        <view v-if="loadProgress > 0 && loadProgress < 100" class="progress-bar">
          <view class="progress-fill" :style="{ width: loadProgress + '%' }"></view>
        </view>
      </view>

      <!-- 顶部栏 -->
      <view class="top-bar" :style="safeArea.topBarStyle.value">
        <view class="top-left">
          <view class="back-btn" @click="goBack">
            <text class="back-arrow">←</text>
          </view>
        </view>
        <text class="logo">BODY LAB</text>
        <view class="top-actions">
          <!-- #ifdef MP-WEIXIN -->
          <view class="menu-placeholder"></view>
          <!-- #endif -->
          <!-- #ifndef MP-WEIXIN -->
          <view class="icon-btn" :class="{ on: autoRotate }" @click="autoRotate = !autoRotate">
            {{ autoRotate ? '⏸' : '▶' }}
          </view>
          <view class="icon-btn" @click="cameraCtrl?.reset()">↻</view>
          <!-- #endif -->
        </view>
      </view>
      
      <!-- #ifdef MP-WEIXIN -->
      <!-- 小程序：控制按钮放胶囊下方 -->
      <view class="mp-actions" :style="{ top: mpActionsTop + 'px' }">
        <view class="icon-btn" :class="{ on: autoRotate }" @click="autoRotate = !autoRotate">
          {{ autoRotate ? '⏸' : '▶' }}
        </view>
        <view class="icon-btn" @click="cameraCtrl?.reset()">↻</view>
      </view>
      <!-- #endif -->
    </view>

    <!-- 控制面板 -->
    <view class="panel" :class="{ collapsed: panel.collapsed.value, dragging: panel.isDragging.value }" :style="panel.style.value">
      <view v-if="panel.layout.value === 'stack'" class="panel-header" 
        @touchstart="panel.onDragStart" @touchmove="panel.onDragMove" @touchend="panel.onDragEnd" 
        @mousedown="panel.onMouseDragStart">
        <view class="drag-bar"></view>
      </view>

      <view v-if="panel.layout.value === 'float'" class="panel-toggle" @click="panel.collapsed.value = !panel.collapsed.value">
        <text class="toggle-icon">{{ panel.collapsed.value ? '◀' : '▶' }}</text>
        <text class="toggle-text">{{ panel.collapsed.value ? '展开' : '收起' }}</text>
      </view>

      <view class="panel-content">
        <view class="modes">
          <view v-for="m in sliders.modes" :key="m.key" class="mode-item" 
            :class="{ active: sliders.mode.value === m.key }" @click="sliders.mode.value = m.key">
            {{ m.label }}
          </view>
        </view>

        <scroll-view class="sliders-wrap" scroll-y>
          <view class="sliders">
            <template v-if="sliders.mode.value === 'simple'">
              <view v-for="s in sliders.simpleSliders" :key="s.key" class="slider-row">
                <text class="s-label">{{ s.label }}</text>
                <view class="slider-container">
                  <slider :value="s.value" :min="0" :max="100" :step="1" 
                    activeColor="#3a86ff" backgroundColor="rgba(255,255,255,0.1)" block-color="#fff" :block-size="20" :show-value="false"
                    @changing="e => sliders.onSliding(s, e.detail.value, model)"
                    @change="e => sliders.onSlideEnd(s, e.detail.value, model)" />
                  <view v-if="sliders.activeSlider.value === s.key" class="slider-tooltip" :style="{ left: sliders.tooltipLeft.value }">
                    {{ s.value }}
                  </view>
                </view>
                <text class="s-val">{{ s.value }}</text>
              </view>
            </template>
            <template v-else>
              <view class="coming-soon">
                <text class="coming-icon">🚧</text>
                <text class="coming-text">{{ sliders.mode.value === 'normal' ? '普通' : '高级' }}模式开发中</text>
                <text class="coming-desc">敬请期待更多体型控制选项</text>
              </view>
            </template>
          </view>
        </scroll-view>

        <view class="actions">
          <button class="btn ghost" @click="onReset">重置</button>
          <button class="btn fill" @click="sliders.savePreset">保存预设</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
// #ifdef H5
import * as THREE from 'three';
// #endif
// #ifndef H5
import * as THREE from 'three-platformize';
import { WechatPlatform } from 'three-platformize/src/WechatPlatform';
// #endif

import { createDemoBodyModel, createDemoScene, createStudioLighting, loadBodyModel } from '../../utils/demoModel.js';
import { createCameraController } from '../../utils/cameraController.js';
import { setupH5Touch, createMiniProgramTouchHandler } from '../../utils/touchHandler.js';
import { usePanel } from '../../composables/usePanel.js';
import { useSafeArea } from '../../composables/useSafeArea.js';
import { useBodySliders } from '../../composables/useBodySliders.js';

// 模型路径
const CDN_URL = 'https://mp-3f56fc6a-bbec-4426-a407-1bcc974e221a.cdn.bspapp.com/body_simple_origin.glb';
// #ifdef H5
// H5 使用 static 目录下的本地模型文件
const MODEL_URL = '/static/models/body_simple_origin.glb';
// #endif
// #ifndef H5
// 小程序使用 CDN（带缓存）
const MODEL_URL = CDN_URL;
// #endif

// 工具函数
const getWindowInfo = () => {
  try { return uni.getWindowInfo(); } 
  catch { return { windowWidth: 375, windowHeight: 667 }; }
};

const goBack = () => {
  uni.navigateBack();
};

// 组合式函数
const panel = usePanel(getWindowInfo);
const safeArea = useSafeArea(getWindowInfo);
const sliders = useBodySliders();

// 小程序按钮位置（胶囊下方）
const mpActionsTop = computed(() => {
  if (safeArea.menuButtonInfo.value) {
    const { bottom } = safeArea.menuButtonInfo.value;
    return bottom + 12;
  }
  return 60;
});

// 3D 状态
const isLoading = ref(true);
const loadingText = ref('初始化...');
const loadProgress = ref(0);
const autoRotate = ref(true);

let scene, camera, renderer, model, canvas, animationId, glCanvas;
let cameraCtrl = null;
let mpTouch = { onTouchStart: () => {}, onTouchMove: () => {}, onTouchEnd: () => {} };
let cleanupTouch = null;

// 生命周期
onMounted(() => {
  safeArea.init();
  panel.updateLayout();
  // #ifdef H5
  window.addEventListener('resize', onResize);
  initThreeH5();
  // #endif
  // #ifndef H5
  initThreeMiniProgram();
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener('resize', onResize);
  cleanupTouch?.();
  // #endif
  if (animationId) cancelAnimationFrame(animationId);
  renderer?.dispose();
});

const onResize = () => {
  panel.updateLayout();
  resizeCanvas();
};

const resizeCanvas = () => {
  // #ifdef H5
  if (!renderer || !camera) return;
  const wrap = document.getElementById('canvasWrap');
  if (!wrap) return;
  const { width, height } = wrap.getBoundingClientRect();
  if (width <= 0 || height <= 0) return;
  
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  renderer.setSize(width, height);
  renderer.setPixelRatio(dpr);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  // #endif
};

// H5 初始化
const initThreeH5 = async () => {
  // #ifdef H5
  try {
    const wrap = document.getElementById('canvasWrap');
    const { width, height } = wrap.getBoundingClientRect();

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
    wrap.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1; // 稍微提高曝光，增强光影对比
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = createDemoScene();
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    cameraCtrl = createCameraController(camera);

    // 使用统一的 Studio 光照
    createStudioLighting(scene);

    // 加载模型
    loadingText.value = '加载模型...';
    try {
      model = await loadBodyModel(MODEL_URL, (p) => {
        loadProgress.value = p;
        loadingText.value = `加载模型 ${p}%`;
      });
      scene.add(model);
      cameraCtrl.fitToModel(model);
      sliders.initModelState(model);
    } catch (e) {
      console.error('模型加载失败:', e);
      uni.showToast({ title: '模型下载失败，使用替代模型', icon: 'none', duration: 3000 });
      model = createDemoBodyModel();
      scene.add(model);
      cameraCtrl.fitToModel(model);
      sliders.initModelState(model);
    }

    cleanupTouch = setupH5Touch(canvas, cameraCtrl, { onInteract: () => autoRotate.value = false });
    animate();
    isLoading.value = false;
  } catch (e) {
    console.error('H5 init error:', e);
    loadingText.value = '初始化失败';
  }
  // #endif
};

// 小程序初始化
const initThreeMiniProgram = () => {
  // #ifndef H5
  const query = uni.createSelectorQuery();
  query.select('#webglCanvas').node().exec(async (res) => {
    if (!res?.[0]?.node) {
      loadingText.value = '画布初始化失败';
      return;
    }

    glCanvas = res[0].node;
    const { windowWidth, windowHeight } = getWindowInfo();
    const sysInfo = uni.getSystemInfoSync();
    const dpr = sysInfo.pixelRatio || 1;
    
    glCanvas.width = windowWidth * dpr;
    glCanvas.height = windowHeight * dpr;

    try {
      const platform = new WechatPlatform(glCanvas);
      THREE.PLATFORM.set(platform);

      const gl = glCanvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true });
      if (!gl) throw new Error('无法获取 WebGL 上下文');

      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, context: gl, antialias: true, alpha: true });
      renderer.setPixelRatio(dpr);
      renderer.setSize(windowWidth, windowHeight, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1; // 与 H5 保持一致
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, windowWidth / windowHeight, 0.1, 100);
      cameraCtrl = createCameraController(camera);

      // 使用统一的 Studio 光照
      createStudioLighting(scene);

      // 加载模型
      loadingText.value = '加载模型...';
      try {
        model = await loadBodyModel(MODEL_URL, (p) => {
          loadProgress.value = p;
          loadingText.value = `加载模型 ${p}%`;
        });
        scene.add(model);
        cameraCtrl.fitToModel(model);
        sliders.initModelState(model);
      } catch (e) {
        loadingText.value = '加载失败: ' + e.message;
        return;
      }

      mpTouch = createMiniProgramTouchHandler(cameraCtrl, { onInteract: () => autoRotate.value = false });
      animateMiniProgram();
      isLoading.value = false;
    } catch (e) {
      loadingText.value = '3D引擎初始化失败: ' + e.message;
    }
  });
  // #endif
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  if (autoRotate.value) cameraCtrl.theta += 0.003;
  cameraCtrl.update();
  renderer?.render(scene, camera);
};

const animateMiniProgram = () => {
  // #ifndef H5
  glCanvas.requestAnimationFrame(animateMiniProgram);
  if (autoRotate.value) cameraCtrl.theta += 0.003;
  cameraCtrl.update();
  renderer?.render(scene, camera);
  // #endif
};

const onReset = () => {
  sliders.resetAll(model);
  uni.showToast({ title: '已重置', icon: 'none' });
};
</script>

<style scoped>
.app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 50% 40%, #2b3240 0%, #0f1115 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #fff;
}

/* 画布层 */
.canvas-layer { position: absolute; inset: 0; }
.canvas-wrap, .webgl-canvas { width: 100%; height: 100%; }

.loader {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #0f1115;
  z-index: 100;
  transition: opacity 0.5s;
}
.loader-ring {
  width: 32px; height: 32px;
  border: 2px solid rgba(255,255,255,0.1); border-top-color: #3a86ff; border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loader-text { margin-top: 16px; font-size: 12px; color: #8da0b6; letter-spacing: 1px; }
.progress-bar {
  width: 120px; height: 2px; margin-top: 16px;
  background: rgba(255,255,255,0.1); border-radius: 1px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: #3a86ff; border-radius: 1px;
  transition: width 0.2s ease;
}

/* 顶部栏 */
.top-bar {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; box-sizing: border-box;
  pointer-events: none;
  z-index: 50;
}
/* #ifdef H5 */
.top-bar { padding-top: calc(12px + env(safe-area-inset-top)); }
/* #endif */
.menu-placeholder { width: 90px; flex-shrink: 0; }
.top-left { pointer-events: auto; flex-shrink: 0; width: 80px; }
.logo { pointer-events: auto; font-size: 14px; font-weight: 800; color: #fff; letter-spacing: 1px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.top-actions { pointer-events: auto; display: flex; gap: 12px; min-width: 40px; justify-content: flex-end; }

.back-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.1); border-radius: 50%;
  backdrop-filter: blur(10px); cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.2s;
}
.back-btn:active { background: rgba(255,255,255,0.2); transform: scale(0.95); }
.back-arrow { font-size: 18px; color: #fff; }

.icon-btn {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.1); border-radius: 50%;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  font-size: 14px; color: #eee; cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:active { background: rgba(255,255,255,0.2); transform: scale(0.95); }
.icon-btn.on { background: #3a86ff; border-color: #3a86ff; color: #fff; box-shadow: 0 0 15px rgba(58, 134, 255, 0.4); }

/* 小程序按钮组 */
.mp-actions {
  position: absolute;
  right: 16px;
  display: flex;
  gap: 12px;
  z-index: 50;
  pointer-events: auto;
}

/* 控制面板 */
.panel {
  position: absolute;
  background: rgba(30,34,43,0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  display: flex; flex-direction: column;
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.4); 
  z-index: 100;
  border: 1px solid rgba(255,255,255,0.05);
}
.panel-content { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }

/* 堆叠布局 - 窄屏 */
.layout-stack .panel {
  bottom: 0; left: 0; right: 0; height: 45%;
  border-radius: 24px 24px 0 0;
  border-bottom: none;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.layout-stack .panel.dragging { transition: none; }
.layout-stack .panel.collapsed { transform: translateY(calc(100% - 32px)); }
.layout-stack .canvas-layer { height: 100%; }

.panel-header {
  display: flex; align-items: center; justify-content: center;
  padding: 12px 0; cursor: ns-resize; touch-action: none;
  border-radius: 24px 24px 0 0; user-select: none;
}
.panel-header .drag-bar { width: 40px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; }
.panel-header:active .drag-bar { background: rgba(255,255,255,0.4); }

/* 浮动布局 */
.layout-float .panel {
  top: 90px; right: 20px; bottom: 20px; width: 320px;
  border-radius: 20px;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.layout-float .panel.collapsed { transform: translateX(calc(100% + 24px)); }
.panel-toggle {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; font-size: 13px; color: #fff; cursor: pointer;
  background: rgba(30,34,43,0.9); backdrop-filter: blur(20px); flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.05);
}
.layout-float .panel-toggle {
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%) translateX(-100%);
  flex-direction: column; padding: 16px 8px;
  border-radius: 12px 0 0 12px; border-right: none;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
}
.layout-float .toggle-text { writing-mode: vertical-rl; font-size: 13px; letter-spacing: 2px; }

/* 侧边布局 */
.layout-side .panel {
  top: 0; right: 0; bottom: 0; width: 360px;
  border-radius: 0; box-shadow: -4px 0 30px rgba(0, 0, 0, 0.3);
  border: none; border-left: 1px solid rgba(255,255,255,0.05);
}
.layout-side .panel-toggle { display: none; }
.layout-side .canvas-layer { right: 360px; }

/* 面板内容 */
.modes { display: flex; gap: 8px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.mode-item {
  flex: 1; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #8da0b6; background: rgba(255,255,255,0.05);
  border-radius: 10px; cursor: pointer; transition: all 0.2s;
  font-weight: 500;
}
.mode-item.active { background: #3a86ff; color: #fff; box-shadow: 0 4px 12px rgba(58, 134, 255, 0.3); }

.sliders-wrap { flex: 1; min-height: 0; }
.sliders { padding: 20px; }
.slider-row { display: flex; align-items: center; gap: 16px; margin-top: 24px; min-height: 44px; }
.s-label { width: 52px; font-size: 14px; color: #cbd5e1; flex-shrink: 0; font-weight: 500; }
.slider-container { flex: 1; position: relative; padding: 8px 0; }
.slider-container slider { width: 100%; margin: 0; }
.slider-tooltip {
  position: absolute; top: -32px; transform: translateX(-50%);
  background: #3a86ff; color: #fff; font-size: 12px; padding: 4px 10px;
  border-radius: 6px; white-space: nowrap; pointer-events: none; z-index: 10;
  font-weight: 600; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.slider-tooltip::after {
  content: ''; position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%);
  border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #3a86ff;
}
.s-val { width: 32px; font-size: 13px; color: #8da0b6; text-align: right; font-variant-numeric: tabular-nums; flex-shrink: 0; }

.actions {
  display: flex; gap: 12px; padding: 16px 20px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255,255,255,0.05);
}
.btn {
  flex: 1; height: 44px; border-radius: 12px;
  font-size: 14px; font-weight: 600; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.btn.ghost { background: rgba(255,255,255,0.05); color: #cbd5e1; }
.btn.ghost:hover { background: rgba(255,255,255,0.1); }
.btn.fill { background: #3a86ff; color: #fff; box-shadow: 0 4px 12px rgba(58, 134, 255, 0.3); }
.btn.fill:hover { background: #2d75e8; }
.btn:active { transform: scale(0.98); }

.coming-soon {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 20px; text-align: center;
  opacity: 0.5;
}
.coming-icon { font-size: 48px; margin-bottom: 16px; filter: grayscale(1); }
.coming-text { font-size: 16px; font-weight: 500; color: #fff; margin-bottom: 8px; }
.coming-desc { font-size: 13px; color: #8da0b6; }
</style>
