import type { OriginalImage } from "../hooks/useGenerator";
import styles from "./ResultView.module.css";

interface Props {
  image: OriginalImage | null;
  result: string | null;
  status: string;
  elapsed: number;
  providerLabel: string;
  presetLabel: string;
}

export function ResultView({
  image,
  result,
  status,
  elapsed,
  providerLabel,
  presetLabel,
}: Props) {
  if (!image && !result) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🎨</div>
        <p>上传图片并选择风格后，这里会并排展示「原图 → 抽象画」。</p>
      </div>
    );
  }

  return (
    <div className={styles.compare}>
      {image && (
        <figure className={styles.cell}>
          <figcaption>原图</figcaption>
          <img src={image.dataUrl} alt="原图" className={styles.img} />
        </figure>
      )}
      <figure className={styles.cell}>
        <figcaption>
          {status === "generating"
            ? `生成中… ${elapsed}s`
            : result
              ? "抽象画"
              : "待生成"}
        </figcaption>
        {status === "generating" ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>
              正在调用 {providerLabel}
              <br />
              风格：{presetLabel}
            </p>
          </div>
        ) : result ? (
          <img src={result} alt="生成的抽象画" className={styles.img} />
        ) : (
          <div className={styles.placeholder}>点击「生成抽象画」</div>
        )}
      </figure>
    </div>
  );
}
