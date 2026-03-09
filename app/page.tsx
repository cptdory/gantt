
"use client";
import { useState, useRef, useCallback, useEffect } from "react";

/* ─── DATE HELPERS ──────────────────────────────────────────────────── */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
function fmtShort(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtISO(d: string | Date): string { return new Date(d).toISOString().slice(0, 10); }

/* ─── INITIAL PHASE CONFIG ──────────────────────────────────────────── */
// Each phase: start, durationDays (end = start + durationDays - 1)
const PHASE_DEFAULTS = [
  { id: "P1", label: "Discovery & Planning",  color: "#3b82f6", light: "#dbeafe", durationDays: 28 },
  { id: "P2", label: "Analysis & Design",     color: "#7c3aed", light: "#ede9fe", durationDays: 31 },
  { id: "P3", label: "Development & Build",   color: "#0891b2", light: "#cffafe", durationDays: 61 },
  { id: "P4", label: "Testing & Migration",   color: "#d97706", light: "#fef3c7", durationDays: 30 },
  { id: "P5", label: "UAT & Training",        color: "#059669", light: "#d1fae5", durationDays: 31 },
  { id: "P6", label: "Go-Live & Hypercare",   color: "#dc2626", light: "#fee2e2", durationDays: 31 },
];

// Build initial phase schedule from P1 start = Feb 16 2026, phases consecutive
function buildPhaseSchedule(p1Start: string, phaseDefs: typeof PHASE_DEFAULTS) {
  let cursor = p1Start;
  return phaseDefs.map(p => {
    const start = cursor;
    const end = addDays(start, p.durationDays - 1);
    cursor = addDays(end, 1);
    return { ...p, start, end };
  });
}

const INITIAL_PHASES = buildPhaseSchedule("2026-02-16", PHASE_DEFAULTS);

// Derive per-task initial start/end as offsets within each phase
// offsets are stored as [startOffset, endOffset] from phase start
const TASK_DEFS = [
  /* P1 */
  {phaseId:"P1",epic:"Project Initiation & Planning",task:"Project alignment meeting",owner:"Partner + Client Exec",so:0,eo:4,color:"#3b82f6"},
  {phaseId:"P1",epic:"Project Initiation & Planning",task:"Conduct high-level discovery sessions",owner:"Partner + Client Exec",so:7,eo:13,color:"#3b82f6"},
  {phaseId:"P1",epic:"Project Initiation & Planning",task:"Define project scope",owner:"Partner",so:14,eo:20,color:"#3b82f6"},
  {phaseId:"P1",epic:"Project Initiation & Planning",task:"Define project objectives",owner:"Partner",so:21,eo:27,color:"#3b82f6"},
  /* P2 */
  {phaseId:"P2",epic:"Analysis & Design",task:"Business process mapping workshops",owner:"Partner + Client Process Owners",so:0,eo:6,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Identify bottlenecks, workarounds, and pain points",owner:"Partner + Client Process Owners",so:0,eo:6,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Convert findings into AS-IS and TO-BE process maps",owner:"Partner",so:7,eo:13,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Review PH-specific requirements (BIR, WHT, VAT, payroll)",owner:"Partner",so:7,eo:13,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Assess fit against BC Essentials standard features",owner:"Partner",so:14,eo:20,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Identify gaps requiring config, extension, or integration",owner:"Partner",so:14,eo:20,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Gather and document functional requirements per module",owner:"Partner",so:21,eo:25,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Gather and document technical requirements per module",owner:"Partner",so:21,eo:25,color:"#7c3aed"},
  {phaseId:"P2",epic:"Analysis & Design",task:"Send documents for client sign-off",owner:"Partner + Client Exec",so:26,eo:30,color:"#7c3aed"},
  /* P3 */
  {phaseId:"P3",epic:"Environment & Foundation Setup",task:"Create Production and Sandbox environments",owner:"Partner",so:0,eo:6,color:"#0891b2"},
  {phaseId:"P3",epic:"Environment & Foundation Setup",task:"Enable required feature management settings",owner:"Partner",so:0,eo:6,color:"#0891b2"},
  {phaseId:"P3",epic:"Environment & Foundation Setup",task:"Set up company information for all companies",owner:"Partner + Client",so:7,eo:13,color:"#0891b2"},
  {phaseId:"P3",epic:"Environment & Foundation Setup",task:"Define accounting periods and posting ranges",owner:"Partner + Client",so:7,eo:13,color:"#0891b2"},
  {phaseId:"P3",epic:"Environment & Foundation Setup",task:"Configure PH VAT handling (12%, zero-rated, exempt)",owner:"Partner + Client",so:14,eo:20,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Finalize and import Chart of Accounts",owner:"Partner + Client",so:0,eo:13,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Define general posting setup and map accounts",owner:"Partner + Client",so:14,eo:27,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Create VAT business and product posting groups",owner:"Partner",so:14,eo:20,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Set LCY to PHP and add foreign currencies",owner:"Partner + Client",so:21,eo:27,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Configure global and shortcut dimensions",owner:"Partner + Client",so:28,eo:34,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Create bank accounts and reconciliation setup",owner:"Partner + Client",so:28,eo:34,color:"#0891b2"},
  {phaseId:"P3",epic:"Finance Configuration",task:"Configure fixed asset posting groups and depreciation",owner:"Partner + Client",so:35,eo:41,color:"#0891b2"},
  {phaseId:"P3",epic:"Sales (Customer-to-Cash)",task:"Configure customer posting groups and VAT groups",owner:"Partner + Client",so:0,eo:13,color:"#0891b2"},
  {phaseId:"P3",epic:"Sales (Customer-to-Cash)",task:"Configure sales price lists and discounts",owner:"Partner + Client",so:14,eo:27,color:"#0891b2"},
  {phaseId:"P3",epic:"Purchasing (Procure-to-Pay)",task:"Configure vendor numbering and posting groups",owner:"Partner + Client",so:0,eo:13,color:"#0891b2"},
  {phaseId:"P3",epic:"Purchasing (Procure-to-Pay)",task:"Define item charges (freight, customs, brokerage)",owner:"Partner + Client",so:14,eo:27,color:"#0891b2"},
  {phaseId:"P3",epic:"Inventory",task:"Configure item master (UoM, costing, posting groups)",owner:"Partner + Client",so:28,eo:41,color:"#0891b2"},
  {phaseId:"P3",epic:"Inventory",task:"Create inventory locations and bins",owner:"Partner",so:28,eo:41,color:"#0891b2"},
  {phaseId:"P3",epic:"Consolidation & Intercompany",task:"Create consolidation company and map subsidiary COA",owner:"Partner + Client",so:42,eo:48,color:"#0891b2"},
  {phaseId:"P3",epic:"Workflows, Security & Controls",task:"Set up procurement and sales approval workflows",owner:"Partner + Client",so:42,eo:48,color:"#0891b2"},
  {phaseId:"P3",epic:"Workflows, Security & Controls",task:"Build role-based permission sets per function",owner:"Partner + Client IT",so:49,eo:55,color:"#0891b2"},
  {phaseId:"P3",epic:"Reporting & Analytics",task:"Build account schedules (Balance Sheet, P&L, Cash Flow)",owner:"Partner + Client",so:42,eo:55,color:"#0891b2"},
  {phaseId:"P3",epic:"Reporting & Analytics",task:"Enable Power BI datasets and publish key visuals",owner:"Partner",so:49,eo:55,color:"#0891b2"},
  {phaseId:"P3",epic:"Development",task:"Develop approved customizations and extensions",owner:"Partner Dev Team",so:0,eo:60,color:"#0891b2"},
  /* P4 */
  {phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse customer master data",owner:"Client + Partner",so:0,eo:6,color:"#d97706"},
  {phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse vendor master data",owner:"Client + Partner",so:0,eo:6,color:"#d97706"},
  {phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse item and fixed asset master data",owner:"Client + Partner",so:7,eo:13,color:"#d97706"},
  {phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse bank account master data",owner:"Client + Partner",so:7,eo:13,color:"#d97706"},
  {phaseId:"P4",epic:"Functional Testing",task:"Test sample postings (sales, purchase, inventory, GL, VAT)",owner:"Partner",so:14,eo:22,color:"#d97706"},
  {phaseId:"P4",epic:"Functional Testing",task:"Test all approved customizations",owner:"Partner",so:23,eo:29,color:"#d97706"},
  /* P5 */
  {phaseId:"P5",epic:"UAT",task:"Execute end-to-end UAT scenarios",owner:"Client + Partner",so:0,eo:15,color:"#059669"},
  {phaseId:"P5",epic:"Training",task:"Deliver role-based training (AR, AP, GL, Sales, Purchasing)",owner:"Partner + Client",so:16,eo:25,color:"#059669"},
  {phaseId:"P5",epic:"Training",task:"Provide quick guides and support during feedback",owner:"Partner",so:25,eo:30,color:"#059669"},
  /* P6 */
  {phaseId:"P6",epic:"Cutover & Go-Live",task:"Freeze master data and execute final data loads",owner:"Partner + Client",so:0,eo:6,color:"#dc2626"},
  {phaseId:"P6",epic:"Cutover & Go-Live",task:"Load open customer and vendor entries",owner:"Partner + Client",so:7,eo:13,color:"#dc2626"},
  {phaseId:"P6",epic:"Cutover & Go-Live",task:"Load inventory and fixed asset balances",owner:"Partner + Client",so:14,eo:20,color:"#dc2626"},
  {phaseId:"P6",epic:"Cutover & Go-Live",task:"Load opening trial balance by G/L and sign-off",owner:"Partner + Client",so:21,eo:27,color:"#dc2626"},
  {phaseId:"P6",epic:"Cutover & Go-Live",task:"Conduct Go/No-Go decision meeting",owner:"Partner + Client Exec",so:28,eo:30,color:"#dc2626"},
];

function uid() { return Math.random().toString(36).slice(2, 9); }

// Resolve tasks to real dates given current phase schedule
function resolveTasks(taskDefs: any[], phases: any[]): any[] {
  const phaseMap = Object.fromEntries(phases.map(p => [p.id, p]));
  return taskDefs.map(td => {
    const ph = phaseMap[td.phaseId];
    const start = addDays(ph.start, td.so);
    const end = addDays(ph.start, Math.min(td.eo, diffDays(ph.start, ph.end)));
    return { ...td, id: td.id || uid(), start, end };
  });
}

const BAR_COLORS = ["#3b82f6","#7c3aed","#0891b2","#d97706","#059669","#dc2626","#db2777","#0d9488"];
const PX_PER_DAY = 5.2;
const ROW_H = 28;

/* ─── MODAL ─────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, width = 520 }: any) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(10,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:10,padding:24,width:"100%",maxWidth:width,boxShadow:"0 24px 64px rgba(0,0,0,0.28)",fontFamily:"'Nunito Sans',sans-serif" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
          <h3 style={{ margin:0,fontSize:14,fontWeight:800,color:"#0f172a" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#94a3b8",lineHeight:1,padding:"0 4px" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const iS: React.CSSProperties = { width:"100%",padding:"8px 10px",borderRadius:6,border:"1px solid #d1d5db",fontSize:12,color:"#0f172a",fontFamily:"'Nunito Sans',sans-serif",background:"#f9fafb",boxSizing:"border-box" as any };
function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom:12 }}>
      <label style={{ display:"block",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4 }}>{label}</label>
      {children}
    </div>
  );
}

/* ─── PHASE EDIT MODAL ──────────────────────────────────────────────── */
function PhaseEditModal({ phases, onSave, onClose }: any) {
  const [localPhases, setLocalPhases] = useState(phases.map((p: any) => ({ ...p })));

  const updatePhase = (idx: number, key: string, val: any) => {
    setLocalPhases((prev: any) => {
      const next = prev.map((p: any, i: number) => i === idx ? { ...p, [key]: val } : p);
      // Cascade: each subsequent phase starts the day after the previous ends
      for (let i = 1; i < next.length; i++) {
        next[i] = { ...next[i], start: addDays(next[i-1].end, 1) };
        next[i] = { ...next[i], end: addDays(next[i].start, diffDays(next[i].start, next[i].end) < 0 ? 27 : diffDays(next[i-1].end, next[i].end) - 1) };
      }
      return next;
    });
  };

  const setStart = (idx: number, val: string) => {
    setLocalPhases((prev: any) => {
      const next = [...prev];
      const oldStart = next[idx].start;
      const dur = diffDays(oldStart, next[idx].end);
      next[idx] = { ...next[idx], start: val, end: addDays(val, dur) };
      // cascade subsequent phases
      for (let i = idx + 1; i < next.length; i++) {
        const dur2 = diffDays(next[i].start, next[i].end);
        next[i] = { ...next[i], start: addDays(next[i-1].end, 1), end: addDays(addDays(next[i-1].end, 1), dur2) };
      }
      return next;
    });
  };

  const setEnd = (idx: number, val: string) => {
    setLocalPhases((prev: any) => {
      const next = [...prev];
      if (val <= next[idx].start) return prev;
      next[idx] = { ...next[idx], end: val };
      for (let i = idx + 1; i < next.length; i++) {
        const dur2 = diffDays(next[i].start, next[i].end);
        next[i] = { ...next[i], start: addDays(next[i-1].end, 1), end: addDays(addDays(next[i-1].end, 1), dur2) };
      }
      return next;
    });
  };

  return (
    <Modal title="Edit Phase Schedule" onClose={onClose} width={620}>
      <div style={{ marginBottom:12,padding:"8px 12px",background:"#f0f9ff",borderRadius:6,border:"1px solid #bae6fd",fontSize:11,color:"#0369a1" }}>
        💡 Editing a phase's start or end date will automatically cascade and shift all subsequent phases.
        Tasks within each phase will shift proportionally.
      </div>
      <div style={{ overflowY:"auto", maxHeight:"60vh" }}>
        {localPhases.map((p: any, idx: number) => {
          const dur = diffDays(p.start, p.end) + 1;
          return (
            <div key={p.id} style={{ marginBottom:10, padding:"10px 12px", borderRadius:8, border:`1.5px solid ${p.color}33`, background:p.light+"66" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:10,height:10,borderRadius:2,background:p.color,flexShrink:0 }}/>
                <span style={{ fontWeight:800,fontSize:12,color:p.color }}>{p.id}</span>
                <span style={{ fontWeight:700,fontSize:12,color:"#1e3a5f" }}>{p.label}</span>
                <span style={{ marginLeft:"auto",fontSize:11,fontWeight:700,color:"#64748b",background:"#fff",padding:"2px 8px",borderRadius:10,border:"1px solid #e2e8f0" }}>
                  {dur} days
                </span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px" }}>
                <Field label="Start Date">
                  <input type="date" value={p.start}
                    onChange={e => setStart(idx, e.target.value)}
                    style={{ ...iS, borderColor: p.color+"88" }}
                  />
                </Field>
                <Field label="End Date">
                  <input type="date" value={p.end}
                    min={addDays(p.start, 6)}
                    onChange={e => setEnd(idx, e.target.value)}
                    style={{ ...iS, borderColor: p.color+"88" }}
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:14, padding:"8px 12px", background:"#f8fafc", borderRadius:6, fontSize:11, color:"#475569" }}>
        Project span: <strong>{fmtDate(localPhases[0].start)}</strong> → <strong>{fmtDate(localPhases[localPhases.length-1].end)}</strong>
        &nbsp;·&nbsp; Total: <strong>{diffDays(localPhases[0].start, localPhases[localPhases.length-1].end) + 1} days</strong>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:14 }}>
        <button onClick={onClose} style={{ padding:"7px 16px",borderRadius:6,border:"1px solid #d1d5db",background:"#f9fafb",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
        <button onClick={() => onSave(localPhases)} style={{ padding:"7px 22px",borderRadius:6,border:"none",background:"#2563eb",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(37,99,235,0.3)" }}>Apply Changes</button>
      </div>
    </Modal>
  );
}

/* ─── TASK FORM ─────────────────────────────────────────────────────── */
function TaskForm({ initial, onSave, onClose, allEpics, phases }: any) {
  const blank = { phaseId:"P1", epic:"", task:"", owner:"", start: phases[0].start, end: phases[0].end, color:"#3b82f6" };
  const [f, setF] = useState(initial ? { ...initial } : blank);
  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));
  const ph = phases.find((p: any) => p.id === f.phaseId) || phases[0];
  const epics = [...new Set(allEpics.filter((x: any) => x.phaseId === f.phaseId).map((x: any) => x.epic))] as string[];
  const valid = f.task.trim() && f.epic.trim() && f.owner.trim() && f.start && f.end && f.start <= f.end;

  const onPhaseChange = (e: any) => {
    const pid = e.target.value;
    const np = phases.find((p: any) => p.id === pid);
    setF((prev: any) => ({ ...prev, phaseId: pid, epic:"", start: np.start, end: np.end, color: np.color }));
  };

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
        <Field label="Phase"><select value={f.phaseId} onChange={onPhaseChange} style={iS}>{phases.map((p: any)=><option key={p.id} value={p.id}>{p.id} — {p.label}</option>)}</select></Field>
        <Field label="Bar Color">
          <div style={{ display:"flex",gap:5,flexWrap:"wrap",paddingTop:4 }}>
            {BAR_COLORS.map(c=><div key={c} onClick={()=>setF((p: any)=>({...p,color:c}))} style={{ width:20,height:20,borderRadius:4,background:c,cursor:"pointer",border:f.color===c?"3px solid #0f172a":"2px solid transparent",boxSizing:"border-box" } as React.CSSProperties}/>)}
          </div>
        </Field>
      </div>
      <Field label="Epic / Workstream"><input list="ep-opts" value={f.epic} onChange={set("epic")} placeholder="Type or pick…" style={iS}/><datalist id="ep-opts">{epics.map((e: string)=><option key={e} value={e}/>)}</datalist></Field>
      <Field label="Task"><textarea value={f.task} onChange={set("task")} rows={2} style={{ ...iS,resize:"vertical",lineHeight:1.5 }}/></Field>
      <Field label="Owner"><input value={f.owner} onChange={set("owner")} placeholder="e.g. Partner + Client" style={iS}/></Field>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px" }}>
        <Field label="Start Date"><input type="date" value={f.start} onChange={set("start")} min={ph.start} max={ph.end} style={iS}/></Field>
        <Field label="End Date"><input type="date" value={f.end} onChange={set("end")} min={f.start} max={ph.end} style={iS}/></Field>
      </div>
      <div style={{ padding:"7px 10px",borderRadius:6,background:"#f0f9ff",border:"1px solid #bae6fd",fontSize:11,color:"#0369a1",marginBottom:12 }}>
        Phase range: <strong>{fmtDate(ph.start)}</strong> → <strong>{fmtDate(ph.end)}</strong>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"7px 16px",borderRadius:6,border:"1px solid #d1d5db",background:"#f9fafb",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
        <button onClick={()=>valid&&onSave(f)} style={{ padding:"7px 20px",borderRadius:6,border:"none",background:valid?"#2563eb":"#bfdbfe",color:"#fff",fontSize:12,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"inherit" }}>Save Task</button>
      </div>
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────────────── */
export default function GanttChart() {
  const [phases, setPhases] = useState(INITIAL_PHASES);
  const [taskDefs, setTaskDefs] = useState(() => TASK_DEFS.map(t => ({ ...t, id: uid() })));
  const [selected, setSelected] = useState<string | null>(null);
  const [phaseOpen, setPhaseOpen] = useState<Record<string, boolean>>({});
  const [epicOpen, setEpicOpen] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<any>(null);
  const [tooltip, setTooltip] = useState<any>(null);
  const [hoverRow, setHoverRow] = useState(null);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  // Sync horizontal scroll between header and body
  const onHeaderScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (bodyScrollRef.current) bodyScrollRef.current.scrollLeft = headerScrollRef.current?.scrollLeft || 0;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);
  const onBodyScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (headerScrollRef.current) headerScrollRef.current.scrollLeft = bodyScrollRef.current?.scrollLeft || 0;
    // Also sync vertical scroll with frozen left column
    const frozenLeft = document.getElementById("frozen-cols");
    if (frozenLeft) frozenLeft.scrollTop = bodyScrollRef.current?.scrollTop || 0;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);
  const onFrozenLeftScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (bodyScrollRef.current) bodyScrollRef.current.scrollTop = document.getElementById("frozen-cols")?.scrollTop || 0;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  // Derived: resolve tasks to real dates
  const tasks = resolveTasks(taskDefs, phases);
  const selTask = tasks.find(t => t.id === selected);
  const allEpics = taskDefs.map(t => ({ phaseId: t.phaseId, epic: t.epic }));

  const projectStart = phases[0].start;
  const projectEnd = phases[phases.length - 1].end;
  const totalDays = diffDays(projectStart, projectEnd) + 1;
  const TOTAL_W = Math.ceil(totalDays * PX_PER_DAY);

  function toX(dateStr: string): number { return Math.max(0, diffDays(projectStart, dateStr)) * PX_PER_DAY; }
  function toW(s: string, e: string): number { return Math.max((diffDays(s, e) + 1) * PX_PER_DAY, 6); }

  // Build week/month ticks from project start
  const monthTicks: {label: string, date: string}[] = [];
  let cursor = new Date(projectStart);
  const pEnd = new Date(projectEnd);
  while (cursor <= pEnd) {
    monthTicks.push({ label: cursor.toLocaleDateString("en-US",{month:"short",day:"numeric"}), date: fmtISO(cursor) });
    cursor.setDate(cursor.getDate() + 28);
  }

  const isPOpen = (id: string) => phaseOpen[id] !== false;
  const isEOpen = (k: string) => epicOpen[k] !== false;

  // Build rows
  const rows = [];
  for (const pm of phases) {
    const pt = tasks.filter(t => t.phaseId === pm.id);
    if (!pt.length) continue;
    rows.push({ type:"phase", pm, id:`ph-${pm.id}`, tasks:pt });
    if (!isPOpen(pm.id)) continue;
    const epics = [...new Set(pt.map(t => t.epic))];
    for (const ename of epics) {
      const ek = `${pm.id}::${ename}`;
      const et = pt.filter(t => t.epic === ename);
      rows.push({ type:"epic", pm, ename, id:ek, tasks:et });
      if (!isEOpen(ek)) continue;
      for (const t of et) rows.push({ type:"task", pm, t, id:t.id });
    }
  }

  // Today line
  const todayStr = fmtISO(new Date());
  const todayInRange = todayStr >= projectStart && todayStr <= projectEnd;
  const todayX = todayInRange ? toX(todayStr) : null;

  const saveTask = (form: any) => {
    const ph = phases.find((p: any) => p.id === form.phaseId);
    if (!ph) return;
    const so = diffDays(ph.start, form.start);
    const eo = diffDays(ph.start, form.end);
    if (modal?.mode === "add") {
      setTaskDefs((ts: any) => [...ts, { ...form, id:uid(), so, eo }]);
    } else if (modal?.mode === "edit") {
      setTaskDefs((ts: any) => ts.map((t: any) => t.id === modal.task.id ? { ...t, ...form, so, eo } : t));
    }
    setModal(null);
  };

  const deleteTask = () => {
    if (!modal?.task?.id) return;
    setTaskDefs((ts: any) => ts.filter((t: any) => t.id !== modal.task.id));
    setModal(null);
    if (selected === modal.task.id) setSelected(null);
  };

  const applyPhaseChanges = (newPhases: any) => {
    setPhases(newPhases);
    setModal(null);
  };

  const LIST_W = 300, INFO_W = 86, SIDE_W = 168;

  return (
    <div style={{ fontFamily:"'Nunito Sans','Segoe UI',sans-serif",background:"#e8edf5",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:6px}
        ::-webkit-scrollbar-thumb{background:#c1cdd8;border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        .rh:hover{background:rgba(37,99,235,0.05)!important}
        .rh:hover .acts{opacity:1!important}
        .ib{background:none;border:none;cursor:pointer;border-radius:4px;padding:2px 4px;display:inline-flex;align-items:center;line-height:1}
        .ib:hover{background:rgba(0,0,0,0.09)}
        .gbar{position:absolute;border-radius:3px;display:flex;align-items:center;padding:0 5px;overflow:hidden;cursor:pointer;transition:filter .12s,box-shadow .12s;white-space:nowrap}
        .gbar:hover{filter:brightness(.88)}
        select:focus,input:focus,textarea:focus{outline:none;border-color:#2563eb!important;box-shadow:0 0 0 2px rgba(37,99,235,.13)}
        .phaseeditbtn:hover{background:#eff6ff!important;border-color:#2563eb!important}
      `}</style>

      {/* NAV */}
      <div style={{ background:"linear-gradient(90deg,#0f2756 0%,#1d4ed8 100%)",height:40,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 14px",flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ color:"#fff",fontWeight:800,fontSize:13,letterSpacing:"-.3px" }}>QED</span>
          <div style={{ width:1,height:16,background:"rgba(255,255,255,.2)",margin:"0 2px" }}/>
          <span style={{ color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:600 }}>BC Implementation — PH</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ background:"#fff",borderBottom:"1px solid #dde3ed",height:34,display:"flex",alignItems:"center",padding:"0 10px",gap:6,flexShrink:0 }}>
        <button onClick={()=>setModal({mode:"add"})} style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:4,border:"none",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
          <span style={{ fontSize:14,lineHeight:1,marginTop:-1 }}>+</span> Add Task
        </button>
        <button className="phaseeditbtn" onClick={()=>setModal({mode:"editPhases"})} style={{ display:"flex",alignItems:"center",gap:5,padding:"4px 11px",borderRadius:4,border:"1px solid #d1d5db",background:"#f9fafb",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .12s" }}>
          📅 Edit Phase Dates
        </button>
        {selTask && <>
          <button onClick={()=>setModal({mode:"edit",task:selTask})} style={{ padding:"4px 10px",borderRadius:4,border:"1px solid #d1d5db",background:"#f9fafb",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✏️ Edit</button>
          <button onClick={()=>setModal({mode:"delete",task:selTask})} style={{ padding:"4px 10px",borderRadius:4,border:"1px solid #fca5a5",background:"#fff",color:"#dc2626",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>🗑 Delete</button>
        </>}
        <span style={{ marginLeft:6,fontSize:11,color:"#64748b" }}>
          <strong style={{color:"#0f172a"}}>{tasks.length}</strong> tasks ·
          <strong style={{color:"#0f172a"}}> {fmtShort(phases[0].start)} – {fmtShort(phases[phases.length-1].end)}, 2026</strong>
        </span>
        <div style={{ marginLeft:"auto",display:"flex",gap:5 }}>
          {phases.map(p=>(
            <div key={p.id} title={`${p.label}\n${fmtShort(p.start)} – ${fmtShort(p.end)}\n${diffDays(p.start,p.end)+1} days`}
              style={{ display:"flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:10,background:p.light,fontSize:10,fontWeight:700,color:p.color,cursor:"default" }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:p.color }}/>{p.id}
            </div>
          ))}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>

        {/* DETAIL SIDEBAR */}
        <div style={{ width:SIDE_W,background:"#fff",borderRight:"1px solid #dde3ed",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden" }}>
          <div style={{ padding:"8px 10px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc" }}>
            <span style={{ fontSize:10,fontWeight:800,color:"#1e3a5f",textTransform:"uppercase",letterSpacing:".08em" }}>Task Details</span>
          </div>
          {selTask ? (
            <div style={{ padding:"10px",fontSize:11,flex:1,overflowY:"auto" }}>
              <div style={{ fontWeight:700,color:"#0f172a",fontSize:12,lineHeight:1.4,marginBottom:8 }}>{selTask.task}</div>
              <div style={{ height:1,background:"#f1f5f9",marginBottom:8 }}/>
              {[
                ["Phase", phases.find(p=>p.id===selTask.phaseId)?.label],
                ["Epic", selTask.epic],
                ["Owner", selTask.owner],
                ["Start", fmtDate(selTask.start)],
                ["End", fmtDate(selTask.end)],
                ["Duration", diffDays(selTask.start,selTask.end)+1 + " days"],
              ].map(([k,v])=>(
                <div key={k} style={{ marginBottom:6 }}>
                  <div style={{ fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".06em" }}>{k}</div>
                  <div style={{ fontWeight:600,color:"#334155",fontSize:11,marginTop:1 }}>{v}</div>
                </div>
              ))}
              <div style={{ height:1,background:"#f1f5f9",margin:"8px 0" }}/>
              <div style={{ display:"flex",gap:5 }}>
                <button onClick={()=>setModal({mode:"edit",task:selTask})} style={{ flex:1,padding:"5px",borderRadius:5,border:"1px solid #2563eb",background:"#eff6ff",color:"#2563eb",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Edit</button>
                <button onClick={()=>setModal({mode:"delete",task:selTask})} style={{ flex:1,padding:"5px",borderRadius:5,border:"1px solid #fca5a5",background:"#fff",color:"#dc2626",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Delete</button>
              </div>
            </div>
          ) : (
            <div style={{ padding:"20px 10px",textAlign:"center",color:"#94a3b8",fontSize:11,lineHeight:1.6 }}>
              <div style={{ fontSize:22,marginBottom:6 }}>📋</div>
              Click a task to see details
            </div>
          )}
          <div style={{ padding:"8px 10px",borderTop:"1px solid #f1f5f9",marginTop:"auto",overflowY:"auto" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <span style={{ fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".07em" }}>Phase Schedule</span>
              <button onClick={()=>setModal({mode:"editPhases"})} style={{ fontSize:9,color:"#2563eb",background:"none",border:"none",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>Edit ✏️</button>
            </div>
            {phases.map(p=>(
              <div key={p.id} style={{ display:"flex",alignItems:"flex-start",gap:5,marginBottom:5 }}>
                <div style={{ width:8,height:8,borderRadius:2,background:p.color,flexShrink:0,marginTop:2 }}/>
                <div>
                  <div style={{ fontSize:10,color:"#1e3a5f",fontWeight:700 }}>{p.id} {p.label}</div>
                  <div style={{ fontSize:9,color:"#64748b" }}>{fmtShort(p.start)} – {fmtShort(p.end)} · {diffDays(p.start,p.end)+1}d</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GANTT TABLE */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>

          {/* ── HEADER (frozen left + scrollable right) ── */}
          <div style={{ display:"flex",flexShrink:0,height:52,background:"#f8fafc",borderBottom:"2px solid #dde3ed",zIndex:10 }}>
            {/* Frozen left header cells */}
            <div style={{ display:"flex",flexShrink:0,zIndex:11,background:"#f8fafc" }}>
              <div style={{ width:LIST_W,display:"flex",alignItems:"center",padding:"0 10px",borderRight:"1px solid #dde3ed",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".07em",height:"100%" }}>Name</div>
              <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 8px",borderRight:"1px solid #dde3ed",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".07em",height:"100%" }}>Start</div>
              <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 8px",borderRight:"1px solid #dde3ed",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".07em",height:"100%" }}>Finish</div>
            </div>
            {/* Scrollable timeline header */}
            <div ref={headerScrollRef} onScroll={onHeaderScroll}
              style={{ flex:1,overflowX:"scroll",overflowY:"hidden",display:"flex",flexDirection:"column" }}>
              <div style={{ minWidth:TOTAL_W,width:TOTAL_W,height:"100%",display:"flex",flexDirection:"column" }}>
                {/* Phase color bands */}
                <div style={{ position:"relative",height:16,flexShrink:0 }}>
                  {phases.map(pm => {
                    const x = toX(pm.start), w = toW(pm.start, pm.end);
                    return (
                      <div key={pm.id} style={{ position:"absolute",top:0,left:x,width:w,height:"100%",background:pm.color,opacity:.18 }}>
                        <div style={{ height:"100%",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
                          <span style={{ fontSize:8,fontWeight:800,color:pm.color,textTransform:"uppercase",letterSpacing:".05em",whiteSpace:"nowrap",opacity:5 }}>{pm.id}: {pm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Date ticks */}
                <div style={{ position:"relative",flex:1,background:"#f8fafc",borderTop:"1px solid #e9ecf1" }}>
                  {monthTicks.map((tick,i) => {
                    const x = toX(tick.date);
                    return (
                      <div key={i} style={{ position:"absolute",top:0,left:x,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:4 }}>
                        <div style={{ width:1,height:7,background:"#cbd5e1",marginBottom:2,marginLeft:0 }}/>
                        <span style={{ fontSize:9,fontWeight:700,color:"#475569",whiteSpace:"nowrap",marginLeft:-10 }}>{tick.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── ROWS (frozen left + scrollable right in sync) ── */}
          <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>

            {/* Frozen left columns (Name, Start, Finish) */}
            <div style={{ display:"flex",flexShrink:0,flexDirection:"column",zIndex:5,background:"#fff",borderRight:"1px solid #dde3ed",overflowY:"auto" }}
              id="frozen-cols" onScroll={onFrozenLeftScroll}>
              {rows.map((row, ri) => {
                const { type, pm } = row;
                const t = type === "task" ? row.t : null;
                const isSel = type === "task" && selected === t.id;
                const isPhase = type==="phase", isEpic=type==="epic", isTask=type==="task";
                let bg = ri%2===0?"#fff":"#f9fafb";
                if(isPhase) bg=pm.light+"cc";
                if(isEpic) bg="#f4f6fa";
                if(isSel) bg="#dbeafe";

                return (
                  <div key={row.id} className={!isPhase?"rh":""}
                    onClick={()=>isTask&&setSelected(t.id===selected?null:t.id)}
                    style={{ display:"flex",height:ROW_H,borderBottom:"1px solid #edf0f5",background:bg,cursor:isTask?"pointer":"default",flexShrink:0,alignItems:"stretch" }}
                    onMouseEnter={()=>setHoverRow(row.id)} onMouseLeave={()=>setHoverRow(null)}>

                    {/* Name cell */}
                    <div style={{ width:LIST_W,display:"flex",alignItems:"center",borderRight:"1px solid #edf0f5",padding:`0 6px 0 ${isPhase?8:isEpic?18:32}px`,gap:4,overflow:"hidden" }}>
                      {isPhase&&<button onClick={e=>{e.stopPropagation();setPhaseOpen(s=>({...s,[pm.id]:!isPOpen(pm.id)}))}} style={{ background:"none",border:"none",cursor:"pointer",color:pm.color,fontSize:11,padding:0,width:14,flexShrink:0 }}>{isPOpen(pm.id)?"▾":"▸"}</button>}
                      {isEpic&&<button onClick={e=>{e.stopPropagation();const k=`${pm.id}::${row.ename}`;setEpicOpen(s=>({...s,[k]:!isEOpen(k)}))}} style={{ background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:10,padding:0,width:12,flexShrink:0 }}>{isEOpen(`${pm.id}::${row.ename}`)?"▾":"▸"}</button>}
                      {isPhase&&<div style={{ width:8,height:8,borderRadius:"50%",background:pm.color,flexShrink:0 }}/>}
                      {isTask&&<div style={{ width:5,height:5,borderRadius:"50%",background:t.color||pm.color,flexShrink:0,opacity:.6 }}/>}
                      <span style={{ fontSize:isPhase?12:11,fontWeight:isPhase?800:isEpic?700:400,color:isPhase?pm.color:isEpic?"#1e3a5f":"#2d3748",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1 }}>
                        {isPhase?`${pm.id} — ${pm.label}`:isEpic?row.ename:t.task}
                      </span>
                      {isTask&&<div className="acts" style={{ display:"flex",gap:1,flexShrink:0,opacity:hoverRow===row.id?1:0,transition:"opacity .12s" }}>
                        <button className="ib" onClick={e=>{e.stopPropagation();setModal({mode:"edit",task:t})}}><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round"/></svg></button>
                        <button className="ib" onClick={e=>{e.stopPropagation();setModal({mode:"delete",task:t})}}><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5l.5-9" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                      </div>}
                    </div>
                    {/* Start */}
                    <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 8px",borderRight:"1px solid #edf0f5",fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden" }}>
                      {isTask?fmtShort(t.start):isPhase?fmtShort(pm.start):""}
                    </div>
                    {/* End */}
                    <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 8px",borderRight:"1px solid #dde3ed",fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden" }}>
                      {isTask?fmtShort(t.end):isPhase?fmtShort(pm.end):""}
                    </div>
                  </div>
                );
              })}
              {/* milestone footer frozen part */}
              <div style={{ height:30,borderTop:"2px solid #dde3ed",background:"#f8fafc",display:"flex",alignItems:"center",padding:"0 10px",fontSize:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".08em",width:LIST_W+INFO_W*2,borderRight:"1px solid #dde3ed",flexShrink:0 }}>
                Milestones
              </div>
            </div>

            {/* Scrollable timeline (vertical + horizontal) */}
            <div ref={bodyScrollRef} onScroll={onBodyScroll}
              style={{ flex:1,overflowX:"scroll",overflowY:"auto",position:"relative" }}
              onMouseLeave={()=>setTooltip(null)}>
              <div style={{ minWidth:TOTAL_W,width:TOTAL_W,position:"relative" }}>
                {rows.map((row, ri) => {
                  const { type, pm } = row;
                  const t = type==="task" ? row.t : null;
                  const isSel = type==="task" && selected===t.id;
                  const isHov = hoverRow===row.id;
                  const isPhase=type==="phase", isEpic=type==="epic", isTask=type==="task";

                  let bg = ri%2===0?"#fff":"#f9fafb";
                  if(isPhase) bg=pm.light+"cc";
                  if(isEpic) bg="#f4f6fa";
                  if(isSel) bg="#dbeafe";

                  const phaseX=isPhase?toX(pm.start):0, phaseW=isPhase?toW(pm.start,pm.end):0;
                  const epicX=isEpic?Math.min(...(row.tasks?.map((t: any)=>toX(t.start))??[])):0;
                  const epicW=isEpic?(Math.max(...(row.tasks?.map((t: any)=>toX(t.end)+PX_PER_DAY)??[0]))-epicX):0;
                  const taskX=isTask?toX(t.start):0, taskW=isTask?Math.max(toW(t.start,t.end),8):0;

                  return (
                    <div key={row.id} className={!isPhase?"rh":""}
                      onClick={()=>isTask&&setSelected(t.id===selected?null:t.id)}
                      style={{ height:ROW_H,borderBottom:"1px solid #edf0f5",background:bg,position:"relative",cursor:isTask?"pointer":"default",flexShrink:0 }}
                      onMouseEnter={()=>setHoverRow(row.id)}
                      onMouseLeave={()=>{setHoverRow(null);setTooltip(null);}}>

                      {/* Grid lines */}
                      {monthTicks.map((tick: any,i: number)=>(
                        <div key={i} style={{ position:"absolute",top:0,bottom:0,left:toX(tick.date),width:1,background:"#e9ecf1",zIndex:0,pointerEvents:"none" }}/>
                      ))}
                      {/* Today */}
                      {todayX!==null&&<div style={{ position:"absolute",top:0,bottom:0,left:todayX,width:1.5,background:"#ef4444",zIndex:3,opacity:.75,pointerEvents:"none" }}/>}

                      {/* Phase band */}
                      {isPhase&&<>
                        <div style={{ position:"absolute",top:8,height:12,borderRadius:2,background:pm.color,opacity:.2,left:phaseX,width:phaseW,zIndex:1 }}/>
                        <div style={{ position:"absolute",top:8,height:12,borderRadius:2,border:`1.5px solid ${pm.color}`,opacity:.45,left:phaseX,width:phaseW,zIndex:1 }}/>
                      </>}
                      {/* Epic band */}
                      {isEpic&&<div style={{ position:"absolute",top:9,height:10,borderRadius:2,background:pm.color,opacity:.12,left:epicX,width:Math.max(epicW,4),zIndex:1 }}/>}
                      {/* Task bar */}
                      {isTask&&(
                        <div className="gbar"
                          onClick={e=>{e.stopPropagation();setSelected(t.id===selected?null:t.id)}}
                          onMouseMove={(e: any)=>setTooltip({x:e.clientX+12,y:e.clientY-10,task:t.task,owner:t.owner,start:t.start,end:t.end})}
                          style={{ top:6,height:16,left:taskX,width:taskW,background:t.color||pm.color,zIndex:2,boxShadow:isSel?`0 0 0 2px #fff,0 0 0 3.5px ${t.color||pm.color}`:isHov?"0 1px 5px rgba(0,0,0,.2)":"none" }}>
                          <span style={{ color:"#fff",fontSize:9,fontWeight:700,textShadow:"0 1px 2px rgba(0,0,0,.3)",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:".02em" }}>
                            {t.owner}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Milestone footer */}
                <div style={{ height:30,borderTop:"2px solid #dde3ed",background:"#f8fafc",position:"relative",flexShrink:0 }}>
                  {phases.map(pm => (
                    <div key={pm.id} style={{ position:"absolute",left:toX(pm.end),top:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
                      <div style={{ width:9,height:9,borderRadius:1.5,background:pm.color,transform:"rotate(45deg)",boxShadow:`0 0 0 1.5px #f8fafc,0 0 0 2.5px ${pm.color}` }}/>
                      <span style={{ fontSize:7.5,fontWeight:800,color:pm.color,textTransform:"uppercase",whiteSpace:"nowrap" }}>{pm.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ background:"#0f2756",height:20,display:"flex",alignItems:"center",padding:"0 12px",gap:16,flexShrink:0 }}>
        {[["Tasks",tasks.length],["Phases",phases.length],["Start",fmtShort(phases[0].start)],["End",fmtShort(phases[phases.length-1].end)]].map(([k,v])=>(
          <span key={k} style={{ color:"rgba(255,255,255,.6)",fontSize:10 }}>{k}: <strong style={{color:"#fff"}}>{v}</strong></span>
        ))}
        {selTask&&<span style={{ fontSize:10,color:"rgba(255,255,255,.6)",marginLeft:4 }}>Selected: <strong style={{color:"#fbbf24"}}>{selTask.task.slice(0,48)}{selTask.task.length>48?"…":""}</strong></span>}
        <span style={{ marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,.4)" }}>Scroll timeline horizontally ↔</span>
      </div>

      {/* TOOLTIP */}
      {tooltip&&(
        <div style={{ position:"fixed",zIndex:3000,top:tooltip?.y,left:tooltip?.x,background:"#1e293b",color:"#f1f5f9",borderRadius:7,padding:"8px 12px",fontSize:11,maxWidth:270,boxShadow:"0 8px 28px rgba(0,0,0,.3)",pointerEvents:"none" }}>
          <div style={{ fontWeight:700,marginBottom:4,lineHeight:1.4 }}>{tooltip?.task}</div>
          <div style={{ color:"#94a3b8",fontSize:10 }}>👤 {tooltip?.owner}</div>
          <div style={{ color:"#94a3b8",fontSize:10,marginTop:1 }}>📅 {fmtDate(tooltip?.start)} → {fmtDate(tooltip?.end)}</div>
          <div style={{ color:"#94a3b8",fontSize:10,marginTop:1 }}>⏱ {diffDays(tooltip?.start,tooltip?.end)+1} days</div>
        </div>
      )}

      {/* PHASE EDIT MODAL */}
      {modal?.mode==="editPhases"&&(
        <PhaseEditModal phases={phases} onSave={applyPhaseChanges} onClose={()=>setModal(null)}/>
      )}

      {/* ADD / EDIT TASK MODAL */}
      {modal&&(modal.mode==="add"||modal.mode==="edit")&&(
        <Modal title={modal.mode==="add"?"Add New Task":"Edit Task"} onClose={()=>setModal(null)}>
          <TaskForm initial={modal.mode==="edit"?modal.task:null} onSave={saveTask} onClose={()=>setModal(null)} allEpics={allEpics} phases={phases}/>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {modal?.mode==="delete"&&(
        <Modal title="Delete Task" onClose={()=>setModal(null)}>
          <p style={{ fontSize:12,color:"#334155",lineHeight:1.7,marginBottom:6 }}>Delete: <strong>"{modal.task.task}"</strong>?</p>
          <p style={{ fontSize:11,color:"#94a3b8",marginBottom:16 }}>This action cannot be undone.</p>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={()=>setModal(null)} style={{ padding:"7px 16px",borderRadius:6,border:"1px solid #d1d5db",background:"#f9fafb",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
            <button onClick={deleteTask} style={{ padding:"7px 20px",borderRadius:6,border:"none",background:"#dc2626",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}