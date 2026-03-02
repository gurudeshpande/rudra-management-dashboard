"use client";

import React, { useState } from "react";
import {
    Building2, Search, Plus, Globe, Mail, Phone,
    Shield, AlertTriangle, CheckCircle2, ChevronRight,
    BarChart2, Star, MapPin, Edit2, Trash2
} from "lucide-react";

type SupplierTier = "OEM" | "Tier-1" | "Tier-2" | "Tier-3";
type SupplierStatus = "Active" | "Under Review" | "Suspended";

type Supplier = {
    id: string;
    name: string;
    country: string;
    tier: SupplierTier;
    contact: string;
    email: string;
    complianceScore: number;
    activeBOMs: number;
    violations: number;
    status: SupplierStatus;
    lastAudit: string;
    certifications: string[];
};

const SUPPLIERS: Supplier[] = [
    {
        id: "SUP-001", name: "Bosch GmbH", country: "Germany", tier: "Tier-1",
        contact: "+49 711 400 40990", email: "imds@bosch.com",
        complianceScore: 98, activeBOMs: 187, violations: 2,
        status: "Active", lastAudit: "2024-01-15",
        certifications: ["IATF 16949", "ISO 14001", "REACH Compliant"],
    },
    {
        id: "SUP-002", name: "Continental AG", country: "Germany", tier: "Tier-1",
        contact: "+49 511 938 01", email: "compliance@conti.de",
        complianceScore: 84, activeBOMs: 143, violations: 18,
        status: "Active", lastAudit: "2024-02-01",
        certifications: ["IATF 16949", "RoHS Compliance Letter"],
    },
    {
        id: "SUP-003", name: "Magna International", country: "Canada", tier: "Tier-1",
        contact: "+1 905 726 7100", email: "env@magna.com",
        complianceScore: 72, activeBOMs: 112, violations: 31,
        status: "Under Review", lastAudit: "2024-01-28",
        certifications: ["IATF 16949"],
    },
    {
        id: "SUP-004", name: "Aptiv PLC", country: "Ireland", tier: "Tier-1",
        contact: "+353 1 521 1700", email: "regulatory@aptiv.com",
        complianceScore: 96, activeBOMs: 98, violations: 4,
        status: "Active", lastAudit: "2024-02-10",
        certifications: ["IATF 16949", "ISO 14001", "REACH Compliant", "RoHS Compliance Letter"],
    },
    {
        id: "SUP-005", name: "Valeo SA", country: "France", tier: "Tier-1",
        contact: "+33 1 40 55 20 20", email: "imds@valeo.com",
        complianceScore: 61, activeBOMs: 77, violations: 41,
        status: "Suspended", lastAudit: "2024-01-05",
        certifications: ["IATF 16949"],
    },
    {
        id: "SUP-006", name: "ZF Friedrichshafen AG", country: "Germany", tier: "Tier-1",
        contact: "+49 7541 77 0", email: "compliance@zf.com",
        complianceScore: 91, activeBOMs: 134, violations: 12,
        status: "Active", lastAudit: "2024-02-15",
        certifications: ["IATF 16949", "ISO 14001", "ELV Compliant"],
    },
];

function GradeRing({ score }: { score: number }) {
    const grade = score >= 95 ? "A" : score >= 85 ? "B" : score >= 70 ? "C" : "D";
    const color = score >= 95 ? "#10b981" : score >= 85 ? "#6366f1" : score >= 70 ? "#f59e0b" : "#ef4444";
    return (
        <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `2.5px solid ${color}55`,
            background: `${color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color,
            flexShrink: 0,
        }}>
            {grade}
        </div>
    );
}

export default function SuppliersPage() {
    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState<"All" | SupplierTier>("All");
    const [statusFilter, setStatusFilter] = useState<"All" | SupplierStatus>("All");
    const [selected, setSelected] = useState<Supplier | null>(SUPPLIERS[0]);

    const filtered = SUPPLIERS.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.country.toLowerCase().includes(search.toLowerCase());
        const matchTier = tierFilter === "All" || s.tier === tierFilter;
        const matchStatus = statusFilter === "All" || s.status === statusFilter;
        return matchSearch && matchTier && matchStatus;
    });

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Supplier Management</h1>
                    <p className="imds-page-subtitle">OEM / Tier-1 / Tier-2 supplier compliance tracking and scorecards</p>
                </div>
                <button className="imds-btn imds-btn--primary imds-btn--sm"><Plus size={14} /> Add Supplier</button>
            </div>

            {/* Summary */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Total Suppliers", value: SUPPLIERS.length, color: "var(--imds-accent)" },
                    { label: "Active", value: SUPPLIERS.filter(s => s.status === "Active").length, color: "var(--imds-success)" },
                    { label: "Under Review", value: SUPPLIERS.filter(s => s.status === "Under Review").length, color: "var(--imds-warning)" },
                    { label: "Suspended", value: SUPPLIERS.filter(s => s.status === "Suspended").length, color: "var(--imds-danger)" },
                ].map(s => (
                    <div key={s.label} className="imds-card" style={{ flex: 1, textAlign: "center", padding: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="imds-grid-main-side">
                {/* List */}
                <div>
                    {/* Filters */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
                            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--imds-text-muted)" }} />
                            <input className="imds-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="imds-select" value={tierFilter} onChange={e => setTierFilter(e.target.value as any)}>
                            {["All", "OEM", "Tier-1", "Tier-2", "Tier-3"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className="imds-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                            {["All", "Active", "Under Review", "Suspended"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {filtered.map(s => {
                        const isSelected = selected?.id === s.id;
                        const statusColor = s.status === "Active" ? "var(--imds-success)" : s.status === "Under Review" ? "var(--imds-warning)" : "var(--imds-danger)";
                        return (
                            <div
                                key={s.id}
                                onClick={() => setSelected(s)}
                                className="imds-card"
                                style={{
                                    marginBottom: 10, cursor: "pointer",
                                    border: isSelected ? "1px solid rgba(0,212,255,0.35)" : "1px solid var(--imds-border)",
                                    background: isSelected ? "rgba(0,212,255,0.04)" : "var(--imds-bg-card)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                                    <GradeRing score={s.complianceScore} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                                            <span className={`imds-badge imds-badge--${s.status === "Active" ? "success" : s.status === "Under Review" ? "warning" : "danger"}`}>
                                                {s.status}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 12, color: "var(--imds-text-secondary)", flexWrap: "wrap" }}>
                                            <span><MapPin size={11} style={{ verticalAlign: "middle" }} /> {s.country}</span>
                                            <span>{s.tier}</span>
                                            <span>{s.activeBOMs} BOMs</span>
                                            <span style={{ color: s.violations > 20 ? "var(--imds-danger)" : s.violations > 5 ? "var(--imds-warning)" : "var(--imds-success)" }}>
                                                {s.violations} violations
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: 18, fontWeight: 800, color: s.complianceScore >= 90 ? "#10b981" : s.complianceScore >= 75 ? "#f59e0b" : "#ef4444", fontFamily: "Space Grotesk" }}>
                                            {s.complianceScore}%
                                        </div>
                                        <div style={{ fontSize: 10, color: "var(--imds-text-muted)" }}>Compliance</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Detail Panel */}
                {selected && (
                    <div>
                        <div className="imds-card imds-card--glow" style={{ position: "sticky", top: 80 }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                                        <GradeRing score={selected.complianceScore} />
                                        <div>
                                            <p style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</p>
                                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)" }}>{selected.tier} · {selected.country}</p>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="imds-btn imds-btn--outline imds-btn--icon"><Edit2 size={13} /></button>
                                </div>
                            </div>

                            {/* Compliance Score */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>Compliance Score</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: selected.complianceScore >= 90 ? "#10b981" : "#f59e0b" }}>{selected.complianceScore}%</span>
                                </div>
                                <div className="imds-progress" style={{ height: 8 }}>
                                    <div className="imds-progress-bar" style={{ width: `${selected.complianceScore}%`, background: selected.complianceScore >= 90 ? "#10b981" : "#f59e0b" }} />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                                {[
                                    { label: "Active BOMs", value: selected.activeBOMs },
                                    { label: "Total Violations", value: selected.violations },
                                    { label: "Last Audit", value: selected.lastAudit },
                                    { label: "Status", value: selected.status },
                                ].map(d => (
                                    <div key={d.label} style={{ background: "var(--imds-bg-elevated)", padding: "10px 12px", borderRadius: "var(--imds-radius-sm)" }}>
                                        <div style={{ fontSize: 10, color: "var(--imds-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{d.label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--imds-text-primary)" }}>{d.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Contact */}
                            <div style={{ marginBottom: 16 }}>
                                <p className="imds-card-title" style={{ marginBottom: 10 }}>Contact</p>
                                {[
                                    { icon: <Mail size={13} />, text: selected.email },
                                    { icon: <Phone size={13} />, text: selected.contact },
                                ].map((c, i) => (
                                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, fontSize: 13, color: "var(--imds-text-secondary)" }}>
                                        <span style={{ color: "var(--imds-text-muted)" }}>{c.icon}</span>
                                        {c.text}
                                    </div>
                                ))}
                            </div>

                            {/* Certifications */}
                            <div style={{ marginBottom: 16 }}>
                                <p className="imds-card-title" style={{ marginBottom: 10 }}>Certifications</p>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {selected.certifications.map(cert => (
                                        <span key={cert} className="imds-badge imds-badge--neutral">{cert}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <BarChart2 size={13} /> View BOMs
                                </button>
                                <button className="imds-btn imds-btn--primary imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <Shield size={13} /> Run Audit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
