import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui";

export default function SettingsPage() {
  return (
    <AppShell
      active="settings"
      title="Settings"
      description="Configuration surfaces for dashboard behavior, integrations, and future live-data wiring."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Workspace">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Project: MZTEK</p>
            <p>Mode: Production-style UI prototype</p>
            <p>Next step: connect live MZTEK core data into widgets and pages.</p>
          </div>
        </SectionCard>

        <SectionCard title="UI Scope">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Current focus is clarity, readability, and route structure.</p>
            <p>Task, validation, decisions, activity, and integrations are page-based and clickable.</p>
            <p>Live mutations and real-time sync remain the next integration step.</p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
