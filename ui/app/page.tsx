"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Chip, SectionCard } from "@/components/ui";
import {
  analyzeProject,
  connectGitHub,
  fetchDashboard,
  pollGitHubConnection,
  runCommand,
  validateNvidia
} from "@/lib/dashboard-api";
import type { DashboardData, IntegrationCard } from "@/lib/dashboard-types";

type ChatLine = {
  id: string;
  role: "system" | "user";
  text: string;
  at: string;
  tone?: "default" | "danger" | "success";
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [goal, setGoal] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [nvidiaApiKey, setNvidiaApiKey] = useState("");
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [working, setWorking] = useState(false);
  const didLoad = useRef(false);

  function pushChat(line: Omit<ChatLine, "id" | "at">) {
    setChat((previous) => [
      { id: crypto.randomUUID(), at: new Date().toISOString(), ...line },
      ...previous
    ]);
  }

  function integrationByKey(key: string): IntegrationCard | undefined {
    return data?.integrations.find((item) => item.key === key);
  }

  function chipToneFor(status: string): "default" | "success" | "danger" | "warning" {
    if (["connected", "ready", "active", "ok"].includes(status)) return "success";
    if (["error", "failed", "blocked"].includes(status)) return "danger";
    if (["planned", "needs_auth", "not_connected", "pending"].includes(status)) return "warning";
    return "default";
  }

  async function refreshDashboard(mode: "initial" | "refresh" = "refresh") {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");
    const result = await fetchDashboard("mztek");
    if (!result.ok) {
      setError(result.error || "Could not load dashboard.");
    } else {
      setData(result.data || null);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    refreshDashboard("initial");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!working) {
        refreshDashboard("refresh");
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [working]);

  async function runAnalyze() {
    setWorking(true);
    const result = await analyzeProject({
      githubUrl: githubRepoUrl,
      websiteUrl,
      productUrl,
      fileNames: selectedFiles
    });
    if (!result.ok) {
      pushChat({ role: "system", tone: "danger", text: `Analyze failed: ${result.error || "Unknown error."}` });
      setWorking(false);
      return;
    }
    pushChat({
      role: "system",
      tone: "success",
      text: "Project understanding completed. Work board and decisions were refreshed from live backend data."
    });
    await refreshDashboard();
    setWorking(false);
  }

  async function runGoal(event: FormEvent) {
    event.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) return;

    setWorking(true);
    pushChat({ role: "user", text: trimmed });
    setGoal("");

    const result = await runCommand({
      message: trimmed,
      githubUrl: githubRepoUrl,
      websiteUrl,
      productUrl,
      fileNames: selectedFiles
    });

    if (!result.ok) {
      pushChat({ role: "system", tone: "danger", text: `Command failed: ${result.error || "Unknown error."}` });
      setWorking(false);
      return;
    }

    const provider = result.data?.provider || "NVIDIA";
    const taskCount = result.data?.result?.tasks?.length || 0;
    const mode = result.data?.result?.mode || "";
    const degraded = mode === "nvidia-fallback";
    pushChat({
      role: "system",
      tone: degraded ? "danger" : "success",
      text: degraded
        ? `${provider} returned a degraded fallback response (unstructured output). Review risks before trusting this result.`
        : `${provider} completed this run with ${taskCount} planned tasks. Decision + activity timelines are updated.`
    });
    await refreshDashboard();
    setWorking(false);
  }

  async function runConnectGitHub() {
    setWorking(true);
    const result = await connectGitHub(githubRepoUrl);
    if (!result.ok) {
      pushChat({ role: "system", tone: "danger", text: `GitHub connect failed: ${result.error || "Unknown error."}` });
      setWorking(false);
      return;
    }
    const verificationUri = result.data?.deviceFlow?.verificationUri;
    const userCode = result.data?.deviceFlow?.userCode;
    pushChat({
      role: "system",
      text: verificationUri && userCode
        ? `GitHub authorization started. Open ${verificationUri} and enter code ${userCode}, then click Check GitHub status.`
        : "GitHub authorization flow started. Complete consent, then click Check GitHub status."
    });
    await refreshDashboard();
    setWorking(false);
  }

  async function runPollGitHub() {
    setWorking(true);
    const result = await pollGitHubConnection();
    if (!result.ok) {
      pushChat({ role: "system", tone: "danger", text: `GitHub check failed: ${result.error || "Unknown error."}` });
      setWorking(false);
      return;
    }
    pushChat({
      role: "system",
      tone: result.data?.pending ? "default" : "success",
      text: result.data?.pending
        ? "GitHub authorization is still pending. Complete consent and check again."
        : "GitHub connected successfully and is now available for repo-aware planning."
    });
    await refreshDashboard();
    setWorking(false);
  }

  async function runConnectNvidia() {
    if (!nvidiaApiKey.trim()) {
      pushChat({ role: "system", text: "Paste an NVIDIA API key, then click Connect NVIDIA." });
      return;
    }
    setWorking(true);
    const result = await validateNvidia(nvidiaApiKey.trim());
    if (!result.ok) {
      pushChat({ role: "system", tone: "danger", text: `NVIDIA connect failed: ${result.error || "Unknown error."}` });
      setWorking(false);
      return;
    }
    setNvidiaApiKey("");
    pushChat({
      role: "system",
      tone: "success",
      text: result.data?.message || "NVIDIA validated successfully through /v1/models."
    });
    await refreshDashboard();
    setWorking(false);
  }

  const mergedTimeline = useMemo(() => {
    return [
      ...(data?.activityFeed || []).map((entry) => ({
        id: `A-${entry.at}-${entry.title}`,
        type: "Activity",
        title: entry.title,
        detail: entry.detail,
        at: entry.at
      })),
      ...(data?.decisionLog || []).map((entry) => ({
        id: `D-${entry.at}-${entry.decision}`,
        type: "Decision",
        title: entry.decision,
        detail: entry.reason,
        at: entry.at
      }))
    ]
      .sort((left, right) => String(right.at).localeCompare(String(left.at)))
      .slice(0, 10);
  }, [data?.activityFeed, data?.decisionLog]);

  const totalWorkItems = (data?.boardColumns || []).reduce((sum, column) => sum + column.items.length, 0);
  const githubIntegration = integrationByKey("github");
  const nvidiaIntegration = integrationByKey("nvidia");
  const suggestedActions = data?.controller.permissions || [];
  const hasLiveData = Boolean(data);
  const autoRefreshLabel = refreshing ? "Refreshing live data..." : "Auto-refresh every 10 seconds";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,#ecfeff,transparent_45%),radial-gradient(circle_at_85%_10%,#ecfdf5,transparent_40%),#f8fafc] px-4 py-6 text-slate-950 md:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">MZTEK Control Room</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {data?.project?.name || "Loading project..."}
              </h1>
              <p className="mt-2 max-w-4xl text-sm text-slate-600">
                {data?.project?.summary || "Live project command center for build, validation, and integration control."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={data?.controller.mode === "controller" ? "success" : "warning"}>
                {data?.controller.mode || "observer"}
              </Chip>
              <Chip tone={error ? "danger" : "default"}>{error ? "data error" : "live mode"}</Chip>
              <Chip tone="default">{autoRefreshLabel}</Chip>
              <button
                onClick={() => refreshDashboard("refresh")}
                disabled={loading || working}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Refresh now
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">Dashboard data failed to load</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => refreshDashboard("initial")}
                className="rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800"
              >
                Retry loading
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Current Step" subtitle="MZTEK should always tell you what is happening and what needs your input next.">
            {loading && !hasLiveData ? (
              <p className="text-sm text-slate-500">Loading current state from backend...</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current step</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{data?.controller.currentStep || "Waiting for backend data"}</p>
                  <p className="mt-2 text-sm text-slate-600">{data?.controller.blocker || "No active blocker from live state."}</p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Next action</p>
                  <p className="mt-2 text-sm font-medium text-teal-950">{data?.controller.nextAction || "Run project analysis to generate the next action."}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={runAnalyze}
                      disabled={working}
                      className="rounded-xl bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Analyze project first
                    </button>
                    <button
                      onClick={runConnectGitHub}
                      disabled={working}
                      className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Connect GitHub
                    </button>
                  </div>
                </div>
              </div>
            )}
            {suggestedActions.length ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Needs your input</p>
                <p className="mt-1 text-sm text-amber-900">{suggestedActions.join(" ")}</p>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Council Telemetry" subtitle="Codex leads, NVIDIA executes, MZTEK validates.">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Accepted</p>
                <p className="mt-2 text-xl font-semibold">{data?.council?.latest?.summary?.accepted ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rejected</p>
                <p className="mt-2 text-xl font-semibold">{data?.council?.latest?.summary?.rejected ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Est. tokens</p>
                <p className="mt-2 text-xl font-semibold">{data?.council?.latest?.summary?.totalEstimatedTokens ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Est. cost USD</p>
                <p className="mt-2 text-xl font-semibold">{(data?.council?.latest?.summary?.totalEstimatedCostUsd ?? 0).toFixed(4)}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Recent runs: {data?.council?.usage?.runs ?? 0} | Total estimated tokens: {data?.council?.usage?.totalEstimatedTokens ?? 0}
            </p>
          </SectionCard>
        </div>

        <SectionCard title="Command Box + Chat" subtitle="Tell MZTEK what to build. The backend run result is captured as live operation messages.">
          <form onSubmit={runGoal} className="grid gap-3">
            <textarea
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="What do you want to build?"
              className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-teal-300 transition focus:ring"
            />
            <div className="grid gap-3 lg:grid-cols-3">
              <input
                value={githubRepoUrl}
                onChange={(event) => setGithubRepoUrl(event.target.value)}
                placeholder="GitHub repo URL (optional)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-300 transition focus:ring"
              />
              <input
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                placeholder="Website URL (optional)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-300 transition focus:ring"
              />
              <input
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="Product URL (optional)"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-teal-300 transition focus:ring"
              />
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Attach files:</span> file names are sent for context analysis.
                <input
                  type="file"
                  multiple
                  className="mt-2 block w-full text-xs"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).map((file) => file.name);
                    setSelectedFiles(files);
                  }}
                />
              </label>
              <button
                type="button"
                onClick={runAnalyze}
                disabled={working}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Analyze project first
              </button>
              <button
                type="submit"
                disabled={working}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {working ? "Running..." : "Run command"}
              </button>
            </div>
            {selectedFiles.length ? (
              <p className="text-xs text-slate-500">Attached: {selectedFiles.join(", ")}</p>
            ) : null}
          </form>
          <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
            {chat.length === 0 ? (
              <p className="text-sm text-slate-500">No chat yet. Submit a command to start a live run.</p>
            ) : (
              chat.map((line) => (
                <div
                  key={line.id}
                  className={`rounded-xl border p-3 text-sm ${
                    line.role === "user"
                      ? "border-teal-200 bg-teal-50 text-teal-950"
                      : line.tone === "danger"
                        ? "border-rose-200 bg-rose-50 text-rose-900"
                        : line.tone === "success"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-slate-200 bg-slate-50 text-slate-800"
                  }`}
                >
                  <p className="font-semibold">{line.role === "user" ? "You" : "System"}</p>
                  <p className="mt-1">{line.text}</p>
                  <p className="mt-2 text-[11px] opacity-75">{new Date(line.at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Integrations Actions" subtitle="Live connection state from backend APIs with immediate action buttons.">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">GitHub</p>
                  <Chip tone={chipToneFor(githubIntegration?.status || "unknown")}>
                    {githubIntegration?.status || "unknown"}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-slate-600">{githubIntegration?.summary || "Connect GitHub to enable repo-aware planning."}</p>
                {githubIntegration?.detail ? <p className="mt-1 text-xs text-slate-500">{githubIntegration.detail}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={runConnectGitHub}
                    disabled={working}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Connect GitHub
                  </button>
                  <button
                    onClick={runPollGitHub}
                    disabled={working}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Check GitHub status
                  </button>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">NVIDIA NIM</p>
                  <Chip tone={chipToneFor(nvidiaIntegration?.status || "unknown")}>
                    {nvidiaIntegration?.status || "unknown"}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-slate-600">{nvidiaIntegration?.summary || "Connect NVIDIA to execute live model work."}</p>
                {nvidiaIntegration?.detail ? <p className="mt-1 text-xs text-slate-500">{nvidiaIntegration.detail}</p> : null}
                {nvidiaIntegration?.warning ? <p className="mt-2 text-xs text-amber-700">{nvidiaIntegration.warning}</p> : null}
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    type="password"
                    value={nvidiaApiKey}
                    onChange={(event) => setNvidiaApiKey(event.target.value)}
                    placeholder="Paste NVIDIA API key"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none ring-teal-300 transition focus:ring"
                  />
                  <button
                    onClick={runConnectNvidia}
                    disabled={working}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Connect NVIDIA
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Activity + Decision Timeline" subtitle="Merged stream from live activity feed and decision log.">
            <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
              {mergedTimeline.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                  No timeline events yet. Run analysis or a command to generate decision traces.
                </p>
              ) : (
                mergedTimeline.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <Chip tone={item.type === "Decision" ? "warning" : "default"}>{item.type}</Chip>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                    <p className="mt-2 text-xs text-slate-400">{item.at}</p>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Work Board (Live)" subtitle="No mock tasks. Columns render directly from backend board data.">
          {loading && !hasLiveData ? (
            <p className="text-sm text-slate-500">Loading work board...</p>
          ) : (data?.boardColumns || []).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No board columns returned yet. Run “Analyze project first” to create the first plan.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {(data?.boardColumns || []).map((column) => (
                <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-950">{column.title}</p>
                    <Chip tone={column.items.length ? "default" : "warning"}>{column.items.length}</Chip>
                  </div>
                  <div className="mt-2 space-y-2">
                    {column.items.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-2 py-2 text-xs text-slate-400">No items yet</p>
                    ) : (
                      column.items.slice(0, 5).map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-2">
                          <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{item.description || item.status || "No details"}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.updatedAt || "timestamp unavailable"}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">Total live items tracked: {totalWorkItems}</p>
        </SectionCard>
      </div>
    </div>
  );
}
