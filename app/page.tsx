"use client";
import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

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

function uid() { return Math.random().toString(36).slice(2, 9); }

function resolveTasks(taskDefs: any[], phases: any[]): any[] {
  const phaseIds = new Set(phases.map(p => p.id));
  return taskDefs.filter(td => phaseIds.has(td.phaseId));
}

const BAR_COLORS = ["#3b82f6","#7c3aed","#0891b2","#d97706","#059669","#dc2626","#db2777","#0d9488"];
const ROW_H = 28;

/* ─── MODAL ─────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children, width = 520 }: any) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed",inset:0,zIndex:2000,background:"rgba(8,16,36,0.72)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:isMobile?10:20 }}>
      <div style={{ background:"#fff",borderRadius:14,padding:isMobile?16:28,width:"100%",maxWidth:isMobile?"100%":width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(0,0,0,0.32)",fontFamily:"'DM Sans',sans-serif",border:"1px solid rgba(255,255,255,0.8)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:isMobile?13:15,fontWeight:700,color:"#0f172a",letterSpacing:"-0.3px" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"#f1f5f9",border:"none",cursor:"pointer",fontSize:16,color:"#64748b",lineHeight:1,padding:"6px 9px",borderRadius:8,transition:"background .15s" }}
            onMouseEnter={e=>(e.currentTarget.style.background="#e2e8f0")}
            onMouseLeave={e=>(e.currentTarget.style.background="#f1f5f9")}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const iS: React.CSSProperties = { width:"100%",padding:"8px 11px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,color:"#0f172a",fontFamily:"'DM Sans',sans-serif",background:"#f8fafc",boxSizing:"border-box" as any,transition:"border-color .15s,box-shadow .15s" };
function Field({ label, children }: any) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block",fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

/* ─── PHASE EDIT MODAL ──────────────────────────────────────────────── */
function PhaseEditModal({ phases, onSave, onClose, isDev }: any) {
  const [localPhases, setLocalPhases] = useState(phases.map((p: any) => ({ ...p })));

  const updatePhase = (idx: number, key: string, val: any) => {
    setLocalPhases((prev: any) => {
      const next = prev.map((p: any, i: number) => i === idx ? { ...p, [key]: val } : p);
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

  const deletePhase = (idx: number) => {
    setLocalPhases((prev: any) => {
      const next = prev.filter((p: any, i: number) => i !== idx);
      for (let i = 1; i < next.length; i++) {
        const dur = diffDays(next[i].start, next[i].end);
        next[i] = { ...next[i], start: addDays(next[i-1].end, 1), end: addDays(addDays(next[i-1].end, 1), dur) };
      }
      return next;
    });
  };

  const addPhase = () => {
    setLocalPhases((prev: any) => {
      const lastPhase = prev[prev.length - 1];
      const newStart = addDays(lastPhase.end, 1);
      const newEnd = addDays(newStart, 27);
      const phaseNum = parseInt(lastPhase.id.slice(1)) + 1;
      return [...prev, { id:`P${phaseNum}`, label:`New Phase`, color:"#6366f1", light:"#e0e7ff", start:newStart, end:newEnd }];
    });
  };

  return (
    <Modal title="Edit Phase Schedule" onClose={onClose} width={640}>
      <div style={{ marginBottom:14,padding:"10px 14px",background:"linear-gradient(135deg,#eff6ff,#f0fdf4)",borderRadius:8,border:"1px solid #bfdbfe",fontSize:11,color:"#1d4ed8",display:"flex",gap:8,alignItems:"flex-start" }}>
        <span style={{fontSize:14,flexShrink:0}}>💡</span>
        <span>Editing a phase's start or end date will automatically cascade and shift all subsequent phases. Tasks within each phase will shift proportionally.</span>
      </div>
      <div style={{ overflowY:"auto", maxHeight:"58vh", paddingRight:4 }}>
        {localPhases.map((p: any, idx: number) => {
          const dur = diffDays(p.start, p.end) + 1;
          return (
            <div key={p.id} style={{ marginBottom:10, padding:"12px 14px", borderRadius:10, border:`1.5px solid ${p.color}30`, background:`${p.light}55`,transition:"box-shadow .2s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ width:10,height:10,borderRadius:3,background:p.color,flexShrink:0,boxShadow:`0 0 0 3px ${p.color}25` }}/>
                <span style={{ fontWeight:700,fontSize:12,color:p.color,minWidth:28 }}>{p.id}</span>
                <input type="text" value={p.label} onChange={(e)=>updatePhase(idx,"label",e.target.value)} style={{ ...iS, flex:1, fontSize:12, padding:"5px 9px",fontWeight:600 }}/>
                <span style={{ fontSize:11,fontWeight:700,color:"#475569",background:"rgba(255,255,255,0.8)",padding:"3px 10px",borderRadius:20,border:"1px solid #e2e8f0",whiteSpace:"nowrap" }}>
                  {dur}d
                </span>
                {isDev && localPhases.length > 1 && (
                  <button onClick={()=>deletePhase(idx)} style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",borderRadius:7,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0 }}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 12px", marginBottom:12 }}>
                <Field label="Start Date">
                  <input type="date" value={p.start} onChange={e => setStart(idx, e.target.value)} style={{ ...iS, borderColor: `${p.color}60` }}/>
                </Field>
                <Field label="End Date">
                  <input type="date" value={p.end} min={addDays(p.start, 6)} onChange={e => setEnd(idx, e.target.value)} style={{ ...iS, borderColor: `${p.color}60` }}/>
                </Field>
              </div>
              <Field label="Phase Color">
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",paddingTop:4 }}>
                  {BAR_COLORS.map(c=>(
                    <div key={c} onClick={()=>updatePhase(idx,"color",c)}
                      style={{ width:24,height:24,borderRadius:6,background:c,cursor:"pointer",border:p.color===c?"3px solid #0f172a":"2px solid transparent",boxSizing:"border-box",transition:"transform .12s,border-color .12s",transform:p.color===c?"scale(1.15)":"scale(1)" } as React.CSSProperties}/>
                  ))}
                </div>
              </Field>
            </div>
          );
        })}
      </div>
      {isDev && (
        <button onClick={addPhase} style={{ padding:"9px 16px",borderRadius:8,border:"1.5px dashed #2563eb",background:"transparent",color:"#2563eb",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:14,width:"100%",transition:"background .15s" }}
          onMouseEnter={e=>(e.currentTarget.style.background="#eff6ff")}
          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
          + Add Phase
        </button>
      )}
      <div style={{ padding:"9px 14px", background:"#f8fafc", borderRadius:8, fontSize:11, color:"#475569",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <span>Project span: <strong style={{color:"#0f172a"}}>{fmtDate(localPhases[0].start)}</strong> → <strong style={{color:"#0f172a"}}>{fmtDate(localPhases[localPhases.length-1].end)}</strong></span>
        <span style={{fontWeight:700,color:"#2563eb"}}>{diffDays(localPhases[0].start, localPhases[localPhases.length-1].end) + 1} days total</span>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:16 }}>
        <button onClick={onClose} style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
        {isDev && (
          <button onClick={() => onSave(localPhases)} style={{ padding:"8px 24px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(37,99,235,0.35)" }}>Apply Changes</button>
        )}
      </div>
    </Modal>
  );
}

/* ─── TASK FORM ─────────────────────────────────────────────────────── */
function TaskForm({ initial, onSave, onClose, allEpics, phases, isDev }: any) {
  const blank = { phaseId:"P1", epic:"", task:"", owner:"", status:"Planned", start: phases[0].start, end: phases[0].end, color:"#3b82f6" };
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
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
        <Field label="Phase"><select value={f.phaseId} onChange={onPhaseChange} style={iS}>{phases.map((p: any)=><option key={p.id} value={p.id}>{p.id} — {p.label}</option>)}</select></Field>
        <Field label="Bar Color">
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",paddingTop:4 }}>
            {BAR_COLORS.map(c=>(
              <div key={c} onClick={()=>setF((p: any)=>({...p,color:c}))}
                style={{ width:22,height:22,borderRadius:6,background:c,cursor:"pointer",border:f.color===c?"3px solid #0f172a":"2px solid transparent",boxSizing:"border-box",transition:"transform .12s,border-color .12s",transform:f.color===c?"scale(1.18)":"scale(1)" } as React.CSSProperties}/>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Epic / Workstream"><input list="ep-opts" value={f.epic} onChange={set("epic")} placeholder="Type or pick…" style={iS}/><datalist id="ep-opts">{epics.map((e: string)=><option key={e} value={e}/>)}</datalist></Field>
      <Field label="Task"><textarea value={f.task} onChange={set("task")} rows={2} style={{ ...iS,resize:"vertical",lineHeight:1.6 }}/></Field>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
        <Field label="Owner"><input value={f.owner} onChange={set("owner")} placeholder="e.g. Partner + Client" style={iS}/></Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")} style={iS}>
            {["Planned","In Progress","Completed","On Hold","At Risk"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
        <Field label="Start Date"><input type="date" value={f.start} onChange={set("start")} min={ph.start} max={ph.end} style={iS}/></Field>
        <Field label="End Date"><input type="date" value={f.end} onChange={set("end")} min={f.start} max={ph.end} style={iS}/></Field>
      </div>
      <div style={{ padding:"8px 12px",borderRadius:8,background:"linear-gradient(135deg,#eff6ff,#f0f9ff)",border:"1px solid #bae6fd",fontSize:11,color:"#0369a1",marginBottom:14 }}>
        Phase range: <strong>{fmtDate(ph.start)}</strong> → <strong>{fmtDate(ph.end)}</strong>
      </div>
      <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
        {isDev && (
          <button onClick={()=>valid&&onSave(f)} style={{ padding:"8px 22px",borderRadius:8,border:"none",background:valid?"linear-gradient(135deg,#2563eb,#1d4ed8)":"#bfdbfe",color:"#fff",fontSize:12,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:valid?"0 4px 14px rgba(37,99,235,0.35)":"none",transition:"all .15s" }}>Save Task</button>
        )}
      </div>
    </div>
  );
}

/* ─── VIEW MODE TOGGLE ──────────────────────────────────────────────── */
function ViewModeToggle({ viewMode, setViewMode }: { viewMode: "day"|"week"|"month", setViewMode: (m: "day"|"week"|"month") => void }) {
  const modes: { key: "day"|"week"|"month"; label: string; icon: string; desc: string }[] = [
    { key: "day",   label: "Day",   icon: "▦", desc: "Detailed daily grid" },
    { key: "week",  label: "Week",  icon: "▤", desc: "Weekly overview" },
    { key: "month", label: "Month", icon: "▣", desc: "Monthly summary" },
  ];
  return (
    <div style={{ display:"flex",gap:2,background:"#f1f5f9",borderRadius:10,padding:3,border:"1px solid #e2e8f0" }}>
      {modes.map(m => {
        const active = viewMode === m.key;
        return (
          <button
            key={m.key}
            onClick={() => setViewMode(m.key)}
            title={m.desc}
            style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"5px 12px",
              borderRadius:7,
              border:"none",
              background: active ? "#fff" : "transparent",
              color: active ? "#1d4ed8" : "#64748b",
              fontSize:11,
              fontWeight: active ? 700 : 500,
              cursor:"pointer",
              fontFamily:"inherit",
              transition:"all .18s cubic-bezier(.4,0,.2,1)",
              boxShadow: active ? "0 1px 6px rgba(0,0,0,0.1),0 0 0 1px rgba(37,99,235,0.12)" : "none",
              letterSpacing: active ? "-0.2px" : "0",
            }}
          >
            <span style={{ fontSize:12, opacity: active ? 1 : 0.6 }}>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────────────── */
function GanttChart() {
  const searchParams = useSearchParams();
  const isDev = searchParams.has("dev");

  const dbPhases = useQuery(api.phases.getPhases) || [];
  const dbTasks = useQuery(api.tasks.getTasks) || [];

  const [phases, setPhases] = useState(dbPhases);
  const [taskDefs, setTaskDefs] = useState(dbTasks);

  const createTaskMutation = useMutation(api.tasks.createTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);
  const updatePhasesMutation = useMutation(api.phases.updatePhases);

  useEffect(() => { setPhases(dbPhases); }, [dbPhases]);
  useEffect(() => { setTaskDefs(dbTasks); }, [dbTasks]);

  const [selected, setSelected] = useState<string | null>(null);
  const [phaseOpen, setPhaseOpen] = useState<Record<string, boolean>>({});
  const [epicOpen, setEpicOpen] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<any>(null);
  const [tooltip, setTooltip] = useState<any>(null);
  const [hoverRow, setHoverRow] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [columnWidths, setColumnWidths] = useState({ list: isMobile ? 160 : 210, owner: isMobile ? 100 : 130, status: isMobile ? 80 : 110, info: isMobile ? 60 : 80 });
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<number>(0);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Resizing logic
  const startResize = (e: React.MouseEvent, colName: string) => {
    e.preventDefault();
    setResizingColumn(colName);
    setResizeStart(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return;
      const delta = e.clientX - resizeStart;
      const minWidth = 60;
      
      setColumnWidths(prev => {
        const newWidths = { ...prev };
        const currentWidth = newWidths[resizingColumn as keyof typeof newWidths];
        const newWidth = Math.max(minWidth, currentWidth + delta);
        (newWidths as any)[resizingColumn] = newWidth;
        return newWidths;
      });
      setResizeStart(e.clientX);
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
      };
    }
  }, [resizingColumn, resizeStart]);

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

  if (phases.length === 0) {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0f4fa",color:"#64748b",gap:12,flexDirection:"column" }}>
        <div style={{ width:36,height:36,border:"3px solid #2563eb",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
        <span style={{ fontSize:13,fontWeight:500 }}>Loading project data…</span>
      </div>
    );
  }

  const tasks = resolveTasks(taskDefs, phases);
  const selTask = tasks.find(t => t.id === selected);
  const allEpics = taskDefs.map(t => ({ phaseId: t.phaseId, epic: t.epic }));

  const projectStart = phases[0].start;
  const projectEnd = phases[phases.length - 1].end;

  const yearStart = "2026-01-01";
  const yearEnd = "2026-12-31";

  const LIST_W = columnWidths.list;
  const OWNER_W = columnWidths.owner;
  const STATUS_W = columnWidths.status;
  const INFO_W = columnWidths.info;

  const baseSize = isMobile ? 4 : 5.4;
  const PX_PER_UNIT = viewMode === "day" ? baseSize * 1 : viewMode === "week" ? baseSize * 7 : baseSize * 30.5;

  const totalDays = diffDays(yearStart, yearEnd) + 1;
  const totalUnits = viewMode === "day" ? totalDays : viewMode === "week" ? Math.ceil(totalDays / 7) : Math.ceil(totalDays / 30.5);
  const TOTAL_W = Math.ceil(totalUnits * PX_PER_UNIT);

  function toX(dateStr: string): number {
    const days = Math.max(0, diffDays(yearStart, dateStr));
    const units = viewMode === "day" ? days : viewMode === "week" ? days / 7 : days / 30.5;
    return units * PX_PER_UNIT;
  }
  function toW(s: string, e: string): number {
    const days = Math.max((diffDays(s, e) + 1), 1);
    const units = viewMode === "day" ? days : viewMode === "week" ? days / 7 : days / 30.5;
    return Math.max(units * PX_PER_UNIT, 4);
  }

  // Build ticks
  const ticks: {label: string, date: string, isMinor?: boolean}[] = [];
  if (viewMode === "day") {
    const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    let current = new Date(2026, 0, 1);
    while (current.getFullYear() === 2026) {
      const isSunday = current.getDay() === 0;
      const isMonday = current.getDay() === 1;
      ticks.push({ label: isSunday ? `${dayNames[current.getDay()]} ${current.getDate()}` : `${current.getDate()}`, date: fmtISO(current), isMinor: !isSunday && !isMonday });
      current = new Date(current.getTime() + 86400000);
    }
  } else if (viewMode === "week") {
    let current = new Date(2026, 0, 1);
    let weekNum = 1;
    while (current.getFullYear() === 2026) {
      ticks.push({ label: `W${weekNum}`, date: fmtISO(current) });
      current = new Date(current.getTime() + 7 * 86400000);
      weekNum++;
    }
  } else {
    for (let month = 0; month < 12; month++) {
      const date = new Date(2026, month, 1);
      ticks.push({ label: date.toLocaleDateString("en-US",{month:"short",year:"2-digit"}), date: fmtISO(date) });
    }
  }
  const monthTicks = ticks;

  const isPOpen = (id: string) => phaseOpen[id] !== false;
  const isEOpen = (k: string) => epicOpen[k] !== false;

  const rows: any[] = [];
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

  const todayStr = fmtISO(new Date());
  const todayInRange = todayStr >= yearStart && todayStr <= yearEnd;
  const todayX = todayInRange ? toX(todayStr) : null;

  const saveTask = async (form: any) => {
    const ph = phases.find((p: any) => p.id === form.phaseId);
    if (!ph) return;
    const so = diffDays(ph.start, form.start);
    const eo = diffDays(ph.start, form.end);
    try {
      if (modal?.mode === "add") {
        const newId = uid();
        await createTaskMutation({ id:newId, phaseId:form.phaseId, epic:form.epic, task:form.task, owner:form.owner, color:form.color, status:form.status, start:form.start, end:form.end, so, eo });
        setTaskDefs((ts: any) => [...ts, { ...form, id:newId, so, eo }]);
      } else if (modal?.mode === "edit") {
        await updateTaskMutation({ id:modal.task.id, phaseId:form.phaseId, epic:form.epic, task:form.task, owner:form.owner, color:form.color, status:form.status, start:form.start, end:form.end, so, eo });
        setTaskDefs((ts: any) => ts.map((t: any) => t.id === modal.task.id ? { ...t, ...form, so, eo } : t));
      }
      setModal(null);
    } catch (error) { console.error("Failed to save task:", error); }
  };

  const deleteTask = async () => {
    if (!modal?.task?.id) return;
    try {
      await deleteTaskMutation({ id: modal.task.id });
      setTaskDefs((ts: any) => ts.filter((t: any) => t.id !== modal.task.id));
      setModal(null);
      if (selected === modal.task.id) setSelected(null);
    } catch (error) { console.error("Failed to delete task:", error); }
  };

  const applyPhaseChanges = async (newPhases: any) => {
    try {
      const phasesWithOrder = newPhases.map((p: any, idx: number) => ({ id:p.id, label:p.label, color:p.color, light:p.light, start:p.start, end:p.end, durationDays:p.durationDays, order:idx }));
      await updatePhasesMutation({ phases: phasesWithOrder });
      setPhases(phasesWithOrder);
      setModal(null);
    } catch (error) { console.error("Failed to update phases:", error); }
  };

  // Status badge colors
  const statusColors: Record<string, {bg:string,color:string,dot:string}> = {
    "Planned":     { bg:"#f1f5f9", color:"#475569", dot:"#94a3b8" },
    "In Progress": { bg:"#eff6ff", color:"#1d4ed8", dot:"#3b82f6" },
    "Completed":   { bg:"#f0fdf4", color:"#15803d", dot:"#22c55e" },
    "On Hold":     { bg:"#fffbeb", color:"#b45309", dot:"#f59e0b" },
    "At Risk":     { bg:"#fef2f2", color:"#dc2626", dot:"#ef4444" },
  };

  return (
    <div style={{ fontFamily:"'DM Sans','Nunito Sans','Segoe UI',sans-serif",background:"#eef1f8",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#c8d3e0;border-radius:6px}
        ::-webkit-scrollbar-track{background:transparent}
        .rh:hover{background:rgba(37,99,235,0.04)!important}
        .rh:hover .acts{opacity:1!important}
        .ib{background:none;border:none;cursor:pointer;border-radius:5px;padding:3px 5px;display:inline-flex;align-items:center;line-height:1;transition:background .12s}
        .ib:hover{background:rgba(0,0,0,0.08)}
        .gbar{position:absolute;border-radius:5px;display:flex;align-items:center;padding:0 6px;overflow:hidden;cursor:pointer;transition:filter .15s,box-shadow .15s,transform .12s;white-space:nowrap}
        .gbar:hover{filter:brightness(.9);transform:scaleY(1.04)}
        .col-header{position:relative;display:flex;align-items:center;padding:0 10px;border-right:1px solid #e4e9f2;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.1em;height:100%}
        .resize-handle{position:absolute;right:-4px;top:0;bottom:0;width:8px;cursor:col-resize;user-select:none;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}
        .col-header:hover .resize-handle{opacity:1}
        .resize-handle::after{content:'';width:1px;height:60%;background:#2563eb;border-radius:1px}
        select:focus,input:focus,textarea:focus{outline:none;border-color:#2563eb!important;box-shadow:0 0 0 3px rgba(37,99,235,.12)!important}
        .toolbar-btn{transition:all .15s!important}
        .toolbar-btn:hover{transform:translateY(-1px)!important;box-shadow:0 3px 10px rgba(0,0,0,.1)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:translateY(0)}}
        .row-anim{animation:fadein .18s ease}
        @media(max-width:768px){
          .toolbar-btn{font-size:9px!important;padding:4px 8px!important}
          .task-count{display:none}
          .phase-badges{display:flex!important;gap:3px;flex-wrap:wrap}
        }
      `}</style>

      {/* NAV */}
      <div style={{ background:"linear-gradient(90deg,#0c1e4a 0%,#1940a8 60%,#2563eb 100%)",height:44,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",flexShrink:0,boxShadow:"0 2px 16px rgba(15,30,80,0.28)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ width:24,height:24,borderRadius:6,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.25)" }}>
              <span style={{ color:"#fff",fontWeight:800,fontSize:10,letterSpacing:"-0.5px" }}>Q</span>
            </div>
            <span style={{ color:"#fff",fontWeight:800,fontSize:13,letterSpacing:"-0.4px" }}>QED</span>
          </div>
          <div style={{ width:1,height:18,background:"rgba(255,255,255,.2)" }}/>
          <span style={{ color:"rgba(255,255,255,.85)",fontSize:12,fontWeight:500,letterSpacing:"-0.2px" }}>BC Implementation — PH</span>
        </div>

      </div>

      {/* TOOLBAR */}
      <div style={{ background:"#fff",borderBottom:"1px solid #e4e9f2",height:"auto",minHeight:46,display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0,flexWrap:"wrap" }}>
        {isDev && (
          <button onClick={()=>setModal({mode:"add"})} className="toolbar-btn"
            style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 8px rgba(37,99,235,0.3)",letterSpacing:"-0.1px" }}>
            <span style={{ fontSize:15,lineHeight:1,marginTop:-1 }}>+</span>
            <span style={{display:isMobile?"none":"inline"}}>Add Task</span>
          </button>
        )}
        {isDev && (
          <button className="toolbar-btn" onClick={()=>setModal({mode:"editPhases"})}
            style={{ display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            <span>📅</span>
            <span style={{display:isMobile?"none":"inline"}}>Edit Dates</span>
          </button>
        )}

        {/* ENHANCED VIEW MODE TOGGLE */}
        <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

        {isMobile && (
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ marginLeft:"auto",padding:"5px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            {sidebarOpen ? "✕" : "📋"}
          </button>
        )}
        {!isMobile && isDev && selTask && (
          <>
            <div style={{ width:1,height:20,background:"#e2e8f0",margin:"0 2px" }}/>
            <button onClick={()=>setModal({mode:"edit",task:selTask})} className="toolbar-btn"
              style={{ padding:"5px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#374151",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>✏️ Edit</button>
            <button onClick={()=>setModal({mode:"delete",task:selTask})} className="toolbar-btn"
              style={{ padding:"5px 12px",borderRadius:8,border:"1.5px solid #fca5a5",background:"#fff5f5",color:"#dc2626",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>🗑 Delete</button>
          </>
        )}
        <span className="task-count" style={{ marginLeft:"auto",fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ background:"#f1f5f9",borderRadius:20,padding:"2px 8px",fontWeight:700,color:"#475569",fontSize:11 }}>{tasks.length} tasks</span>
          <span style={{ color:"#cbd5e1" }}>·</span>
          <span style={{ fontWeight:600,color:"#64748b" }}>{fmtShort(phases[0].start)} – {fmtShort(phases[phases.length-1].end)}</span>
        </span>
      </div>

      {/* BODY */}
      <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0 }}>

          {/* HEADER */}
          <div style={{ display:"flex",flexShrink:0,height:isMobile?42:56,background:"#f8fafc",borderBottom:"2px solid #e4e9f2",zIndex:10 }}>
            {/* Frozen left header */}
            <div style={{ display:"flex",flexShrink:0,zIndex:11,background:"#f8fafc" }}>
              <div className="col-header" style={{ width:LIST_W,gap:6 }}>
                <span style={{ opacity:0.5 }}>⋮⋮</span>{isMobile?"Task":"Name / Task"}
                <div className="resize-handle" onMouseDown={e => startResize(e, "list")}/>
              </div>
              {!isMobile && <>
                <div className="col-header" style={{ width:OWNER_W }}>
                  Owner
                  <div className="resize-handle" onMouseDown={e => startResize(e, "owner")}/>
                </div>
                <div className="col-header" style={{ width:STATUS_W }}>
                  Status
                  <div className="resize-handle" onMouseDown={e => startResize(e, "status")}/>
                </div>
                <div className="col-header" style={{ width:INFO_W }}>
                  Start
                  <div className="resize-handle" onMouseDown={e => startResize(e, "info")}/>
                </div>
                <div className="col-header" style={{ width:INFO_W }}>
                  End
                </div>
              </>}
            </div>
            {/* Scrollable timeline header */}
            <div ref={headerScrollRef} onScroll={onHeaderScroll}
              style={{ flex:1,overflowX:"scroll",overflowY:"hidden",display:"flex",flexDirection:"column" }}>
              <div style={{ minWidth:TOTAL_W+60,width:TOTAL_W+60,height:"100%",display:"flex",flexDirection:"column",paddingLeft:30 }}>
                {/* Phase color bands in header */}
                <div style={{ position:"relative",height:isMobile?10:18,flexShrink:0 }}>
                  {phases.map(pm => {
                    const x = toX(pm.start), w = toW(pm.start, pm.end);
                    return (
                      <div key={pm.id} style={{ position:"absolute",top:2,left:x,width:w,height:"calc(100% - 4px)",background:pm.color,opacity:.14,borderRadius:3 }}>
                        <div style={{ height:"100%",display:"flex",alignItems:"center",paddingLeft:6,overflow:"hidden" }}>
                          <span style={{ fontSize:isMobile?6:8,fontWeight:800,color:pm.color,textTransform:"uppercase",letterSpacing:".06em",opacity:8,whiteSpace:"nowrap" }}>{pm.id} · {pm.label}</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Phase boundary markers */}
                  {phases.map(pm => {
                    const x = toX(pm.start);
                    return <div key={`bnd-${pm.id}`} style={{ position:"absolute",top:0,left:x,width:2,height:"100%",background:pm.color,opacity:0.4,borderRadius:1 }}/>;
                  })}
                </div>
                {/* Date ticks row */}
                <div style={{ position:"relative",flex:1,background:"#f8fafc",borderTop:"1px solid #e9ecf1" }}>
                  {viewMode === "day" && (
                    // Day view: show month labels as floating chips at month boundaries
                    <>
                      {Array.from({length:12},(_,m) => {
                        const date = new Date(2026,m,1);
                        const x = toX(fmtISO(date));
                        return (
                          <div key={`mchip-${m}`} style={{ position:"absolute",top:"50%",left:x+2,transform:"translateY(-50%)",background:"#e0e7ff",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:800,color:"#3730a3",zIndex:2,whiteSpace:"nowrap",pointerEvents:"none",border:"1px solid #c7d2fe" }}>
                            {date.toLocaleDateString("en-US",{month:"short"})}
                          </div>
                        );
                      })}
                      {monthTicks.filter(t=>!t.isMinor).map((tick,i) => {
                        const x = toX(tick.date);
                        const isSun = new Date(tick.date).getDay() === 0;
                        return (
                          <div key={i} style={{ position:"absolute",top:0,left:x,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:3,alignItems:"center" }}>
                            <div style={{ width:isSun?1.5:1,height:isSun?8:5,background:isSun?"#94a3b8":"#e2e8f0",marginBottom:2 }}/>
                            <span style={{ fontSize:isMobile?7:9,fontWeight:isSun?700:400,color:isSun?"#334155":"#94a3b8",whiteSpace:"nowrap",lineHeight:1 }}>
                              {isSun ? tick.label : ""}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {viewMode === "week" && monthTicks.map((tick,i) => {
                    const x = toX(tick.date);
                    const isFirst = i===0 || new Date(tick.date).getDate()<=7;
                    return (
                      <div key={i} style={{ position:"absolute",top:0,left:x,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:3 }}>
                        <div style={{ width:1,height:isFirst?8:5,background:isFirst?"#94a3b8":"#e2e8f0",marginBottom:2 }}/>
                        <span style={{ fontSize:isMobile?7:10,fontWeight:isFirst?700:500,color:isFirst?"#334155":"#94a3b8",whiteSpace:"nowrap",transform:"translateX(-50%)",lineHeight:1 }}>
                          {tick.label}
                        </span>
                      </div>
                    );
                  })}
                  {viewMode === "month" && monthTicks.map((tick,i) => {
                    const x = toX(tick.date);
                    return (
                      <div key={i} style={{ position:"absolute",top:0,left:x,height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",paddingBottom:4 }}>
                        <div style={{ width:1,height:8,background:"#94a3b8",marginBottom:3,marginLeft:0 }}/>
                        <span style={{ fontSize:isMobile?8:11,fontWeight:700,color:"#475569",whiteSpace:"nowrap",transform:"translateX(-50%)",lineHeight:1.2,letterSpacing:"-0.2px" }}>
                          {isMobile?tick.label.charAt(0):tick.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ROWS */}
          <div style={{ flex:1,display:"flex",overflow:"hidden",minHeight:0 }}>
            {/* Frozen left columns */}
            <div style={{ display:"flex",flexShrink:0,flexDirection:"column",zIndex:5,background:"#fff",borderRight:"1px solid #e4e9f2",overflowY:"auto" }}
              id="frozen-cols" onScroll={onFrozenLeftScroll}>
              {rows.map((row, ri) => {
                const { type, pm } = row;
                const t = type === "task" ? row.t : null;
                const isSel = type === "task" && selected === t.id;
                const isPhase = type==="phase", isEpic=type==="epic", isTask=type==="task";
                let bg = ri%2===0?"#fff":"#fafbfd";
                if(isPhase) bg=`${pm.light}cc`;
                if(isEpic) bg="#f4f6fb";
                if(isSel) bg="#eff6ff";
                const statusStyle = isTask ? (statusColors[t.status] || statusColors["Planned"]) : null;

                return (
                  <div key={row.id} className={!isPhase?"rh row-anim":"row-anim"}
                    onClick={()=>isTask&&setSelected(t.id===selected?null:t.id)}
                    style={{ display:"flex",height:isMobile?24:ROW_H,borderBottom:"1px solid #edf0f7",background:bg,cursor:isTask?"pointer":"default",flexShrink:0,alignItems:"stretch",transition:"background .1s" }}
                    onMouseEnter={()=>setHoverRow(row.id)} onMouseLeave={()=>setHoverRow(null)}>

                    {/* Name cell */}
                    <div style={{ width:LIST_W,display:"flex",alignItems:"center",borderRight:"1px solid #edf0f7",padding:`0 8px 0 ${isPhase?10:isEpic?20:34}px`,gap:5,overflow:"hidden" }}>
                      {isPhase && (
                        <button onClick={e=>{e.stopPropagation();setPhaseOpen(s=>({...s,[pm.id]:!isPOpen(pm.id)}))}}
                          style={{ background:"none",border:"none",cursor:"pointer",color:pm.color,fontSize:10,padding:0,width:14,flexShrink:0,transition:"transform .15s",transform:isPOpen(pm.id)?"rotate(0deg)":"rotate(-90deg)" }}>▾</button>
                      )}
                      {isEpic && (
                        <button onClick={e=>{e.stopPropagation();const k=`${pm.id}::${row.ename}`;setEpicOpen(s=>({...s,[k]:!isEOpen(k)}))}}
                          style={{ background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:9,padding:0,width:12,flexShrink:0,transition:"transform .15s",transform:isEOpen(`${pm.id}::${row.ename}`)?"rotate(0deg)":"rotate(-90deg)" }}>▾</button>
                      )}
                      {isPhase && <div style={{ width:8,height:8,borderRadius:2,background:pm.color,flexShrink:0,boxShadow:`0 0 0 2px ${pm.color}25` }}/>}
                      {isTask && <div style={{ width:5,height:5,borderRadius:"50%",background:t.color||pm.color,flexShrink:0,opacity:.8 }}/>}
                      <span style={{ fontSize:isMobile?9:isPhase?11:isEpic?11:11,fontWeight:isPhase?800:isEpic?700:400,color:isPhase?pm.color:isEpic?"#1e3a5f":"#334155",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,letterSpacing:isPhase?"-0.2px":"0" }}>
                        {isPhase?`${pm.id} — ${pm.label}`:isEpic?row.ename:t.task}
                      </span>
                      {isTask && (
                        <div className="acts" style={{ display:"flex",gap:1,flexShrink:0,opacity:hoverRow===row.id?1:0,transition:"opacity .15s" }}>
                          {isDev && (
                            <button className="ib" onClick={e=>{e.stopPropagation();setModal({mode:"edit",task:t})}}>
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                          {isDev && (
                            <button className="ib" onClick={e=>{e.stopPropagation();setModal({mode:"delete",task:t})}}>
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5l.5-9" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Owner */}
                    {!isMobile && (
                      <div style={{ width:OWNER_W,display:"flex",alignItems:"center",padding:"0 10px",borderRight:"1px solid #edf0f7",fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",gap:5,position:"relative" }}>
                        {isTask && <>
                          <div style={{ width:16,height:16,borderRadius:"50%",background:`${t.color||pm.color}22`,border:`1.5px solid ${t.color||pm.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:t.color||pm.color,flexShrink:0 }}>
                            {t.owner.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ overflow:"hidden",textOverflow:"ellipsis" }}>{t.owner}</span>
                        </>}
                      </div>
                    )}
                    {/* Status */}
                    {!isMobile && (
                      <div style={{ width:STATUS_W,display:"flex",alignItems:"center",padding:"0 10px",borderRight:"1px solid #edf0f7",fontSize:10,whiteSpace:"nowrap",overflow:"hidden",position:"relative" }}>
                        {isTask && statusStyle && (
                          <span style={{ display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:12,background:statusStyle.bg,color:statusStyle.color,fontSize:10,fontWeight:600,border:`1px solid ${statusStyle.dot}30` }}>
                            <span style={{ width:5,height:5,borderRadius:"50%",background:statusStyle.dot,display:"inline-block",flexShrink:0 }}/>
                            {t.status||"Planned"}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Start */}
                    {!isMobile && (
                      <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 10px",borderRight:"1px solid #edf0f7",fontSize:10,color:"#64748b",whiteSpace:"nowrap",position:"relative" }}>
                        {isTask?fmtShort(t.start):isPhase?<span style={{fontWeight:700,color:pm.color}}>{fmtShort(pm.start)}</span>:""}
                      </div>
                    )}
                    {/* End */}
                    {!isMobile && (
                      <div style={{ width:INFO_W,display:"flex",alignItems:"center",padding:"0 10px",borderRight:"1px solid #e4e9f2",fontSize:10,color:"#64748b",whiteSpace:"nowrap" }}>
                        {isTask?fmtShort(t.end):isPhase?<span style={{fontWeight:700,color:pm.color}}>{fmtShort(pm.end)}</span>:""}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Milestone footer */}
              <div style={{ height:isMobile?22:32,borderTop:"2px solid #e4e9f2",background:"#f8fafc",display:"flex",alignItems:"center",padding:"0 12px",fontSize:isMobile?8:9,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".1em",width:LIST_W+(isMobile?0:OWNER_W+STATUS_W+INFO_W*2),borderRight:"1px solid #e4e9f2",flexShrink:0,gap:6 }}>
                <span style={{ opacity:0.5 }}>◆</span> Milestones
              </div>
            </div>

            {/* Scrollable timeline */}
            <div ref={bodyScrollRef} onScroll={onBodyScroll}
              style={{ flex:1,overflowX:"scroll",overflowY:"auto",position:"relative" }}
              onMouseLeave={()=>setTooltip(null)}>
              <div style={{ minWidth:TOTAL_W+60,width:TOTAL_W+60,position:"relative",paddingLeft:30 }}>
                {rows.map((row, ri) => {
                  const { type, pm } = row;
                  const t = type==="task" ? row.t : null;
                  const isSel = type==="task" && selected===t.id;
                  const isHov = hoverRow===row.id;
                  const isPhase=type==="phase", isEpic=type==="epic", isTask=type==="task";

                  let bg = ri%2===0?"#fff":"#fafbfd";
                  if(isPhase) bg=`${pm.light}cc`;
                  if(isEpic) bg="#f4f6fb";
                  if(isSel) bg="#eff6ff";

                  const phaseX=isPhase?toX(pm.start):0, phaseW=isPhase?toW(pm.start,pm.end):0;
                  const epicX=isEpic?Math.min(...(row.tasks?.map((t: any)=>toX(t.start))??[])):0;
                  const epicW=isEpic?(Math.max(...(row.tasks?.map((t: any)=>toX(t.end)+PX_PER_UNIT)??[0]))-epicX):0;
                  const taskX=isTask?toX(t.start):0, taskW=isTask?Math.max(toW(t.start,t.end),isMobile?4:8):0;

                  return (
                    <div key={row.id} className={!isPhase?"rh":""}
                      onClick={()=>isTask&&setSelected(t.id===selected?null:t.id)}
                      style={{ height:isMobile?24:ROW_H,borderBottom:"1px solid #edf0f7",background:bg,position:"relative",cursor:isTask?"pointer":"default",flexShrink:0,transition:"background .1s" }}
                      onMouseEnter={()=>setHoverRow(row.id)}
                      onMouseLeave={()=>{setHoverRow(null);setTooltip(null);}}>

                      {/* Grid lines */}
                      {viewMode === "day" && monthTicks.filter(t=>!t.isMinor && new Date(t.date).getDay()===0).map((tick,i) => (
                        <div key={i} style={{ position:"absolute",top:0,bottom:0,left:toX(tick.date),width:1,background:"#e4e9f2",zIndex:0,pointerEvents:"none" }}/>
                      ))}
                      {viewMode !== "day" && monthTicks.map((tick,i) => (
                        <div key={i} style={{ position:"absolute",top:0,bottom:0,left:toX(tick.date),width:1,background:viewMode==="month"?"#e9ecf3":"#edf0f7",zIndex:0,pointerEvents:"none" }}/>
                      ))}

                      {/* Today line */}
                      {todayX!==null && (
                        <div style={{ position:"absolute",top:0,bottom:0,left:todayX,width:2,background:"linear-gradient(to bottom,#f87171,#ef4444)",zIndex:3,opacity:.8,pointerEvents:"none",borderRadius:1 }}/>
                      )}

                      {/* Phase band */}
                      {isPhase && <>
                        <div style={{ position:"absolute",top:isMobile?5:9,height:isMobile?8:12,borderRadius:3,background:pm.color,opacity:.15,left:phaseX,width:phaseW,zIndex:1 }}/>
                        <div style={{ position:"absolute",top:isMobile?5:9,height:isMobile?8:12,borderRadius:3,border:`1.5px solid ${pm.color}`,opacity:.4,left:phaseX,width:phaseW,zIndex:1 }}/>
                        <div style={{ position:"absolute",top:isMobile?5:9,height:isMobile?8:12,borderRadius:3,background:`linear-gradient(90deg,${pm.color}30,transparent)`,left:phaseX,width:Math.min(60,phaseW),zIndex:1 }}/>
                      </>}

                      {/* Epic band */}
                      {isEpic && (
                        <div style={{ position:"absolute",top:isMobile?6:10,height:isMobile?5:9,borderRadius:2,background:pm.color,opacity:.1,left:epicX,width:Math.max(epicW,4),zIndex:1,borderTop:`2px solid ${pm.color}30` }}/>
                      )}

                      {/* Task bar */}
                      {isTask && (
                        <div className="gbar"
                          onClick={e=>{e.stopPropagation();setSelected(t.id===selected?null:t.id)}}
                          onMouseMove={(e: any)=>setTooltip({x:e.clientX+14,y:e.clientY-12,task:t.task,owner:t.owner,start:t.start,end:t.end,status:t.status,color:t.color||pm.color})}
                          style={{
                            top:isMobile?4:5,height:isMobile?13:18,left:taskX,width:taskW,
                            background:`linear-gradient(135deg,${t.color||pm.color},${t.color||pm.color}dd)`,
                            zIndex:2,
                            boxShadow:isSel?`0 0 0 2px #fff,0 0 0 3.5px ${t.color||pm.color},0 4px 12px ${t.color||pm.color}50`:isHov?`0 3px 10px ${t.color||pm.color}55`:`0 1px 4px ${t.color||pm.color}30`
                          }}>
                          <span style={{ color:"rgba(255,255,255,0.92)",fontSize:isMobile?7:9,fontWeight:600,textShadow:"0 1px 3px rgba(0,0,0,.25)",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:".01em" }}>
                            {isMobile ? t.owner.split("+")[0].trim().slice(0,3) : t.owner}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Milestone footer */}
                <div style={{ height:isMobile?22:32,borderTop:"2px solid #e4e9f2",background:"#f8fafc",position:"relative",flexShrink:0 }}>
                  {phases.map(pm => (
                    <div key={pm.id} style={{ position:"absolute",left:toX(pm.end),top:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:isMobile?1:3 }}>
                      <div style={{ width:isMobile?7:10,height:isMobile?7:10,borderRadius:2,background:pm.color,transform:"rotate(45deg)",boxShadow:`0 0 0 2px #f8fafc,0 0 0 3px ${pm.color}60,0 2px 8px ${pm.color}40` }}/>
                      <span style={{ fontSize:isMobile?6:8,fontWeight:800,color:pm.color,textTransform:"uppercase",whiteSpace:"nowrap",letterSpacing:"0.05em" }}>{pm.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ background:"#0c1e4a",height:"auto",minHeight:isMobile?26:24,display:"flex",alignItems:"center",padding:isMobile?"4px 10px":"0 14px",gap:isMobile?8:20,flexShrink:0,flexWrap:"wrap" }}>
        {!isMobile && [["Tasks",tasks.length],["Phases",phases.length],["Start",fmtShort(phases[0].start)],["End",fmtShort(phases[phases.length-1].end)]].map(([k,v])=>(
          <span key={String(k)} style={{ color:"rgba(255,255,255,.45)",fontSize:10,display:"flex",alignItems:"center",gap:5 }}>
            <span>{k}:</span><strong style={{color:"rgba(255,255,255,.9)"}}>{v}</strong>
          </span>
        ))}
        {isMobile && <span style={{ color:"rgba(255,255,255,.5)",fontSize:9 }}>Tasks: <strong style={{color:"#fff"}}>{tasks.length}</strong></span>}
        {selTask && (
          <span style={{ fontSize:isMobile?8:10,color:"rgba(255,255,255,.5)",marginLeft:isMobile?0:"auto",display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#fbbf24",display:"inline-block" }}/>
            <strong style={{color:"#fcd34d"}}>{selTask.task.slice(0,isMobile?20:52)}{selTask.task.length>52?"…":""}</strong>
          </span>
        )}
        {!isMobile && !selTask && (
          <span style={{ marginLeft:"auto",fontSize:10,color:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",gap:5 }}>
            <span>↔</span><span>Scroll timeline · Click task to select</span>
          </span>
        )}
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div style={{ position:"fixed",zIndex:3000,top:tooltip?.y,left:tooltip?.x,background:"#1a2744",color:"#f1f5f9",borderRadius:10,padding:"10px 14px",fontSize:11,maxWidth:280,boxShadow:"0 12px 36px rgba(0,0,0,.35)",pointerEvents:"none",border:"1px solid rgba(255,255,255,.1)",backdropFilter:"blur(4px)" }}>
          <div style={{ fontWeight:700,marginBottom:5,lineHeight:1.4,fontSize:12 }}>{tooltip?.task}</div>
          <div style={{ color:"#94a3b8",fontSize:10,display:"flex",flexDirection:"column",gap:3 }}>
            <span>👤 {tooltip?.owner}</span>
            <span>📅 {fmtDate(tooltip?.start)} → {fmtDate(tooltip?.end)}</span>
            <span>⏱ {diffDays(tooltip?.start,tooltip?.end)+1} days</span>
            {tooltip?.status && (
              <span style={{ marginTop:2,display:"inline-flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:10,background:"rgba(255,255,255,0.08)",width:"fit-content" }}>
                <span style={{ width:5,height:5,borderRadius:"50%",background:statusColors[tooltip.status]?.dot||"#94a3b8",display:"inline-block" }}/>
                {tooltip.status}
              </span>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal?.mode==="editPhases" && <PhaseEditModal phases={phases} onSave={applyPhaseChanges} onClose={()=>setModal(null)} isDev={isDev}/>}
      {modal && (modal.mode==="add"||modal.mode==="edit") && (
        <Modal title={modal.mode==="add"?"Add New Task":"Edit Task"} onClose={()=>setModal(null)}>
          <TaskForm initial={modal.mode==="edit"?modal.task:null} onSave={saveTask} onClose={()=>setModal(null)} allEpics={allEpics} phases={phases} isDev={isDev}/>
        </Modal>
      )}
      {modal?.mode==="delete" && isDev && (
        <Modal title="Delete Task" onClose={()=>setModal(null)} width={400}>
          <div style={{ padding:"12px 14px",borderRadius:8,background:"#fef2f2",border:"1px solid #fecaca",marginBottom:16,display:"flex",gap:10,alignItems:"flex-start" }}>
            <span style={{ fontSize:18,flexShrink:0 }}>⚠️</span>
            <div>
              <p style={{ fontSize:12,color:"#991b1b",fontWeight:600,margin:"0 0 4px" }}>This action cannot be undone.</p>
              <p style={{ fontSize:11,color:"#b91c1c",margin:0 }}>Delete: <strong>"{modal.task.task}"</strong>?</p>
            </div>
          </div>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
            <button onClick={()=>setModal(null)} style={{ padding:"8px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",fontSize:12,cursor:"pointer",color:"#374151",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
            <button onClick={deleteTask} style={{ padding:"8px 22px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px rgba(220,38,38,0.35)" }}>Delete Task</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{ fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f0f4fa",color:"#64748b",gap:12,flexDirection:"column" }}>
        <div style={{ width:36,height:36,border:"3px solid #2563eb",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
        <span style={{ fontSize:13,fontWeight:500 }}>Loading project…</span>
      </div>
    }>
      <GanttChart />
    </Suspense>
  );
}