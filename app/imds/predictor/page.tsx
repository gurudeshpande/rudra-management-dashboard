"use client";

import React, { useState } from "react";
import {
    Activity, Cpu, TrendingUp, TrendingDown, AlertTriangle,
    ChevronRight, Zap, FlaskConical, BarChart2,
    CheckCircle2, Download, RefreshCw, Info
} from "lucide-react";
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Cell, LineChart, Line, Legend
} from "recharts";

// ── Mock Data ─────────────────────────────────────────────────────────────────

const riskRadar = [
    { subject: "SVHC Density", A: 78, fullMark: 100 },
    { subject: "Supplier Risk", A: 45, fullMark: 100 },
    { subject: "Substance Age", A: 62, fullMark: 100 },
    { subject: "Threshold Gap", A: 31, fullMark: 100 },
    { subject: "Doc Quality", A: 88, fullMark: 100 },
    { subject: "Hist. Violations", A: 55, fullMark: 100 },
];

const historicalRejections = [
    { quarter: "Q1 2023", submissions: 112, rejections: 22, rate: 19.6 },
    { quarter: "Q2 2023", submissions: 134, rejections: 18, rate: 13.4 },
    { quarter: "Q3 2023", submissions: 158, rejections: 15, rate: 9.5 },
    { quarter: "Q4 2023", submissions: 180, rejections: 12, rate: 6.7 },
    { quarter: "Q1 2024", submissions: 197, rejections: 9, rate: 4.6 },
    { quarter: "Q2 2024", submissions: 215, rejections: 14, rate: 6.5 },
];

const bomRiskList = [
    { id: "BOM-2024-0889", supplier: "Magna Intl.", parts: 511, risk: 89, factors: ["High SVHC count", "DEHP detected", "Low supplier compliance history"], prediction: "IMDS Rejection Very Likely" },
    { id: "BOM-2024-0886", supplier: "Valeo SA", parts: 228, risk: 78, factors: ["Cd compound detected", "Supplier rating: C", "Missing material declarations"], prediction: "IMDS Rejection Likely" },
    { id: "BOM-2024-0883", supplier: "Continental AG", parts: 312, risk: 54, factors: ["PBB near threshold", "Incomplete substance declaration"], prediction: "Requires Review" },
    { id: "BOM-2024-0881", supplier: "ZF Group", parts: 144, risk: 34, factors: ["Single SVHC flagged", "Exemption applicable"], prediction: "Low Risk" },
    { id: "BOM-2024-0879", supplier: "Bosch GmbH", parts: 420, risk: 12, factors: ["All substances within limits"], prediction: "Very Low Risk" },
];

const featureImportance = [
    { feature: "SVHC Count", importance: 0.28, color: "#6366f1" },
    { feature: "Cd Detected", importance: 0.22, color: "#ef4444" },
    { feature: "Supplier Rating", importance: 0.18, color: "#f59e0b" },
    { feature: "Threshold Gap", importance: 0.14, color: "#00d4ff" },
    { feature: "REACH Entries", importance: 0.11, color: "#10b981" },
    { feature: "Doc Completeness", importance: 0.07, color: "#8b5cf6" },
];

const alternativeSuggestions = [
    {
        original: "Cadmium (Cd) – BRK-10291",
        alternatives: [
            { name: "Zinc Oxide (ZnO)", compliance: 98, available: true, note: "Direct drop-in for thermal stabilizer applications" },
            { name: "Tin-Silver alloy (SnAg)", compliance: 96, available: true, note: "RoHS compliant, widely used in EU automotive" },
            { name: "Bismuth (Bi) compounds", compliance: 94, available: false, note: "Lead-free solder alternative, limited EU stock" },
        ]
    },
    {
        original: "DEHP – INJ-4421A",
        alternatives: [
            { name: "DOTP (Dioctyl Terephthalate)", compliance: 99, available: true, note: "REACH compliant plasticizer, same performance" },
            { name: "DINP (Diisononyl Phthalate)", compliance: 97, available: true, note: "Industry standard replacement for DEHP in automotive" },
        ]
    },
];

// ── Components ────────────────────────────────────────────────────────────────

function RiskGauge({ score }: { score: number }) {
    const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#10b981";
    const label = score >= 70 ? "HIGH RISK" : score >= 40 ? "MEDIUM RISK" : "LOW RISK";
    const radius = 60;
    const circumference = Math.PI * radius;
    const dash = (score / 100) * circumference;

    return (
        <div style={{ textAlign: "center" }}>
            <svg width="160" height="90" viewBox="0 0 160 90">
                <path d="M 20 80 A 60 60 0 0 1 140 80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
                <path
                    d="M 20 80 A 60 60 0 0 1 140 80"
                    fill="none"
                    stroke={color}
                    strokeWidth="14"
                    strokeDasharray={`${dash} ${circumference}`}
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                />
                <text x="80" y="72" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="Space Grotesk">{score}%</text>
                <text x="80" y="86" textAnchor="middle" fill={color} fontSize="9" fontWeight="700" letterSpacing="1">{label}</text>
            </svg>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PredictorPage() {
    const [selectedBOM, setSelectedBOM] = useState(bomRiskList[0]);

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Predictive Compliance Intelligence</h1>
                    <p className="imds-page-subtitle">XGBoost risk scoring · Historical pattern detection · Compliant material alternatives</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="imds-btn imds-btn--outline imds-btn--sm"><RefreshCw size={14} /> Retrain Model</button>
                    <button className="imds-btn imds-btn--primary imds-btn--sm"><Download size={14} /> Export Risk Report</button>
                </div>
            </div>

            {/* XGBoost Model Info Banner */}
            <div className="imds-ai-box" style={{ marginBottom: 24 }}>
                <span className="imds-ai-box-label">🧠 XGBoost Model Status</span>
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    <div>
                        <p className="imds-ai-text">
                            Model trained on <strong style={{ color: "var(--imds-text-primary)" }}>12,400 historical IMDS submissions</strong> (2019-2024).
                            Current accuracy: <strong style={{ color: "var(--imds-success)" }}>91.4% AUC-ROC</strong> on held-out test set.
                            Features: SVHC substance count, threshold proximity, supplier compliance history, material group distribution.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--imds-accent)", fontFamily: "Space Grotesk" }}>91.4%</div>
                            <div style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>AUC-ROC</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--imds-success)", fontFamily: "Space Grotesk" }}>12.4K</div>
                            <div style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>Training BOMs</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--imds-info)", fontFamily: "Space Grotesk" }}>6</div>
                            <div style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>Features</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Row: BOM Risk List + Detail */}
            <div className="imds-grid-main-side" style={{ marginBottom: 24 }}>
                {/* BOM Risk Ranking */}
                <div className="imds-card">
                    <p className="imds-card-title" style={{ marginBottom: 16 }}><Activity size={14} /> BOM Risk Ranking (Current Queue)</p>
                    {bomRiskList.map((bom, i) => {
                        const color = bom.risk >= 70 ? "#ef4444" : bom.risk >= 40 ? "#f59e0b" : "#10b981";
                        const isSelected = bom.id === selectedBOM.id;
                        return (
                            <div
                                key={i}
                                onClick={() => setSelectedBOM(bom)}
                                style={{
                                    padding: "14px 16px",
                                    marginBottom: 8,
                                    borderRadius: "var(--imds-radius)",
                                    border: `1px solid ${isSelected ? color + "55" : "var(--imds-border)"}`,
                                    background: isSelected ? `${color}08` : "var(--imds-bg-elevated)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                    <div>
                                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--imds-accent)" }}>{bom.id}</span>
                                        <p style={{ fontWeight: 600, fontSize: 13, marginTop: 2 }}>{bom.supplier}</p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "Space Grotesk", lineHeight: 1 }}>{bom.risk}%</div>
                                        <div style={{ fontSize: 10, color: "var(--imds-text-muted)" }}>{bom.parts} parts</div>
                                    </div>
                                </div>
                                <div className="imds-progress" style={{ height: 5 }}>
                                    <div className="imds-progress-bar" style={{ width: `${bom.risk}%`, background: color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected BOM Detail */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Gauge */}
                    <div className="imds-card imds-card--glow" style={{ textAlign: "center" }}>
                        <p className="imds-card-title" style={{ textAlign: "left", marginBottom: 4 }}>
                            <Cpu size={14} /> Risk Score – {selectedBOM.id}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--imds-text-muted)", textAlign: "left", marginBottom: 12 }}>{selectedBOM.supplier}</p>
                        <RiskGauge score={selectedBOM.risk} />
                        <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>{selectedBOM.prediction}</p>
                    </div>

                    {/* Risk Factors */}
                    <div className="imds-card">
                        <p className="imds-card-title"><AlertTriangle size={14} /> Detected Risk Factors</p>
                        {selectedBOM.factors.map((f, i) => (
                            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < selectedBOM.factors.length - 1 ? "1px solid var(--imds-border)" : "none" }}>
                                <AlertTriangle size={13} color="var(--imds-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                                <span style={{ fontSize: 13, color: "var(--imds-text-secondary)" }}>{f}</span>
                            </div>
                        ))}
                    </div>

                    {/* Radar */}
                    <div className="imds-card">
                        <p className="imds-card-title"><BarChart2 size={14} /> Risk Dimensions (Radar)</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <RadarChart data={riskRadar} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                <PolarGrid stroke="rgba(56,139,253,0.12)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--imds-text-muted)", fontSize: 10 }} />
                                <Radar name="Risk" dataKey="A" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.15} strokeWidth={2} />
                                <Tooltip contentStyle={{ background: "var(--imds-bg-elevated)", border: "1px solid var(--imds-border)", borderRadius: 8, fontSize: 12 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Feature Importance */}
            <div className="imds-grid-2" style={{ marginBottom: 24 }}>
                <div className="imds-card">
                    <p className="imds-card-title" style={{ marginBottom: 16 }}><Zap size={14} /> XGBoost Feature Importance</p>
                    {featureImportance.map((f, i) => (
                        <div key={i} style={{ marginBottom: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 13, color: "var(--imds-text-secondary)" }}>{f.feature}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: f.color }}>{(f.importance * 100).toFixed(0)}%</span>
                            </div>
                            <div className="imds-progress">
                                <div className="imds-progress-bar" style={{ width: `${f.importance * 100}%`, background: f.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Historical Rejection Rate */}
                <div className="imds-card">
                    <p className="imds-card-title" style={{ marginBottom: 16 }}><TrendingDown size={14} /> Historical IMDS Rejection Rate</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={historicalRejections} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,139,253,0.08)" />
                            <XAxis dataKey="quarter" tick={{ fill: "var(--imds-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "var(--imds-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip
                                contentStyle={{ background: "var(--imds-bg-elevated)", border: "1px solid var(--imds-border)", borderRadius: 8, fontSize: 12 }}
                                cursor={{ stroke: "rgba(0,212,255,0.2)" }}
                            />
                            <Line type="monotone" dataKey="rate" name="Rejection Rate %" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="imds-ai-box" style={{ marginTop: 14 }}>
                        <span className="imds-ai-box-label">📈 AI Pattern Insight</span>
                        <p className="imds-ai-text" style={{ fontSize: 12 }}>
                            Rejection rate declined from 19.6% to 4.6% (Q1 2023 – Q1 2024), correlating with SVHC pre-screening implementation. Q2 2024 uptick (+1.9%) traced to new REACH SVHC additions in August 2024 ECHA list.
                        </p>
                    </div>
                </div>
            </div>

            {/* Alternative Material Suggestions */}
            <div className="imds-card">
                <p className="imds-card-title" style={{ marginBottom: 16 }}><FlaskConical size={14} /> AI-Generated Compliant Alternatives</p>
                {alternativeSuggestions.map((group, gi) => (
                    <div key={gi} style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <AlertTriangle size={14} color="var(--imds-danger)" />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--imds-text-primary)" }}>Restricted: {group.original}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            {group.alternatives.map((alt, ai) => (
                                <div
                                    key={ai}
                                    style={{
                                        flex: "1 1 260px",
                                        background: "var(--imds-bg-elevated)",
                                        border: "1px solid var(--imds-border)",
                                        borderRadius: "var(--imds-radius)",
                                        padding: 16,
                                        position: "relative",
                                        opacity: alt.available ? 1 : 0.6,
                                    }}
                                >
                                    {!alt.available && (
                                        <span className="imds-badge imds-badge--warning" style={{ position: "absolute", top: 10, right: 10 }}>Limited Stock</span>
                                    )}
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <CheckCircle2 size={16} color="var(--imds-success)" />
                                        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{alt.name}</span>
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                            <span style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>Compliance Score</span>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--imds-success)" }}>{alt.compliance}%</span>
                                        </div>
                                        <div className="imds-progress">
                                            <div className="imds-progress-bar" style={{ width: `${alt.compliance}%`, background: "var(--imds-success)" }} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{alt.note}</p>
                                    <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>
                                        Request Sample <ChevronRight size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
