import styles from "./ComplianceModal.module.css";

interface Props {
  onAck: () => void;
}

export function ComplianceModal({ onAck }: Props) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cmp-title">
      <div className={styles.card}>
        <h2 id="cmp-title" className={styles.title}>
          使用前须知
        </h2>
        <ul className={styles.list}>
          <li>
            <strong>图片只发给你配置的模型服务。</strong>
            我们不会把你的图片上传到任何平台方，也不做持久化存储。
          </li>
          <li>
            <strong>API Key 仅保存在你本机浏览器</strong>
            （localStorage，加密存储），不会写入代码、URL 或服务器。
          </li>
          <li>
            生成费用由你自己的模型账户承担；不同风格 / 分辨率费用不同，请留意账户额度。
          </li>
          <li>确认即代表你理解上述数据流向，并自行对上传内容负责。</li>
        </ul>
        <button className={styles.btn} onClick={onAck}>
          我已了解，开始使用
        </button>
      </div>
    </div>
  );
}
