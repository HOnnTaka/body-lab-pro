/**
 * 相机控制器 - 球面坐标系统 + 平移
 * 旋转始终围绕模型中心，平移不影响旋转中心
 */

// #ifdef H5
import * as THREE from 'three';
// #endif
// #ifndef H5
import * as THREE from 'three-platformize';
// #endif

export function createCameraController(camera) {
  // 相机状态
  let distance = 1;
  let theta = 0;        // 水平角度
  let phi = Math.PI / 2; // 垂直角度
  let defaultDistance = 2;
  
  // 旋转中心（模型中心，不受平移影响）
  const rotationCenter = new THREE.Vector3(0, 100, 0);
  const defaultRotationCenter = new THREE.Vector3(0, 0, 0);
  
  // 模型中心偏移参数（在此处调整模型旋转中心）
  const MODEL_CENTER_OFFSET = new THREE.Vector3(0, 0.05, -0.1);
  
  // 屏幕空间平移偏移 (Lens Shift)
  const screenPanOffset = { x: 0, y: 0 };
  
  // 更新相机位置
  const update = () => {
    if (!camera) return;
    
    // 限制角度和距离
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    distance = Math.max(0.5, Math.min(10, distance));
    
    // 球面坐标转笛卡尔坐标（围绕旋转中心）
    const x = distance * Math.sin(phi) * Math.sin(theta);
    const y = distance * Math.cos(phi);
    const z = distance * Math.sin(phi) * Math.cos(theta);
    
    // 相机位置 = 旋转中心 + 球面偏移
    // 注意：不再叠加 panOffset 到 position，而是使用投影偏移
    camera.position.set(
      rotationCenter.x + x,
      rotationCenter.y + y,
      rotationCenter.z + z
    );
    
    // 相机始终看向旋转中心
    camera.lookAt(rotationCenter);
    
    // 应用屏幕平移 (修改投影矩阵实现 Lens Shift)
    // 这能让模型在屏幕上移动，但旋转依然围绕模型中心
    camera.updateProjectionMatrix(); // 重置矩阵
    if (camera.projectionMatrix) {
      // elements[8] 是 x 轴切变 (NDC空间)
      // elements[9] 是 y 轴切变 (NDC空间)
      camera.projectionMatrix.elements[8] = -screenPanOffset.x;
      camera.projectionMatrix.elements[9] = -screenPanOffset.y;
    }
  };
  
  // 根据模型自动适配相机
  const fitToModel = (object) => {
    if (!camera) return;
    
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // 设置旋转中心为模型中心 + 偏移
    rotationCenter.copy(center).add(MODEL_CENTER_OFFSET);
    defaultRotationCenter.copy(rotationCenter);
    
    // 重置平移
    screenPanOffset.x = 0;
    screenPanOffset.y = 0;
    
    const fov = camera.fov * (Math.PI / 180);
    distance = (maxDim / 2) / Math.tan(fov / 2) * 0.8;
    defaultDistance = distance;
    
    update();
  };
  
  // 重置视角
  const reset = () => {
    distance = defaultDistance;
    theta = 0;
    phi = Math.PI / 2;
    // rotationCenter 保持不变
    screenPanOffset.x = 0;
    screenPanOffset.y = 0;
    update();
  };
  
  // 旋转（围绕旋转中心）
  const rotate = (deltaTheta, deltaPhi) => {
    theta += deltaTheta;
    phi += deltaPhi;
  };
  
  // 缩放
  const zoom = (factor) => {
    distance *= factor;
  };
  
  // 平移（屏幕空间 Lens Shift）
  const pan = (deltaX, deltaY) => {
    // 灵敏度系数，根据经验值设定 (NDC空间 -1~1)
    const sensitivity = 0.001;
    
    // 累加偏移量
    screenPanOffset.x += deltaX * sensitivity;
    screenPanOffset.y -= deltaY * sensitivity;
    
  };
  
  // 设置模型中心偏移
  const setCenterOffset = (x, y, z) => {
    MODEL_CENTER_OFFSET.set(x, y, z);
    // 如果已有模型，重新校准中心
    if (rotationCenter.lengthSq() > 0) {
       // 需要重新 fitToModel 或者简单地更新 rotationCenter
       // 这里简单处理：下次 fitToModel 生效，或者手动微调
       // 实际业务中通常是 fitToModel 调用前设置好
    }
  };

  return {
    update,
    fitToModel,
    reset,
    rotate,
    zoom,
    pan,
    setCenterOffset,
    get distance() { return distance; },
    set distance(v) { distance = v; },
    get theta() { return theta; },
    set theta(v) { theta = v; },
    get phi() { return phi; },
    set phi(v) { phi = v; },
    get rotationCenter() { return rotationCenter; },
  };
}
