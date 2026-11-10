import type { ProviderId } from "../types";
import type { ProviderAdapter } from "./types";
import { stabilityAdapter } from "./stability";
import { openaiCompatibleAdapter } from "./openaiCompatible";

export const adapters: Record<ProviderId, ProviderAdapter> = {
  stability: stabilityAdapter,
  openaiCompatible: openaiCompatibleAdapter,
};

export function getAdapter(id: ProviderId): ProviderAdapter {
  return adapters[id];
}

export type { ProviderAdapter, ProviderMeta } from "./types";
