"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Brand from "@/components/Brand";
import "./signin.css";


function TraceIllustration() {
  return <div className="login-trace" role="img" aria-label="Requirement FR01 connected to a task and a passing test">
    <div className="login-trace-heading"><span>TRACE PATH</span><span>01 / 03</span></div>
    <div className="login-trace-canvas">
      <svg viewBox="0 0 620 300" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="traceLine" x1="0" x2="1"><stop stopColor="#6eede0"/><stop offset="1" stopColor="#3faeaa"/></linearGradient></defs>
        <path className="login-grid-line" d="M0 50H620 M0 150H620 M0 250H620 M100 0V300 M220 0V300 M340 0V300 M460 0V300 M580 0V300" />
        <path className="login-path" d="M180 150H260V92H390" />
        <path className="login-path" d="M260 150V210H390" />
        <circle cx="260" cy="150" r="5" fill="#89f1e5" />
        <circle cx="390" cy="92" r="4" fill="#89f1e5" />
        <circle cx="390" cy="210" r="4" fill="#89f1e5" />
      </svg>
      <div className="login-trace-origin"><small>REQUIREMENT</small><strong>FR01</strong><span>User can sign in</span></div>
      <div className="login-trace-end login-trace-task"><small>BUILD</small><strong>Task linked</strong></div>
      <div className="login-trace-end login-trace-test"><small>VERIFY</small><strong>Test passed <span aria-hidden="true">✓</span></strong></div>
    </div>
    <div className="login-trace-note"><span className="login-pulse" /> One requirement. Every connection visible.</div>
  </div>;
}

function SignInContent() {
  const params = useSearchParams();
  const requestedPath = params.get("next") ?? "/teams";
  const nextPath = requestedPath.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/teams";
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(params.has("error") ? "That link could not be verified. Please request a new one." : null);

  async function sendLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const db = createClient();
      const { error: authError } = await db.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      if (authError) setError(authError.message);
      else setSent(true);
    } catch {
      setError("We couldn't send the link. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return <main className="login-page">
    <section className="login-story" aria-label="About NexusTrace">
      <div className="login-story-inner">
        <Brand className="login-brand login-brand-light" />
        <div className="login-story-content">
          <p className="login-overline">REQUIREMENT TRACEABILITY, MADE CLEAR</p>
          <h2>Follow the idea.<br /><span>See the impact.</span></h2>
          <p className="login-story-lead">A clear path from each requirement to the work that builds it and the tests that prove it.</p>
          <TraceIllustration />
        </div>
        <p className="login-story-foot">NEXUSTRACE <span>·</span> PROJECT WORKSPACE</p>
      </div>
    </section>

    <section className="login-entry" aria-label="Sign in">
      <div className="login-entry-inner">
        <div className="login-mobile-brand"><Brand className="login-brand" /></div>
        <div className="login-entry-top"><Link href="/" className="login-back">← Back to home</Link></div>
        <div className="login-entry-main">
          {sent ? <>
            <span className="login-mail-icon" aria-hidden="true">✉</span>
            <p className="login-eyebrow">ONE MORE STEP</p>
            <h1>Check your inbox.</h1>
            <p className="login-subtitle">We sent a sign-in link to <strong>{email}</strong>. Open it on this device to enter your workspace.</p>
            <div className="login-help-box"><strong>Didn&apos;t see it?</strong><span>Check your spam folder, or try another email address.</span></div>
            <button className="login-secondary-action" type="button" onClick={() => { setSent(false); setError(null); }}>Use another email →</button>
          </> : <>
            <p className="login-eyebrow">WELCOME TO NEXUSTRACE</p>
            <h1>Your workspace<br />starts here.</h1>
            <p className="login-subtitle">Enter your email and we&apos;ll send you a link. No password needed.</p>
            <form className="login-form" onSubmit={sendLink}>
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-describedby={error ? "login-error" : "login-explain"} />
              <p id="login-explain" className="login-field-hint">New here? This link will create your account too.</p>
              {error && <p id="login-error" className="login-error" role="alert">{error}</p>}
              <button className="login-submit" type="submit" disabled={sending}>{sending ? "Sending your link…" : "Continue with email"}<span aria-hidden="true">→</span></button>
            </form>
          </>}
          <div className="login-divider"><span>OR</span></div>
          <Link className="login-preview" href="/preview"><span className="login-preview-icon" aria-hidden="true">⌁</span><span><strong>Explore the design</strong><small>Look around without signing in</small></span><span className="login-preview-arrow" aria-hidden="true">↗</span></Link>
        </div>
        <p className="login-entry-foot">NexusTrace · Built for student software teams</p>
      </div>
    </section>
  </main>;
}

export default function SignInPage() { return <Suspense><SignInContent /></Suspense>; }
