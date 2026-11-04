import React from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 20,
      }}
    >
      <div>
        <h1 style={{ fontSize: 24, margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        {subtitle && (
          <p style={{ color: "var(--ink-2)", margin: "4px 0 0", fontSize: 13.5, maxWidth: 620 }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}

const PILLS: Record<string, string> = {
  draft: "p-mute", approved: "p-info", implemented: "p-ok", verified: "p-ok",
  passed: "p-ok", failed: "p-bad", not_run: "p-mute",
  pending: "p-warn", rejected: "p-bad",
  must: "p-bad", should: "p-info", could: "p-mute", wont: "p-mute",
  good: "p-ok", review: "p-warn", poor: "p-bad",
};

export function StatusPill({ value, label }: { value: string; label: string }) {
  return <span className={`pill ${PILLS[value] ?? "p-mute"}`}>{label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-3)", fontSize: 13.5 }}>
      {children}
    </div>
  );
}
