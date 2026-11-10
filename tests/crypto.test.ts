import { describe, it, expect } from "vitest";
import {
  decryptString,
  encryptString,
  generateRawKey,
  importRawKey,
  rawKeyFromBase64,
  rawKeyToBase64,
} from "../src/lib/crypto";

describe("crypto (AES-GCM 加密 Key at rest)", () => {
  it("加密后可解密还原明文", async () => {
    const key = await importRawKey(generateRawKey());
    const secret = "sk-1234567890abcdef";
    const cipher = await encryptString(secret, key);
    expect(cipher).not.toContain(secret);
    const plain = await decryptString(cipher, key);
    expect(plain).toBe(secret);
  });

  it("不同 IV 产生不同密文（语义安全）", async () => {
    const key = await importRawKey(generateRawKey());
    const a = await encryptString("hello", key);
    const b = await encryptString("hello", key);
    expect(a).not.toBe(b);
  });

  it("密钥 base64 可往返", () => {
    const raw = generateRawKey();
    const b64 = rawKeyToBase64(raw);
    const back = rawKeyFromBase64(b64);
    expect(Array.from(back)).toEqual(Array.from(raw));
  });

  it("篡改密文会解密失败", async () => {
    const key = await importRawKey(generateRawKey());
    const cipher = await encryptString("topsecret", key);
    const tampered = cipher.slice(0, -2) + (cipher.endsWith("A") ? "B" : "A");
    await expect(decryptString(tampered, key)).rejects.toBeTruthy();
  });
});
