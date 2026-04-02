"use client";

import React, { useState } from "react";
import {
    FlaskConical, Search, Filter, Book, AlertTriangle,
    Info, CheckCircle2, XCircle, ChevronRight, Download
} from "lucide-react";

type SubstanceEntry = {
    id: string;
    name: string;
    cas: string;
    category: string;
    regulations: string[];
    threshold: string;
    svhcList: boolean;
    riskLevel: "low" | "medium" | "high" | "banned";
    imdsGroup: string;
    description: string;
};

const SUBSTANCES: SubstanceEntry[] = [
    {
        id: "SUB-001", name: "Lead (Pb)", cas: "7439-92-1",
        category: "Heavy Metal", regulations: ["RoHS", "ELV", "REACH"],
        threshold: "0.1%", svhcList: true, riskLevel: "high",
        imdsGroup: "8.1.1 – Heavy Metals",
        description: "Lead and lead compounds are restricted in electrical/electronic equipment and vehicles. Numerous exemptions exist for specific technical applications."
    },
    {
        id: "SUB-002", name: "Cadmium (Cd)", cas: "7440-43-9",
        category: "Heavy Metal", regulations: ["RoHS", "ELV"],
        threshold: "0.01%", svhcList: true, riskLevel: "banned",
        imdsGroup: "8.1.1 – Heavy Metals",
        description: "Cadmium has the strictest threshold (0.01%) among restricted heavy metals. Highly toxic, carcinogenic. Very few exemptions granted. Priority substitution required."
    },
    {
        id: "SUB-003", name: "Mercury (Hg)", cas: "7439-97-6",
        category: "Heavy Metal", regulations: ["RoHS"],
        threshold: "0.1%", svhcList: true, riskLevel: "high",
        imdsGroup: "8.1.1 – Heavy Metals",
        description: "Mercury is restricted in all electrical equipment. Specific exemptions for compact fluorescent lamps (Annex III RoHS). Dental amalgam not in scope of automotive."
    },
    {
        id: "SUB-004", name: "Hexavalent Chromium (Cr VI)", cas: "18540-29-9",
        category: "Heavy Metal", regulations: ["ELV", "RoHS"],
        threshold: "0.1%", svhcList: true, riskLevel: "banned",
        imdsGroup: "8.1.3 – Chromium Compounds",
        description: "Cr(VI) is a carcinogen and potent sensitizer. Must be substituted with trivalent chromium (Cr III) for all surface treatment applications. ELV Annex II applies."
    },
    {
        id: "SUB-005", name: "DEHP (Di(2-ethylhexyl) phthalate)", cas: "117-81-7",
        category: "Plasticizer / SVHC", regulations: ["REACH"],
        threshold: "0.1%", svhcList: true, riskLevel: "high",
        imdsGroup: "8.5.4 – Plasticizers",
        description: "DEHP is reprotoxic (CMR Cat 1B) and endocrine disrupting. REACH SVHC candidate. Authorization required for use above threshold in articles. Substitution with DOTP or DINP recommended."
    },
    {
        id: "SUB-006", name: "Polybrominated Biphenyls (PBB)", cas: "36355-01-8",
        category: "Flame Retardant", regulations: ["RoHS"],
        threshold: "0.1%", svhcList: false, riskLevel: "banned",
        imdsGroup: "8.6.1 – Halogenated Flame Retardants",
        description: "PBBs are persistently toxic and bioaccumulative. Banned under RoHS without exemption. All formulations require substitution with phosphorus-based alternatives."
    },
    {
        id: "SUB-007", name: "Polybrominated Diphenyl Ethers (PBDE)", cas: "32534-81-9",
        category: "Flame Retardant", regulations: ["RoHS"],
        threshold: "0.1%", svhcList: false, riskLevel: "banned",
        imdsGroup: "8.6.1 – Halogenated Flame Retardants",
        description: "PBDEs are persistent organic pollutants. RoHS banned. Alternatives include Firemaster 550, non-halogenated phosphonate esters."
    },
    {
        id: "SUB-008", name: "Bis(2-ethylhexyl) phthalate", cas: "117-81-7",
        category: "Plasticizer / SVHC", regulations: ["REACH", "RoHS (Annex II)"],
        threshold: "0.1%", svhcList: true, riskLevel: "high",
        imdsGroup: "8.5.4 – Plasticizers",
        description: "Added to RoHS restricted list via Delegated Directive EU 2015/863. Covered in REACH Annex XVII and SVHC. Commonly found in PVC flexible cables."
    },
    {
        id: "SUB-009", name: "Antimony Trioxide (Sb₂O₃)", cas: "1309-64-4",
        category: "Flame Retardant Synergist", regulations: ["REACH"],
        threshold: "0.1%", svhcList: false, riskLevel: "medium",
        imdsGroup: "8.6.3 – Inorganic FR Synergists",
        description: "Antimony trioxide is a possible carcinogen (Group 2B – IARC). REACH SVHC candidacy under review. Monitor for future regulatory changes."
    },
    {
        id: "SUB-010", name: "Platinum (Pt) – Catalytic Converters", cas: "7440-06-4",
        category: "Precious Metal", regulations: ["—"],
        threshold: "N/A", svhcList: false, riskLevel: "low",
        imdsGroup: "8.1.6 – Precious Metals",
        description: "Platinum group metals are not restricted under current automotive regulations. Standard IMDS declaration required. Mined source documentation may be required for CSR reporting."
    },
];

function RiskPill({ level }: { level: SubstanceEntry["riskLevel"] }) {
    const map = { low: "success", medium: "warning", high: "danger", banned: "danger" };
    const labels = { low: "Low Risk", medium: "Medium", high: "High Risk", banned: "BANNED" };
    return <span className={`imds-badge imds-badge--${map[level]}`}>{labels[level]}</span>;
}

export default function SubstancesPage() {
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("All");
    const [regFilter, setRegFilter] = useState("All");
    const [selected, setSelected] = useState<SubstanceEntry | null>(null);

    const categories = ["All", ...Array.from(new Set(SUBSTANCES.map(s => s.category.split(" / ")[0])))];
    const regulations = ["All", "REACH", "RoHS", "ELV"];

    const filtered = SUBSTANCES.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
            || s.cas.includes(search) || s.imdsGroup.toLowerCase().includes(search.toLowerCase());
        const matchCat = catFilter === "All" || s.category.startsWith(catFilter);
        const matchReg = regFilter === "All" || s.regulations.includes(regFilter);
        return matchSearch && matchCat && matchReg;
    });

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">SVHC Substance Library</h1>
                    <p className="imds-page-subtitle">650+ substances · REACH SVHC · RoHS Annex II · ELV restricted materials · Updated Aug 2024</p>
                </div>
                <button className="imds-btn imds-btn--outline imds-btn--sm"><Download size={14} /> Export List</button>
            </div>

            {/* Stats Row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Total Substances", value: "650+", color: "var(--imds-accent)" },
                    { label: "REACH SVHC", value: "240", color: "var(--imds-info)" },
                    { label: "RoHS Restricted", value: "10", color: "var(--imds-danger)" },
                    { label: "ELV Annex II", value: "6", color: "var(--imds-warning)" },
                    { label: "Threshold: 0.01%", value: "Cd only", color: "var(--imds-danger)" },
                ].map(s => (
                    <div key={s.label} className="imds-card" style={{ flex: 1, textAlign: "center", padding: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="imds-grid-main-side">
                {/* Library List */}
                <div>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--imds-text-muted)" }} />
                            <input
                                className="imds-input"
                                style={{ width: "100%", paddingLeft: 36 }}
                                placeholder="Search substance name, CAS No., IMDS group…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select className="imds-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select className="imds-select" value={regFilter} onChange={e => setRegFilter(e.target.value)}>
                            {regulations.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="imds-table-wrap">
                        <table className="imds-table">
                            <thead>
                                <tr>
                                    <th>Substance</th>
                                    <th>CAS Number</th>
                                    <th>IMDS Group</th>
                                    <th>Regulations</th>
                                    <th>Threshold</th>
                                    <th>SVHC</th>
                                    <th>Risk Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s.id} style={{ cursor: "pointer", background: selected?.id === s.id ? "var(--imds-bg-hover)" : undefined }} onClick={() => setSelected(s)}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{s.cas}</span></td>
                                        <td style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{s.imdsGroup}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                {s.regulations.map(r => (
                                                    <span key={r} className="imds-reg-tag" style={{ fontSize: 10, padding: "2px 6px" }}>{r}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: "monospace", fontWeight: 700, color: s.threshold === "0.01%" ? "var(--imds-danger)" : "var(--imds-text-primary)" }}>
                                            {s.threshold}
                                        </td>
                                        <td>
                                            {s.svhcList
                                                ? <span className="imds-badge imds-badge--danger">SVHC</span>
                                                : <span className="imds-badge imds-badge--neutral">No</span>}
                                        </td>
                                        <td><RiskPill level={s.riskLevel} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ marginTop: 10, fontSize: 12, color: "var(--imds-text-muted)" }}>
                        Showing {filtered.length} of {SUBSTANCES.length} substances (demo data) · Click row for details
                    </p>
                </div>

                {/* Detail Panel */}
                <div>
                    {selected ? (
                        <div className="imds-card imds-card--glow" style={{ position: "sticky", top: 80 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                                <div>
                                    <p style={{ fontSize: 18, fontWeight: 800, color: "var(--imds-text-primary)" }}>{selected.name}</p>
                                    <p style={{ fontFamily: "monospace", fontSize: 13, color: "var(--imds-text-muted)", marginTop: 2 }}>CAS: {selected.cas}</p>
                                </div>
                                <RiskPill level={selected.riskLevel} />
                            </div>

                            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                                {selected.regulations.map(r => <span key={r} className="imds-reg-tag">{r}</span>)}
                                {selected.svhcList && <span className="imds-badge imds-badge--danger">SVHC Listed</span>}
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                {[
                                    { label: "Category", value: selected.category },
                                    { label: "IMDS Group", value: selected.imdsGroup },
                                    { label: "Threshold Limit", value: selected.threshold },
                                    { label: "SVHC Candidate", value: selected.svhcList ? "Yes" : "No" },
                                ].map(item => (
                                    <div key={item.label} style={{ background: "var(--imds-bg-elevated)", padding: "10px 12px", borderRadius: "var(--imds-radius-sm)" }}>
                                        <div style={{ fontSize: 10, color: "var(--imds-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--imds-text-primary)" }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="imds-ai-box">
                                <span className="imds-ai-box-label">📖 Regulatory Description</span>
                                <p className="imds-ai-text">{selected.description}</p>
                            </div>

                            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                                <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <Book size={13} /> ECHA Entry
                                </button>
                                <button className="imds-btn imds-btn--primary imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <FlaskConical size={13} /> Find Alternatives
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="imds-card" style={{ textAlign: "center", padding: 48 }}>
                            <FlaskConical size={42} color="var(--imds-text-muted)" style={{ margin: "0 auto 16px" }} />
                            <p style={{ color: "var(--imds-text-muted)", fontSize: 14 }}>Select a substance from the table to view detailed regulatory information</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
