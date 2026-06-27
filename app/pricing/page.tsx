"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ── Data ────────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    id: "interior",
    label: "Interior Design",
    desc: "Lead pipeline, projects, designs & materials tracking",
    icon: "🎨",
    locked: false,
  },
  {
    id: "realestate",
    label: "Real Estate",
    desc: "Property leads, site visits & deal management",
    icon: "🏠",
    locked: true,
  },
  {
    id: "hospital",
    label: "Hospital",
    desc: "Patients, doctors, appointments & billing",
    icon: "🏥",
    locked: true,
  },
  {
    id: "b2b",
    label: "B2B Business",
    desc: "Clients, deals, invoices & pipeline management",
    icon: "💼",
    locked: true,
  },
  {
    id: "clinic",
    label: "Clinics",
    desc: "Patients, prescriptions, doctors & billing",
    icon: "🩺",
    locked: true,
  },
];

const PLANS = [
  {
    id: "pro",
    label: "Professional",
    price: 10000,
    users: "10 users",
    color: "#B8860B",
    bgLight: "#fffbeb",
    borderLight: "#fcd34d",
    features: ["Unlimited leads", "Pipeline + HRMS", "Priority support"],
  },
];

const BUNDLE_DISCOUNT = 0.1;
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Component ───────────────────────────────────────────────────
export default function GKCRMPricing() {
  const router = useRouter();
  const [state, setState] = useState<
    Record<string, { active: boolean; plan: string | null }>
  >(() => {
    const s: Record<string, { active: boolean; plan: string | null }> = {};
    INDUSTRIES.forEach((i) => (s[i.id] = { active: false, plan: null }));
    return s;
  });

  const [summary, setSummary] = useState<{
    rows: {
      plan: (typeof PLANS)[0];
      industries: { id: string; label: string }[];
      base: number;
      discount: number;
      final: number;
    }[];
    total: number;
    savings: number;
  }>({ rows: [], total: 0, savings: 0 });

  const [showSummary, setShowSummary] = useState(false);

  function toggleInd(id: string) {
    const industry = INDUSTRIES.find((i) => i.id === id);
    if (industry?.locked) return; // locked industries — no toggle
    setState((prev) => {
      const isActivating = !prev[id].active;
      const next = { ...prev, [id]: { active: isActivating, plan: isActivating ? "pro" : null } };
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
      if (s.active && s.plan)
        planGroups[s.plan].push({ id: ind.id, label: ind.label });
    });
    const rows: typeof summary.rows = [];
    let total = 0,
      totalSavings = 0;
    PLANS.forEach((p) => {
      const group = planGroups[p.id];
      if (!group.length) return;
      const basePrice = p.price * group.length;
      let discount = 0;
      if (group.length > 1) {
        discount = Math.round(basePrice * BUNDLE_DISCOUNT);
        totalSavings += discount;
      }
      const final = basePrice - discount;
      total += final;
      rows.push({ plan: p, industries: group, base: basePrice, discount, final });
    });
    setSummary({ rows, total, savings: totalSavings });
  }, [state]);

  // ── Start Trial handler — direct signup redirect ─────────────
  function handleStartTrial() {
    router.push("/signup?industry=interior&plan=pro");
  }

  // ── Summary Panel (shared) ───────────────────────────────────
  const SummaryPanel = () => (
    <div
      style={{
        background: "#1C1712",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 8px 40px rgba(28,23,18,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.3)",
          marginBottom: 18,
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        Your plan summary
      </div>

      {summary.rows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 10 }}>☝️</div>
          <div style={{ fontSize: 13 }}>Select industries to see pricing</div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 16,
          }}
        >
          {summary.rows.map((row) => (
            <div
              key={row.plan.id}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 6,
                }}
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 11,
                      background: row.plan.bgLight,
                      color: row.plan.color,
                      padding: "2px 10px",
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    {row.plan.label}
                  </span>
                  {row.discount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        background: "#052e16",
                        color: "#4ade80",
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}
                    >
                      Bundle -10%
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  {fmt(row.final)}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {row.industries.map((i) => (
                  <span
                    key={i.id}
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      background: "rgba(255,255,255,0.06)",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    {i.label}
                  </span>
                ))}
              </div>
              {row.discount > 0 && (
                <div
                  style={{ fontSize: 11, color: "#4ade80", marginTop: 6 }}
                >
                  Save {fmt(row.discount)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {summary.savings > 0 && (
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 10,
            padding: "8px 14px",
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#4ade80" }}>Total savings</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#4ade80" }}>
            {fmt(summary.savings)}/mo
          </span>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Total / month
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(summary.total)}
          </span>
        </div>
        {summary.total > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.25)",
              marginTop: 3,
              textAlign: "right",
            }}
          >
            ≈ {fmt(Math.round(summary.total / 30))}/day
          </div>
        )}
      </div>

      <button
        onClick={handleStartTrial}
        style={{
          width: "100%",
          padding: 14,
          borderRadius: 12,
          border: "none",
          background: "#B8860B",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 10,
          transition: "all 0.2s",
        }}
      >
        Start Free Trial →
      </button>

      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "rgba(255,255,255,0.2)",
        }}
      >
        14-day free trial
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
          .pricing-sticky { display: none !important; }
          .pricing-inner { padding: 0 16px !important; }
          .pricing-header { margin-bottom: 40px !important; }
          .pricing-section { padding: 64px 0 100px !important; }
          .plan-buttons { gap: 6px !important; }
          .plan-btn { padding: 10px 4px !important; }
          .plan-btn-label { font-size: 9px !important; }
          .plan-btn-price { font-size: 14px !important; }
        }
        .mobile-summary-btn { display: none; }
        @media (max-width: 768px) {
          .mobile-summary-btn { display: flex !important; }
        }
        .locked-industry {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .coming-soon-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          color: #9A8F82;
          background: #E2D9C8;
          border: 1px solid #CFC8B8;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
      `}</style>

      <section
        className="pricing-section"
        id="pricing"
        style={{
          background: "#F5F0E8",
          padding: "96px 0 96px",
          fontFamily: "inherit",
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />

        <div
          className="pricing-inner"
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}
        >
          {/* Header */}
          <div
            className="pricing-header"
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#B8860B",
                letterSpacing: "4px",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Pricing
            </p>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(28px, 4vw, 52px)",
                fontWeight: 400,
                color: "#1C1712",
                margin: "0 0 14px",
                lineHeight: 1.1,
              }}
            >
              Build your own{" "}
              <span style={{ fontStyle: "italic", color: "#B8860B" }}>
                perfect plan
              </span>
            </h2>
            <p style={{ color: "#7A6E60", fontSize: 15, margin: 0 }}>
              Pick exactly which industries you need. Pay only for what you use.
            </p>
          </div>

          <div
            className="pricing-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 360px",
              gap: 28,
              alignItems: "start",
            }}
          >
            {/* Left: Industry list */}
            <div>
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "#9A8F82",
                  marginBottom: 16,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Select industries & plans
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {INDUSTRIES.map((ind) => {
                  const s = state[ind.id];
                  const isLocked = ind.locked;

                  return (
                    <div
                      key={ind.id}
                      className={isLocked ? "locked-industry" : ""}
                      style={{
                        background: s.active ? "#fff" : "#EDE8DC",
                        border: `1px solid ${isLocked ? "#DDD6C8" : "#E2D9C8"}`,
                        borderRadius: 16,
                        padding: "16px 18px",
                        transition: "all 0.2s",
                        boxShadow:
                          s.active && !isLocked
                            ? "0 2px 12px rgba(28,23,18,0.06)"
                            : "none",
                        position: "relative",
                      }}
                    >
                      {/* Industry header row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: s.active && !isLocked ? 14 : 0,
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{ind.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: isLocked
                                ? "#9A8F82"
                                : s.active
                                ? "#1C1712"
                                : "#9A8F82",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {ind.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#9A8F82",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ind.desc}
                          </div>
                        </div>

                        {/* Toggle OR Coming Soon badge */}
                        {isLocked ? (
                          <span className="coming-soon-badge">
                            🔒 Coming Soon
                          </span>
                        ) : (
                          <div
                            onClick={() => toggleInd(ind.id)}
                            style={{
                              width: 42,
                              height: 22,
                              borderRadius: 22,
                              background: s.active ? "#B8860B" : "#D5CFC3",
                              border: `1px solid ${
                                s.active ? "#B8860B" : "#C5BFB3"
                              }`,
                              position: "relative",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#fff",
                                position: "absolute",
                                top: 2,
                                left: s.active ? 21 : 2,
                                transition: "left 0.2s",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Plan buttons — only for unlocked + active */}
                      {s.active && !isLocked && (
                        <div className="plan-buttons" style={{ display: "flex", gap: 8 }}>
                          {PLANS.map((p) => {
                            const sel = s.plan === p.id;
                            return (
                              <button
                                key={p.id}
                                className="plan-btn"
                                onClick={() => selectPlan(ind.id, p.id)}
                                style={{
                                  flex: 1,
                                  padding: "11px 6px",
                                  borderRadius: 12,
                                  border: sel
                                    ? `2px solid ${p.color}`
                                    : "1.5px solid #E2D9C8",
                                  background: sel ? p.bgLight : "#F5F0E8",
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  className="plan-btn-label"
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: sel ? p.color : "#9A8F82",
                                    marginBottom: 3,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  {p.label}
                                </div>
                                <div
                                  className="plan-btn-price"
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: sel ? "#1C1712" : "#7A6E60",
                                  }}
                                >
                                  {fmt(p.price)}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: sel ? "#7A6E60" : "#9A8F82",
                                    marginTop: 2,
                                  }}
                                >
                                  {p.users}
                                </div>
                                {sel && (
                                  <div
                                    style={{
                                      marginTop: 8,
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 3,
                                    }}
                                  >
                                    {p.features.map((f) => (
                                      <div
                                        key={f}
                                        style={{
                                          fontSize: 9,
                                          color: p.color,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          gap: 3,
                                        }}
                                      >
                                        <span style={{ fontWeight: 700 }}>✓</span>{" "}
                                        {f}
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

              {/* Mobile: Quick CTA below list */}
              <div
                className="mobile-summary-btn"
                style={{
                  display: "none",
                  marginTop: 20,
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {summary.total > 0 && (
                  <div
                    style={{
                      background: "#1C1712",
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          marginBottom: 2,
                        }}
                      >
                        Total / month
                      </div>
                      <div
                        style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}
                      >
                        {fmt(summary.total)}
                      </div>
                      {summary.savings > 0 && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#4ade80",
                            marginTop: 2,
                          }}
                        >
                          Saving {fmt(summary.savings)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowSummary(true)}
                      style={{
                        fontSize: 12,
                        color: "#B8860B",
                        background: "rgba(184,134,11,0.12)",
                        border: "1px solid rgba(184,134,11,0.2)",
                        padding: "8px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      View Plan →
                    </button>
                  </div>
                )}

                <button
                  onClick={handleStartTrial}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 14,
                    border: "none",
                    background: "#B8860B",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Start Free Trial →
                </button>
                <div style={{ textAlign: "center", fontSize: 11, color: "#9A8F82" }}>
                  14-day free trial
                </div>
              </div>


            </div>

            {/* Right: Summary sticky (desktop) */}
            <div className="pricing-sticky" style={{ position: "sticky", top: 24 }}>
              <SummaryPanel />

            </div>
          </div>
        </div>
      </section>

      {/* Mobile: Bottom sheet summary modal */}
      {showSummary && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
            }}
            onClick={() => setShowSummary(false)}
          />
          <div
            style={{
              position: "relative",
              background: "#1C1712",
              borderRadius: "20px 20px 0 0",
              padding: "20px 16px 32px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.7)",
                  margin: 0,
                }}
              >
                Plan Summary
              </p>
              <button
                onClick={() => setShowSummary(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✕
              </button>
            </div>
            <SummaryPanel />
          </div>
        </div>
      )}
    </>
  );
}