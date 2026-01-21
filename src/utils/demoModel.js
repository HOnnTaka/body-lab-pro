// 人体模型加载器 - 使用形态键控制体型

// #ifdef H5
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
// #endif
// #ifndef H5
import * as THREE from "three-platformize";
import { GLTFLoader } from "three-platformize/examples/jsm/loaders/GLTFLoader";
// #endif

const MORPH_KEYS = [
  "Gender_Max",
  "Gender_Min",
  "Age_Max",
  "Age_Min",
  "Age_Min_Weight_Max",
  "Age_Min_Weight_Min",
  "Weight_Max",
  "Weight_Min",
  "Muscle_Max",
  "Muscle_Min",
  "Weight_Max_Muscle_Max",
  "Weight_Min_Muscle_Min",
  "Weight_Max_Muscle_Min",
  "Weight_Min_Muscle_Max",
  "Height_Max",
  "Height_Min",
  "Proportion_Max",
  "Proportion_Min",
];

export async function loadBodyModel(url, onProgress) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    draco.setDecoderConfig({ type: "js" });
    loader.setDRACOLoader(draco);

    // H5 IndexedDB Caching (Works on HTTP/DevEnv unlike Cache API)
    const DB_NAME = "BodyLabCache";
    const STORE_NAME = "models";
    const DB_VERSION = 1;

    function getDB() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) return reject("IDB not supported");
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject("IDB Open Error");
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
      });
    }

    async function loadWithCache() {
      try {
        let buffer;

        // 1. Try reading from IndexedDB
        try {
          const db = await getDB();
          await new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(url);
            req.onsuccess = () => {
              if (req.result) {
                buffer = req.result;
                if (onProgress) onProgress(100);
              }
              resolve();
            };
            req.onerror = () => resolve();
          });
        } catch (e) {
          console.warn("IDB Read Failed", e);
        }

        // 2. Network Request if not cached
        if (!buffer) {
          buffer = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";

            xhr.onprogress = (e) => {
              if (e.lengthComputable && onProgress) {
                onProgress(Math.round((e.loaded / e.total) * 100));
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) resolve(xhr.response);
              else reject(new Error(`Model download failed: ${xhr.status}`));
            };

            xhr.onerror = () => reject(new Error("Network error loading model"));
            xhr.send();
          });

          // 3. Write to IndexedDB
          try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.put(buffer, url);
          } catch (e) {
            console.warn("IDB Write Failed", e);
          }
        }

        // 4. Parse GLB/GLTF
        loader.parse(
          buffer,
          "./",
          (gltf) => processModel(gltf, resolve, reject),
          (err) => reject(new Error("Model Parsing Failed: " + err.message)),
        );
      } catch (err) {
        reject(err);
      }
    }

    loadWithCache();
    // #endif

    // #ifndef H5
    downloadAndParseModel(url, onProgress, resolve, reject);
    // #endif
  });
}

// #ifndef H5
function downloadAndParseModel(url, onProgress, resolve, reject) {
  const cacheFileName = "body_model_" + url.split("/").pop();
  const cachePath = `${wx.env.USER_DATA_PATH}/${cacheFileName}`;
  const fs = wx.getFileSystemManager();

  fs.access({
    path: cachePath,
    success: () => {
      fs.readFile({
        filePath: cachePath,
        success: (res) => parseModelData(res.data, resolve, reject),
        fail: (err) => reject(new Error("缓存读取失败: " + err.errMsg)),
      });
    },
    fail: () => {
      wx.request({
        url,
        method: "GET",
        responseType: "arraybuffer",
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            onProgress?.(100);
            fs.writeFile({
              filePath: cachePath,
              data: res.data,
              success: () => console.log("模型已缓存"),
              fail: () => {},
            });
            parseModelData(res.data, resolve, reject);
          } else {
            reject(new Error("下载失败: HTTP " + res.statusCode));
          }
        },
        fail: (err) => reject(new Error("下载失败: " + err.errMsg)),
      });
    },
  });
}

function parseModelData(arrayBuffer, resolve, reject) {
  const loader = new GLTFLoader();
  loader.parse(arrayBuffer, "", (gltf) => processModel(gltf, resolve, reject), reject);
}
// #endif

function processModel(gltf, resolve, reject) {
  if (!gltf?.scene) {
    reject(new Error("模型数据无效"));
    return;
  }

  const model = gltf.scene;
  const morphMeshes = [];

  // 基础材质 - 优化质感，增强细节表现
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xf0d5c8,
    roughness: 0.5, // 降低一点粗糙度，让高光更聚拢，体现肌肉起伏
    metalness: 0.1, // 微微的金属感有助于捕捉高光
    flatShading: false,
  });

  model.traverse((child) => {
    if (child.isMesh || child.isSkinnedMesh) {
      const hasMorph =
        child.morphTargetInfluences &&
        child.morphTargetDictionary &&
        Object.keys(child.morphTargetDictionary).length > 0;

      if (!hasMorph) {
        child.visible = false;
        return;
      }

      child.castShadow = true;
      child.receiveShadow = true;

      const newMat = baseMaterial.clone();

      // 保留原始贴图细节
      if (child.material) {
        if (child.material.aoMap) {
          newMat.aoMap = child.material.aoMap;
          newMat.aoMapIntensity = 1.2; // 稍微增强 AO
        }
      }

      child.material = newMat;

      // 关键修正：绝对不要删除或重新计算法线！
      // 原始 GLB 模型通常包含为了表现腹肌等细节而精心编辑的平滑组/法线数据。
      // 重新计算会将所有边缘强行平滑，导致细节丢失。
      // 只在完全缺失法线时计算。
      if (child.geometry && !child.geometry.attributes.normal) {
        child.geometry.computeVertexNormals();
      }

      morphMeshes.push(child);
    }
  });

  model.morphMeshes = morphMeshes;
  model.updateBodyMorphs = createBodyMorphUpdater(morphMeshes);

  // 居中模型
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -center.y, -center.z);

  resolve(model);
}

// 创建复杂的形态键更新器
function createBodyMorphUpdater(morphMeshes) {
  // 缓存上一次的参数，避免重复计算（可选）

  return function (params) {
    // params 期望所有值为 -1 到 1 的归一化浮点数
    // { age, gender, weight, muscle, height, proportion }

    // 0. 解构参数
    const { age = 0, gender = 0, weight = 0, muscle = 0, height = 0, proportion = 0 } = params;

    const targets = {};

    // 1. 判断是否处于"幼年"状态 (Age < 0)
    // isChild: 0(成年) -> 1(最幼)
    const isChild = age < 0 ? -age : 0;

    // 2. 计算抑制系数
    // 幼年时 Gender 影响降至 0
    const genderFactor = 1.0 - isChild;
    // 幼年时 Muscle 影响降至 0
    // const muscleFactor = 1.0 - isChild; // 实际上直接在组合逻辑中处理
    // 幼年时 Height 影响降至 0.266 (抑制 0.734)
    const heightFactor = 1.0 - 0.734 * isChild;
    // 幼年时 Proportion 影响降至 0.16 (抑制 0.84)
    const proportionFactor = 1.0 - 0.84 * isChild;
    // 幼年时 成人Weight体系 逐渐切换为 幼儿Weight体系
    const adultFactor = 1.0 - isChild;

    // 3. 计算 Weight & Muscle 组合逻辑 (针对成人体系)
    // 我们使用双线性插值思想处理 Weight/Muscle 的四象限组合
    // 只有在 adultFactor > 0 时才计算这部分

    if (adultFactor > 0.001) {
      // 对 muscle 进行抑制处理? 用户只说 "muscle相关形态键系数降至0"，
      // 意味着即使在成人体系计算中，输入的 muscle 值也应该趋近于 0?
      // 或者就是整个成人体系的权重降低?
      // "体重肌肉都拉满...表现为Weight_Max_Muscle_Max" 是基本规则。
      // "Age最小时...Weight逐渐改用Age_Min_Weight"，意味着 Adult Weight/Muscle 组合逐渐失效。
      // 所以我们用 adultFactor 缩放整个成人组的权重即可。
      // 注意：Muscle 也要降为 0，所以这里输入的 muscle 也需要被抑制吗？
      // 如果 adultFactor 已经是 0，那么 muscle 相关的 key 权重自然是 0。
      // 所以直接计算 standard logic 然后乘以 adultFactor。

      const wAbs = Math.abs(weight);
      const mAbs = Math.abs(muscle);

      // 核心逻辑：
      // Combo Key (e.g. Max_Max) 权重 = |w| * |m|
      // Pure Weight (e.g. Max) 权重 = |w| * (1 - |m|)
      // Pure Muscle (e.g. Max) 权重 = |m| * (1 - |w|)

      const wSuffix = weight >= 0 ? "Max" : "Min";
      const mSuffix = muscle >= 0 ? "Max" : "Min";

      // 组合键
      const comboKey = `Weight_${wSuffix}_Muscle_${mSuffix}`;
      targets[comboKey] = wAbs * mAbs * adultFactor;

      // 纯 Weight 键
      const weightKey = `Weight_${wSuffix}`;
      targets[weightKey] = wAbs * (1 - mAbs) * adultFactor;

      // 纯 Muscle 键
      const muscleKey = `Muscle_${mSuffix}`;
      targets[muscleKey] = mAbs * (1 - wAbs) * adultFactor;
    }

    // 4. 计算 幼儿 Weight 体系
    // "Age_Min_Weight 包含了 age 影响 (相对于 Age_Min)"
    // 只有在 isChild > 0 时生效
    // 修正: 既然 Age_Min_Weight 包含了 Age_Min 的形态，那么在使用 Age_Min_Weight 时，
    // 需要按比例减弱 Age_Min，否则会产生"两次变小"的叠加效果。
    // 逻辑：Age_Min 只负责"不胖不瘦的幼儿"部分。
    if (isChild > 0.001) {
      const wAbs = Math.abs(weight);

      // 幼儿只有胖瘦，没有肌肉维度
      const cwSuffix = weight >= 0 ? "Max" : "Min";
      const childWeightKey = `Age_Min_Weight_${cwSuffix}`;

      // 幼儿体重键权重
      targets[childWeightKey] = wAbs * isChild;
    }

    // 5. 其他独立维度

    // Gender
    const effGender = gender * genderFactor;
    if (effGender > 0) targets["Gender_Max"] = effGender;
    else targets["Gender_Min"] = -effGender;

    // Age
    if (age > 0) {
      // 老年 (Age_Max)
      targets["Age_Max"] = age;
    } else {
      // 幼年 (Age_Min)
      // 如果有体重偏移，Age_Min 的份额被 Age_Min_Weight 取代
      // Age_Min 权重 = isChild * (1 - |weight|)
      // 修正：Age_Min 本身可能就需要根据 isChild 线性增加。
      // 但这里 targets['Age_Min'] 是控制 "Age_Min" key 的权重。
      // 如果 isChild=1, weight=0 => Age_Min=1. Correct.
      // 如果 isChild=1, weight=1 => Age_Min=0 (fully Age_Min_Weight). Correct.
      const wAbs = Math.abs(weight);
      targets["Age_Min"] = isChild * (1 - wAbs);
    }

    // Height
    const effHeight = height * heightFactor;
    if (effHeight > 0) targets["Height_Max"] = effHeight;
    else targets["Height_Min"] = -effHeight;

    // Proportion
    const effProp = proportion * proportionFactor;
    if (effProp > 0) targets["Proportion_Max"] = effProp;
    else targets["Proportion_Min"] = -effProp;

    // 6. 应用到所有 Mesh
    morphMeshes.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) return;

      // 遍历我们关心的 Key 列表，直接设置值
      // 为了性能和避免残留，最好确保未提及的 Key 被归零？
      // 由于我们 MORPH_KEYS 是全集，我们可以遍历 MORPH_KEYS

      MORPH_KEYS.forEach((key) => {
        if (dict[key] !== undefined) {
          const val = targets[key] || 0;
          influences[dict[key]] = val;
        }
      });
    });
  };
}

export function createDemoScene() {
  const scene = new THREE.Scene();
  // 可以添加极其微弱的雾效增加融合感
  // scene.fog = new THREE.FogExp2(0x2b3240, 0.002);
  return scene;
}

export function createStudioLighting(scene, camera) {
  scene.children.filter((c) => c.isLight).forEach((l) => scene.remove(l));

  // Clean up previous camera lights if any
  if (camera) {
    camera.children.filter((c) => c.isLight).forEach((l) => camera.remove(l));
  }

  // 1. 环境光 (Ambient) - 降低亮度，增加对比度
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  // 2. 取消半球光，避免色调干扰，保持纯净的灰阶/肤色
  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  // scene.add(hemiLight);

  if (camera) {
    // 3. 相机跟随三点布光 (3-Point Lighting Rig attached to Camera)

    // A. 主光 (Key Light) - 侧逆光/侧光能最好地表现纹理
    // 位置：稍微偏侧面一点，光线"擦"过皮肤表面，最能显现腹肌凸起
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.65);
    // 恢复到较近的位置以获得更好的阴影定义，但保持侧向角度
    keyLight.position.set(5, 3, 5);
    keyLight.castShadow = true;

    // 优化阴影质量 - 锐利一点的阴影有助于表现肌肉轮廓
    keyLight.shadow.bias = -0.0001; // 稍微增加bias防止自遮挡伪影
    keyLight.shadow.mapSize.width = 2048; // 高分辨率
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.radius = 1; // 稍微锐利一点
    camera.add(keyLight);

    // B. 补光 (Fill Light) - 另一侧
    const fillLight = new THREE.DirectionalLight(0xeef2ff, 0.25);
    fillLight.position.set(-4, 0, 4);
    camera.add(fillLight);

    // C. 轮廓光 (Rim Light) - 顶部后方，勾勒肩膀
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 4, -2);
    camera.add(rimLight);
  } else {
    // Fallback
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(3, 3, 5);
    scene.add(keyLight);
  }
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
