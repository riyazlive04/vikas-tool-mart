/**
 * VTM CRE Daily Workbook — ORIGINAL localStorage PROTOTYPE.
 *
 * This file is the CONTENT + VISUAL reference only (PRD §11). It is NOT wired
 * into the app and is not imported anywhere. The production rebuild lives under
 * /app and /components and replaces localStorage with server-side persistence,
 * WooCommerce auto-population, the KPI engine, i18n, and roles.
 *
 * Deltas the production build intentionally applies vs. this prototype:
 *   - KPIs: adds "On-site Reviews Received" (auto); several counts become
 *     auto-populated from WooCommerce / worklist tap-actions (overridable).
 *   - Tasks: drops "Invoice List Received" (the order list is now automatic).
 *   - Social: adds "Pinterest" channel; channels are admin-configurable rows.
 *   - Persistence: PostgreSQL via Prisma, multi-user, audited — no localStorage.
 *
 * Keep this for design parity: colors, tab layout, progress bars, history,
 * achievement/issues/commitment sections, and the save affordance.
 */
import { useState, useEffect } from "react";

const GOLD = "#F5C400";
const DARK = "#1A1A1A";
const CARD = "#242424";
const MUTED = "#888";
const GREEN = "#4CAF50";
const RED = "#F44336";

const KPI_LIST = [
  { id: "rating", label: "Average Customer Rating (1–10)", target: "9.0", type: "number" },
  { id: "review_requested", label: "Google Review Requested", type: "count" },
  { id: "unboxing_requested", label: "Unboxing Video Requested", type: "count" },
  { id: "testimonial_requested", label: "Testimonial Requested", type: "count" },
  { id: "customers_contacted", label: "Customers Contacted", type: "count" },
  { id: "reviews_received", label: "Google Reviews Received", type: "count" },
  { id: "feedback_forms", label: "Feedback Forms Completed", type: "count" },
  { id: "complaints_logged", label: "Customer Complaints Logged", type: "count" },
  { id: "complaints_assigned", label: "Customer Complaints Assigned", type: "count" },
  { id: "repeat_customers", label: "Repeat Customers", type: "count" },
  { id: "new_customers", label: "New Customers", type: "count" },
  { id: "packing_story", label: "Packing Area Story Posted", type: "check" },
  { id: "crowd_story", label: "Crowd / Customer Visit Story Posted", type: "check" },
  { id: "tip_posted", label: "Tip of the Day Posted", type: "check" },
  { id: "hand_tool_post", label: "Hand Tool Post Uploaded", type: "check" },
  { id: "clearance_post", label: "Stock Clearance Post Uploaded", type: "check" },
  { id: "restock_post", label: "New Product Restock Post Uploaded", type: "check" },
];

const TASKS = [
  "Invoice List Received",
  "WhatsApp Review Request Sent",
  "Customer Follow-up Calls Done",
  "Google Review Link Sent",
  "Feedback Form Completed",
  "Unboxing Video Request Sent",
  "Testimonial Request Sent",
  "Customer Complaints Updated",
  "Repeat Customers Tracked",
  "New Customers Tracked",
  "Google Review Screenshot Shared",
  "Customer Testimonial Shared",
  "Daily KPI Sheet Updated",
  "Packing Area Story Posted",
  "Crowd / Customer Visit Story Posted",
  "Tip of the Day Posted",
  "Hand Tool Post Uploaded",
  "Stock Clearance Post Uploaded",
  "New Product Restock Post Uploaded",
  "Google Review Link Clicks Tracked",
  "Customer Satisfaction Follow-up",
  "Complaint Resolution Follow-up",
  "Media Files / Screenshots Saved",
  "Social Media Growth Stats Updated",
  "End-of-Day Report Submitted",
  "Tomorrow Plan Prepared",
];

const PLATFORMS = ["Instagram", "YouTube", "Facebook", "WhatsApp Community"];

const today = () => new Date().toISOString().slice(0, 10);
const dayName = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "long" });

function getStorageKey(date) {
  return `vtm_cre_${date}`;
}

function loadEntry(date) {
  try {
    const raw = localStorage.getItem(getStorageKey(date));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveEntry(date, data) {
  try {
    localStorage.setItem(getStorageKey(date), JSON.stringify(data));
  } catch {}
}

function blankEntry(date, creName = "") {
  const kpis = {};
  KPI_LIST.forEach(k => { kpis[k.id] = k.type === "check" ? false : ""; });
  const tasks = {};
  TASKS.forEach(t => { tasks[t] = false; });
  const social = {};
  PLATFORMS.forEach(p => { social[p] = { yesterday: "", today: "" }; });
  return {
    date,
    creName,
    achievement: "",
    kpis,
    social,
    issues: "",
    commitment: "",
    tasks,
    notes: "",
  };
}

const TABS = ["KPIs", "Tasks", "Social", "Notes"];

export default function CREWorkbook() {
  const [activeDate, setActiveDate] = useState(today());
  const [entry, setEntry] = useState(() => loadEntry(today()) || blankEntry(today()));
  const [activeTab, setActiveTab] = useState("KPIs");
  const [saved, setSaved] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyDates, setHistoryDates] = useState([]);

  useEffect(() => {
    const e = loadEntry(activeDate) || blankEntry(activeDate, entry.creName);
    setEntry(e);
    setSaved(false);
  }, [activeDate]);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("vtm_cre_"));
    const dates = keys.map(k => k.replace("vtm_cre_", "")).sort().reverse();
    setHistoryDates(dates);
  }, [saved]);

  const update = (path, value) => {
    setEntry(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    saveEntry(activeDate, entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tasksDone = Object.values(entry.tasks).filter(Boolean).length;
  const tasksTotal = TASKS.length;
  const kpisFilled = KPI_LIST.filter(k => {
    const v = entry.kpis[k.id];
    return k.type === "check" ? v === true : v !== "";
  }).length;

  return (
    <div style={{ background: DARK, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#fff", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: GOLD, padding: "14px 16px 10px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: DARK, letterSpacing: 2, textTransform: "uppercase" }}>Vikas Tool Mart</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: DARK, lineHeight: 1.2 }}>CRE Daily Workbook</div>
          </div>
          <button onClick={() => setHistoryOpen(!historyOpen)}
            style={{ background: DARK, color: GOLD, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            📋 History
          </button>
        </div>

        {/* Date & CRE */}
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)}
            style={{ flex: 1, background: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 600, color: DARK }} />
          <input placeholder="CRE Name" value={entry.creName}
            onChange={e => update("creName", e.target.value)}
            style={{ flex: 1, background: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 13, fontWeight: 600, color: DARK }} />
        </div>
        <div style={{ fontSize: 11, color: DARK, marginTop: 4, fontWeight: 600 }}>{dayName(activeDate)}</div>
      </div>

      {/* History Panel */}
      {historyOpen && (
        <div style={{ background: CARD, borderBottom: `2px solid ${GOLD}`, padding: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, marginBottom: 8 }}>PAST ENTRIES</div>
          {historyDates.length === 0 && <div style={{ color: MUTED, fontSize: 12 }}>No saved entries yet.</div>}
          {historyDates.map(d => (
            <button key={d} onClick={() => { setActiveDate(d); setHistoryOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", background: d === activeDate ? GOLD : "#333", color: d === activeDate ? DARK : "#fff", border: "none", borderRadius: 6, padding: "7px 12px", marginBottom: 4, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              {d} — {dayName(d)}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ padding: "10px 16px 4px" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>TASKS {tasksDone}/{tasksTotal}</div>
            <div style={{ background: "#333", borderRadius: 4, height: 6 }}>
              <div style={{ background: GOLD, width: `${(tasksDone / tasksTotal) * 100}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>KPIs {kpisFilled}/{KPI_LIST.length}</div>
            <div style={{ background: "#333", borderRadius: 4, height: 6 }}>
              <div style={{ background: GREEN, width: `${(kpisFilled / KPI_LIST.length) * 100}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Achievement */}
      <div style={{ padding: "10px 16px 0" }}>
        <Section title="Yesterday's Achievement">
          <textarea rows={2} placeholder="What did you achieve yesterday?" value={entry.achievement}
            onChange={e => update("achievement", e.target.value)}
            style={textareaStyle} />
        </Section>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", padding: "10px 16px 0", gap: 6 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            style={{ flex: 1, background: activeTab === t ? GOLD : "#333", color: activeTab === t ? DARK : "#aaa", border: "none", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: "12px 16px" }}>
        {activeTab === "KPIs" && (
          <div>
            {KPI_LIST.map(k => (
              <div key={k.id} style={{ background: CARD, borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1, fontSize: 13, color: "#ddd", paddingRight: 10 }}>{k.label}
                  {k.target && <span style={{ fontSize: 10, color: GOLD, marginLeft: 6 }}>Target: {k.target}</span>}
                </div>
                {k.type === "check" ? (
                  <button onClick={() => update(`kpis.${k.id}`, !entry.kpis[k.id])}
                    style={{ background: entry.kpis[k.id] ? GREEN : "#444", border: "none", borderRadius: 6, width: 36, height: 36, fontSize: 18, cursor: "pointer" }}>
                    {entry.kpis[k.id] ? "✓" : "○"}
                  </button>
                ) : (
                  <input type="number" min="0" value={entry.kpis[k.id]}
                    onChange={e => update(`kpis.${k.id}`, e.target.value)}
                    style={{ width: 60, background: "#333", border: `1px solid ${entry.kpis[k.id] ? GOLD : "#555"}`, borderRadius: 8, padding: "6px 8px", color: "#fff", fontSize: 14, fontWeight: 700, textAlign: "center" }} />
                )}
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <Section title="Issues / Bottlenecks">
                  <textarea rows={3} placeholder="Any blockers today?" value={entry.issues}
                    onChange={e => update("issues", e.target.value)} style={textareaStyle} />
                </Section>
              </div>
              <div style={{ flex: 1 }}>
                <Section title="Today's Commitment">
                  <textarea rows={3} placeholder="Your goal for today..." value={entry.commitment}
                    onChange={e => update("commitment", e.target.value)} style={textareaStyle} />
                </Section>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Tasks" && (
          <div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>Tap to mark done</div>
            {TASKS.map((t, i) => (
              <button key={t} onClick={() => update(`tasks.${t}`, !entry.tasks[t])}
                style={{ display: "flex", alignItems: "center", width: "100%", background: entry.tasks[t] ? "#1e3a1e" : CARD, border: `1px solid ${entry.tasks[t] ? GREEN : "transparent"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 26, height: 26, borderRadius: 6, background: entry.tasks[t] ? GREEN : "#444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 12, flexShrink: 0 }}>
                  {entry.tasks[t] ? "✓" : <span style={{ color: "#666", fontSize: 11 }}>{i + 1}</span>}
                </span>
                <span style={{ fontSize: 13, color: entry.tasks[t] ? "#aaa" : "#ddd", textDecoration: entry.tasks[t] ? "line-through" : "none" }}>{t}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "Social" && (
          <div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>Enter follower/member counts</div>
            {PLATFORMS.map(p => {
              const diff = (Number(entry.social[p].today) || 0) - (Number(entry.social[p].yesterday) || 0);
              return (
                <div key={p} style={{ background: CARD, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GOLD, marginBottom: 8 }}>{p}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>YESTERDAY</div>
                      <input type="number" value={entry.social[p].yesterday}
                        onChange={e => update(`social.${p}.yesterday`, e.target.value)}
                        style={numInputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>TODAY</div>
                      <input type="number" value={entry.social[p].today}
                        onChange={e => update(`social.${p}.today`, e.target.value)}
                        style={numInputStyle} />
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>CHANGE</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: diff > 0 ? GREEN : diff < 0 ? RED : MUTED }}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? "—" : diff}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "Notes" && (
          <div>
            <Section title="Notes / Remarks">
              <textarea rows={8} placeholder="Any additional notes for today..." value={entry.notes}
                onChange={e => update("notes", e.target.value)} style={{ ...textareaStyle, minHeight: 160 }} />
            </Section>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ padding: "0 16px 32px" }}>
        <button onClick={handleSave}
          style={{ width: "100%", background: saved ? GREEN : GOLD, color: DARK, border: "none", borderRadius: 12, padding: "14px", fontSize: 16, fontWeight: 800, cursor: "pointer", transition: "background 0.3s", letterSpacing: 1 }}>
          {saved ? "✓ SAVED" : "SAVE TODAY'S ENTRY"}
        </button>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: MUTED }}>Data is saved on this device</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 1.5, marginBottom: 6, textTransform: "uppercase" }}>{title}</div>
      {children}
    </div>
  );
}

const textareaStyle = {
  width: "100%",
  background: CARD,
  border: "1px solid #333",
  borderRadius: 10,
  padding: "10px 12px",
  color: "#fff",
  fontSize: 13,
  resize: "none",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const numInputStyle = {
  width: "100%",
  background: "#333",
  border: "1px solid #555",
  borderRadius: 8,
  padding: "8px",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  textAlign: "center",
  boxSizing: "border-box",
};
