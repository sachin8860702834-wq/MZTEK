export function modelDiscovery({ env = process.env }) {
  const explicit = String(env.NVIDIA_MODELS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const fallback = env.NVIDIA_DEFAULT_MODEL ? [String(env.NVIDIA_DEFAULT_MODEL).trim()] : [];
  const models = [...new Set([...explicit, ...fallback])];

  return {
    provider: "nvidia",
    models
  };
}
