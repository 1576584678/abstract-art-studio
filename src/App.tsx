import { useMemo } from "react";
import styles from "./App.module.css";
import { PRESETS } from "./presets";
import { adapters } from "./adapters";
import { useGenerator } from "./hooks/useGenerator";
import { downloadImage } from "./lib/blob";
import { ComplianceModal } from "./components/ComplianceModal";
import { ConfigPanel } from "./components/ConfigPanel";
import { Uploader } from "./components/Uploader";
import { StylePicker } from "./components/StylePicker";
import { ResultView } from "./components/ResultView";
import { StatusBanner } from "./components/StatusBanner";

export default function App() {
  const g = useGenerator(PRESETS);
  const { state } = g;

  const meta = adapters[state.config?.provider ?? "stability"].meta;
  const supportsStrength = meta.supportsStrength;

  const canGenerate = useMemo(
    () => !!state.image && !!state.config?.apiKey && state.status !== "generating",
    [state.image, state.config?.apiKey, state.status],
  );

  const handleDownload = () => {
    if (!state.result) return;
    const name = `abstract-${state.presetId}-${Date.now()}.png`;
    downloadImage(state.result, name);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.brand}>抽象画生成器</h1>
          <p className={styles.tagline}>上传照片，秒变抽象艺术 · 纯前端 · 自带模型密钥</p>
        </div>
        <button className={styles.configBtn} onClick={g.openConfig}>
          ⚙ 模型配置
          {state.config?.apiKey ? "" : "（待配置）"}
        </button>
      </header>

      {!state.complianceAck && (
        <ComplianceModal onAck={g.acknowledgeCompliance} />
      )}

      {state.configOpen && (
        <ConfigPanel
          config={state.config}
          onSave={g.persistConfig}
          onClear={g.removeConfig}
          onClose={g.closeConfig}
        />
      )}

      <main className={styles.main}>
        <section className={styles.col}>
          <div className={styles.card}>
            <Uploader
              image={state.image}
              compressing={state.compressing}
              onFile={g.onFile}
              onClear={g.clearImage}
            />
          </div>
          <div className={styles.card}>
            <StylePicker
              presets={PRESETS}
              presetId={state.presetId}
              strength={state.strength}
              customPrompt={state.customPrompt}
              supportsStrength={supportsStrength}
              onSelect={g.selectPreset}
              onStrength={g.setStrength}
              onCustom={g.setCustomPrompt}
            />
          </div>
        </section>

        <section className={styles.col}>
          <div className={styles.card}>
            <ResultView
              image={state.image}
              result={state.result}
              status={state.status}
              elapsed={state.elapsed}
              providerLabel={state.providerLabel}
              presetLabel={state.presetLabel}
            />
            <div className={styles.bannerSlot}>
              <StatusBanner
                status={state.status}
                error={state.error}
                result={state.result}
                onRetry={g.generate}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.notice}>
          {state.config?.apiKey
            ? `图片将发送至你配置的模型服务（${meta.label}）`
            : "尚未配置 API Key，无法生成"}
        </span>
        <div className={styles.actions}>
          {state.status === "generating" ? (
            <button className={styles.cancel} onClick={g.cancel}>
              取消
            </button>
          ) : (
            <button
              className={styles.generate}
              disabled={!canGenerate}
              onClick={g.generate}
            >
              生成抽象画
            </button>
          )}
          <button
            className={styles.download}
            disabled={state.status !== "success" || !state.result}
            onClick={handleDownload}
          >
            下载 PNG
          </button>
        </div>
      </footer>
    </div>
  );
}
