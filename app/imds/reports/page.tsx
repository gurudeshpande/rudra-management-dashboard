"use client";

import React, { useState } from "react";
import {
    BarChart3, Download, FileText, TrendingUp,
    Calendar, Shield, AlertTriangle, CheckCircle2,
    Zap, Filter
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    PieChart, Pie, Cell, Legend
} from "recharts";

const monthlyData = [
    { month: "Aug", submissions: 82, passed: 71, failed: 11, svhc: 8 },
    { month: "Sep", submissions: 94, passed: 85, failed: 9, svhc: 12 },
    { month: "Oct", submissions: 112, passed: 94, failed: 18, svhc: 15 },
    { month: "Nov", submissions: 103, passed: 97, failed: 6, svhc: 7 },
    { month: "Dec", submissions: 89, passed: 80, failed: 9, svhc: 9 },
    { month: "Jan", submissions: 127, passed: 121, failed: 6, svhc: 5 },
    { month: "Feb", submissions: 98, passed: 91, failed: 7, svhc: 8 },
];

const supplierPerf = [
    { supplier: "Bosch GmbH", submissions: 187, compRate: 98, avgRisk: 12, violations: 2 },
    { supplier: "Continental AG", submissions: 143, compRate: 84, avgRisk: 34, violations: 18 },
    { supplier: "Magna Intl.", submissions: 112, compRate: 72, avgRisk: 68, violations: 31 },
    { supplier: "Aptiv PLC", submissions: 98, compRate: 96, avgRisk: 8, violations: 4 },
    { supplier: "Valeo SA", submissions: 77, compRate: 61, avgRisk: 89, violations: 41 },
    { supplier: "ZF Group", submissions: 134, compRate: 91, avgRisk: 22, violations: 12 },
];

const substanceHits = [
    { substance: "Lead (Pb)", hits: 34, color: "#6366f1" },
    { substance: "DEHP", hits: 28, color: "#f59e0b" },
    { substance: "Cadmium", hits: 12, color: "#ef4444" },
    { substance: "Cr VI", hits: 7, color: "#00d4ff" },
    { substance: "PBB", hits: 5, color: "#10b981" },
    { substance: "Mercury", hits: 3, color: "#8b5cf6" },
];

const regulationSplit = [
    { name: "REACH", value: 44, color: "#6366f1" },
    { name: "RoHS", value: 33, color: "#00d4ff" },
    { name: "ELV", value: 23, color: "#f59e0b" },
];

const CustomBar = (props: any) => {
    const { x, y, width, height, value } = props;
    const colors = value >= 90 ? "#10b981" : value >= 75 ? "#f59e0b" : "#ef4444";
    return <rect x={x} y={y} width={width} height={height} fill={colors} rx={4} ry={4} />;
};

export default function ReportsPage() {
    const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Compliance Reports & Analytics</h1>
                    <p className="imds-page-subtitle">Executive dashboards · Supplier scorecards · Regulatory trend analysis</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <div className="imds-tabs" style={{ marginBottom: 0 }}>
                        {(["month", "quarter", "year"] as const).map(p => (
                            <button key={p} className={`imds-tab-btn ${period === p ? "imds-tab-btn--active" : ""}`} onClick={() => setPeriod(p)}>
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="imds-btn imds-btn--primary imds-btn--sm"><Download size={14} /> Export PDF</button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="imds-stat-grid" style={{ marginBottom: 24 }}>
                {[
                    { label: "Total Submissions", value: "705", trend: "+18%", up: true, color: "var(--imds-accent)", bg: "var(--imds-accent-muted)" },
                    { label: "Compliance Rate", value: "93.2%", trend: "+3.1%", up: true, color: "var(--imds-success)", bg: "var(--imds-success-bg)" },
                    { label: "SVHC Detections", value: "64", trend: "-8", up: true, color: "var(--imds-warning)", bg: "var(--imds-warning-bg)" },
                    { label: "Avg. Risk Score", value: "23.4", trend: "-4.2", up: true, color: "var(--imds-info)", bg: "var(--imds-info-bg)" },
                ].map((s, i) => (
                    <div key={i} className="imds-stat-card" style={{ "--stat-color": s.color, "--stat-bg": s.bg } as React.CSSProperties}>
                        <div className="imds-stat-icon"><BarChart3 size={20} /></div>
                        <div>
                            <div className="imds-stat-value">{s.value}</div>
                            <div className="imds-stat-label">{s.label}</div>
                            <div className={`imds-stat-change imds-stat-change--${s.up ? "up" : "down"}`}>
                                <TrendingUp size={12} /> {s.trend} vs last period
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Trend + Regulation Split */}
            <div className="imds-grid-main-side" style={{ marginBottom: 24 }}>
                <div className="imds-card">
                    <p className="imds-card-title" style={{ marginBottom: 16 }}><BarChart3 size={14} /> Monthly Submission Breakdown</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,139,253,0.08)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--imds-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "var(--imds-bg-elevated)", border: "1px solid var(--imds-border)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(0,212,255,0.05)" }} />
                            <Legend wrapperStyle={{ fontSize: 12, color: "var(--imds-text-secondary)", paddingTop: 8 }} />
                            <Bar dataKey="passed" name="Passed" fill="#10b981" radius={[3, 3, 0, 0]} stackId="a" />
                            <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Regulation Split Pie */}
                    <div className="imds-card" style={{ flex: 1 }}>
                        <p className="imds-card-title" style={{ marginBottom: 12 }}><Shield size={14} /> Violations by Regulation</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <PieChart width={110} height={110}>
                                <Pie data={regulationSplit} cx={50} cy={50} innerRadius={28} outerRadius={50} dataKey="value" paddingAngle={4}>
                                    {regulationSplit.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                            </PieChart>
                            <div>
                                {regulationSplit.map(r => (
                                    <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                                        <span style={{ fontSize: 13, color: "var(--imds-text-secondary)" }}>{r.name}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--imds-text-primary)", marginLeft: "auto" }}>{r.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SVHC Hits */}
                    <div className="imds-card" style={{ flex: 1 }}>
                        <p className="imds-card-title" style={{ marginBottom: 12 }}><Zap size={14} /> Top SVHC Detections</p>
                        {substanceHits.slice(0, 4).map(s => (
                            <div key={s.substance} style={{ marginBottom: 10 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{s.substance}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.hits}</span>
                                </div>
                                <div className="imds-progress">
                                    <div className="imds-progress-bar" style={{ width: `${(s.hits / 34) * 100}%`, background: s.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Supplier Scorecard */}
            <div className="imds-card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <p className="imds-card-title"><Shield size={14} /> Supplier Compliance Scorecards</p>
                    <button className="imds-btn imds-btn--outline imds-btn--sm"><Download size={13} /> Export Scorecards</button>
                </div>
                <div className="imds-table-wrap">
                    <table className="imds-table">
                        <thead>
                            <tr>
                                <th>Supplier</th>
                                <th>Total Submissions</th>
                                <th>Compliance Rate</th>
                                <th>Avg. Risk Score</th>
                                <th>Violations</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierPerf.map((s, i) => {
                                const grade = s.compRate >= 95 ? "A" : s.compRate >= 85 ? "B" : s.compRate >= 70 ? "C" : "D";
                                const gradeColor = s.compRate >= 95 ? "var(--imds-success)" : s.compRate >= 85 ? "var(--imds-info)" : s.compRate >= 70 ? "var(--imds-warning)" : "var(--imds-danger)";
                                return (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600 }}>{s.supplier}</td>
                                        <td>{s.submissions}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div className="imds-progress" style={{ width: 80 }}>
                                                    <div className="imds-progress-bar" style={{ width: `${s.compRate}%`, background: s.compRate >= 90 ? "#10b981" : s.compRate >= 75 ? "#f59e0b" : "#ef4444" }} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.compRate}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: s.avgRisk >= 70 ? "var(--imds-danger)" : s.avgRisk >= 40 ? "var(--imds-warning)" : "var(--imds-success)" }}>
                                                {s.avgRisk}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`imds-badge imds-badge--${s.violations > 20 ? "danger" : s.violations > 5 ? "warning" : "success"}`}>
                                                {s.violations}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: "50%",
                                                background: `${gradeColor}1a`, border: `2px solid ${gradeColor}44`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 14, fontWeight: 900, color: gradeColor
                                            }}>
                                                {grade}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Exportable Reports */}
            <div className="imds-grid-3">
                {[
                    { icon: <FileText size={22} />, title: "REACH Compliance Report", desc: "Full SVHC inventory with substance counts, thresholds, supplier declarations.", type: "PDF" },
                    { icon: <Shield size={22} />, title: "RoHS Technical File", desc: "Homogeneous material breakdown per product with measurement precision.", type: "Excel" },
                    { icon: <BarChart3 size={22} />, title: "ELV End-of-Life Report", desc: "Vehicle recyclability rate, restricted substance summary, Annex II status.", type: "PDF" },
                    { icon: <AlertTriangle size={22} />, title: "SVHC Notification Report", desc: "Article 33 REACH notifications – substances present > 0.1% in articles.", type: "XML" },
                    { icon: <CheckCircle2 size={22} />, title: "Supplier Audit Package", desc: "Per-supplier compliance scorecard, violation history, corrective actions.", type: "PDF" },
                    { icon: <Zap size={22} />, title: "IMDS Submission Summary", desc: "Submission history, acceptance/rejection logs, IMDS reference numbers.", type: "JSON" },
                ].map((r, i) => (
                    <div key={i} className="imds-card" style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "var(--imds-radius)", background: "var(--imds-accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--imds-accent)", marginBottom: 12 }}>
                            {r.icon}
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{r.title}</p>
                        <p style={{ fontSize: 12, color: "var(--imds-text-secondary)", flex: 1, marginBottom: 14 }}>{r.desc}</p>
                        <div style={{ display: "flex", gap: 8 }}>
                            <span className="imds-badge imds-badge--neutral">{r.type}</span>
                            <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                <Download size={12} /> Generate
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
