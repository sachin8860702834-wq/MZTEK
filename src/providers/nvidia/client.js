export async function nvidiaChatCompletion({
  baseUrl,
  apiKey,
  model,
  messages,
  temperature = 0.2,
  fetchImpl = fetch
}) {
  const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature,
      messages
    })
  });

  const rawText = await response.text();
  let body = null;

  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body?.error?.message || rawText || response.statusText,
      usage: body?.usage || null
    };
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    return {
      ok: false,
      status: 502,
      error: "NVIDIA response did not include completion content.",
      usage: body?.usage || null
    };
  }

  return {
    ok: true,
    content,
    usage: body?.usage || null
  };
}

export async function nvidiaListModels({
  baseUrl,
  apiKey,
  fetchImpl = fetch
}) {
  const response = await fetchImpl(`${String(baseUrl).replace(/\/$/, "")}/models`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`
    }
  });

  const rawText = await response.text();
  let body = null;

  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body?.error?.message || body?.detail || rawText || response.statusText,
      models: []
    };
  }

  const models = Array.isArray(body?.data)
    ? body.data
        .map((item) => item.id)
        .filter(Boolean)
    : [];

  return {
    ok: true,
    models
  };
}
