import { AppShell } from "@/components/app-shell";
import { Chip, SectionCard } from "@/components/ui";
import { integrations } from "@/lib/mock-data";

export default function IntegrationsPage() {
  return (
    <AppShell
      active="integrations"
      title="Integrations"
      description="Connection status for GitHub, NVIDIA, and other systems MZTEK depends on."
    >
      <SectionCard title="Integration Status">
        <div className="space-y-3">
          {integrations.map((integration) => (
            <article key={integration.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950">{integration.label}</p>
                <Chip tone={integration.status === "Connected" ? "success" : "danger"}>{integration.status}</Chip>
              </div>
              <p className="mt-3 text-sm text-slate-600">{integration.detail}</p>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
