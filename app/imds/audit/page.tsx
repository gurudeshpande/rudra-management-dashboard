"use client";

import React, { useState } from "react";
import {
    BookOpen, Search, Filter, Shield, AlertTriangle,
    CheckCircle2, User, FileText, Clock, Download,
    RefreshCw, Eye
} from "lucide-react";

type AuditAction =
    | "BOM_IMPORTED"
    | "COMPLIANCE_CHECK"
    | "SUBSTANCE_FLAGGED"
    | "REPORT_GENERATED"
    | "USER_LOGIN"
    | "BOM_SUBMITTED"
    | "VIOLATION_RESOLVED"
    | "RULE_UPDATED";

type AuditEntry = {
    id: string;
    timestamp: string;
    action: AuditAction;
    actor: string;
    role: string;
    tenantId: string;
    entity: string;
    details: string;
    ipAddress: string;
    result: "success" | "failed" | "warning";
};

const AUDIT_ENTRIES: AuditEntry[] = [
    {
        id: "AUD-20240223-001", timestamp: "2026-02-23T13:21:04Z",
        action: "SUBSTANCE_FLAGGED", actor: "AI Engine (GPT-4)", role: "System",
        tenantId: "ORG-BMW-001", entity: "BOM-2024-0889",
        details: "Cadmium (Cd) detected at 0.012% in BRK-10291. Exceeds RoHS limit 0.01%. Compliance check blocked.",
        ipAddress: "10.0.0.1", result: "warning"
    },
    {
        id: "AUD-20240223-002", timestamp: "2026-02-23T12:48:22Z",
        action: "COMPLIANCE_CHECK", actor: "john.doe@bmw.com", role: "Compliance Lead",
        tenantId: "ORG-BMW-001", entity: "BOM-2024-0891",
        details: "Full compliance check executed against REACH, RoHS, ELV. 7 checks passed, 0 violations. BOM cleared for IMDS submission.",
        ipAddress: "192.168.1.44", result: "success"
    },
    {
        id: "AUD-20240223-003", timestamp: "2026-02-23T11:30:55Z",
        action: "BOM_IMPORTED", actor: "sarah.chen@bmw.com", role: "Product Engineer",
        tenantId: "ORG-BMW-001", entity: "BOM-2024-0891",
        details: "BOM uploaded: 'bosch-brake-system-2025.xlsx'. 347 rows detected. AI extraction job queued (job ID: JOB-8821).",
        ipAddress: "192.168.1.55", result: "success"
    },
    {
        id: "AUD-20240223-004", timestamp: "2026-02-23T10:15:00Z",
        action: "BOM_SUBMITTED", actor: "john.doe@bmw.com", role: "Compliance Lead",
        tenantId: "ORG-BMW-001", entity: "BOM-2024-0888",
        details: "BOM normalized and submitted to IMDS portal. IMDS Ref: IMDS-2024-BOM-0888. Status: Accepted.",
        ipAddress: "192.168.1.44", result: "success"
    },
    {
        id: "AUD-20240223-005", timestamp: "2026-02-23T09:02:11Z",
        action: "USER_LOGIN", actor: "valeo.supplier@valeo.com", role: "Tier-1 Supplier",
        tenantId: "ORG-BMW-001", entity: "Session",
        details: "Supplier portal login. 2FA verified. Session token issued.",
        ipAddress: "84.22.114.8", result: "success"
    },
    {
        id: "AUD-20240223-006", timestamp: "2026-02-22T16:44:33Z",
        action: "VIOLATION_RESOLVED", actor: "john.doe@bmw.com", role: "Compliance Lead",
        tenantId: "ORG-BMW-001", entity: "CHK-001",
        details: "Cadmium violation in BRK-10291 marked as 'In Remediation'. Corrective action plan submitted to Bosch GmbH. Target date: 2024-03-15.",
        ipAddress: "192.168.1.44", result: "success"
    },
    {
        id: "AUD-20240223-007", timestamp: "2026-02-22T14:20:00Z",
        action: "RULE_UPDATED", actor: "admin@imdssentinel.io", role: "Super Admin",
        tenantId: "SYSTEM", entity: "RuleEngine-v2.4.1",
        details: "REACH SVHC list updated to August 2024 version (247 substances). 3 new SVHCs added: PFOA, UV-328, DOTE.",
        ipAddress: "10.0.0.2", result: "success"
    },
    {
        id: "AUD-20240223-008", timestamp: "2026-02-22T13:00:00Z",
        action: "REPORT_GENERATED", actor: "sarah.chen@bmw.com", role: "Product Engineer",
        tenantId: "ORG-BMW-001", entity: "REACH-RPT-20240222",
        details: "REACH Compliance Report generated for Q4 2024. 112 BOMs included. PDF exported.",
        ipAddress: "192.168.1.55", result: "success"
    },
];

const ACTION_LABELS: Record<AuditAction, { label: string; icon: React.ReactNode; color: string }> = {
    BOM_IMPORTED: { label: "BOM Imported", icon: <FileText size={13} />, color: "#00d4ff" },
    COMPLIANCE_CHECK: { label: "Compliance Check", icon: <Shield size={13} />, color: "#10b981" },
    SUBSTANCE_FLAGGED: { label: "Substance Flagged", icon: <AlertTriangle size={13} />, color: "#f59e0b" },
    REPORT_GENERATED: { label: "Report Generated", icon: <BookOpen size={13} />, color: "#6366f1" },
    USER_LOGIN: { label: "User Login", icon: <User size={13} />, color: "#8b5cf6" },
    BOM_SUBMITTED: { label: "BOM Submitted", icon: <CheckCircle2 size={13} />, color: "#10b981" },
    VIOLATION_RESOLVED: { label: "Violation Resolved", icon: <CheckCircle2 size={13} />, color: "#10b981" },
    RULE_UPDATED: { label: "Rule Updated", icon: <RefreshCw size={13} />, color: "#f59e0b" },
};

export default function AuditPage() {
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState<"ALL" | AuditAction>("ALL");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = AUDIT_ENTRIES.filter(e => {
        const matchSearch = e.actor.includes(search) || e.entity.includes(search) || e.id.includes(search) || e.details.toLowerCase().includes(search.toLowerCase());
        const matchAction = actionFilter === "ALL" || e.action === actionFilter;
        return matchSearch && matchAction;
    });

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" });
    };

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Audit Logs</h1>
                    <p className="imds-page-subtitle">Immutable compliance activity trail · GDPR-grade logging · Encrypted at rest</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="imds-btn imds-btn--outline imds-btn--sm"><Download size={14} /> Export Logs</button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "Events Today", value: "48", color: "var(--imds-accent)" },
                    { label: "Unique Actors", value: "12", color: "var(--imds-info)" },
                    { label: "Failed Events", value: "0", color: "var(--imds-success)" },
                    { label: "Log Retention", value: "7 Years", color: "var(--imds-text-secondary)" },
                ].map(s => (
                    <div key={s.label} className="imds-card" style={{ flex: 1, textAlign: "center", padding: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--imds-text-muted)" }} />
                    <input
                        className="imds-input"
                        style={{ width: "100%", paddingLeft: 36 }}
                        placeholder="Search actor, entity, event ID, or details…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="imds-select"
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value as any)}
                >
                    <option value="ALL">All Actions</option>
                    {Object.keys(ACTION_LABELS).map(a => (
                        <option key={a} value={a}>{ACTION_LABELS[a as AuditAction].label}</option>
                    ))}
                </select>
            </div>

            {/* Audit Timeline */}
            <div className="imds-card">
                <div style={{ display: "flex", flexDirection: "column" }}>
                    {filtered.map((entry, i) => {
                        const meta = ACTION_LABELS[entry.action];
                        const isExpanded = expandedId === entry.id;
                        return (
                            <div key={entry.id}>
                                <div
                                    style={{
                                        display: "flex", alignItems: "flex-start", gap: 16,
                                        padding: "16px 0",
                                        borderBottom: i < filtered.length - 1 ? "1px solid rgba(56,139,253,0.06)" : "none",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                                >
                                    {/* Timeline Dot */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0, paddingTop: 4 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            background: `${meta.color}18`, border: `2px solid ${meta.color}44`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: meta.color
                                        }}>
                                            {meta.icon}
                                        </div>
                                        {i < filtered.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--imds-border)", minHeight: 20, marginTop: 4 }} />}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                                                    <span className={`imds-badge imds-badge--${entry.result === "success" ? "success" : entry.result === "warning" ? "warning" : "danger"}`}>
                                                        {entry.result}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--imds-text-secondary)", flexWrap: "wrap" }}>
                                                    <span><User size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{entry.actor}</span>
                                                    <span>·</span>
                                                    <span>{entry.role}</span>
                                                    <span>·</span>
                                                    <span style={{ fontFamily: "monospace", color: "var(--imds-accent)" }}>{entry.entity}</span>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <div style={{ fontSize: 11, color: "var(--imds-text-muted)", fontFamily: "monospace" }}>{entry.id}</div>
                                                <div style={{ fontSize: 11, color: "var(--imds-text-muted)", marginTop: 2 }}><Clock size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />{formatTime(entry.timestamp)}</div>
                                            </div>
                                        </div>

                                        {/* Details Preview */}
                                        <p style={{ fontSize: 12.5, color: "var(--imds-text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
                                            {isExpanded ? entry.details : entry.details.length > 100 ? entry.details.slice(0, 100) + "…" : entry.details}
                                        </p>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                                                {[
                                                    { label: "Tenant ID", value: entry.tenantId },
                                                    { label: "IP Address", value: entry.ipAddress },
                                                    { label: "Event ID", value: entry.id },
                                                ].map(d => (
                                                    <div key={d.label} style={{ background: "var(--imds-bg-elevated)", padding: "8px 12px", borderRadius: "var(--imds-radius-sm)" }}>
                                                        <div style={{ fontSize: 10, color: "var(--imds-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{d.label}</div>
                                                        <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--imds-text-secondary)" }}>{d.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p style={{ marginTop: 12, fontSize: 12, color: "var(--imds-text-muted)", textAlign: "center" }}>
                Showing {filtered.length} entries · Logs are write-once, tamper-evident · Encrypted with AES-256 at rest
            </p>
        </div>
    );
}
