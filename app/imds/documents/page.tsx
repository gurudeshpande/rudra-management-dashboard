"use client";

import React, { useState } from "react";
import { FileText, Upload, Search, Download, Eye, Trash2, Filter } from "lucide-react";

const DOCS = [
    { id: "DOC-001", name: "Bosch_MaterialDeclaration_2024.pdf", supplier: "Bosch GmbH", type: "Material Declaration", uploaded: "2024-02-20", size: "2.4 MB", status: "Processed" },
    { id: "DOC-002", name: "Continental_MSDS_Brake_Fluid.pdf", supplier: "Continental AG", type: "MSDS", uploaded: "2024-02-18", size: "1.8 MB", status: "Processed" },
    { id: "DOC-003", name: "BOM_FuelSystem_Q1_2024.xlsx", supplier: "Aptiv PLC", type: "BOM", uploaded: "2024-02-17", size: "842 KB", status: "Processed" },
    { id: "DOC-004", name: "Valeo_Lamp_Specification.pdf", supplier: "Valeo SA", type: "Spec Sheet", uploaded: "2024-02-15", size: "5.1 MB", status: "Pending OCR" },
    { id: "DOC-005", name: "Magna_Polymer_Compound_SDS.pdf", supplier: "Magna Intl.", type: "SDS", uploaded: "2024-02-14", size: "3.2 MB", status: "Failed" },
    { id: "DOC-006", name: "ZF_Transmision_BOM_Rev3.xlsx", supplier: "ZF Group", type: "BOM", uploaded: "2024-02-12", size: "1.1 MB", status: "Processed" },
];

export default function DocumentsPage() {
    const [search, setSearch] = useState("");
    const filtered = DOCS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.supplier.toLowerCase().includes(search.toLowerCase()));

    return (
        <div>
            <div className="imds-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 className="imds-page-title">Document Vault</h1>
                    <p className="imds-page-subtitle">Secure storage for BOM files, material datasheets, and supplier declarations</p>
                </div>
                <button className="imds-btn imds-btn--primary imds-btn--sm"><Upload size={14} /> Upload Document</button>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                {[
                    { label: "Total Documents", value: DOCS.length, color: "var(--imds-accent)" },
                    { label: "Processed", value: DOCS.filter(d => d.status === "Processed").length, color: "var(--imds-success)" },
                    { label: "Pending", value: DOCS.filter(d => d.status === "Pending OCR").length, color: "var(--imds-warning)" },
                    { label: "Failed", value: DOCS.filter(d => d.status === "Failed").length, color: "var(--imds-danger)" },
                ].map(s => (
                    <div key={s.label} className="imds-card" style={{ flex: 1, textAlign: "center", padding: 14 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "Space Grotesk" }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--imds-text-muted)" }} />
                    <input className="imds-input" style={{ width: "100%", paddingLeft: 36 }} placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="imds-select">
                    <option>All Types</option>
                    <option>BOM</option>
                    <option>MSDS</option>
                    <option>SDS</option>
                    <option>Spec Sheet</option>
                </select>
            </div>

            <div className="imds-table-wrap">
                <table className="imds-table">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>Supplier</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(d => (
                            <tr key={d.id}>
                                <td>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <FileText size={16} color={d.name.endsWith(".pdf") ? "var(--imds-danger)" : "var(--imds-success)"} />
                                        <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
                                    </div>
                                </td>
                                <td style={{ fontSize: 13 }}>{d.supplier}</td>
                                <td><span className="imds-badge imds-badge--neutral">{d.type}</span></td>
                                <td style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{d.size}</td>
                                <td style={{ fontSize: 12, color: "var(--imds-text-secondary)" }}>{d.uploaded}</td>
                                <td>
                                    <span className={`imds-badge imds-badge--${d.status === "Processed" ? "success" : d.status === "Failed" ? "danger" : "warning"}`}>
                                        {d.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button className="imds-btn imds-btn--outline imds-btn--icon"><Eye size={13} /></button>
                                        <button className="imds-btn imds-btn--outline imds-btn--icon"><Download size={13} /></button>
                                        <button className="imds-btn imds-btn--danger imds-btn--icon"><Trash2 size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
