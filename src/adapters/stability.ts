import type {
  AdapterConfig,
  GenRequest,
  GenResult,
  ProviderAdapter,
  ProviderMeta,
} from "./types";
import { classifyError } from "./types";

const meta: ProviderMeta = {
  id: "stability",
  label: "Stability AI（CORS 友好）",
  corsFriendly: true,
  defaultEndpoint: "https://api.stability.ai/v2beta/stable-image/generate/img2img",
  defaultModel: "stable-diffusion-xl-1.0",
  endpointPlaceholder: "https://api.stability.ai/v2beta/stable-image/generate/img2img",
  modelPlaceholder: "stable-diffusion-xl-1.0",
  supportsStrength: true,
  help: "使用 Stability 官方 img2img 接口，浏览器可直连。需自备 API Key（https://platform.stability.ai）。",
};

function buildForm(req: GenRequest, model: string): FormData {
  const form = new FormData();
  form.append("prompt", req.prompt);
  form.append("image", req.image, "source.jpg");
  form.append("strength", String(req.strength));
  form.append("output_format", "png");
  form.append("model", model);
  if (req.negative) form.append("negative_prompt", req.negative);
  return form;
}

function extractError(body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (typeof b.message === "string") return b.message;
    if (Array.isArray(b.errors)) return b.errors.join("；");
  }
  return "生成失败，未返回图像。";
}

export const stabilityAdapter: ProviderAdapter = {
  meta,
  async generate(
    req: GenRequest,
    config: AdapterConfig,
  ): Promise<GenResult> {
    try {
      const model = req.model || config.model || meta.defaultModel;
      const res = await fetch(config.endpoint || meta.defaultEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/json",
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
        return { error: `Stability 返回错误（${res.status}）：${detail}` };
      }
      const json = (await res.json()) as {
        images?: { image?: string }[];
      };
      const b64 = json.images?.[0]?.image;
      if (!b64) return { error: "生成成功但未返回图像数据。" };
      return { imageBase64: `data:image/png;base64,${b64}` };
    } catch (err) {
      return { error: classifyError(err) };
    }
  },
};
