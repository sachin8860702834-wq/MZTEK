import fs from "node:fs";
import path from "node:path";

import { MZTEK_DIR } from "../constants.js";

const LEDGER_FILE = "council-runs.json";

function ledgerPath(rootDir) {
  return path.join(path.resolve(rootDir), MZTEK_DIR, LEDGER_FILE);
}

function readLedger(rootDir) {
  const filePath = ledgerPath(rootDir);
  if (!fs.existsSync(filePath)) {
    return {
      runs: []
    };
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {
      runs: []
    };
  }
}

function writeLedger(rootDir, value) {
  const filePath = ledgerPath(rootDir);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function recordCouncilRun(rootDir, run) {
  const ledger = readLedger(rootDir);
  ledger.runs.push(run);
  if (ledger.runs.length > 120) {
    ledger.runs = ledger.runs.slice(-120);
  }
  writeLedger(rootDir, ledger);
}

export function latestCouncilRuns(rootDir, count = 10) {
  const ledger = readLedger(rootDir);
  return ledger.runs.slice(-count).reverse();
}

export function summarizeCouncilUsage(rootDir) {
  const runs = latestCouncilRuns(rootDir, 30);
  const summary = {
    totalRuns: runs.length,
    acceptedRuns: runs.filter((item) => item.accepted).length,
    rejectedRuns: runs.filter((item) => !item.accepted).length,
    totalEstimatedTokens: 0,
    totalEstimatedCostUsd: 0
  };

  for (const run of runs) {
    summary.totalEstimatedTokens += Number(run.usage?.estimatedTokens || 0);
    summary.totalEstimatedCostUsd += Number(run.usage?.estimatedCostUsd || 0);
  }

  summary.totalEstimatedCostUsd = Number(summary.totalEstimatedCostUsd.toFixed(6));
  return summary;
}
