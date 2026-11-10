"use client";

import { useEffect } from "react";

// The one pop-up window used across the app. Closes on the backdrop or the Escape key.
export default function Modal({
  title,
  description,
  width = 460,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  width?: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,25,35,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="card" onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: "100%", padding: 24, maxHeight: "90vh", overflow: "auto" }}>
        <h2 style={{ fontSize: 19, margin: description ? "0 0 4px" : "0 0 16px" }}>{title}</h2>
        {description && <p style={{ color: "var(--ink-2)", fontSize: 13, margin: "0 0 18px" }}>{description}</p>}
        {children}
      </div>
    </div>
  );
}
