import { computed } from 'vue';

const BASE = { age: 25.0, height: 161.18, weight: 51.97 };

// 定义各维度的极端值偏差 (相对于 Base)
// Slider: 0(Min) -> 50(Base) -> 100(Max)
const OFFSETS = {
  height: {
    min: { h: -37.18, w: -19.97 }, // Slider 0
    max: { h: +71.82, w: +80.03 }  // Slider 100
  },
  gender: {
    min: { h: -6.82, w: -7.32 },
    max: { h: +6.97, w: +9.99 }
  },
  proportion: {
    min: { h: -0.34, w: +0.78 },
    max: { h: +0.46, w: +0.33 }
  },
  age: {
    // Child state handled separately mostly, but if we treat as linear blend:
    min: { age: 1.0, h: 60.17, w: 4.86 }, // Absolute values for child base
    max: { age: 25.0, h: 161.18, w: 49.14 } // Elder/Max? (Data says Age 25, W 49.14)
  }
};

// Weight/Muscle 2D Grid Values (Absolute)
// Rows: Weight (0, 100), Cols: Muscle (0, 100)
// Order: [W0M0, W0M1, W1M0, W1M1]
// W0=Min, W1=Max. M0=Min, M1=Max.
// Weight/Muscle 3x3 Grid for Quadrant Interpolation
// Rows (v): Muscle 0, 0.5, 1
// Cols (u): Weight 0, 0.5, 1
const G3 = {
  // u=0 (Min Weight)
  c00: 35.24,  // M0
  c01: 46.31,  // M50 (Data)
  c02: 45.16,  // M100
  
  // u=0.5 (Base Weight)
  c10: 55.09,  // M0
  c11: 51.97,  // M50 (Base)
  c12: 50.07,  // M100 (Data)
  
  // u=1 (Max Weight)
  c20: 122.0,  // M0 (Pure Fat)
  c21: 56.77,  // M50 (Data: High weight gain only occurs at Low Muscle)
  c22: 73.26   // M100 (Fat + Muscle)
};

export function useMetrics(sliders) {
  
  const metrics = computed(() => {
    // Helper to get slider value 0-100
    const getVal = (key) => {
      const s = sliders.find(x => x.key === key);
      return s ? s.value : 50;
    };

    const sAge = getVal('age');
    const sGender = getVal('gender');
    const sHeight = getVal('height');
    const sWeight = getVal('weight');
    const sMuscle = getVal('muscle');
    const sProp = getVal('proportion');

    // 1. Calculate Adult Base Metrics components
    // Start with Base
    let h_Base = BASE.height;
    let w_Base = BASE.weight;
    let ageVal = BASE.age;

    // Delta variables
    let h_H = 0, w_H = 0; // Height Delta
    let h_P = 0, w_P = 0; // Proportion Delta
    let h_G = 0, w_G = 0; // Gender Delta

    // Apply Height Slider
    if (sHeight < 50) {
      const t = (50 - sHeight) / 50;
      h_H = OFFSETS.height.min.h * t;
      w_H = OFFSETS.height.min.w * t;
    } else {
      const t = (sHeight - 50) / 50;
      h_H = OFFSETS.height.max.h * t;
      
      // Dynamic Weight Gain based on Body Type (Weight Slider)
      // Tall + Skinny = Minimal Weight Gain. Tall + Heavy = Massive Weight Gain.
      // Fits data: H 0.6 -> W 0.5 (56.5kg), W 1.0 (69.7kg), W 0 (34kg)
      let w_Slope;
      const wPct = sWeight / 100;
      if (wPct <= 0.5) {
          // 0(Min) -> 23(Base)
          w_Slope = 0 + (23 - 0) * (wPct * 2);
      } else {
          // 23(Base) -> 70(Max)
          w_Slope = 23 + (70 - 23) * ((wPct - 0.5) * 2); 
      }
      w_H = w_Slope * t;
    }

    // Apply Proportion Slider
    if (sProp < 50) {
      const t = (50 - sProp) / 50;
      h_P = OFFSETS.proportion.min.h * t;
      w_P = OFFSETS.proportion.min.w * t;
    } else {
      const t = (sProp - 50) / 50;
      h_P = OFFSETS.proportion.max.h * t;
      w_P = OFFSETS.proportion.max.w * t;
    }

    // Apply Gender Slider
    if (sGender < 50) {
      const t = (50 - sGender) / 50;
      h_G = OFFSETS.gender.min.h * t;
      w_G = OFFSETS.gender.min.w * t;
    } else {
      const t = (sGender - 50) / 50;
      h_G = OFFSETS.gender.max.h * t;
      w_G = OFFSETS.gender.max.w * t;
    }

    // Apply Weight/Muscle Grid for Weight
    const u = sWeight / 100;
    const v = sMuscle / 100;

    let wmWeight = 0;
    
    // Quadrant Interpolation helper
    const qInterp = (tu, tv, bl, tl, br, tr) => {
      const top = tl + (tr - tl) * tu;
      const bot = bl + (br - bl) * tu;
      return bot + (top - bot) * tv;
    };

    if (u <= 0.5) {
      if (v <= 0.5) {
        // Q1: u 0-0.5, v 0-0.5
        wmWeight = qInterp(u*2, v*2, G3.c00, G3.c01, G3.c10, G3.c11);
      } else {
        // Q2: u 0-0.5, v 0.5-1
        wmWeight = qInterp(u*2, (v-0.5)*2, G3.c01, G3.c02, G3.c11, G3.c12);
      }
    } else {
      // Weight > 50: Use Cubic Curve (t^3) for Weight Interpolation
      // User reported that "Chubby" (75%) weight is still too high.
      // Quadratic lowered it, but Cubic will lower it further, pushing the mass gain to the very end 90-100%.
      // u 0.5 -> 1. t 0 -> 1.
      const tU = (u - 0.5) * 2;
      const tU_eased = tU * tU * tU; 
      
      if (v <= 0.5) {
        // Q3: u 0.5-1, v 0-0.5
        wmWeight = qInterp(tU_eased, v*2, G3.c10, G3.c11, G3.c20, G3.c21);
      } else {
        // Q4: u 0.5-1, v 0.5-1
        wmWeight = qInterp(tU_eased, (v-0.5)*2, G3.c11, G3.c12, G3.c21, G3.c22);
      }
    }
    
    // Delta W from sliders (W/M)
    const w_WM = wmWeight - 51.97;
    
    // Sum Up Adult Metrics
    let h = h_Base + h_H + h_P + h_G;
    let w = w_Base + w_H + w_P + w_G + w_WM;

    // 2. Age Scaling
    // If Age < 50, scale down to Child.
    // At Age 0: H -> 60.17, W -> 4.86 (plus Weight slider effect for child)
    // Child Weight Delta: At Age 0, Weight Slider 0->3.45, 100->5.59. Base 4.86.
    // Child W Delta Range: -1.41 to +0.73.
    // Logic in model: Age 0 overrides Adult metrics.
    
    let finalH = h;
    let finalW = w;
    let displayAge = ageVal;
    
    if (sAge < 50) {
        // Child Blend
        const t = sAge / 50; // 0 (Child) -> 1 (Adult Base)
        
        const childBaseH = OFFSETS.age.min.h; // 60.17
        const childBaseW = OFFSETS.age.min.w; // 4.86
        
        // Child Weight Delta from Weight slider
        let childWOffset = 0;
        if (sWeight < 50) childWOffset = (3.45 - 4.86) * ((50 - sWeight) / 50);
        else childWOffset = (5.59 - 4.86) * ((sWeight - 50) / 50);
        // Weight Logic:
        // Child Weight is mainly derived from Age_Min_Weight (Child Weight Slider).
        // Plus scaled influence from Height and Proportion.
        // Note: Adult Deltas (w_H, w_P) are large (~20kg). For Child (~5kg), we use smaller factors to avoid negative weight.
        // Using approx 0.05 for Height and 0.03 for Proportion to provide subtle but positive correlation.
        let rawChildW = (childBaseW + childWOffset) + (w_H * 0.05) + (w_P * 0.03);
        const wAtChild = Math.max(0.5, rawChildW); // Safety clamp to 0.5kg

        // Height Logic Adjustment
        // User Request: Age 0 -> Gender 0 effect. Height coeff 0.266, Prop coeff 0.16.
        const hAtChild = childBaseH + (h_H * 0.266) + (h_P * 0.16);
        
        // Interpolate H: Child -> Adult
        // t blends from 0 (Child State) to 1 (Adult State)
        finalH = hAtChild + (h - hAtChild) * t;

        // Interpolate W
        // Weight grows roughly with the square/cube of dimensions (Height).
        // Linear interpolation of Weight over Age consistently overestimates weight in 10-20 age range.
        // Using Quadratic (t^2) easing for Weight blend to better match physics and ref data.
        const tW = t * t;
        finalW = wAtChild + (w - wAtChild) * tW;
        
        // Age Value Curve: 
        // Data analysis shows Linear relationship for 0-50 range
        displayAge = 1 + (24 * t);
    } else {
        // Adult Ageing (50 -> 100)
        // Placeholder Logic until data provided
        const t = (sAge - 50) / 50; // 0 -> 1
        
        // Age: 25 -> 80
        displayAge = 25 + (55 * t);
        
        // Elder Morph Effects (Guesses)
        // Height shrinks slightly (-3cm at 80?)
        finalH = h - (3 * t);
        
        // Weight might drop slightly or increase? Let's keep weight stable for now or slight drop
        // finalW = w; 
    }

    return {
      age: Math.round(displayAge),
      height: finalH.toFixed(1),
      weight: finalW.toFixed(1)
    };
  });
  
  return metrics;
}
