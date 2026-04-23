function isoNow() {
  return new Date().toISOString();
}

export function createTask(state, input) {
  const id = `TASK-${String(state.tasks.nextId).padStart(3, "0")}`;
  state.tasks.nextId += 1;

  const task = {
    id,
    title: input.title,
    owner: input.owner || "unassigned",
    status: input.status || "todo",
    claimedDone: false,
    verifiedDone: false,
    kind: input.kind || "general",
    dependencies: input.dependencies || [],
    requiredEvidence: input.requiredEvidence || [],
    evidence: [],
    notes: input.notes || "",
    createdAt: isoNow(),
    updatedAt: isoNow()
  };

  state.tasks.items.push(task);
  state.project.updatedAt = isoNow();
  return task;
}

export function findTask(state, taskId) {
  return state.tasks.items.find((task) => task.id === taskId);
}

export function claimTaskDone(state, taskId, note) {
  const task = findTask(state, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  task.claimedDone = true;
  task.status = "claimed_done";
  if (note) {
    task.notes = task.notes ? `${task.notes}\n${note}` : note;
  }
  task.updatedAt = isoNow();
  state.project.updatedAt = isoNow();
  return task;
}

export function addEvidence(state, taskId, input) {
  const task = findTask(state, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const evidence = {
    type: input.type,
    detail: input.detail,
    addedAt: isoNow()
  };

  task.evidence.push(evidence);
  task.updatedAt = isoNow();
  state.project.updatedAt = isoNow();
  return evidence;
}

export function addDecision(state, summary, rationale) {
  const item = {
    id: `DEC-${String(state.decisions.items.length + 1).padStart(3, "0")}`,
    summary,
    rationale: rationale || "",
    addedAt: isoNow()
  };

  state.decisions.items.push(item);
  state.project.updatedAt = isoNow();
  return item;
}
