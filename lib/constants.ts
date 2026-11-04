export const APP_NAME = "NexusTrace";
export const APP_TAGLINE =
  "Requirements traceability and change impact analytics for student software teams";

export type Role = "student" | "team_lead" | "supervisor";

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  team_lead: "Team lead",
  supervisor: "Supervisor",
};

export type ReqStatus = "draft" | "approved" | "implemented" | "verified";
export const REQ_STATUS: ReqStatus[] = ["draft", "approved", "implemented", "verified"];
export const REQ_STATUS_LABEL: Record<ReqStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  implemented: "Implemented",
  verified: "Verified",
};

export type Priority = "must" | "should" | "could" | "wont";
export const PRIORITY_LABEL: Record<Priority, string> = {
  must: "Must",
  should: "Should",
  could: "Could",
  wont: "Won't",
};

export type TestResult = "passed" | "failed" | "not_run";
export const TEST_RESULT_LABEL: Record<TestResult, string> = {
  passed: "Passed",
  failed: "Failed",
  not_run: "Not run",
};

export type CRStatus = "pending" | "approved" | "rejected";
export const CR_STATUS_LABEL: Record<CRStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const NAV = [
  { key: "dashboard", label: "Dashboard" },
  { key: "requirements", label: "Requirements" },
  { key: "tests", label: "Test cases" },
  { key: "matrix", label: "Traceability matrix" },
  { key: "changes", label: "Change requests" },
  { key: "quality", label: "Quality check" },
] as const;
