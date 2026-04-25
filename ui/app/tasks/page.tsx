"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { fetchDashboard } from "@/lib/dashboard-api";
import type { BoardColumn, DashboardData } from "@/lib/dashboard-types";

const orderedColumns = [
  "intake",
  "understanding",
  "planning",
  "building",
  "reviewing",
  "validation",
  "done",
  "failed"
];

function sortColumns(columns: BoardColumn[]) {
  return [...columns].sort((left, right) => {
    const leftIndex = orderedColumns.indexOf(left.key);
    const rightIndex = orderedColumns.indexOf(right.key);
    const safeLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const safeRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;
    return safeLeft - safeRight;
  });
}

export default function TasksPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const result = await fetchDashboard("mztek");
      if (!alive) return;
      if (!result.ok) {
        setError(result.error || "Could not load live task board.");
      } else {
        setError("");
        setData(result.data || null);
      }
      setLoading(false);
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const columns = useMemo(() => sortColumns(data?.boardColumns || []), [data?.boardColumns]);
  const totalItems = columns.reduce((sum, column) => sum + column.items.length, 0);

  return (
    <AppShell
      active="tasks"
      title="Tasks"
      description="Live MZTEK work board from backend state, not static placeholders."
    >
      <SectionCard title="Task Board" subtitle="Columns are loaded from the active MZTEK dashboard API.">
        {loading ? (
          <p className="text-sm text-slate-500">Loading live task board...</p>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">Could not load tasks</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-4">
            {columns.map((column) => (
              <div key={column.key} className="rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-950">{column.title}</h3>
                  <Chip tone={column.items.length ? "default" : "warning"}>{column.items.length}</Chip>
                </div>
                <div className="space-y-3">
                  {column.items.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                      No live items.
                    </div>
                  ) : (
                    column.items.slice(0, 8).map((task) => (
                      <div key={task.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-950">{task.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{task.description || task.status || "No details provided."}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {task.status ? <Chip>{task.status}</Chip> : null}
                          {task.proof !== undefined ? <Chip tone="warning">proof: {String(task.proof)}</Chip> : null}
                          {task.updatedAt ? <Chip>{task.updatedAt}</Chip> : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">Total live tracked items: {totalItems}</p>
      </SectionCard>
    </AppShell>
  );
}
