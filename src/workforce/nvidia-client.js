export async function nvidiaClientChatCompletion({ baseUrl, apiKey, model, messages, fetchImpl = fetch }) {
  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages
    })
  });

  const rawText = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: rawText || response.statusText
    };
  }

  let body = null;
  try {
    body = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      status: 502,
      error: "NVIDIA response was not valid JSON."
    };
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    return {
      ok: false,
      status: 502,
      error: "NVIDIA response did not include completion content."
    };
  }

  return {
    ok: true,
    content
  };
}
