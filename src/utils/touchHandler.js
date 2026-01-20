/**
 * 触摸/鼠标交互处理器
 * 单指/左键拖动：旋转
 * 双指/右键拖动：平移
 * 双指捏合/滚轮：缩放
 */

// 计算两点距离
const getDistance = (t1, t2) => {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// 计算两点中心
const getCenter = (t1, t2) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
});

/**
 * 创建 H5 端触摸处理器
 */
export function setupH5Touch(canvas, controller, options = {}) {
  const { onInteract } = options;
  const rotateSensitivity = 0.008;
  
  let mode = 'none'; // none | rotate | pan
  let startX = 0, startY = 0;
  let startTheta = 0, startPhi = 0;
  let pinchDist = 0;
  let pinchCenter = { x: 0, y: 0 };
  
  const onMouseDown = (e) => {
    onInteract?.();
    startX = e.clientX;
    startY = e.clientY;
    startTheta = controller.theta;
    startPhi = controller.phi;
    
    // 右键或中键平移，左键旋转
    if (e.button === 2 || e.button === 1) {
      mode = 'pan';
    } else {
      mode = 'rotate';
    }
  };
  
  const onMouseMove = (e) => {
    if (mode === 'none') return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    if (mode === 'rotate') {
      controller.theta = startTheta - dx * rotateSensitivity;
      controller.phi = startPhi - dy * rotateSensitivity;
    } else if (mode === 'pan') {
      controller.pan(dx - (e.clientX - startX), dy - (e.clientY - startY));
      controller.pan(e.clientX - startX, e.clientY - startY);
      startX = e.clientX;
      startY = e.clientY;
    }
  };
  
  const onMouseUp = () => { mode = 'none'; };
  
  const onWheel = (e) => {
    e.preventDefault();
    // Invert zoom direction matches Blender: Scroll Up -> Zoom In
    controller.zoom(1 - e.deltaY * 0.001);
  };
  
  const onTouchStart = (e) => {
    e.preventDefault();
    onInteract?.();
    
    if (e.touches.length === 1) {
      mode = 'rotate';
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTheta = controller.theta;
      startPhi = controller.phi;
    } else if (e.touches.length === 2) {
      mode = 'pinch';
      pinchDist = getDistance(e.touches[0], e.touches[1]);
      pinchCenter = getCenter(e.touches[0], e.touches[1]);
    }
  };
  
  const onTouchMove = (e) => {
    e.preventDefault();
    
    if (mode === 'rotate' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      controller.theta = startTheta - dx * rotateSensitivity;
      controller.phi = startPhi - dy * rotateSensitivity;
    } else if (mode === 'pinch' && e.touches.length === 2) {
      // 缩放
      const dist = getDistance(e.touches[0], e.touches[1]);
      controller.zoom(pinchDist / dist);
      pinchDist = dist;
      
      // 平移
      const center = getCenter(e.touches[0], e.touches[1]);
      controller.pan(center.x - pinchCenter.x, center.y - pinchCenter.y);
      pinchCenter = center;
    }
  };
  
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) {
      mode = 'none';
    } else if (e.touches.length === 1) {
      // 从双指变单指，重新开始旋转
      mode = 'rotate';
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTheta = controller.theta;
      startPhi = controller.phi;
    }
  };
  
  // 绑定事件
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd);
  
  // 返回清理函数
  return () => {
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', e => e.preventDefault());
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
  };
}

/**
 * 创建小程序端触摸处理器
 */
export function createMiniProgramTouchHandler(controller, options = {}) {
  const { onInteract } = options;
  const rotateSensitivity = 0.008;
  
  let mode = 'none';
  let startX = 0, startY = 0;
  let startTheta = 0, startPhi = 0;
  let pinchDist = 0;
  let pinchCenter = { x: 0, y: 0 };
  
  const onTouchStart = (e) => {
    onInteract?.();
    
    if (e.touches.length === 1) {
      mode = 'rotate';
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTheta = controller.theta;
      startPhi = controller.phi;
    } else if (e.touches.length === 2) {
      mode = 'pinch';
      pinchDist = getDistance(e.touches[0], e.touches[1]);
      pinchCenter = getCenter(e.touches[0], e.touches[1]);
    }
  };
  
  const onTouchMove = (e) => {
    if (mode === 'rotate' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      controller.theta = startTheta - dx * rotateSensitivity;
      controller.phi = startPhi - dy * rotateSensitivity;
    } else if (mode === 'pinch' && e.touches.length === 2) {
      // 缩放
      const dist = getDistance(e.touches[0], e.touches[1]);
      controller.zoom(pinchDist / dist);
      pinchDist = dist;
      
      // 平移
      const center = getCenter(e.touches[0], e.touches[1]);
      controller.pan(center.x - pinchCenter.x, center.y - pinchCenter.y);
      pinchCenter = center;
    }
  };
  
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) {
      mode = 'none';
    } else if (e.touches.length === 1) {
      mode = 'rotate';
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTheta = controller.theta;
      startPhi = controller.phi;
    }
  };
  
  return { onTouchStart, onTouchMove, onTouchEnd };
}
