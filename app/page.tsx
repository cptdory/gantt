
"use client";
import { useState } from "react";

const PHASE_META = [
  { id:"P1", shortLabel:"Discovery & Planning",  months:[1],   color:"#6366f1", bg:"#eef2ff", border:"#c7d2fe" },
  { id:"P2", shortLabel:"Analysis & Design",      months:[2],   color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe" },
  { id:"P3", shortLabel:"Development & Build",    months:[3,4], color:"#0ea5e9", bg:"#f0f9ff", border:"#bae6fd" },
  { id:"P4", shortLabel:"Testing & Migration",    months:[5],   color:"#f59e0b", bg:"#fffbeb", border:"#fde68a" },
  { id:"P5", shortLabel:"UAT & Training",         months:[6],   color:"#10b981", bg:"#f0fdf4", border:"#a7f3d0" },
  { id:"P6", shortLabel:"Go-Live & Hypercare",    months:[7],   color:"#ef4444", bg:"#fff1f2", border:"#fecdd3" },
];

const TIMELINE_OPTIONS = ["Month 1","Month 2","Month 3–4","Month 5","Month 6","Month 7"];
const TOTAL_MONTHS = 7;
const MONTH_LABELS = ["Month 1","Month 2","Month 3","Month 4","Month 5","Month 6","Month 7"];

function uid() { return Math.random().toString(36).slice(2,10); }
function getBar(months) {
  const s = Math.min(...months), e = Math.max(...months);
  return { left:`${((s-1)/TOTAL_MONTHS)*100}%`, width:`${((e-s+1)/TOTAL_MONTHS)*100}%` };
}

const INIT = [
  {id:uid(),phaseId:"P1",epic:"Project Initiation & Planning",task:"Project alignment meeting",owner:"Partner + Client Executive Sponsor",timeline:"Month 1"},
  {id:uid(),phaseId:"P1",epic:"Project Initiation & Planning",task:"Conduct high-level discovery sessions",owner:"Partner + Client Executive Sponsor",timeline:"Month 1"},
  {id:uid(),phaseId:"P1",epic:"Project Initiation & Planning",task:"Define project scope",owner:"Partner + Client Executive Sponsor",timeline:"Month 1"},
  {id:uid(),phaseId:"P1",epic:"Project Initiation & Planning",task:"Define project objectives",owner:"Partner + Client Executive Sponsor",timeline:"Month 1"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Conduct business process mapping workshops for finance, sales, and procurement across 3 PH companies",owner:"Partner + Client Process Owners",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Identify bottlenecks, workarounds, and pain points",owner:"Partner + Client Process Owners",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Convert findings into AS-IS and TO-BE process maps",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Review PH-specific requirements (BIR compliance, WHT, VAT, payroll integrations, statutory reports)",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Assess fit against Business Central Essentials standard features",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Identify gaps requiring configuration, extension, or integration",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Gather and document functional requirements per module",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Gather and document technical requirements per module",owner:"Partner",timeline:"Month 2"},
  {id:uid(),phaseId:"P2",epic:"Analysis & Design",task:"Send functional and technical documents for client sign-off",owner:"Partner + Client Executive Sponsor",timeline:"Month 2"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Create Production and Sandbox environments and define promotion path (Sandbox → Prod)",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Enable required feature management settings (background posting, bank recon improvements, deferrals, Excel/Power BI)",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Set up company information for all companies",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Define accounting periods and posting ranges",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Define and assign document and journal number series",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Configure PH VAT handling including 12%, zero-rated, exempt, and unrealized VAT policy",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Decide approach for CWT/EWT (ISV app or customization) and define process/reporting",owner:"Client + Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Enable change log for critical tables",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Environment & Foundation Setup",task:"Schedule job queues for cost adjustments, exports, reports, and bank import",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Finalize and import Chart of Accounts; lock direct posting on control accounts; map to financial statements",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Define general posting setup and map revenue, expense, and interim accounts",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Create VAT business and product posting groups",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Configure VAT posting setup for 12%, 0%, and exempt transactions including VAT accounts",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Build VAT statement lines and define monthly VAT periods",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Set LCY to PHP and add foreign currencies as needed",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Configure global and shortcut dimensions and enforce on transactions where needed",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Create bank accounts, bank posting setup, check formats, reconciliation setup, and auto-match rules",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Define payment terms and payment methods",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Finance Configuration",task:"Configure fixed asset posting groups, depreciation books, FA classes, subclasses, and number series",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Sales (Customer-to-Cash)",task:"Create customer numbering series and configure posting groups, VAT groups, credit limits, and default dimensions",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Sales (Customer-to-Cash)",task:"Configure sales price lists and discounts by item, customer, group, and currency",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Purchasing (Procure-to-Pay)",task:"Configure vendor numbering series, vendor posting groups, payment terms, payment methods, bank details, and default dimensions",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Purchasing (Procure-to-Pay)",task:"Define item charges such as freight, customs duties, and brokerage including allocation methods",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Inventory",task:"Configure item master including UoM, costing method, and inventory posting groups",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Inventory",task:"Create inventory locations and bins with posting setup per location",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Inventory",task:"Map inventory posting setup for inventory, COGS, adjustment, and variance accounts",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Inventory",task:"Decide costing method and schedule Adjust Cost - Item Entries job queue; test returns and negative inventory scenarios",owner:"Client + Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Consolidation & Intercompany",task:"Create consolidation company, map subsidiary COA, and set exchange rates and ownership percentages",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Consolidation & Intercompany",task:"Define intercompany partners, routing, posting templates, and test IC sales/purchase",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Workflows, Security & Controls",task:"Set up procurement approval workflow based on client criteria",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Workflows, Security & Controls",task:"Set up sales approval workflow based on client criteria",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Workflows, Security & Controls",task:"Build role-based permission sets per function; client IT to assign users later",owner:"Partner + Client IT",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Workflows, Security & Controls",task:"Enable change log and define retention approach",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Workflows, Security & Controls",task:"Configure email/document templates and Microsoft 365 or SMTP connection",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Reporting & Analytics",task:"Build account schedules for balance sheet, profit and loss, and cash flow with dimension analysis",owner:"Partner + Client",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Reporting & Analytics",task:"Validate VAT reports, VAT statement previews, entry listings, and G/L reconciliation",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Reporting & Analytics",task:"Enable Power BI datasets and publish key visuals by module",owner:"Partner",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P3",epic:"Development",task:"Develop approved customizations and extensions identified during fit-gap analysis",owner:"Partner Development Team",timeline:"Month 3–4"},
  {id:uid(),phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse customer master data and import via configuration packages",owner:"Client + Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse vendor master data and import via configuration packages",owner:"Client + Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse item master data and import via configuration packages",owner:"Client + Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse fixed asset master data and import via configuration packages",owner:"Client + Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Data Migration",task:"Prepare and cleanse bank account master data and import via configuration packages",owner:"Client + Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Functional Testing",task:"Test sample postings for sales, purchase, inventory, general ledger, and VAT and reconcile results",owner:"Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P4",epic:"Functional Testing",task:"Test all approved customizations",owner:"Partner",timeline:"Month 5"},
  {id:uid(),phaseId:"P5",epic:"UAT",task:"Execute end-to-end UAT scenarios for sales, purchase, VAT edge cases, inventory counts/returns, financial close, and consolidation",owner:"Client + Partner",timeline:"Month 6"},
  {id:uid(),phaseId:"P5",epic:"Training",task:"Deliver role-based training for AR, AP, GL, Sales, Purchasing, and Inventory users",owner:"Partner + Client",timeline:"Month 6"},
  {id:uid(),phaseId:"P5",epic:"Training",task:"Provide quick guides and support during feedback and issue resolution",owner:"Partner",timeline:"Month 6"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Freeze master data and execute final AR, AP, Inventory, and GL loads; finalize permissions; prepare backup and rollback plan",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Load open customer entries with original document numbers and dates and reconcile aging",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Load open vendor entries with original document numbers and dates and reconcile aging",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Load inventory balances",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Load fixed asset balances",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Load opening trial balance by G/L and secure sign-off",owner:"Partner + Client",timeline:"Month 7"},
  {id:uid(),phaseId:"P6",epic:"Cutover & Go-Live",task:"Conduct Go/No-Go decision meeting",owner:"Partner + Client Executive Sponsor",timeline:"Month 7"},
];

function Modal({ title, onClose, children }) {
  return (
    <div onClick={e => e.target===e.currentTarget && onClose()}
      style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(15,23,42,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#fff",borderRadius:14,padding:28,width:"100%",maxWidth:520,boxShadow:"0 24px 60px rgba(0,0,0,0.22)",fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
          <h2 style={{ margin:0,fontSize:16,fontWeight:700,color:"#0f172a" }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#94a3b8",lineHeight:1,padding:"0 4px",borderRadius:6 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:13,color:"#0f172a",outline:"none",fontFamily:"'DM Sans',sans-serif",background:"#f8fafc",boxSizing:"border-box" };

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block",fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

function TaskForm({ initial, onSave, onClose, allEpicMeta }) {
  const blank = { phaseId:"P1", epic:"", task:"", owner:"", timeline:"Month 1" };
  const [form, setForm] = useState(initial ? { phaseId:initial.phaseId, epic:initial.epic||"", task:initial.task||"", owner:initial.owner||"", timeline:initial.timeline||"Month 1" } : blank);
  const set = k => e => setForm(f => ({ ...f, [k]:e.target.value }));

  const epicsForPhase = [...new Set(allEpicMeta.filter(x => x.phaseId===form.phaseId).map(x => x.epic))];
  const valid = form.task.trim() && form.epic.trim() && form.owner.trim();

  return (
    <div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px" }}>
        <Field label="Phase">
          <select value={form.phaseId} onChange={e => setForm(f => ({ ...f, phaseId:e.target.value, epic:"" }))} style={inputStyle}>
            {PHASE_META.map(p => <option key={p.id} value={p.id}>{p.id} — {p.shortLabel}</option>)}
          </select>
        </Field>
        <Field label="Timeline">
          <select value={form.timeline} onChange={set("timeline")} style={inputStyle}>
            {TIMELINE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Epic / Workstream">
        <input list="epic-opts" value={form.epic} onChange={set("epic")} placeholder="Type or pick an existing epic…" style={inputStyle} />
        <datalist id="epic-opts">{epicsForPhase.map(e => <option key={e} value={e} />)}</datalist>
      </Field>
      <Field label="Task Description">
        <textarea value={form.task} onChange={set("task")} placeholder="Describe the task…" rows={3} style={{ ...inputStyle,resize:"vertical",lineHeight:1.5 }} />
      </Field>
      <Field label="Owner">
        <input value={form.owner} onChange={set("owner")} placeholder="e.g. Partner + Client" style={inputStyle} />
      </Field>
      <div style={{ display:"flex",gap:10,justifyContent:"flex-end",marginTop:8 }}>
        <button onClick={onClose} style={{ padding:"9px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",fontSize:13,cursor:"pointer",color:"#475569",fontFamily:"inherit",fontWeight:500 }}>Cancel</button>
        <button onClick={() => valid && onSave(form)} style={{ padding:"9px 22px",borderRadius:8,border:"none",background:valid?"#6366f1":"#c7d2fe",color:"#fff",fontSize:13,fontWeight:700,cursor:valid?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:valid?"0 2px 10px rgba(99,102,241,0.35)":"none",transition:"background 0.15s" }}>Save Task</button>
      </div>
    </div>
  );
}

export default function GanttChart() {
  const [tasks, setTasks]         = useState(INIT);
  const [phaseOpen, setPhaseOpen] = useState({});
  const [epicOpen, setEpicOpen]   = useState({});
  const [modal, setModal]         = useState(null);
  const [tooltip, setTooltip]     = useState(null);
  const [hoverId, setHoverId]     = useState(null);

  const isPOpen = id => phaseOpen[id] !== false;
  const isEOpen = k  => epicOpen[k]   !== false;

  const grouped = PHASE_META.map(pm => {
    const pt = tasks.filter(t => t.phaseId===pm.id);
    const epics = [...new Set(pt.map(t => t.epic))];
    return { ...pm, epics: epics.map(n => ({ name:n, tasks:pt.filter(t=>t.epic===n) })) };
  });

  const allEpicMeta = tasks.map(t => ({ phaseId:t.phaseId, epic:t.epic }));

  const saveTask = form => {
    if (modal.mode==="add") setTasks(ts => [...ts, { ...form, id:uid() }]);
    else setTasks(ts => ts.map(t => t.id===modal.task.id ? { ...t,...form } : t));
    setModal(null);
  };

  const deleteTask = () => { setTasks(ts => ts.filter(t => t.id!==modal.task.id)); setModal(null); };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#f8fafc",minHeight:"100vh",padding:"28px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box}
        .ph-row:hover{background:rgba(0,0,0,0.012)}
        .task-row:hover{background:rgba(99,102,241,0.04)}
        .task-row:hover .act{opacity:1!important}
        .ibtn{background:none;border:none;cursor:pointer;border-radius:5px;padding:3px 5px;display:flex;align-items:center;line-height:1}
        .ibtn:hover{background:rgba(0,0,0,0.07)}
        .mcol{border-left:1px solid #e2e8f0}
        select:focus,input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.13)}
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom:22,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:4 }}>
            <div style={{ width:5,height:34,borderRadius:3,background:"linear-gradient(180deg,#6366f1,#ef4444)" }} />
            <div>
              <h1 style={{ margin:0,fontSize:19,fontWeight:700,color:"#0f172a",letterSpacing:"-0.4px" }}>QED</h1>
              <p style={{ margin:0,fontSize:12,color:"#64748b",marginTop:1 }}>Azure DevOps Backlog · 6 Phases · 7 Months · <strong style={{color:"#334155"}}>{tasks.length} Tasks</strong></p>
            </div>
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginTop:8,paddingLeft:15 }}>
            {PHASE_META.map(p => (
              <span key={p.id} style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 9px",borderRadius:20,background:p.bg,border:`1px solid ${p.border}`,fontSize:10 }}>
                <span style={{ width:6,height:6,borderRadius:"50%",background:p.color,display:"inline-block" }} />
                <strong style={{ color:p.color }}>{p.id}</strong>
                <span style={{ color:"#475569" }}>{p.shortLabel}</span>
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => setModal({ mode:"add" })}
          style={{ display:"flex",alignItems:"center",gap:6,padding:"10px 18px",borderRadius:9,border:"none",background:"#6366f1",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 12px rgba(99,102,241,0.35)",whiteSpace:"nowrap",flexShrink:0 }}>
          <span style={{ fontSize:18,lineHeight:1,marginTop:-1 }}>+</span> Add Task
        </button>
      </div>

      {/* ── Chart ── */}
      <div style={{ background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>

        {/* Column headers */}
        <div style={{ display:"grid",gridTemplateColumns:"360px 1fr",borderBottom:"2px solid #e2e8f0" }}>
          <div style={{ padding:"9px 14px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",background:"#f8fafc" }}>Phase / Epic / Task</div>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${TOTAL_MONTHS},1fr)`,background:"#f8fafc" }}>
            {MONTH_LABELS.map((m,i) => <div key={i} className="mcol" style={{ padding:"9px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em" }}>{m}</div>)}
          </div>
        </div>

        {grouped.map(phase => (
          <div key={phase.id}>
            {/* Phase row */}
            <div className="ph-row" style={{ display:"grid",gridTemplateColumns:"360px 1fr",borderBottom:`1px solid ${phase.border}`,background:phase.bg }}>
              <div style={{ padding:"9px 14px",display:"flex",alignItems:"center",gap:6 }}>
                <button onClick={() => setPhaseOpen(s => ({ ...s,[phase.id]:!isPOpen(phase.id) }))}
                  style={{ background:"none",border:"none",cursor:"pointer",padding:0,color:"#94a3b8",fontSize:12,width:14,flexShrink:0 }}>
                  {isPOpen(phase.id)?"▾":"▸"}
                </button>
                <div style={{ width:9,height:9,borderRadius:"50%",background:phase.color,flexShrink:0 }} />
                <span style={{ fontSize:12,fontWeight:700,color:phase.color }}>{phase.id}</span>
                <span style={{ fontSize:12,fontWeight:600,color:"#334155" }}>{phase.shortLabel}</span>
                <span style={{ fontSize:9,color:"#94a3b8",background:"rgba(0,0,0,0.06)",borderRadius:10,padding:"1px 7px",marginLeft:2 }}>
                  {phase.epics.reduce((a,e)=>a+e.tasks.length,0)}
                </span>
                <button onClick={() => setModal({ mode:"add", defPhase:phase.id })}
                  style={{ marginLeft:"auto",background:"none",border:`1px solid ${phase.color}`,borderRadius:5,cursor:"pointer",color:phase.color,fontSize:10,fontWeight:700,padding:"2px 7px",fontFamily:"inherit",opacity:0.75,transition:"opacity 0.1s" }}>
                  + Add
                </button>
              </div>
              <div style={{ position:"relative",display:"grid",gridTemplateColumns:`repeat(${TOTAL_MONTHS},1fr)`,padding:"8px 4px" }}>
                {MONTH_LABELS.map((_,i) => <div key={i} className="mcol" style={{ height:"100%" }} />)}
                <div style={{ position:"absolute",inset:"8px 4px",pointerEvents:"none" }}>
                  <div style={{ position:"absolute",top:0,bottom:0,borderRadius:6,background:phase.color,opacity:0.1,...getBar(phase.months) }} />
                  <div style={{ position:"absolute",top:0,bottom:0,borderRadius:6,border:`2px solid ${phase.color}`,opacity:0.4,...getBar(phase.months) }} />
                </div>
              </div>
            </div>

            {isPOpen(phase.id) && phase.epics.map((epic, ei) => {
              const ek = `${phase.id}-${ei}`;
              return (
                <div key={ek}>
                  {/* Epic row */}
                  <div className="ph-row" style={{ display:"grid",gridTemplateColumns:"360px 1fr",borderBottom:"1px solid #f1f5f9",background:"#fafbfc" }}>
                    <div style={{ padding:"7px 14px 7px 30px",display:"flex",alignItems:"center",gap:5 }}>
                      <button onClick={() => setEpicOpen(s => ({ ...s,[ek]:!isEOpen(ek) }))}
                        style={{ background:"none",border:"none",cursor:"pointer",padding:0,color:"#94a3b8",fontSize:11,width:12,flexShrink:0 }}>
                        {isEOpen(ek)?"▾":"▸"}
                      </button>
                      <span style={{ fontSize:11,fontWeight:600,color:"#334155" }}>{epic.name}</span>
                      <span style={{ fontSize:9,color:"#94a3b8",background:"rgba(0,0,0,0.05)",borderRadius:10,padding:"1px 6px",marginLeft:2 }}>{epic.tasks.length}</span>
                    </div>
                    <div style={{ position:"relative",display:"grid",gridTemplateColumns:`repeat(${TOTAL_MONTHS},1fr)`,padding:"7px 4px" }}>
                      {MONTH_LABELS.map((_,i) => <div key={i} className="mcol" style={{ height:"100%" }} />)}
                      <div style={{ position:"absolute",inset:"7px 4px",pointerEvents:"none" }}>
                        <div style={{ position:"absolute",top:0,bottom:0,borderRadius:4,background:phase.color,opacity:0.07,...getBar(phase.months) }} />
                      </div>
                    </div>
                  </div>

                  {isEOpen(ek) && epic.tasks.map(t => (
                    <div key={t.id} className="task-row"
                      style={{ display:"grid",gridTemplateColumns:"360px 1fr",borderBottom:"1px solid #f8fafc" }}
                      onMouseEnter={() => setHoverId(t.id)} onMouseLeave={() => { setHoverId(null); setTooltip(null); }}>
                      <div style={{ padding:"6px 10px 6px 46px",display:"flex",alignItems:"flex-start",gap:6 }}>
                        <div style={{ width:5,height:5,borderRadius:"50%",background:phase.color,flexShrink:0,marginTop:5,opacity:0.5 }} />
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ fontSize:11,color:"#1e293b",lineHeight:1.45 }}>{t.task}</div>
                          <div style={{ fontSize:10,color:"#94a3b8",marginTop:1,fontWeight:500 }}>{t.owner}</div>
                        </div>
                        {/* Action icons — visible on row hover */}
                        <div className="act" style={{ display:"flex",gap:2,flexShrink:0,opacity:hoverId===t.id?1:0,transition:"opacity 0.15s",marginTop:1 }}>
                          <button className="ibtn" title="Edit task" onClick={() => setModal({ mode:"edit", task:t })}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                              <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className="ibtn" title="Delete task" onClick={() => setModal({ mode:"delete", task:t })}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                              <path d="M3 4h10M6 4V3h4v1M5 4l.5 9h5l.5-9" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div style={{ position:"relative",display:"grid",gridTemplateColumns:`repeat(${TOTAL_MONTHS},1fr)`,padding:"6px 4px" }}
                        onMouseMove={e => setTooltip({ x:e.clientX+14,y:e.clientY-10,task:t.task,owner:t.owner,timeline:t.timeline })}
                        onMouseLeave={() => setTooltip(null)}>
                        {MONTH_LABELS.map((_,i) => <div key={i} className="mcol" style={{ height:"100%" }} />)}
                        <div style={{ position:"absolute",inset:"6px 4px",pointerEvents:"none" }}>
                          <div style={{ position:"absolute",top:"50%",transform:"translateY(-50%)",height:10,borderRadius:5,background:phase.color,opacity:hoverId===t.id?0.42:0.22,transition:"opacity 0.15s",...getBar(phase.months) }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}

        {/* Milestones footer */}
        <div style={{ padding:"10px 14px",background:"#f8fafc",borderTop:"2px solid #e2e8f0",display:"grid",gridTemplateColumns:"360px 1fr" }}>
          <div style={{ fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",display:"flex",alignItems:"center" }}>Milestones</div>
          <div style={{ display:"grid",gridTemplateColumns:`repeat(${TOTAL_MONTHS},1fr)` }}>
            {PHASE_META.map(p => p.months.map(m => (
              <div key={`${p.id}-m${m}`} style={{ gridColumn:m,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <div style={{ width:11,height:11,borderRadius:2,background:p.color,transform:"rotate(45deg)",boxShadow:`0 0 0 2px #f8fafc,0 0 0 3px ${p.color}` }} />
                <span style={{ fontSize:8,fontWeight:800,color:p.color,textTransform:"uppercase",whiteSpace:"nowrap" }}>{p.id}</span>
              </div>
            )))}
          </div>
        </div>
      </div>

      <div style={{ marginTop:12,fontSize:11,color:"#94a3b8",textAlign:"center" }}>
        Click phase/epic headers to collapse · Hover task rows to reveal <strong>edit ✏️</strong> and <strong>delete 🗑</strong> actions
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position:"fixed",zIndex:3000,top:tooltip.y,left:tooltip.x,background:"#1e293b",color:"#f1f5f9",borderRadius:9,padding:"10px 14px",fontSize:12,maxWidth:290,boxShadow:"0 8px 28px rgba(0,0,0,0.28)",pointerEvents:"none" }}>
          <div style={{ fontWeight:700,marginBottom:4,lineHeight:1.4 }}>{tooltip.task}</div>
          <div style={{ color:"#94a3b8",fontSize:11 }}>👤 {tooltip.owner}</div>
          <div style={{ color:"#94a3b8",fontSize:11,marginTop:2 }}>📅 {tooltip.timeline}</div>
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (modal.mode==="add"||modal.mode==="edit") && (
        <Modal title={modal.mode==="add"?"Add New Task":"Edit Task"} onClose={() => setModal(null)}>
          <TaskForm
            initial={modal.mode==="edit" ? modal.task : (modal.defPhase ? { phaseId:modal.defPhase, epic:"", task:"", owner:"", timeline: TIMELINE_OPTIONS[PHASE_META.findIndex(p=>p.id===modal.defPhase)] || "Month 1" } : null)}
            onSave={saveTask}
            onClose={() => setModal(null)}
            allEpicMeta={allEpicMeta}
          />
        </Modal>
      )}

      {/* Delete confirm modal */}
      {modal && modal.mode==="delete" && (
        <Modal title="Delete Task" onClose={() => setModal(null)}>
          <p style={{ fontSize:13,color:"#334155",lineHeight:1.65,margin:0 }}>
            Are you sure you want to delete:<br />
            <strong style={{ color:"#0f172a" }}>"{modal.task.task}"</strong>
          </p>
          <p style={{ fontSize:12,color:"#94a3b8",marginTop:6,marginBottom:0 }}>This action cannot be undone.</p>
          <div style={{ display:"flex",gap:8,justifyContent:"flex-end",marginTop:20 }}>
            <button onClick={() => setModal(null)} style={{ padding:"9px 18px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f8fafc",fontSize:13,cursor:"pointer",color:"#475569",fontFamily:"inherit",fontWeight:500 }}>Cancel</button>
            <button onClick={deleteTask} style={{ padding:"9px 22px",borderRadius:8,border:"none",background:"#ef4444",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 2px 10px rgba(239,68,68,0.35)" }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}