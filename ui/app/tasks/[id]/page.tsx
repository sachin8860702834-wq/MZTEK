import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { taskById } from "@/lib/mock-data";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = taskById(id);

  if (!task) {
    notFound();
  }

  return (
    <AppShell
      active="tasks"
      title={task.title}
      description="Task detail view with description, evidence, validation, QA feedback, and dependencies."
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="Task Description">
          <p className="text-sm leading-7 text-slate-600">{task.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip>{task.status}</Chip>
            <Chip tone={task.validationStatus === "FAIL" ? "danger" : task.validationStatus === "PASS" ? "success" : "warning"}>
              {task.validationStatus}
            </Chip>
            <Chip>{task.owner}</Chip>
          </div>
        </SectionCard>

        <SectionCard title="Task Meta">
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-950">Evidence count</p>
              <p>{task.evidenceCount}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Updated</p>
              <p>{task.updatedAt}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Dependencies</p>
              <p>{task.dependencies.length ? task.dependencies.join(", ") : "No dependencies recorded."}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <SectionCard title="Evidence">
          <div className="space-y-3">
            {Array.from({ length: task.evidenceCount || 1 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">Evidence item {index + 1}</p>
                <p className="mt-2 text-sm text-slate-500">
                  Placeholder for code, logs, outputs, or screenshots tied to this task.
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Validation Result">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Chip tone={task.validationStatus === "FAIL" ? "danger" : task.validationStatus === "PASS" ? "success" : "warning"}>
                {task.validationStatus}
              </Chip>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Validation status is ready to connect to live MZTEK core results in the next step.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="QA Feedback">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">{task.qaFeedback}</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
