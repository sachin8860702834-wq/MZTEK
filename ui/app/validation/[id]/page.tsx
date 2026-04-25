import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { validationById } from "@/lib/mock-data";

export default async function ValidationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = validationById(id);

  if (!run) {
    notFound();
  }

  return (
    <AppShell
      active="validation"
      title={run.title}
      description="Detailed validation report with checks performed and failure reasons."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Validation Result">
          <div className="flex items-center gap-3">
            <Chip tone={run.status === "FAIL" ? "danger" : run.status === "PASS" ? "success" : "warning"}>
              {run.status}
            </Chip>
            <p className="text-sm text-slate-500">{run.ranAt}</p>
          </div>
        </SectionCard>

        <SectionCard title="Checks Performed">
          <div className="space-y-3">
            {run.checks.map((check) => (
              <div key={check} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                {check}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard title="Failure Reasons">
          <div className="space-y-3">
            {(run.failureReasons.length ? run.failureReasons : ["No failure reasons recorded."]).map((reason) => (
              <div key={reason} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                {reason}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
