"use client";

import React, { useState } from "react";
import {
    Settings, Shield, Bell, Users, Database,
    Key, Globe, Cpu, Save, ChevronRight,
    CheckCircle2, AlertTriangle, Lock, Eye, EyeOff
} from "lucide-react";

type SettingSection = "general" | "regulations" | "ai" | "notifications" | "security" | "integrations";

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SettingSection>("general");
    const [showKey, setShowKey] = useState(false);
    const [reach, setReach] = useState(true);
    const [rohs, setRohs] = useState(true);
    const [elv, setElv] = useState(true);
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [svhcAlerts, setSvhcAlerts] = useState(true);
    const [savedSuccess, setSavedSuccess] = useState(false);

    const handleSave = () => {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    const sections: Array<{ id: SettingSection; label: string; icon: React.ReactNode }> = [
        { id: "general", label: "General", icon: <Settings size={16} /> },
        { id: "regulations", label: "Regulations", icon: <Shield size={16} /> },
        { id: "ai", label: "AI & ML Config", icon: <Cpu size={16} /> },
        { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
        { id: "security", label: "Security & RBAC", icon: <Lock size={16} /> },
        { id: "integrations", label: "Integrations", icon: <Globe size={16} /> },
    ];

    function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
        return (
            <div
                onClick={() => onChange(!value)}
                style={{
                    width: 44, height: 24, borderRadius: 999,
                    background: value ? "var(--imds-accent)" : "var(--imds-bg-elevated)",
                    border: `1px solid ${value ? "var(--imds-accent)" : "var(--imds-border)"}`,
                    position: "relative", cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: value ? "0 0 10px rgba(0,212,255,0.3)" : "none",
                    flexShrink: 0,
                }}
            >
                <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: "#fff",
                    position: "absolute", top: 2,
                    left: value ? 22 : 2,
                    transition: "left 0.2s",
                }} />
            </div>
        );
    }

    function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
        return (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "18px 0", borderBottom: "1px solid rgba(56,139,253,0.06)" }}>
                <div style={{ flex: 1, marginRight: 32 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--imds-text-primary)", marginBottom: 3 }}>{label}</p>
                    {description && <p style={{ fontSize: 12, color: "var(--imds-text-muted)", lineHeight: 1.5 }}>{description}</p>}
                </div>
                <div style={{ flexShrink: 0 }}>{children}</div>
            </div>
        );
    }

    return (
        <div>
            <div className="imds-page-header">
                <h1 className="imds-page-title">Settings</h1>
                <p className="imds-page-subtitle">Platform configuration, regulation rules, AI parameters, and integrations</p>
            </div>

            {savedSuccess && (
                <div className="imds-alert imds-alert--success" style={{ marginBottom: 20 }}>
                    <CheckCircle2 size={16} />
                    <span>Settings saved successfully.</span>
                </div>
            )}

            <div style={{ display: "flex", gap: 24 }}>
                {/* Sidebar Nav */}
                <div style={{ width: 200, flexShrink: 0 }}>
                    <div className="imds-card" style={{ padding: 8 }}>
                        {sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSection(s.id)}
                                className={`imds-nav-item ${activeSection === s.id ? "imds-nav-item--active" : ""}`}
                                style={{ width: "100%", border: "none", cursor: "pointer", textAlign: "left", background: "none", display: "flex" }}
                            >
                                {s.icon}
                                <span style={{ marginLeft: 8, fontSize: 13 }}>{s.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    {/* General */}
                    {activeSection === "general" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>General Configuration</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Organization and platform settings</p>

                            <SettingRow label="Organization Name" description="Displayed across all reports and IMDS submissions">
                                <input className="imds-input" defaultValue="BMW Group – Compliance Division" style={{ width: 280 }} />
                            </SettingRow>
                            <SettingRow label="Default Currency" description="Used in cost calculations for alternative materials">
                                <select className="imds-select" style={{ width: 140 }}>
                                    <option>EUR €</option>
                                    <option>USD $</option>
                                    <option>GBP £</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Fiscal Year Start" description="Used for report period calculations">
                                <select className="imds-select" style={{ width: 140 }}>
                                    <option>January</option>
                                    <option>April</option>
                                    <option>July</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="IMDS Submitter ID" description="Your registered IMDS organization ID for submissions">
                                <input className="imds-input" defaultValue="IMDS-ORG-04821" style={{ width: 200 }} />
                            </SettingRow>
                            <SettingRow label="Tenant ID" description="Multi-tenant isolation identifier">
                                <input className="imds-input" defaultValue="ORG-BMW-001" style={{ width: 200 }} readOnly />
                            </SettingRow>
                        </div>
                    )}

                    {/* Regulations */}
                    {activeSection === "regulations" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>Regulation Rules Engine</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Configure which regulations are active and threshold overrides</p>

                            <SettingRow label="REACH (EU 1907/2006)" description="Substances of Very High Concern – SVHC candidate list validation">
                                <Toggle value={reach} onChange={setReach} />
                            </SettingRow>
                            <SettingRow label="RoHS (EU 2011/65/EU)" description="Restriction of Hazardous Substances in EEE – Annexes I & II">
                                <Toggle value={rohs} onChange={setRohs} />
                            </SettingRow>
                            <SettingRow label="ELV (EU 2000/53/EC)" description="End-of-Life Vehicles Directive – Annex II restricted substances">
                                <Toggle value={elv} onChange={setElv} />
                            </SettingRow>
                            <SettingRow label="SVHC List Version" description="ECHA Candidate List version in use">
                                <select className="imds-select" style={{ width: 200 }}>
                                    <option>August 2024 (247 SVHCs)</option>
                                    <option>January 2024 (240 SVHCs)</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="RoHS Annex Version" description="RoHS restricted substances annex version">
                                <select className="imds-select" style={{ width: 200 }}>
                                    <option>RoHS 3 – EU 2015/863</option>
                                    <option>RoHS 2 – EU 2011/65</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Custom Threshold Override" description="Allow tenant-specific lower thresholds for stricter internal policies">
                                <Toggle value={false} onChange={() => { }} />
                            </SettingRow>
                        </div>
                    )}

                    {/* AI Config */}
                    {activeSection === "ai" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>AI & ML Configuration</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Configure document parsing LLM and XGBoost risk model parameters</p>

                            <SettingRow label="LLM Engine" description="GPT-4 class model used for document parsing and explanation generation">
                                <select className="imds-select" style={{ width: 200 }}>
                                    <option>GPT-4o (OpenAI)</option>
                                    <option>GPT-4 Turbo</option>
                                    <option>Gemini 1.5 Pro</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="OpenAI API Key" description="Used for document extraction and compliance reasoning">
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        className="imds-input"
                                        type={showKey ? "text" : "password"}
                                        defaultValue="sk-proj-••••••••••••••••••••••••"
                                        style={{ width: 220 }}
                                    />
                                    <button className="imds-btn imds-btn--outline imds-btn--icon" onClick={() => setShowKey(!showKey)}>
                                        {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                </div>
                            </SettingRow>
                            <SettingRow label="OCR Engine" description="AWS Textract for scanned PDF material safety datasheets">
                                <Toggle value={true} onChange={() => { }} />
                            </SettingRow>
                            <SettingRow label="XGBoost Model" description="Predictive compliance risk scoring model">
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--imds-success)" }}>v3.2.1 – AUC 91.4%</p>
                                    <p style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>Last trained: Jan 2024</p>
                                </div>
                            </SettingRow>
                            <SettingRow label="Confidence Threshold" description="Minimum AI extraction confidence to auto-accept material entries">
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <input className="imds-input" type="number" defaultValue="85" min="50" max="99" style={{ width: 80 }} />
                                    <span style={{ fontSize: 13, color: "var(--imds-text-secondary)" }}>%</span>
                                </div>
                            </SettingRow>
                            <SettingRow label="Vector DB (Pinecone)" description="Optional vector similarity search for substance matching">
                                <Toggle value={false} onChange={() => { }} />
                            </SettingRow>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeSection === "notifications" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>Notification Preferences</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Alert channels and trigger conditions</p>

                            <SettingRow label="Email Alerts" description="Send email notifications for compliance events">
                                <Toggle value={emailAlerts} onChange={setEmailAlerts} />
                            </SettingRow>
                            <SettingRow label="SVHC Detection Alerts" description="Notify when an SVHC substance is flagged above threshold">
                                <Toggle value={svhcAlerts} onChange={setSvhcAlerts} />
                            </SettingRow>
                            <SettingRow label="BOM Processing Complete" description="Alert when AI extraction is finished">
                                <Toggle value={true} onChange={() => { }} />
                            </SettingRow>
                            <SettingRow label="IMDS Rejection Alerts" description="Notify on predicted IMDS rejection (risk > 70%)">
                                <Toggle value={true} onChange={() => { }} />
                            </SettingRow>
                            <SettingRow label="Regulation Update Notifications" description="Alert when ECHA SVHC list or RoHS annex is updated">
                                <Toggle value={true} onChange={() => { }} />
                            </SettingRow>
                            <SettingRow label="Slack Webhook" description="Send alerts to your Slack channel">
                                <input className="imds-input" placeholder="https://hooks.slack.com/…" style={{ width: 280 }} />
                            </SettingRow>
                        </div>
                    )}

                    {/* Security */}
                    {activeSection === "security" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>Security & Role-Based Access Control</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Authentication policies and role management</p>

                            <SettingRow label="Two-Factor Authentication" description="Require 2FA for all users in this organization">
                                <Toggle value={true} onChange={() => { }} />
                            </SettingRow>
                            <SettingRow label="SSO (SAML 2.0)" description="Single Sign-On integration with enterprise IdP">
                                <select className="imds-select" style={{ width: 180 }}>
                                    <option>Not Configured</option>
                                    <option>Azure AD</option>
                                    <option>Okta</option>
                                    <option>Google Workspace</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Session Timeout" description="Auto-logout after period of inactivity">
                                <select className="imds-select" style={{ width: 140 }}>
                                    <option>30 minutes</option>
                                    <option>1 hour</option>
                                    <option>4 hours</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Audit Log Retention" description="How long immutable audit logs are retained">
                                <select className="imds-select" style={{ width: 140 }}>
                                    <option>7 Years (GDPR)</option>
                                    <option>5 Years</option>
                                    <option>3 Years</option>
                                </select>
                            </SettingRow>
                            <SettingRow label="Storage Encryption" description="AES-256 encryption for all stored files and data at rest">
                                <span className="imds-badge imds-badge--success">AES-256 Active</span>
                            </SettingRow>
                        </div>
                    )}

                    {/* Integrations */}
                    {activeSection === "integrations" && (
                        <div className="imds-card">
                            <p className="imds-card-title" style={{ marginBottom: 4 }}>External Integrations</p>
                            <p style={{ fontSize: 12, color: "var(--imds-text-muted)", marginBottom: 20 }}>Connect IMDSentinel AI to your enterprise systems</p>

                            {[
                                { name: "IMDS Portal (OEM)", desc: "Direct submission API to IMDS.org portal", status: "Connected", color: "success" },
                                { name: "AWS S3", desc: "File storage for BOM uploads and reports", status: "Connected", color: "success" },
                                { name: "AWS Textract", desc: "OCR service for scanned material datasheets", status: "Connected", color: "success" },
                                { name: "PostgreSQL (Neon)", desc: "Production database – Prisma ORM", status: "Connected", color: "success" },
                                { name: "Redis (BullMQ)", desc: "Async job queue for document processing workers", status: "Disconnected", color: "danger" },
                                { name: "Pinecone Vector DB", desc: "Semantic substance similarity search", status: "Not Configured", color: "neutral" },
                                { name: "PLM / PDM System", desc: "SAP PLM integration for BOM sync", status: "Not Configured", color: "neutral" },
                                { name: "ERP Integration", desc: "SAP S/4HANA or similar ERP data bridge", status: "Not Configured", color: "neutral" },
                            ].map((int, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(56,139,253,0.06)" }}>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{int.name}</p>
                                        <p style={{ fontSize: 12, color: "var(--imds-text-muted)" }}>{int.desc}</p>
                                    </div>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                        <span className={`imds-badge imds-badge--${int.color}`}>{int.status}</span>
                                        <button className="imds-btn imds-btn--outline imds-btn--sm">Configure</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Save Button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                        <button className="imds-btn imds-btn--primary" onClick={handleSave}>
                            <Save size={15} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
