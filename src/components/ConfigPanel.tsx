import { useEffect, useState } from "react";
import type { ProviderId, UserConfig } from "../types";
import { adapters } from "../adapters";
import styles from "./ConfigPanel.module.css";

interface Props {
  config: UserConfig | null;
  onSave: (cfg: UserConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

export function ConfigPanel({ config, onSave, onClear, onClose }: Props) {
  const [provider, setProvider] = useState<ProviderId>(
    config?.provider ?? "stability",
  );
  const [endpoint, setEndpoint] = useState(config?.endpoint ?? "");
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [model, setModel] = useState(config?.model ?? "");

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setEndpoint(config.endpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
    }
  }, [config]);

  const meta = adapters[provider].meta;
  const showEndpoint = provider === "openaiCompatible";

  const handleSave = () => {
    const cfg: UserConfig = {
      provider,
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
      model: model.trim() || meta.defaultModel,
    };
    if (!cfg.apiKey) {
      alert("请填写 API Key。");
      return;
    }
    if (showEndpoint && !cfg.endpoint) {
      alert("请填写端点 URL。");
      return;
    }
    onSave(cfg);
  };

  const handleClear = () => {
    if (confirm("确定清除本地配置？下次需重新填写。")) {
      onClear();
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cfg-title">
      <div className={styles.card}>
        <div className={styles.head}>
          <h2 id="cfg-title" className={styles.title}>
            模型配置（BYOK）
          </h2>
          <button className={styles.close} onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <p className={styles.note}>
          API Key 仅加密保存在你本机浏览器，不会上传到任何平台。
        </p>

        <label className={styles.field}>
          <span>服务商</span>
          <select
            value={provider}
            onChange={(e) => {
              const p = e.target.value as ProviderId;
              setProvider(p);
              const m = adapters[p].meta;
              setModel((prev) => prev || m.defaultModel);
            }}
          >
            {Object.values(adapters).map((a) => (
              <option key={a.meta.id} value={a.meta.id}>
                {a.meta.label}
              </option>
            ))}
          </select>
        </label>

        {showEndpoint && (
          <label className={styles.field}>
            <span>端点 URL</span>
            <input
              type="url"
              value={endpoint}
              placeholder={meta.endpointPlaceholder}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </label>
        )}

        <label className={styles.field}>
          <span>API Key</span>
          <input
            type="password"
            value={apiKey}
            placeholder="sk-..."
            autoComplete="off"
            onChange={(e) => setApiKey(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>模型标识</span>
          <input
            type="text"
            value={model}
            placeholder={meta.modelPlaceholder}
            onChange={(e) => setModel(e.target.value)}
          />
        </label>

        <p className={styles.help}>{meta.help}</p>

        <div className={styles.actions}>
          <button className={styles.secondary} onClick={handleClear}>
            清除配置
          </button>
          <div className={styles.right}>
            <button className={styles.ghost} onClick={onClose}>
              取消
            </button>
            <button className={styles.primary} onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
