import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { activity } from "@/lib/mock-data";

export default function ActivityPage() {
  return (
    <AppShell
      active="activity"
      title="Activity"
      description="Slack-style event timeline for tasks, validations, integrations, and decisions."
    >
      <SectionCard title="Activity Timeline">
        <div className="space-y-3">
          {activity.map((event) => (
            <article key={event.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                <Chip>{event.kind}</Chip>
              </div>
              <p className="mt-3 text-sm text-slate-600">{event.detail}</p>
              <p className="mt-3 text-xs text-slate-400">{event.at}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
