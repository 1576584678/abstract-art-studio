// 图片前端压缩：长边 ≤ maxSide，质量 quality，输出 JPEG Blob + 预览 dataURL。

export interface CompressResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/** 纯函数：根据原始尺寸与最大边长计算等比缩放后的尺寸（不依赖 DOM，便于单测）。 */
export function computeScaledSize(
  srcW: number,
  srcH: number,
  maxSide: number,
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(srcW, srcH);
  if (longest <= maxSide) {
    return { width: srcW, height: srcH, scaled: false };
  }
  const ratio = maxSide / longest;
  return {
    width: Math.round(srcW * ratio),
    height: Math.round(srcH * ratio),
    scaled: true,
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("读取失败"));
    reader.readAsDataURL(blob);
  });
}

/**
 * 压缩图片文件。
 * - 使用 createImageBitmap 解码（现代浏览器支持 jpg/png/webp）。
 * - 长边超过 maxSide 时等比缩放到 maxSide。
 * - 以 JPEG、指定质量编码。
 */
export async function compressImage(
  file: File,
  maxSide = 1024,
  quality = 0.85,
): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = computeScaledSize(
      bitmap.width,
      bitmap.height,
      maxSide,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建画布上下文");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("图片编码失败");
    const dataUrl = await blobToDataUrl(blob);
    return { blob, dataUrl, width, height };
  } finally {
    bitmap.close();
  }
}
