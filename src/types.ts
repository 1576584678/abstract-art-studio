// 全局共享类型定义

export type ProviderId = "stability" | "openaiCompatible";

export interface UserConfig {
  provider: ProviderId;
  /** 模型服务端点。Stability 可留空走默认；OpenAI 兼容需填完整端点。 */
  endpoint: string;
  /** 模型标识（如 stable-diffusion-xl-1.0 / gpt-image-1）。 */
  model: string;
  /** 明文 API Key（仅在内存中短暂存在，落盘前加密）。 */
  apiKey: string;
}

export interface StylePreset {
  id: string;
  name: string;
  /** 提示词模板，生成时与用户附加描述拼接。 */
  prompt: string;
  /** 负面提示词：告诉模型应避免的元素（文字、水印、畸形、过饱和等）。仅支持该参数的 Provider（如 Stability）会生效。 */
  negative: string;
  /** 默认去噪强度 0–1。 */
  defaultStrength: number;
  /** 卡片缩略用的渐变占位（CSS）。 */
  swatch: string;
  description: string;
}

/** 生成阶段状态机。 */
export type GenStatus =
  | "idle"
  | "uploading"
  | "ready" // 图片压缩完成、配置有效，可生成
  | "generating"
  | "success"
  | "error";
