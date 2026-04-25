import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { agents } from "@/lib/mock-data";

export default function AgentsPage() {
  return (
    <AppShell
      active="agents"
      title="Agents"
      description="Track which agents are active, what they are doing, and what they most recently produced."
    >
      <SectionCard title="Active Agents" subtitle="Operational status across builders, reviewers, and providers.">
        <div className="space-y-3">
          {agents.map((agent) => (
            <article key={agent.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{agent.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{agent.role}</p>
                </div>
                <Chip tone={agent.status === "blocked" ? "danger" : agent.status === "active" ? "success" : "warning"}>
                  {agent.status}
                </Chip>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900">Current: {agent.currentTask}</p>
              <p className="mt-2 text-sm text-slate-500">Last output: {agent.lastOutput}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
