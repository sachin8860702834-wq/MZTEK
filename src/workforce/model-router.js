export function modelRouter({ taskType, availableModels }) {
  const models = availableModels.filter(Boolean);
  if (!models.length) {
    return [];
  }

  const first = models[0];
  const second = models[1];

  if (taskType === "analysis" && second) {
    return [first, second];
  }

  return [first];
}
