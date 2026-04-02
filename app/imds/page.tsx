"use client";

import React, { useState } from "react";
import {
    Shield, AlertTriangle, CheckCircle2, XCircle,
    TrendingUp, TrendingDown, Upload, Activity,
    FlaskConical, Clock, Zap, ChevronRight,
    BarChart2, ArrowUpRight, ArrowDownRight,
    FileText, RefreshCw, Eye
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie,
    Cell, BarChart, Bar, Legend
} from "recharts";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const complianceTrend = [
    { month: "Aug", passed: 88, failed: 12 },
    { month: "Sep", passed: 91, failed: 9 },
    { month: "Oct", passed: 86, failed: 14 },
    { month: "Nov", passed: 94, failed: 6 },
    { month: "Dec", passed: 90, failed: 10 },
    { month: "Jan", passed: 96, failed: 4 },
    { month: "Feb", passed: 93, failed: 7 },
];

const regulationBreakdown = [
    { name: "REACH", value: 42, color: "#6366f1" },
    { name: "RoHS", value: 31, color: "#00d4ff" },
    { name: "ELV", value: 18, color: "#f59e0b" },
    { name: "Other", value: 9, color: "#10b981" },
];

const substanceRisks = [
    { substance: "Lead (Pb)", cas: "7439-92-1", regulation: "RoHS/ELV", threshold: "0.1%", detected: "0.08%", status: "pass" },
    { substance: "Cadmium (Cd)", cas: "7440-43-9", regulation: "RoHS", threshold: "0.01%", detected: "0.012%", status: "fail" },
    { substance: "DEHP", cas: "117-81-7", regulation: "REACH", threshold: "0.1%", detected: "0.09%", status: "warn" },
    { substance: "Chromium VI", cas: "18540-29-9", regulation: "ELV", threshold: "0.1%", detected: "0.00%", status: "pass" },
    { substance: "Mercury (Hg)", cas: "7439-97-6", regulation: "RoHS", threshold: "0.1%", detected: "0.05%", status: "pass" },
];

const recentBOMs = [
    { id: "BOM-2024-0891", supplier: "Bosch GmbH", parts: 347, status: "Validated", risk: 12, date: "2h ago" },
    { id: "BOM-2024-0890", supplier: "Continental AG", parts: 182, status: "Processing", risk: null, date: "4h ago" },
    { id: "BOM-2024-0889", supplier: "Magna Intl.", parts: 511, status: "Flagged", risk: 68, date: "8h ago" },
    { id: "BOM-2024-0888", supplier: "Aptiv PLC", parts: 94, status: "Validated", risk: 5, date: "1d ago" },
    { id: "BOM-2024-0887", supplier: "Valeo SA", parts: 228, status: "Rejected", risk: 89, date: "1d ago" },
];

const aiInsights = [
    {
        icon: "🔬",
        title: "SVHC Detection Spike",
        desc: "3 BOMs from Tier-2 suppliers contain DEHP above 0.08% — approaching REACH threshold. Proactive review recommended.",
        severity: "warning",
    },
    {
        icon: "✨",
        title: "Compliance Rate Improved",
        desc: "February shows 93% first-pass compliance — 3% improvement over January. REACH alignment driving improvement.",
        severity: "success",
    },
    {
        icon: "⚠️",
        title: "Cadmium Risk Alert",
        desc: "BOM-2024-0889 contains Cd at 0.012% exceeding 0.01% RoHS limit. Immediate supplier escalation required.",
        severity: "danger",
    },
];

const riskBySupplier = [
    { supplier: "Bosch", risk: 12 },
    { supplier: "Continental", risk: 34 },
    { supplier: "Magna", risk: 68 },
    { supplier: "Aptiv", risk: 5 },
    { supplier: "Valeo", risk: 89 },
    { supplier: "ZF Group", risk: 22 },
];

// ── Sub Components ────────────────────────────────────────────────────────────

function ComplianceScoreRing({ score }: { score: number }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const dash = (score / 100) * circumference;
    const color = score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

    return (
        <div className="imds-score-ring" style={{ width: 130, height: 130 }}>
            <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                <circle
                    cx="65" cy="65" r={radius} fill="none"
                    stroke={color} strokeWidth="10"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color})` }}
                    transform="rotate(-90 65 65)"
                />
            </svg>
            <div className="imds-score-value">
                <div className="imds-score-number" style={{ color }}>{score}%</div>
                <div className="imds-score-unit">Compliant</div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        Validated: "success", Processing: "info", Flagged: "warning", Rejected: "danger"
    };
    return <span className={`imds-badge imds-badge--${map[status] || "neutral"}`}>{status}</span>;
}

function RiskBar({ value }: { value: number | null }) {
    if (value === null) return <span style={{ color: "var(--imds-text-muted)", fontSize: 12 }}>Scanning…</span>;
    const color = value < 30 ? "#10b981" : value < 70 ? "#f59e0b" : "#ef4444";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="imds-progress" style={{ width: 80 }}>
                <div className="imds-progress-bar" style={{ width: `${value}%`, background: color }} />
            </div>
            <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}%</span>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: "var(--imds-bg-elevated)", border: "1px solid var(--imds-border)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
            <p style={{ color: "var(--imds-text-secondary)", marginBottom: 6 }}>{label}</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}%</p>
            ))}
        </div>
    );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function IMDSDashboardPage() {
    const [activeTab, setActiveTab] = useState<"week" | "month" | "quarter">("month");

    return (
        <div>
            {/* Page Header */}
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Compliance Command Center</h1>
                    <p className="imds-page-subtitle">Feb 23, 2026 · Real-time IMDS regulatory intelligence across your supply chain</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="imds-btn imds-btn--outline imds-btn--sm">
                        <RefreshCw size={14} /> Sync Data
                    </button>
                    <button className="imds-btn imds-btn--primary imds-btn--sm">
                        <Upload size={14} /> Import BOM
                    </button>
                </div>
            </div>

            {/* AI Insights Banner */}
            <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
                {aiInsights.map((insight, i) => (
                    <div key={i} className={`imds-alert imds-alert--${insight.severity}`} style={{ flex: 1, marginBottom: 0 }}>
                        <span style={{ fontSize: 18 }}>{insight.icon}</span>
                        <div>
                            <p style={{ fontWeight: 700, marginBottom: 2 }}>{insight.title}</p>
                            <p style={{ fontSize: 12, opacity: 0.85 }}>{insight.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* KPI Stats */}
            <div className="imds-stat-grid">
                {[
                    {
                        icon: <CheckCircle2 size={22} />, label: "BOMs Validated", value: "1,247",
                        change: "+8.3%", up: true, stat: "--imds-success", bg: "var(--imds-success-bg)", color: "var(--imds-success)"
                    },
                    {
                        icon: <XCircle size={22} />, label: "Non-Compliant", value: "89",
                        change: "-12.5%", up: false, stat: "--imds-danger", bg: "var(--imds-danger-bg)", color: "var(--imds-danger)"
                    },
                    {
                        icon: <AlertTriangle size={22} />, label: "Flagged SVHCs", value: "34",
                        change: "+2", up: false, stat: "--imds-warning", bg: "var(--imds-warning-bg)", color: "var(--imds-warning)"
                    },
                    {
                        icon: <Shield size={22} />, label: "REACH Alerts", value: "12",
                        change: "-4", up: true, stat: "--imds-info", bg: "var(--imds-info-bg)", color: "var(--imds-info)"
                    },
                    {
                        icon: <Activity size={22} />, label: "Avg Risk Score", value: "23.4",
                        change: "-3.1 pts", up: true, stat: "--imds-accent", bg: "var(--imds-accent-muted)", color: "var(--imds-accent)"
                    },
                ].map((stat, i) => (
                    <div key={i} className="imds-stat-card" style={{ "--stat-color": stat.color, "--stat-bg": stat.bg } as React.CSSProperties}>
                        <div className="imds-stat-icon">{stat.icon}</div>
                        <div>
                            <div className="imds-stat-value">{stat.value}</div>
                            <div className="imds-stat-label">{stat.label}</div>
                            <div className={`imds-stat-change imds-stat-change--${stat.up ? "up" : "down"}`}>
                                {stat.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                                {stat.change} vs last month
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="imds-grid-main-side" style={{ marginBottom: 24 }}>
                {/* Compliance Trend Chart */}
                <div className="imds-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <p className="imds-card-title"><BarChart2 size={14} /> Compliance Trend</p>
                        <div className="imds-tabs" style={{ marginBottom: 0 }}>
                            {(["week", "month", "quarter"] as const).map(t => (
                                <button key={t} className={`imds-tab-btn ${activeTab === t ? "imds-tab-btn--active" : ""}`} onClick={() => setActiveTab(t)}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={complianceTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,139,253,0.08)" />
                            <XAxis dataKey="month" tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="passed" name="Passed" stroke="#10b981" strokeWidth={2.5} fill="url(#colorPass)" dot={{ fill: "#10b981", r: 3, strokeWidth: 0 }} />
                            <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorFail)" dot={{ fill: "#ef4444", r: 3, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Right Panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Score Ring */}
                    <div className="imds-card imds-card--glow" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <ComplianceScoreRing score={93} />
                        <div>
                            <p className="imds-card-title">Overall Score</p>
                            <p style={{ fontSize: 13, color: "var(--imds-text-secondary)", lineHeight: 1.6 }}>
                                First-pass compliance rate across all active BOMs this month.
                            </p>
                            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span className="imds-badge imds-badge--success">REACH ✓</span>
                                <span className="imds-badge imds-badge--warning">RoHS ⚠</span>
                                <span className="imds-badge imds-badge--success">ELV ✓</span>
                            </div>
                        </div>
                    </div>

                    {/* Regulation Breakdown */}
                    <div className="imds-card" style={{ flex: 1 }}>
                        <p className="imds-card-title"><Shield size={14} /> Violation by Regulation</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <PieChart width={120} height={120}>
                                <Pie data={regulationBreakdown} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                                    {regulationBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                            <div style={{ flex: 1 }}>
                                {regulationBreakdown.map(r => (
                                    <div key={r.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div style={{ width: 9, height: 9, borderRadius: "50%", background: r.color }} />
                                            <span style={{ fontSize: 13, color: "var(--imds-text-secondary)" }}>{r.name}</span>
                                        </div>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--imds-text-primary)" }}>{r.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="imds-grid-2" style={{ marginBottom: 24 }}>
                {/* Recent BOM Imports */}
                <div className="imds-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <p className="imds-card-title"><FileText size={14} /> Recent BOM Imports</p>
                        <a href="/imds/import" className="imds-btn imds-btn--outline imds-btn--sm">
                            View All <ChevronRight size={13} />
                        </a>
                    </div>
                    <div className="imds-table-wrap">
                        <table className="imds-table">
                            <thead>
                                <tr>
                                    <th>BOM ID</th>
                                    <th>Supplier</th>
                                    <th>Parts</th>
                                    <th>Status</th>
                                    <th>Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBOMs.map(bom => (
                                    <tr key={bom.id} style={{ cursor: "pointer" }}>
                                        <td>
                                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--imds-accent)" }}>{bom.id}</span>
                                        </td>
                                        <td style={{ fontWeight: 500 }}>{bom.supplier}</td>
                                        <td>{bom.parts.toLocaleString()}</td>
                                        <td><StatusBadge status={bom.status} /></td>
                                        <td><RiskBar value={bom.risk} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Substance Alerts */}
                <div className="imds-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <p className="imds-card-title"><FlaskConical size={14} /> Substance Alert Monitor</p>
                        <a href="/imds/substances" className="imds-btn imds-btn--outline imds-btn--sm">
                            Details <ChevronRight size={13} />
                        </a>
                    </div>
                    {substanceRisks.map((s, i) => (
                        <div key={i} className="imds-risk-item">
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--imds-text-primary)" }}>{s.substance}</span>
                                    <span className="imds-reg-tag">{s.regulation}</span>
                                </div>
                                <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--imds-text-muted)" }}>
                                    <span>CAS: {s.cas}</span>
                                    <span>Limit: <strong style={{ color: "var(--imds-text-secondary)" }}>{s.threshold}</strong></span>
                                    <span>Found: <strong style={{ color: "var(--imds-text-secondary)" }}>{s.detected}</strong></span>
                                </div>
                            </div>
                            <span className={`imds-badge imds-badge--${s.status === "pass" ? "success" : s.status === "fail" ? "danger" : "warning"}`}>
                                {s.status === "pass" ? "✓ Pass" : s.status === "fail" ? "✗ Fail" : "⚠ Near Limit"}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Supplier Risk Bar Chart */}
            <div className="imds-card">
                <p className="imds-card-title" style={{ marginBottom: 16 }}><Zap size={14} /> Predicted Compliance Risk by Supplier (XGBoost Model)</p>
                <div className="imds-ai-box" style={{ marginBottom: 14 }}>
                    <span className="imds-ai-box-label">🤖 AI Prediction Insight</span>
                    <p className="imds-ai-text">
                        XGBoost risk model (trained on 12,400 historical IMDS submissions) predicts Valeo SA at 89% rejection likelihood based on material composition patterns.
                        Recommend immediate supplier engagement and material substitution analysis for polybrominated compounds.
                    </p>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={riskBySupplier} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,139,253,0.08)" vertical={false} />
                        <XAxis dataKey="supplier" tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                        <Tooltip
                            contentStyle={{ background: "var(--imds-bg-elevated)", border: "1px solid var(--imds-border)", borderRadius: 8, fontSize: 12 }}
                            labelStyle={{ color: "var(--imds-text-secondary)" }}
                            cursor={{ fill: "rgba(0,212,255,0.05)" }}
                        />
                        <Bar dataKey="risk" name="Risk Score" radius={[4, 4, 0, 0]}>
                            {riskBySupplier.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.risk >= 70 ? "#ef4444" : entry.risk >= 40 ? "#f59e0b" : "#10b981"} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
