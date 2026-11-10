"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABEL, type Role } from "@/lib/constants";
import type { Project } from "@/lib/data";

type Props = {
  projects: (Project & { role: Role })[];
  project: Project;
  role: Role;
  userName: string;
  pendingChanges: number;
};

const sections = [
  { label: "Workspace", items: [["dashboard", "Overview"], ["requirements", "Requirements"], ["tests", "Test cases"], ["changes", "Change requests"]] },
  { label: "Insights", items: [["matrix", "Traceability"], ["quality", "Quality check"]] },
] as const;

export default function Sidebar({ projects, project, role, userName, pendingChanges }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/projects/${project.id}`;

  return <aside className="sidebar">
    <Link href="/teams" className="brand" aria-label="NexusTrace projects">
      <span className="brand-mark"><i /><i /><i /></span>
      <span>Nexus<span className="brand-accent">Trace</span><small>PROJECT WORKSPACE</small></span>
    </Link>
    <div className="project-picker">
      <span className="eyebrow">CURRENT PROJECT</span>
      <select aria-label="Switch project" value={project.id} onChange={(e) => router.push(`/projects/${e.target.value}/dashboard`)}>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <span className="project-caption">Sprint {project.current_sprint} of {project.total_sprints}</span>
    </div>
    <nav className="side-nav" aria-label="Project navigation">
      {sections.map((section) => <div className="nav-section" key={section.label}>
        <div className="eyebrow nav-caption">{section.label}</div>
        {section.items.map(([key, label]) => {
          const href = `${base}/${key}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={key} href={href} aria-current={active ? "page" : undefined} className={`nav-link ${active ? "active" : ""}`}>
            <span className={`nav-glyph glyph-${key}`} aria-hidden="true" />
            <span>{label}</span>
            {key === "changes" && pendingChanges > 0 && <span className="nav-count">{pendingChanges}</span>}
          </Link>;
        })}
      </div>)}
    </nav>
    <div className="side-bottom">
      {role === "supervisor" && <Link href="/teams" className="nav-link">All projects</Link>}
      <div className="user-row">
        <span className="avatar">{userName.slice(0, 1).toUpperCase()}</span>
        <span className="user-copy"><strong>{userName}</strong><small>{ROLE_LABEL[role]}</small></span>
      </div>
      <form action="/auth/signout" method="post"><button className="text-button" type="submit">Sign out ↗</button></form>
    </div>
  </aside>;
}
