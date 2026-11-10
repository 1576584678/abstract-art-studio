import styles from "./StatusBanner.module.css";

interface Props {
  status: string;
  error: string | null;
  result: string | null;
  onRetry: () => void;
}

export function StatusBanner({ status, error, result, onRetry }: Props) {
  if (status === "error" && error) {
    return (
      <div className={`${styles.banner} ${styles.error}`} role="alert">
        <span className={styles.icon}>⚠</span>
        <div className={styles.body}>
          <p className={styles.msg}>{error}</p>
          <button className={styles.retry} onClick={onRetry}>
            重试
          </button>
        </div>
      </div>
    );
  }
  if (status === "success" && result) {
    return (
      <div className={`${styles.banner} ${styles.ok}`} role="status">
        <span className={styles.icon}>✓</span>
        <p className={styles.msg}>生成成功！可点击「下载 PNG」保存。</p>
      </div>
    );
  }
  return null;
}
