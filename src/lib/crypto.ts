// 浏览器端 API Key 加密存储（AES-GCM）。
//
// 设计取舍（对应 PRD 风险 RK-02）：纯前端无用户口令可派生密钥，
// 因此采用「本地随机生成 AES-256 密钥 + 同域 localStorage 保存」的方案，
// 使 API Key 不以明文落盘（不进代码 / URL / console / 日志）。
// 该方案防护的是「明文泄露 + 跨源读取」，无法抵御同源 XSS；
// v2 引入 Worker 代理可进一步隔离（见 PRD 演进路径）。

const enc = new TextEncoder();
const dec = new TextDecoder();

/** 生成 32 字节随机原始密钥。 */
export function generateRawKey(): Uint8Array {
  const raw = new Uint8Array(32);
  crypto.getRandomValues(raw);
  return raw;
}

/** 将原始密钥导入为 AES-GCM CryptoKey。 */
export async function importRawKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** 将密钥导出为 base64 字符串，便于持久化。 */
export function rawKeyToBase64(raw: Uint8Array): string {
  let bin = "";
  for (const b of raw) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** 从 base64 还原原始密钥。 */
export function rawKeyFromBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const raw = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) raw[i] = bin.charCodeAt(i);
  return raw;
}

/**
 * 加密明文，返回 base64(iv | ciphertext)。
 * 每次加密使用随机 12 字节 IV。
 */
export async function encryptString(
  plaintext: string,
  key: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc.encode(plaintext) as BufferSource,
  );
  const out = new Uint8Array(iv.length + ct.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ct), iv.length);
  let bin = "";
  for (const b of out) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** 解密 encryptString 产物；密文非法时抛出。 */
export async function decryptString(
  payload: string,
  key: CryptoKey,
): Promise<string> {
  const bin = atob(payload);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const iv = buf.subarray(0, 12);
  const ct = buf.subarray(12);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  return dec.decode(pt);
}
