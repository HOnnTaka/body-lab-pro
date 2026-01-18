// 人体模型加载器 - 使用形态键控制体型

// #ifdef H5
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
// #endif
// #ifndef H5
import * as THREE from 'three-platformize';
import { GLTFLoader } from 'three-platformize/examples/jsm/loaders/GLTFLoader';
// #endif

const MORPH_MAP = {
  muscle: { max: 'Muscle_Max', min: 'Muscle_Min' },
  weight: { max: 'Weight_Max', min: 'Weight_Min' },
  height: { max: 'Height_Max', min: 'Height_Min' },
  proportion: { max: 'Proportion_Max', min: 'Proportion_Min' },
  age: { max: 'Age_Max', min: 'Age_Min' },
  gender: { max: 'Gender', min: null },
};

export async function loadBodyModel(url, onProgress) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    draco.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(draco);
    
    loader.load(
      url,
      (gltf) => processModel(gltf, resolve, reject),
      (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round(event.loaded / event.total * 100));
        }
      },
      reject
    );
    // #endif
    
    // #ifndef H5
    downloadAndParseModel(url, onProgress, resolve, reject);
    // #endif
  });
}

// #ifndef H5
function downloadAndParseModel(url, onProgress, resolve, reject) {
  const cacheFileName = 'body_model_' + url.split('/').pop();
  const cachePath = `${wx.env.USER_DATA_PATH}/${cacheFileName}`;
  const fs = wx.getFileSystemManager();
  
  fs.access({
    path: cachePath,
    success: () => {
      fs.readFile({
        filePath: cachePath,
        success: (res) => parseModelData(res.data, resolve, reject),
        fail: (err) => reject(new Error('缓存读取失败: ' + err.errMsg))
      });
    },
    fail: () => {
      wx.request({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            onProgress?.(100);
            fs.writeFile({
              filePath: cachePath,
              data: res.data,
              success: () => console.log('模型已缓存'),
              fail: () => {}
            });
            parseModelData(res.data, resolve, reject);
          } else {
            reject(new Error('下载失败: HTTP ' + res.statusCode));
          }
        },
        fail: (err) => reject(new Error('下载失败: ' + err.errMsg))
      });
    }
  });
}

function parseModelData(arrayBuffer, resolve, reject) {
  const loader = new GLTFLoader();
  loader.parse(
    arrayBuffer,
    '',
    (gltf) => processModel(gltf, resolve, reject),
    reject
  );
}
// #endif

function processModel(gltf, resolve, reject) {
  if (!gltf?.scene) {
    reject(new Error('模型数据无效'));
    return;
  }
  
  const model = gltf.scene;
  const morphMeshes = [];
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0d5c8,
    roughness: 0.5,
    metalness: 0.0,
  });
  
  model.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      const hasMorph = child.morphTargetInfluences && 
                       child.morphTargetDictionary && 
                       Object.keys(child.morphTargetDictionary).length > 0;
      
      if (!hasMorph) {
        child.visible = false;
        return;
      }
      
      child.castShadow = true;
      child.receiveShadow = true;
      child.material = material.clone();
      
      if (child.geometry) {
        child.geometry.deleteAttribute('normal');
        child.geometry.computeVertexNormals();
      }
      
      morphMeshes.push(child);
    }
  });
  
  model.morphMeshes = morphMeshes;
  model.updateBlendShape = createMorphUpdater(morphMeshes);
  
  // 居中模型
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -center.y, -center.z);
  
  resolve(model);
}

function createMorphUpdater(morphMeshes) {
  return function(shapeName, value) {
    const mapping = MORPH_MAP[shapeName];
    if (!mapping) return;
    
    morphMeshes.forEach(mesh => {
      const dict = mesh.morphTargetDictionary;
      if (!dict) return;
      
      if (value >= 0) {
        if (mapping.max && dict[mapping.max] !== undefined) {
          mesh.morphTargetInfluences[dict[mapping.max]] = value;
        }
        if (mapping.min && dict[mapping.min] !== undefined) {
          mesh.morphTargetInfluences[dict[mapping.min]] = 0;
        }
      } else {
        if (mapping.max && dict[mapping.max] !== undefined) {
          mesh.morphTargetInfluences[dict[mapping.max]] = 0;
        }
        if (mapping.min && dict[mapping.min] !== undefined) {
          mesh.morphTargetInfluences[dict[mapping.min]] = -value;
        }
      }
    });
  };
}

export function createDemoScene() {
  return new THREE.Scene();
}

export function createStudioLighting(scene) {
  scene.children.filter(c => c.isLight).forEach(l => scene.remove(l));
  
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.35));
  
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
  keyLight.position.set(3, 5, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -3;
  keyLight.shadow.camera.right = keyLight.shadow.camera.top = 3;
  keyLight.shadow.bias = -0.001;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);
  
  const fillLight = new THREE.DirectionalLight(0xeef5ff, 0.3);
  fillLight.position.set(-4, 3, 2);
  scene.add(fillLight);
  
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
  rimLight.position.set(0, 4, -4);
  scene.add(rimLight);
}

export function createDemoBodyModel() {
  const group = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({ color: 0xfdbcb4 });
  
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.6, 16), material);
  body.position.y = 0.9;
  group.add(body);
  
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), material);
  head.position.y = 1.35;
  group.add(head);
  
  group.updateBlendShape = () => {};
  return group;
}
