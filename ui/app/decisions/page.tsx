import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui";
import { decisions } from "@/lib/mock-data";

export default function DecisionsPage() {
  return (
    <AppShell
      active="decisions"
      title="Decisions"
      description="History of key decisions, why they were made, and what changed after each one."
    >
      <SectionCard title="Decision History">
        <div className="space-y-3">
          {decisions.map((decision) => (
            <article key={decision.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-950">{decision.title}</p>
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">Why:</span> {decision.reason}</p>
              <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-900">Impact:</span> {decision.impact}</p>
              <p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-900">What changed:</span> {decision.changed}</p>
              <p className="mt-3 text-xs text-slate-400">{decision.at}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
