import Link from "next/link";
import { ReactNode } from "react";

type AppPageKey =
  | "dashboard"
  | "tasks"
  | "validation"
  | "agents"
  | "decisions"
  | "activity"
  | "integrations"
  | "settings";

const appNav = [
  { key: "dashboard", label: "Dashboard", href: "/" },
  { key: "tasks", label: "Tasks", href: "/tasks" },
  { key: "validation", label: "Validation", href: "/validation" },
  { key: "agents", label: "Agents", href: "/agents" },
  { key: "decisions", label: "Decisions", href: "/decisions" },
  { key: "activity", label: "Activity", href: "/activity" },
  { key: "integrations", label: "Integrations", href: "/integrations" },
  { key: "settings", label: "Settings", href: "/settings" }
] as const;

function navStyle(active: boolean) {
  return [
    "flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition",
    active
      ? "bg-teal-600 text-white shadow-sm"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  ].join(" ");
}

export function AppShell({
  active,
  title,
  description,
  children
}: {
  active: AppPageKey;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 gap-6 px-4 py-4 xl:grid-cols-[250px_minmax(0,1fr)_300px]">
        <aside className="surface-card sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto p-5">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">MZTEK</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">Control Room</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Operate projects with clear steps and validated outcomes.
            </p>
          </div>

          <nav className="space-y-2">
            {appNav.map((item) => (
              <Link key={item.key} href={item.href} className={navStyle(item.key === active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">MZTEK</p>
            <p className="mt-2 text-sm text-slate-500">
              Founder-friendly operating layer above builders, validators, and integrations.
            </p>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <header className="surface-card p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">{title}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                  Sync project
                </button>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Create task
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Primary Action</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">Run the next decisive step</p>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Start with one high-impact action, then use the board below to track how work moves from planning to validation.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800">
                  Start Next Step
                </button>
                <button className="rounded-full border border-teal-200 bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50">
                  Review Risks
                </button>
              </div>
            </div>
          </header>

          <section className="surface-card p-6">{children}</section>
        </main>

        <aside className="surface-card sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">What Needs You</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Focus Now</p>
              <p className="mt-2 text-base font-semibold text-amber-900">Use page actions to run the next MZTEK step with validation.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">No fake status</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Shell avoids static connected or PASS claims.</p>
              <p className="mt-1 text-sm text-slate-500">Each page must show live API-backed status.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Decision quality rule</p>
              <p className="mt-2 text-sm text-slate-700">Accept only outputs with evidence, validation path, and clear decision rationale.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Integrations</p>
              <p className="mt-2 text-sm text-slate-700">Connect and validate GitHub and NVIDIA from dashboard actions before claiming readiness.</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Council mode</p>
              <p className="mt-2 text-sm text-slate-700">Codex orchestrates. NVIDIA models execute. MZTEK validates before acceptance.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
