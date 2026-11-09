"use client";

type Req = { id: string; code: string; title: string };
type Task = { id: string; title: string; status: string; requirement_id: string | null };
type Test = { id: string; code: string; title: string; result: string };
type Link = { requirement_id: string; test_case_id: string };

export default function CircuitView({ requirements, tasks, tests, links, selectedId, onSelect }: {
  requirements: Req[]; tasks: Task[]; tests: Test[]; links: Link[]; selectedId: string | null; onSelect: (id: string) => void;
}) {
  const visible = requirements.slice(0, 8);
  const height = Math.max(420, 70 + visible.length * 72);
  const getTasks = (id: string) => tasks.filter((task) => task.requirement_id === id);
  const getTests = (id: string) => {
    const ids = new Set(links.filter((link) => link.requirement_id === id).map((link) => link.test_case_id));
    return tests.filter((test) => ids.has(test.id));
  };

  return <div className="circuit">
    <div className="circuit-head"><div><strong>Circuit blueprint</strong><p>Select a requirement to inspect its connected work and tests.</p></div><span className="pill p-info">Live project data</span></div>
    <div className="circuit-scroll">
      <div className="circuit-canvas" style={{ width: 1000, height }}>
        <div className="circuit-cols"><span>01 / REQUIREMENTS</span><span>02 / TASKS</span><span>03 / TEST CASES</span></div>
        <svg className="circuit-svg" viewBox={`0 0 1000 ${height}`} aria-hidden="true">
          {visible.map((req, index) => {
            const y = 70 + index * 72 + 23;
            const taskList = getTasks(req.id);
            const testList = getTests(req.id);
            const color = selectedId === req.id ? "#59ded2" : "#386775";
            return <g key={req.id} fill="none" stroke={color} strokeWidth={selectedId === req.id ? 2 : 1.5}>
              <path d={`M 265 ${y} H 328 V ${y - 10} H 368`} />
              <path d={`M 328 ${y} V ${y + 10} H 672`} />
              <circle cx="328" cy={y} r="3" fill={color} stroke="none" />
              {taskList.length === 0 && <circle cx="368" cy={y - 10} r="3" fill="none" />}
              {testList.length === 0 && <circle cx="672" cy={y + 10} r="3" fill="none" />}
            </g>;
          })}
        </svg>
        {visible.map((req, index) => {
          const top = 70 + index * 72;
          const taskList = getTasks(req.id);
          const testList = getTests(req.id);
          const testFailed = testList.some((test) => test.result === "failed");
          return <div key={req.id}>
            <button className={`circuit-node ${selectedId === req.id ? "active" : ""}`} style={{ left: 45, top, width: 220 }} onClick={() => onSelect(req.id)} aria-label={`Inspect ${req.code}: ${req.title}`}>
              <small>{req.code}</small><span>{req.title}</span>
            </button>
            <button className={`circuit-node secondary ${taskList.length === 0 ? "empty" : ""}`} style={{ left: 368, top: top - 10, width: 220 }} onClick={() => onSelect(req.id)} aria-label={`Inspect tasks for ${req.code}`}>
              <small>{taskList.length ? `${taskList.length} TASK${taskList.length === 1 ? "" : "S"}` : "NO TASK YET"}</small><span>{taskList[0]?.title ?? "Add work to this requirement"}</span>
            </button>
            <button className={`circuit-node secondary ${testList.length === 0 ? "empty" : ""} ${testFailed ? "failed" : ""}`} style={{ left: 672, top: top + 10, width: 270 }} onClick={() => onSelect(req.id)} aria-label={`Inspect tests for ${req.code}`}>
              <small>{testList.length ? `${testList.length} TEST${testList.length === 1 ? "" : "S"}${testFailed ? " · FAILED" : ""}` : "NO TEST YET"}</small><span>{testList[0] ? `${testList[0].code}  ${testList[0].title}` : "Link a test to prove it"}</span>
            </button>
          </div>;
        })}
        {visible.length === 0 && <div style={{ position: "absolute", top: 155, left: 45, color: "#8eb0b5" }}>No requirements match this filter. Add one in List view.</div>}
      </div>
    </div>
    <div className="circuit-footer"><span><b>●</b> Selected path</span><span>Red = failed test</span><span>Dashed = missing connection</span>{requirements.length > 8 && <span>Showing first 8 of {requirements.length}; narrow by module to see more.</span>}</div>
  </div>;
}
