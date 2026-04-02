"use client";

import React, { useState } from "react";
import {
    Shield, AlertTriangle, CheckCircle2, XCircle,
    ChevronDown, ChevronUp, FlaskConical, BookOpen,
    Cpu, Filter, Download, Search, Info
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Regulation = "REACH" | "RoHS" | "ELV";
type Status = "pass" | "fail" | "warn" | "exempt";

type CheckResult = {
    id: string;
    substance: string;
    cas: string;
    regulation: Regulation;
    limit: number;
    unit: string;
    detected: number;
    status: Status;
    category: string;
    part: string;
    reasoning: string;
    alternatives?: string[];
};

// ── Mock Data ─────────────────────────────────────────────────────────────────

const RESULTS: CheckResult[] = [
    {
        id: "CHK-001",
        substance: "Cadmium (Cd)",
        cas: "7440-43-9",
        regulation: "RoHS",
        limit: 0.01,
        unit: "%",
        detected: 0.012,
        status: "fail",
        category: "Heavy Metal",
        part: "BRK-10291 – Brake Pad Assembly",
        reasoning: "Cadmium and cadmium compounds are restricted under RoHS Directive 2011/65/EU Annex II. Maximum allowable concentration is 0.01% by weight of homogeneous material. Detected concentration of 0.012% exceeds this threshold. This constitutes a direct regulatory violation requiring immediate corrective action.",
        alternatives: [
            "Zinc oxide (ZnO) – similar thermal properties, 92% compliance rate",
            "Titanium dioxide alloy (TiO₂) – IMDS approved, RoHS exempt",
            "Alkali borate series (IMDS group 8.5.2)"
        ]
    },
    {
        id: "CHK-002",
        substance: "Di(2-ethylhexyl) phthalate (DEHP)",
        cas: "117-81-7",
        regulation: "REACH",
        limit: 0.1,
        unit: "%",
        detected: 0.09,
        status: "warn",
        category: "SVHC – Reprotoxic",
        part: "INJ-4421A – Fuel Injector Body",
        reasoning: "DEHP is included in the REACH SVHC (Substances of Very High Concern) candidate list due to reproductive toxicity (CMR Category 1B). Current concentration of 0.09% is below the 0.1% REACH threshold (SVHC in articles ≥ 0.1% w/w). However, proximity to threshold requires monitoring and proactive supplier declaration under Article 33 of REACH.",
        alternatives: [
            "DINP (Diisononyl phthalate) – REACH compliant alternative, widely used",
            "DOTP (Dioctyl terephthalate) – non-phthalate alternative",
            "Polymeric plasticizers (Palatinol series)"
        ]
    },
    {
        id: "CHK-003",
        substance: "Lead (Pb)",
        cas: "7439-92-1",
        regulation: "RoHS",
        limit: 0.1,
        unit: "%",
        detected: 0.08,
        status: "pass",
        category: "Heavy Metal",
        part: "CON-7712 – Wiring Connector",
        reasoning: "Lead is restricted under RoHS Directive with a maximum concentration of 0.1% by weight in homogeneous material. Detected concentration of 0.08% is within the permissible limit. Additionally, this application may qualify for RoHS Annex III exemption 6(c) – Lead in solders for servers, storage and storage array systems (review required).",
    },
    {
        id: "CHK-004",
        substance: "Hexavalent Chromium (Cr VI)",
        cas: "18540-29-9",
        regulation: "ELV",
        limit: 0.1,
        unit: "%",
        detected: 0.0,
        status: "pass",
        category: "Heavy Metal",
        part: "BRK-10291 – Brake Pad Assembly",
        reasoning: "Hexavalent Chromium is restricted under ELV Directive 2000/53/EC Annex II. No Cr(VI) compounds detected in submitted material declaration. Surface treatment verified as trivalent chromium (Cr III) passivation — which is not restricted. Fully compliant.",
    },
    {
        id: "CHK-005",
        substance: "Polybrominated Biphenyls (PBB)",
        cas: "36355-01-8",
        regulation: "RoHS",
        limit: 0.1,
        unit: "%",
        detected: 0.0,
        status: "pass",
        category: "Flame Retardant",
        part: "CON-7712 – Wiring Connector",
        reasoning: "PBBs are restricted under RoHS Directive 2011/65/EU. No PBB flame retardants detected in the submitted polymer material composition. Supplier declaration confirms use of alternative phosphorus-based flame retardant system. Compliant.",
    },
    {
        id: "CHK-006",
        substance: "Mercury (Hg)",
        cas: "7439-97-6",
        regulation: "RoHS",
        limit: 0.1,
        unit: "%",
        detected: 0.05,
        status: "pass",
        category: "Heavy Metal",
        part: "SEN-3301 – Oxygen Sensor",
        reasoning: "Mercury is restricted under RoHS with 0.1% maximum concentration. Detected level of 0.05% is within limits. This application uses a small sealed mercury switch which may qualify for RoHS exemption 1 (large-scale stationary industrial tools) — however automotive application requires a fresh exemption review under RoHS 3.",
    },
    {
        id: "CHK-007",
        substance: "Octylphenol ethoxylates (OPEO)",
        cas: "9036-19-5",
        regulation: "REACH",
        limit: 0.1,
        unit: "%",
        detected: 0.0,
        status: "exempt",
        category: "Surfactant",
        part: "INJ-4421A – Fuel Injector Body",
        reasoning: "OPEO is an SVHC candidate substance. Not detected in material composition. Supplier has provided ICP-MS test certificate confirming absence. Exempt from restriction reporting requirements under REACH Article 7(2) as concentration is below detection threshold (0.001%).",
    },
];

// ── Components ────────────────────────────────────────────────────────────────

function RegBadge({ reg }: { reg: Regulation }) {
    const colors: Record<Regulation, string> = { REACH: "#6366f1", RoHS: "#00d4ff", ELV: "#f59e0b" };
    return (
        <span style={{
            fontFamily: "monospace", fontSize: 11, fontWeight: 800,
            color: colors[reg], border: `1px solid ${colors[reg]}44`,
            background: `${colors[reg]}14`, padding: "2px 8px", borderRadius: 4
        }}>
            {reg}
        </span>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const map = { pass: ["success", "✓ PASS"], fail: ["danger", "✗ FAIL"], warn: ["warning", "⚠ NEAR LIMIT"], exempt: ["neutral", "◎ EXEMPT"] };
    const [cls, label] = map[status];
    return <span className={`imds-badge imds-badge--${cls}`}>{label}</span>;
}

function ExpandableRow({ result }: { result: CheckResult }) {
    const [expanded, setExpanded] = useState(false);
    const pct = Math.min((result.detected / result.limit) * 100, 130);
    const barColor = result.status === "fail" ? "#ef4444" : result.status === "warn" ? "#f59e0b" : "#10b981";

    return (
        <>
            <tr
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded(!expanded)}
            >
                <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--imds-text-secondary)" }}>{result.id}</span></td>
                <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{result.substance}</div>
                    <div style={{ fontSize: 11, color: "var(--imds-text-muted)", fontFamily: "monospace" }}>CAS: {result.cas}</div>
                </td>
                <td><RegBadge reg={result.regulation} /></td>
                <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="imds-progress" style={{ width: 80, position: "relative" }}>
                            <div className="imds-progress-bar" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                        </div>
                        <span style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>
                            {result.detected.toFixed(3)}% / {result.limit}%
                        </span>
                    </div>
                </td>
                <td style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{result.part.split("–")[0].trim()}</td>
                <td><StatusBadge status={result.status} /></td>
                <td>
                    {expanded ? <ChevronUp size={15} color="var(--imds-text-muted)" /> : <ChevronDown size={15} color="var(--imds-text-muted)" />}
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={7} style={{ padding: 0, background: "var(--imds-bg-elevated)" }}>
                        <div style={{ padding: "20px 24px" }}>
                            <div className="imds-grid-2" style={{ gap: 16 }}>
                                {/* AI Reasoning */}
                                <div className="imds-ai-box">
                                    <span className="imds-ai-box-label">🤖 AI Compliance Reasoning (GPT-4)</span>
                                    <p className="imds-ai-text">{result.reasoning}</p>
                                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                        <span className="imds-badge imds-badge--neutral">
                                            <BookOpen size={10} /> {result.regulation} Directive
                                        </span>
                                        <span className="imds-badge imds-badge--neutral">
                                            Category: {result.category}
                                        </span>
                                        <span className="imds-badge imds-badge--neutral">
                                            Part: {result.part}
                                        </span>
                                    </div>
                                </div>

                                {/* Alternatives (if fail/warn) */}
                                {result.alternatives && result.alternatives.length > 0 && (
                                    <div className="imds-card" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)" }}>
                                        <p className="imds-card-title" style={{ color: "var(--imds-success)" }}>
                                            <CheckCircle2 size={13} /> AI-Suggested Compliant Alternatives
                                        </p>
                                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                            {result.alternatives.map((alt, i) => (
                                                <li key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "var(--imds-text-secondary)" }}>
                                                    <span style={{ color: "var(--imds-success)", flexShrink: 0 }}>→</span>
                                                    {alt}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ marginTop: 4 }}>
                                            <FlaskConical size={12} /> View Substance Library
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CompliancePage() {
    const [regFilter, setRegFilter] = useState<"ALL" | Regulation>("ALL");
    const [statusFilter, setStatFilter] = useState<"all" | Status>("all");
    const [search, setSearch] = useState("");

    const filtered = RESULTS.filter(r => {
        const matchReg = regFilter === "ALL" || r.regulation === regFilter;
        const matchStat = statusFilter === "all" || r.status === statusFilter;
        const matchSearch = r.substance.toLowerCase().includes(search.toLowerCase())
            || r.cas.includes(search)
            || r.part.toLowerCase().includes(search.toLowerCase());
        return matchReg && matchStat && matchSearch;
    });

    const counts = {
        pass: RESULTS.filter(r => r.status === "pass").length,
        fail: RESULTS.filter(r => r.status === "fail").length,
        warn: RESULTS.filter(r => r.status === "warn").length,
        exempt: RESULTS.filter(r => r.status === "exempt").length,
    };

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Regulatory Compliance Checker</h1>
                    <p className="imds-page-subtitle">REACH · RoHS · ELV · Deterministic rules engine with AI-powered explainability</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="imds-btn imds-btn--outline imds-btn--sm"><Download size={14} /> Export PDF Report</button>
                    <button className="imds-btn imds-btn--primary imds-btn--sm"><Cpu size={14} /> Re-run Check</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="imds-stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 24 }}>
                {[
                    { label: "Pass", count: counts.pass, icon: <CheckCircle2 size={20} />, color: "var(--imds-success)", bg: "var(--imds-success-bg)" },
                    { label: "Violations", count: counts.fail, icon: <XCircle size={20} />, color: "var(--imds-danger)", bg: "var(--imds-danger-bg)" },
                    { label: "Near Limit", count: counts.warn, icon: <AlertTriangle size={20} />, color: "var(--imds-warning)", bg: "var(--imds-warning-bg)" },
                    { label: "Exempt", count: counts.exempt, icon: <Shield size={20} />, color: "var(--imds-info)", bg: "var(--imds-info-bg)" },
                ].map((s, i) => (
                    <div key={i} className="imds-stat-card" style={{ "--stat-color": s.color, "--stat-bg": s.bg } as React.CSSProperties}>
                        <div className="imds-stat-icon">{s.icon}</div>
                        <div>
                            <div className="imds-stat-value">{s.count}</div>
                            <div className="imds-stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Violations Alert */}
            {counts.fail > 0 && (
                <div className="imds-alert imds-alert--danger">
                    <XCircle size={18} style={{ flexShrink: 0 }} />
                    <div>
                        <strong>{counts.fail} active regulatory violation{counts.fail > 1 ? "s" : ""} detected.</strong>
                        {" "}Immediate corrective action required. IMDS submission blocked until violations are resolved or exemptions documented.
                    </div>
                </div>
            )}

            {/* Regulation Info Bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                {[
                    { reg: "REACH", desc: "EU 1907/2006 – Substances of Very High Concern (SVHC)", threshold: "0.1% w/w in articles" },
                    { reg: "RoHS", desc: "EU 2011/65/EU – Restriction of Hazardous Substances", threshold: "Cd: 0.01% · Pb/Hg/Cr VI/PBB/PBDE: 0.1%" },
                    { reg: "ELV", desc: "EU 2000/53/EC – End of Life Vehicles Directive", threshold: "Pb/Hg/Cr VI: 0.1%, Cd: 0.01%" },
                ].map(info => (
                    <div key={info.reg} className="imds-card" style={{ flex: 1, padding: 14 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                            <RegBadge reg={info.reg as Regulation} />
                            <Info size={13} color="var(--imds-text-muted)" />
                        </div>
                        <p style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginBottom: 4 }}>{info.desc}</p>
                        <p style={{ fontSize: 11, color: "var(--imds-text-muted)", fontFamily: "monospace" }}>{info.threshold}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--imds-text-muted)" }} />
                    <input
                        className="imds-input"
                        style={{ width: "100%", paddingLeft: 36 }}
                        placeholder="Search substance, CAS number, or part…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="imds-tabs" style={{ marginBottom: 0 }}>
                    {(["ALL", "REACH", "RoHS", "ELV"] as const).map(r => (
                        <button key={r} className={`imds-tab-btn ${regFilter === r ? "imds-tab-btn--active" : ""}`} onClick={() => setRegFilter(r)}>{r}</button>
                    ))}
                </div>
                <select className="imds-select" style={{ minWidth: 140 }} value={statusFilter} onChange={e => setStatFilter(e.target.value as any)}>
                    <option value="all">All Status</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="warn">Near Limit</option>
                    <option value="exempt">Exempt</option>
                </select>
            </div>

            {/* Results Table */}
            <div className="imds-table-wrap">
                <table className="imds-table">
                    <thead>
                        <tr>
                            <th>Check ID</th>
                            <th>Substance</th>
                            <th>Regulation</th>
                            <th>Concentration</th>
                            <th>Part</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(result => (
                            <ExpandableRow key={result.id} result={result} />
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "var(--imds-text-muted)", textAlign: "center" }}>
                Showing {filtered.length} of {RESULTS.length} checks · Last validated against ECHA SVHC list (Aug 2024) · RoHS 3 (EU 2015/863) · ELV Annex II
            </div>
        </div>
    );
}
