import type {
  AdapterConfig,
  GenRequest,
  GenResult,
  ProviderAdapter,
  ProviderMeta,
} from "./types";
import { classifyError } from "./types";

const meta: ProviderMeta = {
  id: "openaiCompatible",
  label: "OpenAI 兼容端点（需自验 CORS）",
  corsFriendly: false,
  defaultEndpoint: "https://api.openai.com/v1/images/edits",
  defaultModel: "gpt-image-1",
  endpointPlaceholder: "https://your-endpoint/v1/images/edits",
  modelPlaceholder: "gpt-image-1",
  supportsStrength: false,
  help: "通用 OpenAI 兼容图像接口（如 gpt-image-1 的 images/edits）。注意：OpenAI 官方域名通常不允许浏览器跨域直连，可能触发 CORS，需使用支持 CORS 的代理/兼容端点。",
};

function buildForm(req: GenRequest, model: string): FormData {
  const form = new FormData();
  form.append("image", req.image, "source.png");
  form.append("prompt", req.prompt);
  form.append("model", model);
  form.append("n", "1");
  form.append("size", "1024x1024");
  form.append("output_format", "png");
  return form;
}

function extractError(body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.error === "string") return b.error;
    if (b.error && typeof b.error === "object") {
      const e = b.error as Record<string, unknown>;
      if (typeof e.message === "string") return e.message;
    }
    if (typeof b.message === "string") return b.message;
  }
  return "生成失败，未返回图像。";
}

export const openaiCompatibleAdapter: ProviderAdapter = {
  meta,
  async generate(
    req: GenRequest,
    config: AdapterConfig,
  ): Promise<GenResult> {
    try {
      if (!config.endpoint) {
        return { error: "请先填写 OpenAI 兼容端点 URL。" };
      }
      const model = req.model || config.model || meta.defaultModel;
      const res = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: buildForm(req, model),
        signal: req.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = "";
        try {
          detail = extractError(JSON.parse(text));
        } catch {
          detail = text || `HTTP ${res.status}`;
        }
        return { error: `接口返回错误（${res.status}）：${detail}` };
      }
      const json = (await res.json()) as {
        data?: ({ b64_json?: string; url?: string })[];
      };
      const item = json.data?.[0];
      if (item?.b64_json) {
        return { imageBase64: `data:image/png;base64,${item.b64_json}` };
      }
      if (item?.url) return { imageUrl: item.url };
      return { error: "生成成功但未返回图像数据。" };
    } catch (err) {
      return { error: classifyError(err) };
    }
  },
};
