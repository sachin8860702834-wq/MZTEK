"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { fetchDashboard } from "@/lib/dashboard-api";
import type { DashboardData } from "@/lib/dashboard-types";

type CouncilAssignmentRun = {
  role?: string;
  model?: string;
  ok?: boolean;
  accepted?: boolean;
  issues?: string[];
  error?: string;
  usage?: {
    estimatedTokens?: number;
    estimatedCostUsd?: number;
  };
  startedAt?: string;
  finishedAt?: string;
};

type CouncilRunData = {
  id?: string;
  runId?: string;
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  taskId?: string;
  taskType?: string;
  objective?: string;
  accepted?: boolean;
  summary?: {
    acceptedCount?: number;
    rejectedCount?: number;
    usage?: {
      estimatedTokens?: number;
      estimatedCostUsd?: number;
    };
  };
  runs?: CouncilAssignmentRun[];
  assignments?: Array<{
    role?: string;
    model?: string;
    rationale?: string;
  }>;
};

function formatWhen(value?: string) {
  if (!value) {
    return "n/a";
  }

  const stamp = new Date(value);
  if (Number.isNaN(stamp.getTime())) {
    return value;
  }

  return stamp.toLocaleString();
}

function asNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function pickRecentRuns(data?: DashboardData | null) {
  const maybeRecent = data?.council?.recentRuns;
  if (Array.isArray(maybeRecent) && maybeRecent.length) {
    return maybeRecent as unknown as CouncilRunData[];
  }

  const maybeLatest = data?.council?.latest;
  if (maybeLatest) {
    return [maybeLatest as unknown as CouncilRunData];
  }

  return [];
}

function statusTone(ok?: boolean, accepted?: boolean, hasError?: boolean): "success" | "warning" | "danger" | "default" {
  if (hasError || ok === false) {
    return "danger";
  }
  if (accepted) {
    return "success";
  }
  if (ok) {
    return "warning";
  }
  return "default";
}

export default function ValidationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      const response = await fetchDashboard("mztek");
      if (!mounted) {
        return;
      }

      if (!response.ok) {
        setError(response.error || "Could not load dashboard data.");
        setDashboard(null);
      } else {
        setDashboard(response.data || null);
      }

      setLoading(false);
    }

    void load();
    const timer = window.setInterval(load, 12000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const recentRuns = pickRecentRuns(dashboard);

  return (
    <AppShell
      active="validation"
      title="Validation"
      description="Council run visibility from live dashboard data, including role-level outcomes and evidence."
    >
      <SectionCard title="Council Runs" subtitle="Live council telemetry from /api/mztek/dashboard">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Loading real council runs...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            Could not load council runs: {error}
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No council runs recorded yet. Run an analyze/command cycle to generate live worker runs.
          </div>
        ) : (
          <div className="space-y-4">
            {recentRuns.map((run, idx) => {
              const runKey = run.id || run.runId || `${run.taskId || "run"}-${idx}`;
              const perRoleRuns = Array.isArray(run.runs) ? run.runs : [];
              const acceptedCount = asNumber(run.summary?.acceptedCount);
              const rejectedCount = asNumber(run.summary?.rejectedCount);
              const tokenSum = asNumber(run.summary?.usage?.estimatedTokens);
              const costSum = asNumber(run.summary?.usage?.estimatedCostUsd);

              return (
                <div key={runKey} className="rounded-[22px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {run.taskId || run.objective || run.id || run.runId || "Council run"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Type: {run.taskType || "n/a"} • Created: {formatWhen(run.createdAt || run.startedAt)}
                      </p>
                    </div>
                    <Chip tone={run.accepted ? "success" : "warning"}>{run.accepted ? "Accepted" : "Needs Review"}</Chip>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-4">
                    <p>Accepted roles: {acceptedCount}</p>
                    <p>Rejected roles: {rejectedCount}</p>
                    <p>Estimated tokens: {tokenSum}</p>
                    <p>Estimated cost: ${costSum.toFixed(6)}</p>
                  </div>

                  {perRoleRuns.length ? (
                    <div className="mt-4 space-y-3">
                      {perRoleRuns.map((roleRun, roleIndex) => {
                        const roleKey = `${roleRun.role || "role"}-${roleIndex}`;
                        const hasError = Boolean(roleRun.error);
                        const issuesText = roleRun.issues?.length ? roleRun.issues.join(", ") : "none";
                        const roleTokens = asNumber(roleRun.usage?.estimatedTokens);
                        const roleCost = asNumber(roleRun.usage?.estimatedCostUsd);

                        return (
                          <div key={roleKey} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-900">
                                {roleRun.role || "unknown-role"} • {roleRun.model || "unknown-model"}
                              </p>
                              <Chip tone={statusTone(roleRun.ok, roleRun.accepted, hasError)}>
                                {hasError ? "Error" : roleRun.accepted ? "Accepted" : roleRun.ok ? "Rejected" : "Failed"}
                              </Chip>
                            </div>
                            <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                              <p>ok: {String(Boolean(roleRun.ok))}</p>
                              <p>accepted: {String(Boolean(roleRun.accepted))}</p>
                              <p>issues: {issuesText}</p>
                              <p>error: {roleRun.error || "none"}</p>
                              <p>tokens: {roleTokens}</p>
                              <p>cost: ${roleCost.toFixed(6)}</p>
                              <p>started: {formatWhen(roleRun.startedAt)}</p>
                              <p>finished: {formatWhen(roleRun.finishedAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      No per-role run entries were returned for this council run.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </AppShell>
  );
}
