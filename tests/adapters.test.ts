import { describe, it, expect, vi, afterEach } from "vitest";
import { stabilityAdapter } from "../src/adapters/stability";
import { openaiCompatibleAdapter } from "../src/adapters/openaiCompatible";
import type { AdapterConfig } from "../src/adapters/types";

const cfg: AdapterConfig = {
  endpoint: "https://api.stability.ai/v2beta/stable-image/generate/img2img",
  apiKey: "sk-test",
  model: "stable-diffusion-xl-1.0",
};

function makeBlob(): Blob {
  return new Blob(["x"], { type: "image/jpeg" });
}

describe("stability adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("成功响应：base64 映射为 data URL，且请求头/表单正确", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ images: [{ image: "QUJD" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await stabilityAdapter.generate(
      { image: makeBlob(), prompt: "abstract", strength: 0.7, model: "stable-diffusion-xl-1.0" },
      cfg,
    );

    expect(res.error).toBeUndefined();
    expect(res.imageBase64).toBe("data:image/png;base64,QUJD");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(cfg.endpoint);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    const body = init.body as FormData;
    expect(body.get("prompt")).toBe("abstract");
    expect(body.get("strength")).toBe("0.7");
    expect(body.get("model")).toBe("stable-diffusion-xl-1.0");
    expect(body.get("output_format")).toBe("png");
    expect(body.get("image")).toBeInstanceOf(Blob);
  });

  it("HTTP 错误：提取 message 并返回 error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "invalid api token" }), { status: 401 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await stabilityAdapter.generate(
      { image: makeBlob(), prompt: "abstract", strength: 0.7 },
      cfg,
    );
    expect(res.error).toContain("401");
    expect(res.error).toContain("invalid api token");
  });
});

describe("openaiCompatible adapter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("成功响应：b64_json 映射为 data URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ b64_json: "QUJD" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await openaiCompatibleAdapter.generate(
      { image: makeBlob(), prompt: "abstract", strength: 0.7 },
      { endpoint: "https://api.openai.com/v1/images/edits", apiKey: "sk-test", model: "gpt-image-1" },
    );

    expect(res.imageBase64).toBe("data:image/png;base64,QUJD");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/images/edits");
    const body = init.body as FormData;
    expect(body.get("model")).toBe("gpt-image-1");
    expect(body.get("image")).toBeInstanceOf(Blob);
  });

  it("未填端点时返回明确错误，不发起请求", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await openaiCompatibleAdapter.generate(
      { image: makeBlob(), prompt: "abstract", strength: 0.7 },
      { endpoint: "", apiKey: "sk-test", model: "gpt-image-1" },
    );
    expect(res.error).toContain("端点");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("CORS / 网络失败（TypeError）被识别为跨域提示", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    const res = await openaiCompatibleAdapter.generate(
      { image: makeBlob(), prompt: "abstract", strength: 0.7 },
      { endpoint: "https://api.openai.com/v1/images/edits", apiKey: "sk-test", model: "gpt-image-1" },
    );
    expect(res.error).toContain("CORS");
  });
});
