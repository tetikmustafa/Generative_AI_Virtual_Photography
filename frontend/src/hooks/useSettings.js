import { useState, useCallback } from 'react';

const STORAGE_KEY = 'product_photo_settings';

const DEFAULT_SETTINGS = {
  comfyUrl: 'http://127.0.0.1:8188',
  steps: 4,
  megapixels: 1,
  loraStrength: 1.0,
  cfgNorm: 1.0,
  randomSeed: true,
  seeds: [584189815858054, 383180825145818, 781195917738250],
  outputPrefix: 'product',
  prompts: {
    front: {
      positive: "Direct front view, eye-level hero shot. Change the image into professional commercial product photography in a realistic style. Place the product in a premium studio environment with a clean minimalist composition. Use large softbox studio lighting with soft diffused light from multiple angles, subtle rim lighting for separation, balanced exposure, realistic shadows beneath the object, natural contact shadows, realistic reflections where appropriate, premium advertising aesthetic, photorealistic materials and textures, highly detailed surfaces, sharp focus, cinematic depth of field, luxury catalog photography style, modern clean presentation, magazine quality, high-end branding photography, ultra realistic, 8k.",
      negative: ""
    },
    side: {
      positive: "Sleek three-quarter side profile view, angled slightly to reveal depth and curves. Change the image into professional commercial product photography in a realistic style. Place the product in a premium studio environment with a clean minimalist composition. Use large softbox studio lighting with soft diffused light from multiple angles, subtle rim lighting for separation, balanced exposure, realistic shadows beneath the object, natural contact shadows, realistic reflections where appropriate, premium advertising aesthetic, photorealistic materials and textures, highly detailed surfaces, sharp focus, cinematic depth of field, luxury catalog photography style, modern clean presentation, magazine quality, high-end branding photography, ultra realistic, 8k.",
      negative: ""
    },
    iso: {
      positive: "Dynamic 45-degree high angle isometric view, showcasing the top and front surfaces. Change the image into professional commercial product photography in a realistic style. Place the product in a premium studio environment with a clean minimalist composition. Use large softbox studio lighting with soft diffused light from multiple angles, subtle rim lighting for separation, balanced exposure, realistic shadows beneath the object, natural contact shadows, realistic reflections where appropriate, premium advertising aesthetic, photorealistic materials and textures, highly detailed surfaces, sharp focus, cinematic depth of field, luxury catalog photography style, modern clean presentation, magazine quality, high-end branding photography, ultra realistic, 8k.",
      negative: ""
    }
  }
};

function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge with defaults to handle new fields
      return deepMerge(DEFAULT_SETTINGS, parsed);
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export default function useSettings() {
  const [settings, setSettings] = useState(loadSettings);

  const persist = useCallback((newSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      persist(next);
      return next;
    });
  }, [persist]);

  const updatePrompt = useCallback((view, type, value) => {
    setSettings(prev => {
      const next = {
        ...prev,
        prompts: {
          ...prev.prompts,
          [view]: {
            ...prev.prompts[view],
            [type]: value
          }
        }
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetPrompt = useCallback((view) => {
    setSettings(prev => {
      const next = {
        ...prev,
        prompts: {
          ...prev.prompts,
          [view]: { ...DEFAULT_SETTINGS.prompts[view] }
        }
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetAll = useCallback(() => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    setSettings(defaults);
    persist(defaults);
  }, [persist]);

  return { settings, updateSetting, updatePrompt, resetPrompt, resetAll, DEFAULT_SETTINGS };
}
