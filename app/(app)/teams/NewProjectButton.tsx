"use client";

import { useState } from "react";
import { createProject } from "./actions";

export default function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn primary" onClick={() => setOpen(true)}>
        + New project
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(20,25,35,0.4)",
            display: "grid", placeItems: "center", zIndex: 50, padding: 20,
          }}
        >
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", padding: 24 }}>
            <h2 style={{ fontSize: 19, margin: "0 0 4px" }}>New project</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 13, margin: "0 0 18px" }}>
              You become the team lead. Add your supervisor and teammates afterwards.
            </p>
            <form action={createProject}>
              <label className="label" htmlFor="name">Project name</label>
              <input id="name" name="name" className="input" required minLength={3} maxLength={120}
                placeholder="For example: Campus Event Booking System" style={{ margin: "6px 0 14px" }} />
              <label className="label" htmlFor="description">Short description</label>
              <textarea id="description" name="description" className="input" rows={3}
                placeholder="One line about what the system does" style={{ margin: "6px 0 18px" }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn primary">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
