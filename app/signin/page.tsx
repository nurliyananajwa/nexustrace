"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";

function SignInInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/teams";
  const hadError = params.get("error");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(
    hadError ? "Sign-in did not complete. Please try again." : null,
  );

  async function signInWithGoogle() {
    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(false);
      setMsg(error.message);
    }
    // on success the browser is redirected to Google
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        padding: 24,
      }}
    >
      <div className="card" style={{ width: 400, maxWidth: "100%", padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: 8, background: "var(--brand)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 800, fontSize: 15,
            }}
          >
            N
          </span>
          <strong style={{ fontSize: 17 }}>{APP_NAME}</strong>
        </div>

        <h1 style={{ fontSize: 22, margin: "0 0 6px" }}>Sign in</h1>
        <p style={{ color: "var(--ink-2)", margin: "0 0 22px", fontSize: 13.5 }}>
          NexusTrace uses your Google account. No passwords are stored.
        </p>

        <button className="btn" onClick={signInWithGoogle} disabled={loading}
          style={{ width: "100%", height: 44 }}>
          <GoogleMark />
          {loading ? "Opening Google…" : "Continue with Google"}
        </button>

        {msg && (
          <p style={{ color: "var(--bad)", fontSize: 12.5, marginTop: 14 }}>{msg}</p>
        )}

        <p style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 22 }}>
          Only your name, email and profile photo are read from Google.
        </p>

        <Link href="/" style={{ color: "var(--ink-2)", fontSize: 12.5, display: "inline-block", marginTop: 6 }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInInner />
    </Suspense>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
