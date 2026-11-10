"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { createProject } from "./actions";

export default function NewProjectButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="btn primary" onClick={() => setOpen(true)}>
        + New project
      </button>
      {open && (
        <Modal title="New project" description="You become the team lead. Add your supervisor and teammates afterwards." width={440} onClose={() => setOpen(false)}>
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
        </Modal>
      )}
    </>
  );
}
