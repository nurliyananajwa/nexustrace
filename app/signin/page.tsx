"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/teams";
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(params.has("error") ? "The link could not be verified. Try requesting a new one." : null);

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    const db = createClient();
    const { error: authError } = await db.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setSending(false);
    if (authError) setError(authError.message);
    else setSent(true);
  }

  return <main className="signin-page"><div className="signin-box card">
    <Link className="brand" href="/"><span className="brand-mark"><i /><i /><i /></span><span>Nexus<span className="brand-accent">Trace</span><small>PROJECT WORKSPACE</small></span></Link>
    {sent ? <><h1>Check your email</h1><p>We sent a sign-in link to <strong>{email}</strong>. Open it on this device to enter your workspace.</p><button className="btn" onClick={() => setSent(false)}>Use another email</button></> : <>
      <p className="page-kicker" style={{ marginTop: 38 }}>WELCOME BACK</p><h1>Enter your workspace.</h1>
      <p>Use your email to open the real project and save your work to Supabase.</p>
      <form onSubmit={sendLink} className="form-field"><label htmlFor="email">Email address</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button className="btn primary" disabled={sending}>{sending ? "Sending…" : "Send sign-in link →"}</button></form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </>}
    <div className="signin-preview"><span>Just reviewing the design?</span><Link href="/preview">Open interactive preview →</Link></div>
  </div></main>;
}

export default function SignInPage() { return <Suspense><SignInForm /></Suspense>; }
