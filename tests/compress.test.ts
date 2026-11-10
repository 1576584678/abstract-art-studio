import { describe, it, expect } from "vitest";
import { computeScaledSize } from "../src/lib/compress";

describe("computeScaledSize", () => {
  it("小于最大边长时不缩放", () => {
    const r = computeScaledSize(800, 600, 1024);
    expect(r.scaled).toBe(false);
    expect(r.width).toBe(800);
    expect(r.height).toBe(600);
  });

  it("正方形超长边时等比缩放到最大边长", () => {
    const r = computeScaledSize(2048, 2048, 1024);
    expect(r.scaled).toBe(true);
    expect(r.width).toBe(1024);
    expect(r.height).toBe(1024);
  });

  it("横向图按长边缩放并保持宽高比", () => {
    const r = computeScaledSize(4000, 2000, 1024);
    expect(r.width).toBe(1024);
    expect(r.height).toBe(512);
  });

  it("纵向图按长边缩放并保持宽高比", () => {
    const r = computeScaledSize(1500, 3000, 1024);
    expect(r.width).toBe(512);
    expect(r.height).toBe(1024);
  });

  it("缩放后宽高比保持近似一致", () => {
    const r = computeScaledSize(1920, 1080, 1024);
    const ratioBefore = 1920 / 1080;
    const ratioAfter = r.width / r.height;
    expect(Math.abs(ratioBefore - ratioAfter)).toBeLessThan(0.01);
  });
});
