import { useRef, useState } from "react";
import styles from "./Uploader.module.css";
import type { OriginalImage } from "../hooks/useGenerator";

interface Props {
  image: OriginalImage | null;
  compressing: boolean;
  onFile: (file: File) => void;
  onClear: () => void;
}

export function Uploader({ image, compressing, onFile, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) onFile(files[0]);
  };

  if (image) {
    return (
      <div className={styles.wrap}>
        <div className={styles.previewBox}>
          <img src={image.dataUrl} alt="原图预览" className={styles.preview} />
          <button className={styles.clear} onClick={onClear} aria-label="移除图片">
            ×
          </button>
        </div>
        <p className={styles.meta}>
          已压缩至 {image.width}×{image.height}（长边 ≤1024，质量 0.85）
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.drop} ${dragOver ? styles.over : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className={styles.input}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className={styles.icon}>⬆</div>
      <div className={styles.hint}>
        {compressing ? "正在压缩…" : "点击或拖拽上传图片"}
      </div>
      <div className={styles.sub}>支持 jpg / png / webp，自动压缩后仅发送至你的模型服务</div>
    </div>
  );
}
