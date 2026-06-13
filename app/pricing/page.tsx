"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  { id: "interior", label: "Interior Design", desc: "Lead pipeline, projects, designs & materials tracking", icon: "🎨" },
  { id: "realestate", label: "Real Estate", desc: "Property leads, site visits & deal management", icon: "🏠" },
  { id: "hospital", label: "Hospital", desc: "Patients, doctors, appointments & billing", icon: "🏥" },
  { id: "b2b", label: "B2B Business", desc: "Clients, deals, invoices & pipeline management", icon: "💼" },
  { id: "clinic", label: "Clinics", desc: "Patients, prescriptions, doctors & billing", icon: "🩺" },
];

const PLANS = [
  { id: "starter", label: "Starter", price: 999, users: "3 users", color: "#16a34a", bgLight: "#f0fdf4", borderLight: "#86efac", features: ["500 leads/month", "Basic reports", "Email support"] },
  { id: "pro", label: "Professional", price: 2499, users: "10 users", color: "#7c3aed", bgLight: "#f5f3ff", borderLight: "#c4b5fd", features: ["Unlimited leads", "Pipeline + HRMS", "Priority support"] },
  { id: "enterprise", label: "Enterprise", price: 5999, users: "Unlimited", color: "#B8860B", bgLight: "#fffbeb", borderLight: "#fcd34d", features: ["Custom branding", "API access", "Dedicated manager"] },
];

const BUNDLE_DISCOUNT = 0.1;
function fmt(n: number) { return "₹" + n.toLocaleString("en-IN"); }

export default function GKCRMPricing() {
  const router = useRouter();
  const [state, setState] = useState<Record<string, { active: boolean; plan: string | null }>>(() => {
    const s: Record<string, { active: boolean; plan: string | null }> = {};
    INDUSTRIES.forEach((i) => (s[i.id] = { active: false, plan: null }));
    return s;
  });
  const [summary, setSummary] = useState<{
    rows: { plan: typeof PLANS[0]; industries: { id: string; label: string }[]; base: number; discount: number; final: number }[];
    total: number;
    savings: number;
  }>({ rows: [], total: 0, savings: 0 });

  function toggleInd(id: string) {
    setState((prev) => {
      const next = { ...prev, [id]: { ...prev[id], active: !prev[id].active } };
      if (!next[id].active) next[id] = { active: false, plan: null };
      return next;
    });
  }

  function selectPlan(indId: string, planId: string) {
    setState((prev) => ({ ...prev, [indId]: { active: true, plan: planId } }));
  }

  useEffect(() => {
    const planGroups: Record<string, { id: string; label: string }[]> = {};
    PLANS.forEach((p) => (planGroups[p.id] = []));
    INDUSTRIES.forEach((ind) => {
      const s = state[ind.id];
      if (s.active && s.plan) planGroups[s.plan].push({ id: ind.id, label: ind.label });
    });
    const rows: typeof summary.rows = [];
    let total = 0, totalSavings = 0;
    PLANS.forEach((p) => {
      const group = planGroups[p.id];
      if (!group.length) return;
      const basePrice = p.price * group.length;
      let discount = 0;
      if (group.length > 1) { discount = Math.round(basePrice * BUNDLE_DISCOUNT); totalSavings += discount; }
      const final = basePrice - discount;
      total += final;
      rows.push({ plan: p, industries: group, base: basePrice, discount, final });
    });
    setSummary({ rows, total, savings: totalSavings });
  }, [state]);

  const activeCount = INDUSTRIES.filter((i) => state[i.id].active && state[i.id].plan).length;

  function handleStartTrial() {
  const selected = INDUSTRIES.filter(i => state[i.id].active).map(i => i.id);
  if (selected.length > 0) {
    window.location.href = `/signup?industries=${selected.join(',')}`
  } else {
    window.location.href = '/signup'
  }
}

  return (
    <section id="pricing" style={{ background: "#F5F0E8", padding: "96px 0", fontFamily: "inherit" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#B8860B", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 16 }}>Pricing</p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, color: "#1C1712", margin: "0 0 16px", lineHeight: 1.1 }}>
            Build your own{" "}
            <span style={{ fontStyle: "italic", color: "#B8860B" }}>perfect plan</span>
          </h2>
          <p style={{ color: "#7A6E60", fontSize: 16, margin: 0 }}>
            Pick exactly which industries you need. Pay only for what you use.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>

          {/* Left: Industry list */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "#9A8F82", marginBottom: 20, fontWeight: 600, textTransform: "uppercase" }}>
              Select industries & plans
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {INDUSTRIES.map((ind) => {
                const s = state[ind.id];
                return (
                  <div key={ind.id} style={{ background: s.active ? "#fff" : "#EDE8DC", border: "1px solid #E2D9C8", borderRadius: 16, padding: "18px 22px", transition: "all 0.2s", boxShadow: s.active ? "0 2px 12px rgba(28,23,18,0.06)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: s.active ? 18 : 0 }}>
                      <span style={{ fontSize: 26 }}>{ind.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: s.active ? "#1C1712" : "#9A8F82" }}>{ind.label}</div>
                        <div style={{ fontSize: 12, color: "#9A8F82", marginTop: 2 }}>{ind.desc}</div>
                      </div>
                      {/* Toggle */}
                      <div onClick={() => toggleInd(ind.id)} style={{ width: 44, height: 24, borderRadius: 24, background: s.active ? "#B8860B" : "#D5CFC3", border: `1px solid ${s.active ? "#B8860B" : "#C5BFB3"}`, position: "relative", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: s.active ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
                      </div>
                    </div>
                    {s.active && (
                      <div style={{ display: "flex", gap: 8 }}>
                        {PLANS.map((p) => {
                          const sel = s.plan === p.id;
                          return (
                            <button key={p.id} onClick={() => selectPlan(ind.id, p.id)}
                              style={{ flex: 1, padding: "12px 8px", borderRadius: 12, border: sel ? `2px solid ${p.color}` : "1.5px solid #E2D9C8", background: sel ? p.bgLight : "#F5F0E8", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: sel ? p.color : "#9A8F82", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{p.label}</div>
                              <div style={{ fontSize: 17, fontWeight: 700, color: sel ? "#1C1712" : "#7A6E60" }}>{fmt(p.price)}</div>
                              <div style={{ fontSize: 11, color: sel ? "#7A6E60" : "#9A8F82", marginTop: 2 }}>{p.users}</div>
                              {sel && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {p.features.map((f) => (
                                    <div key={f} style={{ fontSize: 10, color: p.color, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                      <span style={{ fontWeight: 700 }}>✓</span> {f}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Summary */}
          <div style={{ position: "sticky", top: 24 }}>
            <div style={{ background: "#1C1712", borderRadius: 20, padding: 28, boxShadow: "0 8px 40px rgba(28,23,18,0.18)" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 20, fontWeight: 600, textTransform: "uppercase" }}>
                Your plan summary
              </div>

              {summary.rows.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>☝️</div>
                  <div style={{ fontSize: 14 }}>Select industries to see pricing</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {summary.rows.map((row) => (
                    <div key={row.plan.id} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, background: row.plan.bgLight, color: row.plan.color, padding: "2px 10px", borderRadius: 20, fontWeight: 600 }}>{row.plan.label}</span>
                          {row.discount > 0 && <span style={{ fontSize: 10, background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 20 }}>Bundle -10%</span>}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{fmt(row.final)}</div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {row.industries.map((i) => <span key={i.id} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: 6 }}>{i.label}</span>)}
                      </div>
                      {row.discount > 0 && <div style={{ fontSize: 11, color: "#4ade80", marginTop: 8 }}>You save {fmt(row.discount)} on this bundle</div>}
                    </div>
                  ))}
                </div>
              )}

              {summary.savings > 0 && (
                <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#4ade80" }}>Total savings</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#4ade80" }}>{fmt(summary.savings)}/mo</span>
                </div>
              )}

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Total / month</span>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{fmt(summary.total)}</span>
                </div>
                {summary.total > 0 && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 4, textAlign: "right" }}>≈ {fmt(Math.round(summary.total / 30))}/day</div>}
              </div>

              {/* Start Free Trial → /signup */}
              <button
                onClick={handleStartTrial}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none",
                  background: "#B8860B",
                  color: "#fff",
                  fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 12, transition: "all 0.2s",
                }}
              >
                {activeCount > 0 ? `Start Free Trial →` : "Start Free Trial →"}
              </button>

              <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
                14-day free trial · No credit card required
              </div>
            </div>

            {/* Plan legend */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {PLANS.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#EDE8DC", border: "1px solid #DDD6C8", borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#7A6E60", flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1712" }}>{fmt(p.price)}/mo</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "#9A8F82", textAlign: "center", padding: "8px 0" }}>
                Same plan, 2+ industries → 10% bundle discount
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}