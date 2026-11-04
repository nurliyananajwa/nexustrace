import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/teams");

  const features = [
    {
      title: "Traceability, built for you",
      body: "Link every requirement to the tasks that build it and the tests that check it. The traceability matrix updates itself, so it can never fall out of date.",
    },
    {
      title: "See a change before you make it",
      body: "Propose a change to a requirement and NexusTrace shows every task, test and dependent requirement it will touch, up to three levels deep.",
    },
    {
      title: "Catch vague requirements early",
      body: "The quality checker scores each requirement against ISO/IEC/IEEE 29148 and flags vague words, weak verbs and untestable wording as you type.",
    },
    {
      title: "Your supervisor stays in the loop",
      body: "Changes to an approved requirement need supervisor approval. Every decision is recorded in an audit log that cannot be edited.",
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          maxWidth: 1080,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <strong style={{ fontSize: 17 }}>{APP_NAME}</strong>
        </div>
        <Link href="/signin" className="btn primary">
          Sign in
        </Link>
      </header>

      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 24px 40px",
          textAlign: "center",
        }}
      >
        <span className="pill p-info" style={{ marginBottom: 18 }}>
          Final-year project · UiTM
        </span>
        <h1
          style={{
            fontSize: 42,
            lineHeight: 1.1,
            margin: "14px 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          Keep your requirements, tests and changes in one thread.
        </h1>
        <p style={{ fontSize: 17, color: "var(--ink-2)", margin: "0 auto 28px", maxWidth: 560 }}>
          {APP_TAGLINE}. NexusTrace helps a student software team know what is
          built, what is tested, and what a change will break.
        </p>
        <Link href="/signin" className="btn primary" style={{ height: 44, padding: "0 22px", fontSize: 15 }}>
          Sign in with Google
        </Link>
      </section>

      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "20px 24px 80px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
        }}
      >
        {features.map((f) => (
          <div key={f.title} className="card" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>{f.title}</h3>
            <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 13.5 }}>{f.body}</p>
          </div>
        ))}
      </section>

      <footer
        style={{
          textAlign: "center",
          padding: "24px",
          color: "var(--ink-3)",
          fontSize: 12.5,
          borderTop: "1px solid var(--border)",
        }}
      >
        {APP_NAME} — Nurliyana Najwa binti Roslan (2025381073), Faculty of
        Information Science, UiTM Puncak Perdana.
      </footer>
    </main>
  );
}

function Logo() {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: "var(--brand)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: 15,
      }}
    >
      N
    </span>
  );
}
