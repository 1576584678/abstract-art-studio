import type { StylePreset } from "../types";

// 内置抽象风格预设。提示词以英文为主（多数文生图模型对英文更敏感），
// 辅以中文意图说明，方便用户理解。
//
// 提示词优化要点（基于画令令专家审查）：
//  1) 锚定原图：每套都含 "transform the uploaded photo into ..."，
//     确保 img2img 保留用户原图主体与构图，避免抽象化后完全脱离原图
//     （对应 PRD RK-03 的「失真过度 / 不像原图的抽象画」风险）。
//  2) 中性质量增强词：使用 masterpiece / best quality / artistic composition 等，
//     不含 photorealistic 等写实词，避免把照片往写实方向拉。
//  3) 负面提示词：negative 字段供支持该参数的 Provider（如 Stability）使用，
//     抑制文字、水印、畸形、过饱和等。
//  4) 风格纯净：oil 统一为 impasto 厚涂语义；ink 去掉写死的 "misty mountains"，
//     改为氛围词，避免强制覆盖用户原图内容。
export const PRESETS: StylePreset[] = [
  {
    id: "geometric",
    name: "几何极简",
    prompt:
      "abstract geometric minimalism, transform the uploaded photo into bold flat shapes and clean lines, limited color palette, Bauhaus inspired, high contrast, modern poster style, masterpiece, best quality, highly detailed",
    negative:
      "photorealistic, 3d render, blurry, low quality, lowres, distorted, deformed, text, watermark, signature, extra elements",
    defaultStrength: 0.75,
    swatch: "linear-gradient(135deg,#1f2937 0%,#6366f1 55%,#f59e0b 100%)",
    description: "硬朗色块与几何分割，少即是多。",
  },
  {
    id: "oil",
    name: "油画笔触",
    prompt:
      "impressionist oil painting of the uploaded photo, visible expressive brushstrokes, rich impasto texture, warm chiaroscuro lighting, thick paint on canvas, masterpiece, best quality, artistic composition",
    negative:
      "photorealistic, 3d render, blurry, low quality, lowres, distorted, deformed, text, watermark, signature, flat colors",
    defaultStrength: 0.6,
    swatch: "linear-gradient(135deg,#7c2d12 0%,#b45309 50%,#fbbf24 100%)",
    description: "厚涂笔触与暖色光影，质感强烈。",
  },
  {
    id: "watercolor",
    name: "水彩晕染",
    prompt:
      "soft watercolor painting of the uploaded photo, bleeding pigments, organic gradients, dreamy pastel tones, visible paper texture, fluid abstract composition, masterpiece, best quality, artistic",
    negative:
      "hard edges, photorealistic, 3d render, blurry, low quality, text, watermark, oversaturated, muddy colors",
    defaultStrength: 0.7,
    swatch: "linear-gradient(135deg,#0ea5e9 0%,#a78bfa 50%,#fbcfe8 100%)",
    description: "通透晕染与柔彩，轻盈梦幻。",
  },
  {
    id: "synthwave",
    name: "赛博霓虹",
    prompt:
      "cyberpunk neon abstract reinterpretation of the uploaded photo, glowing magenta and cyan light, dark background, grid horizon, holographic gradients, retro futurism, masterpiece, best quality, highly detailed",
    negative:
      "photorealistic, low quality, blurry, distorted, deformed, text, watermark, dull colors, overexposed, flat",
    defaultStrength: 0.72,
    swatch: "linear-gradient(135deg,#0f172a 0%,#db2777 50%,#22d3ee 100%)",
    description: "霓虹光感与暗底网格，未来感。",
  },
  {
    id: "ink",
    name: "水墨写意",
    prompt:
      "East Asian ink wash painting (sumi-e) of the uploaded photo, expressive black ink, generous negative space, minimalist, flowing brush strokes, misty atmosphere, masterpiece, best quality, artistic",
    negative:
      "photorealistic, color photo, oversaturated, blurry, low quality, text, watermark, heavy black outlines, clutter, extra elements",
    defaultStrength: 0.68,
    swatch: "linear-gradient(135deg,#111827 0%,#374151 50%,#e5e7eb 100%)",
    description: "留白与飞白，东方写意。",
  },
];

export function getPreset(id: string): StylePreset | undefined {
  return PRESETS.find((p) => p.id === id);
}
