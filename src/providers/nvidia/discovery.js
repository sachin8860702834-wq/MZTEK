import { nvidiaListModels } from "./client.js";
import { buildModelCapabilityRegistry } from "./registry.js";

function parseEnvModels(env = process.env) {
  const explicit = String(env.NVIDIA_MODELS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const fallback = env.NVIDIA_DEFAULT_MODEL ? [String(env.NVIDIA_DEFAULT_MODEL).trim()] : [];
  return [...new Set([...explicit, ...fallback])];
}

export async function discoverNvidiaModels({
  baseUrl,
  apiKey,
  env = process.env,
  fetchImpl = fetch
}) {
  const envModels = parseEnvModels(env);
  if (!apiKey) {
    return {
      ok: true,
      source: "env",
      models: envModels,
      registry: buildModelCapabilityRegistry(envModels),
      warning: "No API key present, discovery is limited to configured environment models."
    };
  }

  const listed = await nvidiaListModels({
    baseUrl,
    apiKey,
    fetchImpl
  });

  if (!listed.ok) {
    return {
      ok: envModels.length > 0,
      source: "fallback",
      models: envModels,
      registry: buildModelCapabilityRegistry(envModels),
      warning: listed.error || "NVIDIA model discovery failed."
    };
  }

  const models = listed.models.length ? listed.models : envModels;
  return {
    ok: true,
    source: "api",
    models,
    registry: buildModelCapabilityRegistry(models),
    warning: ""
  };
}
