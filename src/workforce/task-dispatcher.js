import { nvidiaClientChatCompletion } from "./nvidia-client.js";

export async function taskDispatcher({ baseUrl, apiKey, models, messages, fetchImpl = fetch }) {
  const runs = [];

  for (const model of models) {
    const startedAt = new Date().toISOString();
    const run = await nvidiaClientChatCompletion({
      baseUrl,
      apiKey,
      model,
      messages,
      fetchImpl
    });
    runs.push({
      model,
      startedAt,
      finishedAt: new Date().toISOString(),
      ...run
    });
  }

  return runs;
}
