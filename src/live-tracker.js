import fs from "node:fs";
import path from "node:path";

export function liveStatusPath(workspaceRoot) {
  return path.join(workspaceRoot, "docs", "project", "live-status.json");
}

export function loadLiveStatus(workspaceRoot) {
  const filePath = liveStatusPath(workspaceRoot);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Live status file not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function formatLiveStatus(status) {
  const lines = [
    `Project: ${status.project}`,
    `Stage: ${status.stage}`,
    `Current Phase: ${status.current_phase}`,
    `Current Task: ${status.current_task}`,
    ""
  ];

  if (status.current_focus?.length) {
    lines.push("Current Focus:");
    for (const item of status.current_focus) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (status.latest_capability_gains?.length) {
    lines.push("Latest Capability Gains:");
    for (const item of status.latest_capability_gains) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (status.completed_recently?.length) {
    lines.push("Completed Recently:");
    for (const item of status.completed_recently) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  if (status.pending_next?.length) {
    lines.push("Pending Next:");
    for (const item of status.pending_next) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  lines.push("Blockers:");
  if (status.blockers?.length) {
    for (const item of status.blockers) {
      lines.push(`- ${item}`);
    }
  } else {
    lines.push("- None right now.");
  }
  lines.push("");

  if (status.latest_validation) {
    lines.push("Latest Validation:");
    lines.push(`- ${status.latest_validation.summary}`);
    lines.push(`- Tests: ${status.latest_validation.tests_passing}/${status.latest_validation.tests_total}`);
    lines.push("");
  }

  if (status.active_team?.length) {
    lines.push("Active Team Model:");
    for (const item of status.active_team) {
      lines.push(`- ${item}`);
    }
    lines.push("");
  }

  lines.push(`Updated At: ${status.updated_at}`);
  return lines.join("\n");
}

export function formatPulse(status) {
  const lines = [
    `Project Pulse: ${status.project}`,
    `Stage: ${status.stage}`,
    `Right now: ${status.current_task}`,
    ""
  ];

  const topGain = status.latest_capability_gains?.[0];
  const topNext = status.pending_next?.[0];
  const topBlocker = status.blockers?.[0];

  if (topGain) {
    lines.push(`Latest Gain: ${topGain}`);
  }

  if (topNext) {
    lines.push(`Next Move: ${topNext}`);
  }

  lines.push(`Blocker: ${topBlocker || "None right now."}`);

  if (status.latest_validation) {
    lines.push(`Validation: ${status.latest_validation.tests_passing}/${status.latest_validation.tests_total} tests green`);
  }

  if (status.current_focus?.length) {
    lines.push("");
    lines.push("Focus Now:");
    for (const item of status.current_focus.slice(0, 3)) {
      lines.push(`- ${item}`);
    }
  }

  return lines.join("\n");
}
