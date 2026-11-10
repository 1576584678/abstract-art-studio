import { useCallback, useEffect, useRef, useState } from "react";
import type { GenStatus, StylePreset, UserConfig } from "../types";
import { compressImage } from "../lib/compress";
import {
  ackCompliance,
  clearConfig as clearStoredConfig,
  hasAckCompliance,
  loadConfig,
  saveConfig,
} from "../lib/storage";
import { getAdapter } from "../adapters";
import { getPreset } from "../presets";

const TIMEOUT_MS = 60_000;

export interface OriginalImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface GeneratorState {
  config: UserConfig | null;
  complianceAck: boolean;
  configOpen: boolean;

  image: OriginalImage | null;
  compressing: boolean;

  presetId: string;
  strength: number;
  customPrompt: string;

  status: GenStatus;
  result: string | null; // 生成的图片（dataURL 或 URL）
  error: string | null;
  providerLabel: string;
  presetLabel: string;
  elapsed: number; // 生成计时（秒）
}

export function useGenerator(presets: StylePreset[]) {
  const initialPreset = presets[0];
  const [state, setState] = useState<GeneratorState>({
    config: null,
    complianceAck: hasAckCompliance(),
    configOpen: false,
    image: null,
    compressing: false,
    presetId: initialPreset.id,
    strength: initialPreset.defaultStrength,
    customPrompt: "",
    status: "idle",
    result: null,
    error: null,
    providerLabel: "",
    presetLabel: "",
    elapsed: 0,
  });

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 首次进入加载已保存配置
  useEffect(() => {
    let mounted = true;
    loadConfig().then((cfg) => {
      if (mounted && cfg) {
        setState((s) => ({ ...s, config: cfg }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const openConfig = useCallback(
    () => setState((s) => ({ ...s, configOpen: true })),
    [],
  );
  const closeConfig = useCallback(
    () => setState((s) => ({ ...s, configOpen: false })),
    [],
  );

  const acknowledgeCompliance = useCallback(() => {
    ackCompliance();
    setState((s) => ({ ...s, complianceAck: true }));
  }, []);

  const persistConfig = useCallback(async (cfg: UserConfig) => {
    await saveConfig(cfg);
    setState((s) => ({ ...s, config: cfg, configOpen: false }));
  }, []);

  const removeConfig = useCallback(() => {
    clearStoredConfig();
    setState((s) => ({
      ...s,
      config: null,
      configOpen: false,
      status: "idle",
      result: null,
      error: null,
    }));
  }, []);

  const onFile = useCallback(async (file: File) => {
    const ok = /image\/(jpeg|png|webp)/.test(file.type);
    if (!ok) {
      setState((s) => ({ ...s, error: "仅支持 jpg / png / webp 图片" }));
      return;
    }
    setState((s) => ({ ...s, compressing: true, error: null, status: "uploading" }));
    try {
      const compressed = await compressImage(file, 1024, 0.85);
      setState((s) => ({
        ...s,
        compressing: false,
        image: compressed,
        status: "ready",
      }));
    } catch {
      setState((s) => ({
        ...s,
        compressing: false,
        error: "图片处理失败，请换一张试试。",
      }));
    }
  }, []);

  const selectPreset = useCallback(
    (id: string) => {
      const p = getPreset(id);
      setState((s) => ({
        ...s,
        presetId: id,
        strength: p ? p.defaultStrength : s.strength,
      }));
    },
    [],
  );

  const setStrength = useCallback((v: number) => {
    setState((s) => ({ ...s, strength: v }));
  }, []);

  const setCustomPrompt = useCallback((v: string) => {
    setState((s) => ({ ...s, customPrompt: v }));
  }, []);

  const clearImage = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({
      ...s,
      image: null,
      result: null,
      status: "idle",
      error: null,
    }));
  }, []);

  const generate = useCallback(async () => {
    const cfg = state.config;
    if (!cfg || !cfg.apiKey) {
      setState((s) => ({
        ...s,
        error: "请先配置 API Key。",
        configOpen: true,
      }));
      return;
    }
    if (!state.image) {
      setState((s) => ({ ...s, error: "请先上传一张图片。" }));
      return;
    }
    const preset = getPreset(state.presetId);
    if (!preset) {
      setState((s) => ({ ...s, error: "请选择一个风格预设。" }));
      return;
    }

    const adapter = getAdapter(cfg.provider);
    const prompt = state.customPrompt.trim()
      ? `${preset.prompt}, ${state.customPrompt.trim()}`
      : preset.prompt;
    const negative = preset.negative;

    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    setState((s) => ({
      ...s,
      status: "generating",
      error: null,
      result: null,
      elapsed: 0,
      providerLabel: adapter.meta.label,
      presetLabel: preset.name,
    }));
    timerRef.current = setInterval(() => {
      setState((s) =>
        s.status === "generating" ? { ...s, elapsed: s.elapsed + 1 } : s,
      );
    }, 1000);

    try {
      const res = await adapter.generate(
        {
          image: state.image.blob,
          prompt,
          strength: state.strength,
          negative,
          model: cfg.model,
          signal: controller.signal,
        },
        { endpoint: cfg.endpoint, apiKey: cfg.apiKey, model: cfg.model },
      );
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);

      if (res.error) {
        const errMsg = res.error;
        setState((s) => ({ ...s, status: "error", error: errMsg }));
        return;
      }
      const out = res.imageBase64 || res.imageUrl;
      if (!out) {
        setState((s) => ({
          ...s,
          status: "error",
          error: "生成成功但未返回有效图像，请重试。",
        }));
        return;
      }
      setState((s) => ({ ...s, status: "success", result: out }));
    } catch (err) {
      clearTimeout(timeout);
      if (timerRef.current) clearInterval(timerRef.current);
      const aborted = controller.signal.aborted;
      setState((s) => ({
        ...s,
        status: "error",
        error: aborted
          ? "生成超时（>60s）或已取消，请重试或更换 Provider。"
          : err instanceof Error
            ? err.message
            : "生成失败，请重试。",
      }));
    }
  }, [state.config, state.image, state.presetId, state.strength, state.customPrompt]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState((s) => ({ ...s, status: "error", error: "已取消生成。" }));
  }, []);

  return {
    state,
    openConfig,
    closeConfig,
    acknowledgeCompliance,
    persistConfig,
    removeConfig,
    onFile,
    selectPreset,
    setStrength,
    setCustomPrompt,
    clearImage,
    generate,
    cancel,
  };
}
