// 下载工具：将生成的图片（base64 或 URL）保存为本地文件。

function dataUrlToBlob(dataUrl: string): Blob {
  // data:image/png;base64,xxxx
  const [meta, b64] = dataUrl.split(",");
  const mimeMatch = meta.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** 触发浏览器下载。支持 base64 dataURL 与 http(s) URL。 */
export function downloadImage(src: string, filename: string): void {
  let url: string;
  let revoke = false;
  if (src.startsWith("data:")) {
    const blob = dataUrlToBlob(src);
    url = URL.createObjectURL(blob);
    revoke = true;
  } else {
    url = src;
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) URL.revokeObjectURL(url);
}
