"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV, ROLE_LABEL, APP_NAME, type Role } from "@/lib/constants";
import type { Project } from "@/lib/data";

type Props = {
  projects: (Project & { role: Role })[];
  project: Project;
  role: Role;
  userName: string;
  pendingChanges: number;
};

export default function Sidebar({ projects, project, role, userName, pendingChanges }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/projects/${project.id}`;

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <span
          style={{
            width: 24, height: 24, borderRadius: 7, background: "var(--brand)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 13,
          }}
        >
          N
        </span>
        <strong style={{ fontSize: 15 }}>{APP_NAME}</strong>
      </div>

      {/* project switcher */}
      <select
        className="input"
        value={project.id}
        onChange={(e) => router.push(`/projects/${e.target.value}/dashboard`)}
        disabled={projects.length < 2}
        style={{ height: 34, fontWeight: 600, marginBottom: 6 }}
        aria-label="Switch project"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", margin: "0 2px 14px" }}>
        Sprint {project.current_sprint} of {project.total_sprints} · {ROLE_LABEL[role]}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {role === "supervisor" && (
          <NavLink href="/teams" label="All teams" active={pathname === "/teams"} />
        )}
        {NAV.map((item) => {
          const href = `${base}/${item.key}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <NavLink
              key={item.key}
              href={href}
              label={item.label}
              active={active}
              badge={item.key === "changes" && pendingChanges > 0 ? pendingChanges : undefined}
            />
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <span
            style={{
              width: 30, height: 30, borderRadius: "50%", background: "var(--surface-2)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 12, color: "var(--ink-2)",
            }}
          >
            {userName.slice(0, 1).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn sm" type="submit" style={{ width: "100%" }}>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  active,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 10px",
        borderRadius: 7,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--brand)" : "var(--ink)",
        background: active ? "var(--brand-tint)" : "transparent",
      }}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className="pill p-warn" style={{ padding: "0 7px", fontSize: 11 }}>
          {badge}
        </span>
      )}
    </Link>
  );
}
