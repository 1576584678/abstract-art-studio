import type { UserConfig } from "../types";
import {
  decryptString,
  encryptString,
  generateRawKey,
  importRawKey,
  rawKeyFromBase64,
  rawKeyToBase64,
} from "./crypto";

const LS_ENC_KEY = "aas.enckey";
const LS_CONFIG = "aas.config";
const LS_COMPLIANCE = "aas.compliance.ack";

/** 获取或创建本地 AES 密钥（用于加密 API Key 落盘）。 */
async function getLocalAesKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(LS_ENC_KEY);
  if (existing) {
    return importRawKey(rawKeyFromBase64(existing));
  }
  const raw = generateRawKey();
  localStorage.setItem(LS_ENC_KEY, rawKeyToBase64(raw));
  return importRawKey(raw);
}

export interface StoredConfig {
  provider: UserConfig["provider"];
  endpoint: string;
  model: string;
  /** 已加密的 API Key（base64）。 */
  apiKeyEnc: string;
}

/** 保存配置：API Key 加密后写入 localStorage。 */
export async function saveConfig(cfg: UserConfig): Promise<void> {
  const key = await getLocalAesKey();
  const apiKeyEnc = cfg.apiKey ? await encryptString(cfg.apiKey, key) : "";
  const stored: StoredConfig = {
    provider: cfg.provider,
    endpoint: cfg.endpoint,
    model: cfg.model,
    apiKeyEnc,
  };
  localStorage.setItem(LS_CONFIG, JSON.stringify(stored));
}

/**
 * 读取配置：解密 API Key。
 * 返回 null 表示尚未配置（首次进入）。
 */
export async function loadConfig(): Promise<UserConfig | null> {
  const raw = localStorage.getItem(LS_CONFIG);
  if (!raw) return null;
  try {
    const stored = JSON.parse(raw) as StoredConfig;
    const key = await getLocalAesKey();
    const apiKey = stored.apiKeyEnc
      ? await decryptString(stored.apiKeyEnc, key)
      : "";
    return {
      provider: stored.provider,
      endpoint: stored.endpoint,
      model: stored.model,
      apiKey,
    };
  } catch {
    return null;
  }
}

/** 清除全部配置（含加密密钥）。 */
export function clearConfig(): void {
  localStorage.removeItem(LS_CONFIG);
  localStorage.removeItem(LS_ENC_KEY);
}

/** 是否已确认过合规告知。 */
export function hasAckCompliance(): boolean {
  return localStorage.getItem(LS_COMPLIANCE) === "1";
}

export function ackCompliance(): void {
  localStorage.setItem(LS_COMPLIANCE, "1");
}
