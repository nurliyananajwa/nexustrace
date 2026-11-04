// Rule-based requirement quality checker (RO3).
// Not AI-based: the score starts at 100 and loses points for each requirements
// "smell", following the quality characteristics in ISO/IEC/IEEE 29148 (Femmer
// et al., 2017). The same function runs on the requirement form and the
// Quality check screen, so a requirement is scored the same way everywhere.

export type QualityIssue = {
  rule: string;
  message: string;
  severity: "warn" | "bad";
  penalty: number;
  words?: string[]; // words to highlight in the preview
};

export type QualityResult = {
  score: number; // 0-100
  grade: "good" | "review" | "poor";
  issues: QualityIssue[];
  flagged: string[]; // every word to highlight, lowercased
};

// Vague words have no single testable meaning (29148: "unambiguous").
const VAGUE = [
  "quickly", "fast", "slow", "efficient", "efficiently", "user-friendly",
  "easy", "easily", "simple", "intuitive", "robust", "flexible", "seamless",
  "modern", "nice", "good", "better", "best", "optimal", "optimally",
  "appropriate", "appropriately", "reasonable", "reasonably", "adequate",
  "sufficient", "sufficiently", "approximately", "about", "roughly",
  "minimal", "maximal", "several", "some", "many", "few", "etc",
  "and so on", "as needed", "if possible", "where possible", "state-of-the-art",
];

// Weak verbs leave it optional, so it cannot be verified (29148: "verifiable").
const WEAK = ["should", "could", "may", "might", "can", "would", "ought"];

const MEASURABLE = /\b\d+(\.\d+)?\s*(%|percent|ms|milliseconds?|seconds?|secs?|minutes?|mins?|hours?|days?|kb|mb|gb|users?|requests?|characters?|clicks?|times?|attempts?)\b/i;

function findWords(text: string, list: string[]): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const w of list) {
    const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    if (re.test(lower)) hits.push(w);
  }
  return hits;
}

export function checkQuality(raw: string): QualityResult {
  const text = (raw || "").trim();
  const issues: QualityIssue[] = [];

  if (text.length === 0) {
    return { score: 0, grade: "poor", issues: [], flagged: [] };
  }

  // 1. Vague words
  const vague = findWords(text, VAGUE);
  if (vague.length) {
    issues.push({
      rule: "vague",
      message: `Vague word${vague.length > 1 ? "s" : ""}: ${vague.join(", ")}. Say exactly what is expected.`,
      severity: "warn",
      penalty: Math.min(30, vague.length * 12),
      words: vague,
    });
  }

  // 2. Weak verb (not a firm requirement)
  const weak = findWords(text, WEAK);
  if (weak.length) {
    issues.push({
      rule: "weak_verb",
      message: `Weak verb: ${weak.join(", ")}. Use "must" or "shall" for a firm requirement.`,
      severity: "warn",
      penalty: 10,
      words: weak,
    });
  }

  // 3. No measurable value (only expected when the text implies a quantity)
  const impliesQuantity = /\b(within|at least|at most|up to|no more than|under|over|less than|more than|load|respond|response|performance|speed|time|support|handle|concurrent)\b/i.test(text);
  if (impliesQuantity && !MEASURABLE.test(text)) {
    issues.push({
      rule: "not_measurable",
      message: "No measurable value. Add a number and unit, for example \"within 3 seconds\".",
      severity: "bad",
      penalty: 20,
    });
  }

  // 4. Two needs joined in one sentence
  if (/\b(and|as well as|also|plus)\b/i.test(text) && /\b(must|shall|should|can|will|allow|let|enable)\b/i.test(text)) {
    const conj = (text.match(/\band\b/gi) || []).length;
    if (conj >= 1 && text.split(/\band\b/i).length > 1) {
      issues.push({
        rule: "compound",
        message: "This may be two requirements in one. Split it so each can be tested on its own.",
        severity: "warn",
        penalty: 10,
        words: ["and"],
      });
    }
  }

  // 5. Too short to be a real requirement
  if (text.split(/\s+/).length < 4) {
    issues.push({
      rule: "too_short",
      message: "Too short. Describe who does what, and under what condition.",
      severity: "bad",
      penalty: 25,
    });
  }

  // 6. No clear actor/subject (heuristic: should mention system/user/role)
  if (!/\b(system|user|users|student|supervisor|admin|application|app|it|server)\b/i.test(text) && text.split(/\s+/).length >= 4) {
    issues.push({
      rule: "no_actor",
      message: "No clear actor. Name who or what does this (for example \"the system\" or \"a student\").",
      severity: "warn",
      penalty: 10,
    });
  }

  const penalty = issues.reduce((s, i) => s + i.penalty, 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade: QualityResult["grade"] = score >= 80 ? "good" : score >= 50 ? "review" : "poor";
  const flagged = Array.from(
    new Set(issues.flatMap((i) => i.words ?? []).map((w) => w.toLowerCase())),
  );

  return { score, grade, issues, flagged };
}

export const GRADE_LABEL: Record<QualityResult["grade"], string> = {
  good: "Good",
  review: "Needs review",
  poor: "Poor",
};

export const QUALITY_EXAMPLES = {
  vague:
    "The system should load quickly and be user-friendly for all users.",
  good:
    "The system must display the project dashboard within 3 seconds for a signed-in student.",
};
