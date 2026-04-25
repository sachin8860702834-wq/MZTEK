function isoNow() {
  return new Date().toISOString();
}

function nextReviewId(state) {
  const id = state.reviews.nextId || 1;
  state.reviews.nextId = id + 1;
  return `REVIEW-${String(id).padStart(3, "0")}`;
}

export function recordQaReview(state, input) {
  const record = {
    id: nextReviewId(state),
    promptId: input.promptId || "unlinked",
    taskId: input.taskId || "unscoped",
    reviewer: input.reviewer || "qa-sidecar",
    severity: input.severity || "medium",
    failureClass: input.failureClass || "unclassified",
    critique: input.critique || "",
    evidenceGap: input.evidenceGap || "",
    recommendedAction: input.recommendedAction || "",
    sourceType: input.sourceType || "manual",
    createdAt: isoNow()
  };

  state.reviews.items.push(record);
  state.project.updatedAt = record.createdAt;
  return record;
}

export function latestQaReviews(state, limit = 5) {
  return state.reviews.items.slice().reverse().slice(0, limit);
}
