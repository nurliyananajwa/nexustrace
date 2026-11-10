import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Brand from "@/components/Brand";
import "./home.css";


function HeroTrace() {
  return <div className="home-trace" role="img" aria-label="Example: a requirement connects to a build task and a passing test">
    <div className="home-trace-top"><span><i /> NEXUSTRACE / EXAMPLE PATH</span><span>LIVE CONNECTIONS</span></div>
    <div className="home-trace-stage">
      <div className="home-trace-labels"><span>REQUIREMENT</span><span>WORK</span><span>PROOF</span></div>
      <svg viewBox="0 0 600 370" preserveAspectRatio="none" aria-hidden="true">
        <path className="home-trace-grid" d="M0 55H600 M0 125H600 M0 195H600 M0 265H600 M0 335H600 M70 0V370 M150 0V370 M230 0V370 M310 0V370 M390 0V370 M470 0V370 M550 0V370" />
        <path className="home-trace-line" d="M172 187H245V127H290" />
        <path className="home-trace-line" d="M245 187V252H448" />
        <circle cx="245" cy="187" r="5" fill="#88e9d9" />
        <circle cx="290" cy="127" r="4" fill="#88e9d9" />
        <circle cx="448" cy="252" r="4" fill="#88e9d9" />
      </svg>
      <div className="home-trace-node home-trace-req"><small>FR01</small><strong>User can sign in</strong><em>Requirement</em></div>
      <div className="home-trace-node home-trace-task"><small>TASK 01</small><strong>Build sign-in flow</strong><em>In progress</em></div>
      <div className="home-trace-node home-trace-test"><small>TEST 01</small><strong>Sign-in succeeds</strong><em>Passed ✓</em></div>
    </div>
    <div className="home-trace-bottom"><span className="home-live-dot" /> <strong>One connected path</strong><span>Requirement → Work → Test</span></div>
  </div>;
}

export default async function Landing() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/teams");

  return <main className="home-page">
    <div className="home-dark">
      <header className="home-header">
        <Brand className="home-brand" />
        <nav aria-label="Home navigation"><a href="#how-it-works">How it works</a><a href="#two-views">Two views</a></nav>
        <Link className="home-header-signin" href="/signin">Open workspace <span aria-hidden="true">↗</span></Link>
      </header>
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-eyebrow"><span className="home-live-dot" /> A CLEARER WAY TO TRACK YOUR PROJECT</p>
          <h1>Every requirement<br />has a <span>path.</span></h1>
          <p className="home-hero-lead">See what needs to be built, what has been tested, and what a change could affect. All in one place your team can understand.</p>
          <div className="home-hero-actions"><Link href="/preview" className="home-cta">Explore the preview <span aria-hidden="true">→</span></Link><Link href="/signin" className="home-cta-secondary">Open your workspace <span aria-hidden="true">↗</span></Link></div>
          <p className="home-hero-note">Explore the preview without signing in.</p>
        </div>
        <HeroTrace />
      </section>
    </div>

    <section id="how-it-works" className="home-section home-process">
      <div className="home-section-head"><p className="home-section-kicker">HOW IT WORKS</p><h2>From idea to evidence.</h2><p>NexusTrace follows the simple chain behind every software feature.</p></div>
      <ol className="home-steps">
        <li><span className="home-step-number">01</span><h3>Write the requirement</h3><p>Describe what the system needs to do in clear language.</p></li>
        <li><span className="home-step-number">02</span><h3>Connect the work</h3><p>Link the tasks that turn that requirement into a feature.</p></li>
        <li><span className="home-step-number">03</span><h3>Prove it with a test</h3><p>Record the result so your team can see what is ready.</p></li>
      </ol>
    </section>

    <section id="two-views" className="home-section home-views">
      <div className="home-section-head"><p className="home-section-kicker">TWO WAYS TO SEE THE SAME PROJECT</p><h2>Read the details. See the connections.</h2><p>Switch views without changing your data or losing your place.</p></div>
      <div className="home-view-grid">
        <div className="home-view-item"><div className="home-view-preview home-card-preview" aria-hidden="true"><div className="home-preview-top"><span>REQUIREMENTS</span><span>▦ CARD VIEW</span></div><div className="home-mini-card"><span>FR01 <b>APPROVED</b></span><strong>User can sign in</strong><small>2 tasks &nbsp;·&nbsp; 1 test</small></div><div className="home-mini-card"><span>FR02 <b>IN PROGRESS</b></span><strong>Export a report</strong><small>1 task &nbsp;·&nbsp; 0 tests</small></div></div><div className="home-view-copy"><span>01 / EVERYDAY VIEW</span><h3>Card view</h3><p>Focus on the details, update your records, and find what needs attention.</p></div></div>
        <div className="home-view-item"><div className="home-view-preview home-circuit-preview" aria-hidden="true"><div className="home-preview-top"><span>TRACE PATHS</span><span>⌁ CIRCUIT VIEW</span></div><svg viewBox="0 0 470 165" preserveAspectRatio="none"><path d="M51 45H230V30H273 M230 45V100H379 M51 133H205V160H379" fill="none" stroke="#68d6cd" strokeWidth="2" strokeLinejoin="round" /><circle cx="230" cy="45" r="4" fill="#8ce4d8" /><circle cx="205" cy="133" r="4" fill="#8ce4d8" /></svg><span className="home-mini-node home-mini-n1">FR01</span><span className="home-mini-node home-mini-n2">TASK</span><span className="home-mini-node home-mini-n3">TEST ✓</span><span className="home-mini-node home-mini-n4">FR02</span><span className="home-mini-node home-mini-n5">TEST —</span></div><div className="home-view-copy"><span>02 / VISUAL VIEW</span><h3>Circuit view</h3><p>Follow each requirement through its tasks and tests on a visual path.</p></div></div>
      </div>
    </section>

    <section className="home-final"><div><p className="home-section-kicker">READY TO EXPLORE?</p><h2>Start with the full picture.</h2><p>Try the preview first, then open your own workspace when you&apos;re ready.</p></div><Link className="home-cta" href="/preview">Explore NexusTrace <span aria-hidden="true">→</span></Link></section>
    <footer className="home-footer"><Brand className="home-brand" /><span>Requirements · Work · Tests · Changes</span></footer>
  </main>;
}
