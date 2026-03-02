"use client";

import React, { useState } from "react";
import { Users, Plus, Edit2, Trash2, Shield, Mail, Phone, Clock } from "lucide-react";

type Role = "Compliance Lead" | "Product Engineer" | "Sustainability Officer" | "Supplier" | "Read Only";

const TEAM_MEMBERS = [
    { id: "USR-001", name: "John Doe", email: "john.doe@company.com", role: "Compliance Lead" as Role, status: "Active", lastActive: "2 min ago", mfa: true },
    { id: "USR-002", name: "Sarah Chen", email: "sarah.chen@company.com", role: "Product Engineer" as Role, status: "Active", lastActive: "1 hr ago", mfa: true },
    { id: "USR-003", name: "Marco Bianchi", email: "marco.bianchi@company.com", role: "Sustainability Officer" as Role, status: "Active", lastActive: "3 hr ago", mfa: false },
    { id: "USR-004", name: "Valeo Supplier", email: "imds@valeo.com", role: "Supplier" as Role, status: "Active", lastActive: "2 days ago", mfa: false },
    { id: "USR-005", name: "Klaus Müller", email: "k.mueller@company.com", role: "Read Only" as Role, status: "Inactive", lastActive: "5 days ago", mfa: false },
];

const PERMISSIONS: Record<Role, string[]> = {
    "Compliance Lead": ["Import BOM", "Run Compliance Check", "Submit to IMDS", "Generate Reports", "Manage Team", "View Audit Logs", "Configure Settings"],
    "Product Engineer": ["Import BOM", "Run Compliance Check", "View Reports"],
    "Sustainability Officer": ["View Dashboard", "Generate Reports", "View Audit Logs"],
    "Supplier": ["Upload Documents", "View Own BOM Status"],
    "Read Only": ["View Dashboard", "View Reports"],
};

const ROLE_COLORS: Record<Role, string> = {
    "Compliance Lead": "#00d4ff",
    "Product Engineer": "#6366f1",
    "Sustainability Officer": "#10b981",
    "Supplier": "#f59e0b",
    "Read Only": "#8b5cf6",
};

export default function TeamPage() {
    const [selected, setSelected] = useState<typeof TEAM_MEMBERS[0] | null>(null);

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Team & Access Control</h1>
                    <p className="imds-page-subtitle">RBAC role management · Per-user permissions · MFA enforcement</p>
                </div>
                <button className="imds-btn imds-btn--primary imds-btn--sm"><Plus size={14} /> Invite Member</button>
            </div>

            <div className="imds-grid-main-side">
                {/* Team List */}
                <div className="imds-card">
                    <p className="imds-card-title" style={{ marginBottom: 16 }}><Users size={14} /> Team Members ({TEAM_MEMBERS.length})</p>
                    <div className="imds-table-wrap">
                        <table className="imds-table">
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Role</th>
                                    <th>MFA</th>
                                    <th>Last Active</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {TEAM_MEMBERS.map(m => (
                                    <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => setSelected(m)}>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 32, height: 32, borderRadius: "50%",
                                                    background: `linear-gradient(135deg, ${ROLE_COLORS[m.role]}, #6366f1)`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 12, fontWeight: 700, color: "#fff",
                                                }}>
                                                    {m.name.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                                                    <div style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>{m.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLORS[m.role], border: `1px solid ${ROLE_COLORS[m.role]}33`, padding: "2px 8px", borderRadius: 4 }}>
                                                {m.role}
                                            </span>
                                        </td>
                                        <td>
                                            {m.mfa
                                                ? <span className="imds-badge imds-badge--success">✓ MFA</span>
                                                : <span className="imds-badge imds-badge--warning">⚠ No MFA</span>}
                                        </td>
                                        <td style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>
                                            <Clock size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />{m.lastActive}
                                        </td>
                                        <td>
                                            <span className={`imds-badge imds-badge--${m.status === "Active" ? "success" : "neutral"}`}>{m.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="imds-btn imds-btn--outline imds-btn--icon"><Edit2 size={13} /></button>
                                                <button className="imds-btn imds-btn--danger imds-btn--icon"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Role Permissions Panel */}
                <div>
                    {selected ? (
                        <div className="imds-card imds-card--glow" style={{ position: "sticky", top: 80 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    background: `linear-gradient(135deg, ${ROLE_COLORS[selected.role]}, #6366f1)`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, fontWeight: 800, color: "#fff",
                                }}>
                                    {selected.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 800 }}>{selected.name}</p>
                                    <p style={{ fontSize: 12, color: "var(--imds-text-muted)" }}>{selected.email}</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <p className="imds-card-title" style={{ marginBottom: 8 }}>Assigned Role</p>
                                <select className="imds-select" style={{ width: "100%" }} defaultValue={selected.role}>
                                    {Object.keys(PERMISSIONS).map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <p className="imds-card-title" style={{ marginBottom: 10 }}><Shield size={13} /> Permissions</p>
                                {PERMISSIONS[selected.role].map(p => (
                                    <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(56,139,253,0.06)", fontSize: 13, color: "var(--imds-text-secondary)" }}>
                                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: ROLE_COLORS[selected.role] }} />
                                        {p}
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: "flex", gap: 10 }}>
                                <button className="imds-btn imds-btn--outline imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    <Mail size={13} /> Send Invite
                                </button>
                                <button className="imds-btn imds-btn--primary imds-btn--sm" style={{ flex: 1, justifyContent: "center" }}>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="imds-card" style={{ textAlign: "center", padding: 48 }}>
                            <Users size={42} color="var(--imds-text-muted)" style={{ margin: "0 auto 16px" }} />
                            <p style={{ color: "var(--imds-text-muted)", fontSize: 14 }}>Click a team member to view and edit their permissions</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
