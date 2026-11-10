import type { ProviderId } from "../types";

export interface GenRequest {
  image: Blob; // 压缩后的源图
  prompt: string; // 风格提示词（可含用户附加描述）
  strength: number; // 去噪强度 0–1
  model?: string;
  /** 负面提示词（可选）。仅部分 Provider 支持，缺失则忽略。 */
  negative?: string;
  signal?: AbortSignal; // 用于超时 / 取消
}

export interface GenResult {
  /** 成功时返回其一。 */
  imageUrl?: string;
  imageBase64?: string; // data:image/...;base64,...
  error?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** 浏览器是否通常支持 CORS 直连（用于失败时提示）。 */
  corsFriendly: boolean;
  defaultEndpoint: string;
  defaultModel: string;
  endpointPlaceholder: string;
  modelPlaceholder: string;
  /** 该 Provider 是否支持强度参数（不支持时前端隐藏滑块）。 */
  supportsStrength: boolean;
  help: string;
}

export interface ProviderAdapter {
  meta: ProviderMeta;
  /** 统一封装为 Promise，屏蔽同步/异步差异。 */
  generate(req: GenRequest, config: AdapterConfig): Promise<GenResult>;
}

export interface AdapterConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

/**
 * 提取 fetch 失败中的可读信息，尤其识别 CORS 拦截。
 * 浏览器在 CORS 失败时抛 TypeError('Failed to fetch')，无法拿到状态码。
 */
export function classifyError(err: unknown): string {
  if (err instanceof TypeError) {
    // 典型 CORS / 网络不可达
    return "网络请求失败：该 Provider 可能不支持浏览器跨域直连（CORS），或网络不可达。建议更换 CORS 友好的端点，或等待后续 Worker 代理方案。";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
