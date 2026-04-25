import Link from "next/link";
import { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  action,
  children
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="surface-subtle rounded-[24px] border border-slate-200 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({
  label,
  value,
  tone = "default",
  href
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "success";
  href: string;
}) {
  const toneMap = {
    default: "surface-card text-slate-950",
    danger: "border-rose-200 bg-rose-50 text-rose-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900"
  };

  return (
    <Link
      href={href}
      className={`rounded-[24px] border p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${toneMap[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}

export function Chip({
  children,
  tone = "default"
}: {
  children: ReactNode;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  const toneMap = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    danger: "bg-rose-100 text-rose-700",
    warning: "bg-amber-100 text-amber-700"
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${toneMap[tone]}`}>{children}</span>;
}
