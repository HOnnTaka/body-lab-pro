/**
 * 相机控制器 - 类似 Blender 的操作模式
 * 1. 旋转围绕"屏幕中心"（即相机的 Target 点）
 * 2. 平移会移动 Target 点，从而改变旋转中心
 * 3. 缩放调整相机与 Target 的距离
 * 4. 动态灵敏度：缩放越近，平移越慢
 */

// #ifdef H5
import * as THREE from 'three';
// #endif
// #ifndef H5
import * as THREE from 'three-platformize';
// #endif

export function createCameraController(camera) {
  // 核心状态
  const target = new THREE.Vector3(0, 0.9, 0); // 旋转中心/观察目标
  const defaultTarget = new THREE.Vector3(0, 0.9, 0);
  
  // 球面坐标状态 (相对 target)
  let radius = 2.5;         // 距离
  let theta = 0;           // 水平角 (Azimuth)
  let phi = Math.PI / 2;   // 垂直角 (Polar)
  
  // 默认状态记录
  let defaultRadius = 2.5;
  let defaultTheta = 0;
  let defaultPhi = Math.PI / 2;

  // 配置参数
  const MIN_RADIUS = 0.2;
  const MAX_RADIUS = 10.0;
  const MIN_PHI = 0.1;
  const MAX_PHI = Math.PI - 0.1;
  
  // 辅助向量 (避免每帧创建)
  const offset = new THREE.Vector3();
  const panOffset = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();

  // 更新相机位置
  const update = () => {
    if (!camera) return;

    // 1. 限制范围
    radius = Math.max(MIN_RADIUS, Math.min(MAX_RADIUS, radius));
    phi = Math.max(MIN_PHI, Math.min(MAX_PHI, phi));

    // 2. 球面坐标转笛卡尔偏移
    // standard spherical conversion
    // y is up in Three.js
    const sinPhiRadius = radius * Math.sin(phi);
    offset.x = sinPhiRadius * Math.sin(theta);
    offset.y = radius * Math.cos(phi);
    offset.z = sinPhiRadius * Math.cos(theta);

    // 3. 应用位置: Target + Offset
    camera.position.copy(target).add(offset);

    // 4. 看向 Target
    camera.lookAt(target);
    
    // 确保矩阵更新
    camera.updateMatrix();
    if (camera.updateMatrixWorld) camera.updateMatrixWorld();
  };

  // 旋转 (Orbit)
  const rotate = (deltaX, deltaY) => {
    // 降低旋转灵敏度
    theta -= deltaX * 0.005; // 左右拖动改变水平角
    phi -= deltaY * 0.005;   // 上下拖动改变垂直角
    update();
  };

  // 缩放 (Dolly)
  const zoom = (factor) => {
    // factor > 1 放大(拉近), factor < 1 缩小(拉远)
    // 这里的 factor 传入通常是增量，比如 1.1 或 0.9
    // 或者传入 delta，这里假设传入的是 scale multiplier
    
    // 降低缩放灵敏度
    // 如果 factor 是 0.95 (缩小), newRadius = radius / 0.95 = larger
    // 如果 factor 是 1.05 (放大), newRadius = radius / 1.05 = smaller
    
    // 平滑处理: 实际上通常传入 delta
    // 我们假设外部传入的是 scale factor (e.g. 1.02 or 0.98)
    
    // 为了更平滑，我们对 factor 进行衰减
    // targetFactor = 1 + (factor - 1) * sensitivity
    const s = 0.6; // 降低缩放速度
    const effectiveFactor = 1 + (factor - 1) * s;
    
    radius /= effectiveFactor;
    update();
  };

  // 平移 (Pan) - 类似 Blender Shift+Middle
  const pan = (deltaX, deltaY) => {
    if (!camera) return;
    
    // 关键优化：平移灵敏度随距离(radius)变化
    // 距离越近，平移越慢
    const panSpeed = radius * 0.001; // 降低灵敏度 (原 0.002)
    
    // 获取相机当前的右向量和上向量
    cameraRight.setFromMatrixColumn(camera.matrix, 0); // Local X
    cameraUp.setFromMatrixColumn(camera.matrix, 1);    // Local Y (Screen Up)
    
    panOffset.set(0, 0, 0);
    panOffset.addScaledVector(cameraRight, -deltaX * panSpeed);
    panOffset.addScaledVector(cameraUp, deltaY * panSpeed);
    
    target.add(panOffset);
    update();
  };

  // 适配模型
  const fitToModel = (object) => {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // 设置 Target 为模型中心(或偏上一点，这里根据需求调整)
    // 之前有 MODEL_CENTER_OFFSET (0, 0.05, -0.1)
    target.copy(center).add(new THREE.Vector3(0, 0.05, -0.1));
    defaultTarget.copy(target); // 记录归位点
    
    // 计算最佳距离
    const fov = camera.fov * (Math.PI / 180);
    // 0.8 是填充系数，留白
    const distance_fit = (maxDim / 2) / Math.tan(fov / 2);
    
    // 稍微离远一点
    radius = distance_fit * 1.5;
    defaultRadius = radius;
    
    // 重置角度
    theta = defaultTheta;
    phi = defaultPhi;
    
    update();
  };

  const reset = () => {
    radius = defaultRadius;
    theta = defaultTheta;
    phi = defaultPhi;
    target.copy(defaultTarget);
    update();
  };

  return {
    update,
    fitToModel,
    reset,
    rotate,
    zoom,
    pan,
    // Getters
    get distance() { return radius; },
    set distance(v) { radius = v; update(); },
    get theta() { return theta; },
    set theta(v) { theta = v; update(); },
    get phi() { return phi; },
    set phi(v) { phi = v; update(); },
  };
}
