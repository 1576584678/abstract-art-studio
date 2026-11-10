import type { StylePreset } from "../types";
import styles from "./StylePicker.module.css";

interface Props {
  presets: StylePreset[];
  presetId: string;
  strength: number;
  customPrompt: string;
  supportsStrength: boolean;
  onSelect: (id: string) => void;
  onStrength: (v: number) => void;
  onCustom: (v: string) => void;
}

export function StylePicker({
  presets,
  presetId,
  strength,
  customPrompt,
  supportsStrength,
  onSelect,
  onStrength,
  onCustom,
}: Props) {
  return (
    <div className={styles.wrap}>
      <h3 className={styles.title}>抽象风格</h3>
      <div className={styles.grid}>
        {presets.map((p) => (
          <button
            key={p.id}
            className={`${styles.card} ${p.id === presetId ? styles.active : ""}`}
            onClick={() => onSelect(p.id)}
            aria-pressed={p.id === presetId}
          >
            <span className={styles.swatch} style={{ background: p.swatch }} />
            <span className={styles.name}>{p.name}</span>
            <span className={styles.desc}>{p.description}</span>
          </button>
        ))}
      </div>

      {supportsStrength && (
        <div className={styles.slider}>
          <div className={styles.sliderHead}>
            <span>抽象强度</span>
            <span className={styles.val}>{strength.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={strength}
            onChange={(e) => onStrength(Number(e.target.value))}
          />
          <div className={styles.scaleBt}>
            <span>保真</span>
            <span>抽象</span>
          </div>
        </div>
      )}

      <label className={styles.addLabel}>
        <span>附加描述（可选）</span>
        <textarea
          value={customPrompt}
          placeholder="例如：更暖的色调、加入金色线条…"
          rows={2}
          onChange={(e) => onCustom(e.target.value)}
        />
      </label>
    </div>
  );
}
