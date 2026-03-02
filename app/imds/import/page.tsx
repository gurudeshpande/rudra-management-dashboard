"use client";

import React, { useState, useRef } from "react";
import {
    Upload, FileSpreadsheet, FileText, CheckCircle2,
    XCircle, AlertTriangle, Cpu, ChevronRight,
    Trash2, Eye, Download, Loader2, Plus, Minus
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type UploadedFile = {
    name: string;
    size: number;
    type: "bom" | "pdf";
    status: "pending" | "processing" | "done" | "error";
    rows?: number;
};

type ParsedMaterial = {
    partNumber: string;
    partName: string;
    substance: string;
    cas: string;
    weightPct: number;
    category: string;
    status: "ok" | "warn" | "fail";
};

const MOCK_PARSED: ParsedMaterial[] = [
    { partNumber: "BRK-10291", partName: "Brake Pad Assembly", substance: "Steel Alloy (Fe)", cas: "N/A", weightPct: 62.5, category: "Metal", status: "ok" },
    { partNumber: "BRK-10291", partName: "Brake Pad Assembly", substance: "Cadmium (Cd)", cas: "7440-43-9", weightPct: 0.012, category: "SVHC", status: "fail" },
    { partNumber: "BRK-10291", partName: "Brake Pad Assembly", substance: "Phenol Resin", cas: "100-66-3", weightPct: 18.3, category: "Polymer", status: "ok" },
    { partNumber: "INJ-4421A", partName: "Fuel Injector Body", substance: "Aluminium Alloy", cas: "N/A", weightPct: 88.0, category: "Metal", status: "ok" },
    { partNumber: "INJ-4421A", partName: "Fuel Injector Body", substance: "DEHP Plasticizer", cas: "117-81-7", weightPct: 0.09, category: "SVHC", status: "warn" },
    { partNumber: "CON-7712", partName: "Wiring Connector", substance: "Copper (Cu)", cas: "7440-50-8", weightPct: 71.2, category: "Metal", status: "ok" },
    { partNumber: "CON-7712", partName: "Wiring Connector", substance: "Lead (Pb)", cas: "7439-92-1", weightPct: 0.08, category: "SVHC", status: "ok" },
    { partNumber: "SEN-3301", partName: "Oxygen Sensor", substance: "Platinum Group Metal", cas: "7440-06-4", weightPct: 3.2, category: "Metal", status: "ok" },
    { partNumber: "SEN-3301", partName: "Oxygen Sensor", substance: "Chromium VI Compound", cas: "18540-29-9", weightPct: 0.0, category: "SVHC", status: "ok" },
];

// ── Components ────────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
    const steps = [
        { label: "Upload Files" },
        { label: "AI Extraction" },
        { label: "Review & Normalize" },
        { label: "Export to IMDS" },
    ];
    return (
        <div className="imds-steps">
            {steps.map((s, i) => {
                const status = i < step ? "done" : i === step ? "active" : "idle";
                return (
                    <div key={i} className={`imds-step imds-step--${status}`}>
                        <div className="imds-step-circle">
                            {status === "done" ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        <span className="imds-step-label">{s.label}</span>
                        {i < steps.length - 1 && <div className="imds-step-line" />}
                    </div>
                );
            })}
        </div>
    );
}

function FileDropZone({
    onFile,
    accept,
    label,
    sublabel,
    icon,
}: {
    onFile: (f: File) => void;
    accept: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
}) {
    const [drag, setDrag] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const file = e.dataTransfer.files[0];
        if (file) onFile(file);
    };

    return (
        <div
            className={`imds-upload-zone ${drag ? "imds-upload-zone--active" : ""}`}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <div className="imds-upload-icon">{icon}</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--imds-text-primary)", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 13, color: "var(--imds-text-secondary)", marginBottom: 12 }}>{sublabel}</p>
            <button className="imds-btn imds-btn--outline imds-btn--sm">Browse Files</button>
        </div>
    );
}

function StatusPill({ status }: { status: "ok" | "warn" | "fail" }) {
    return (
        <span className={`imds-badge imds-badge--${status === "ok" ? "success" : status === "fail" ? "danger" : "warning"}`}>
            {status === "ok" ? "✓ OK" : status === "fail" ? "✗ Violation" : "⚠ Near Limit"}
        </span>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BOMImportPage() {
    const [step, setStep] = useState(0);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [filter, setFilter] = useState<"all" | "ok" | "warn" | "fail">("all");
    const [manualRows, setManualRows] = useState([
        { partNumber: "", partName: "", substance: "", cas: "", weightPct: "" }
    ]);

    const addFile = (file: File, type: "bom" | "pdf") => {
        setFiles(prev => [
            ...prev,
            { name: file.name, size: file.size, type, status: "pending", rows: type === "bom" ? Math.floor(Math.random() * 400) + 100 : undefined }
        ]);
    };

    const runProcessing = () => {
        setProcessing(true);
        setFiles(prev => prev.map(f => ({ ...f, status: "processing" as const })));
        setTimeout(() => {
            setFiles(prev => prev.map(f => ({ ...f, status: "done" as const })));
            setProcessing(false);
            setStep(2);
            setShowResults(true);
        }, 2800);
    };

    const filtered = showResults
        ? MOCK_PARSED.filter(m => filter === "all" ? true : m.status === filter)
        : [];

    return (
        <div>
            <div className="imds-page-header">
                <h1 className="imds-page-title">BOM Import & AI Extraction</h1>
                <p className="imds-page-subtitle">Upload BOM files or supplier datasheets for automated IMDS-compatible material extraction</p>
            </div>

            <StepIndicator step={step} />

            {/* Step 0 & 1: Upload */}
            {step <= 1 && (
                <>
                    {/* Upload Cards */}
                    <div className="imds-grid-2" style={{ marginBottom: 24 }}>
                        <div className="imds-card">
                            <p className="imds-card-title"><FileSpreadsheet size={14} /> BOM File (Excel / CSV)</p>
                            <FileDropZone
                                onFile={f => { addFile(f, "bom"); setStep(1); }}
                                accept=".xlsx,.csv,.xls"
                                label="Drop BOM Spreadsheet"
                                sublabel="Supports Excel (.xlsx, .xls) and CSV formats · Max 50MB"
                                icon={<FileSpreadsheet size={30} color="var(--imds-accent)" />}
                            />
                        </div>
                        <div className="imds-card">
                            <p className="imds-card-title"><FileText size={14} /> Supplier datasheets (PDF)</p>
                            <FileDropZone
                                onFile={f => { addFile(f, "pdf"); setStep(1); }}
                                accept=".pdf"
                                label="Drop Supplier Documents"
                                sublabel="Material safety datasheets, specification sheets · Max 50MB"
                                icon={<FileText size={30} color="var(--imds-info)" />}
                            />
                        </div>
                    </div>

                    {/* Manual Entry */}
                    <div className="imds-card" style={{ marginBottom: 24 }}>
                        <p className="imds-card-title"><Plus size={14} /> Manual Material Entry</p>
                        <div style={{ overflowX: "auto" }}>
                            <table className="imds-table" style={{ minWidth: 700 }}>
                                <thead>
                                    <tr>
                                        <th>Part Number</th>
                                        <th>Part Name</th>
                                        <th>Substance</th>
                                        <th>CAS No.</th>
                                        <th>Weight %</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {manualRows.map((row, i) => (
                                        <tr key={i}>
                                            {["partNumber", "partName", "substance", "cas", "weightPct"].map(field => (
                                                <td key={field}>
                                                    <input
                                                        className="imds-input"
                                                        style={{ width: "100%", padding: "6px 10px", fontSize: 12 }}
                                                        value={(row as any)[field]}
                                                        placeholder={field === "weightPct" ? "0.00" : "–"}
                                                        onChange={e => {
                                                            const updated = [...manualRows];
                                                            (updated[i] as any)[field] = e.target.value;
                                                            setManualRows(updated);
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                            <td>
                                                <button className="imds-btn imds-btn--danger imds-btn--icon"
                                                    onClick={() => setManualRows(prev => prev.filter((_, idx) => idx !== i))}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            className="imds-btn imds-btn--outline imds-btn--sm"
                            style={{ marginTop: 12 }}
                            onClick={() => setManualRows(prev => [...prev, { partNumber: "", partName: "", substance: "", cas: "", weightPct: "" }])}
                        >
                            <Plus size={13} /> Add Row
                        </button>
                    </div>

                    {/* Uploaded Files List */}
                    {files.length > 0 && (
                        <div className="imds-card" style={{ marginBottom: 24 }}>
                            <p className="imds-card-title">Queued Files ({files.length})</p>
                            {files.map((f, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: "1px solid var(--imds-border)" }}>
                                    {f.type === "bom" ? <FileSpreadsheet size={18} color="var(--imds-success)" /> : <FileText size={18} color="var(--imds-info)" />}
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</p>
                                        <p style={{ fontSize: 11, color: "var(--imds-text-muted)" }}>
                                            {(f.size / 1024).toFixed(1)} KB {f.rows ? `· ${f.rows} rows detected` : ""}
                                        </p>
                                    </div>
                                    <span className={`imds-badge imds-badge--${f.status === "done" ? "success" : f.status === "error" ? "danger" : f.status === "processing" ? "info" : "neutral"}`}>
                                        {f.status === "processing" ? "🔄 AI Parsing…" : f.status === "done" ? "✓ Done" : f.status === "error" ? "✗ Error" : "Queued"}
                                    </span>
                                    <button className="imds-btn imds-btn--danger imds-btn--icon" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Run AI Button */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                        {files.length === 0 && <p style={{ fontSize: 13, color: "var(--imds-text-muted)", alignSelf: "center" }}>Upload at least one file or add manual rows to continue</p>}
                        <button
                            className="imds-btn imds-btn--primary"
                            disabled={processing}
                            onClick={() => { setStep(1); runProcessing(); }}
                            style={{ opacity: processing ? 0.7 : 1 }}
                        >
                            {processing
                                ? <><Loader2 size={16} className="spinning" /> AI Extracting…</>
                                : <><Cpu size={16} /> Run AI Extraction</>}
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Results */}
            {showResults && (
                <div style={{ marginTop: step > 1 ? 0 : 32 }}>
                    {/* AI Summary */}
                    <div className="imds-ai-box" style={{ marginBottom: 20 }}>
                        <span className="imds-ai-box-label">🤖 GPT-4 Extraction Summary</span>
                        <p className="imds-ai-text">
                            Extracted <strong style={{ color: "var(--imds-text-primary)" }}>9 material entries</strong> from
                            2 uploaded files with <strong style={{ color: "var(--imds-text-primary)" }}>94.2% confidence</strong>.
                            Detected <strong style={{ color: "var(--imds-danger)" }}>1 direct SVHC violation</strong> (Cadmium in BRK-10291),
                            1 near-threshold substance (DEHP in INJ-4421A).
                            All materials have been normalized to IMDS classification schema v6.3.
                            Recommend substituting Cadmium with Zinc alloy alternatives per IMDS material group 8.3.
                        </p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                        {[
                            { label: "Total Entries", value: MOCK_PARSED.length, color: "var(--imds-accent)" },
                            { label: "Compliant", value: MOCK_PARSED.filter(m => m.status === "ok").length, color: "var(--imds-success)" },
                            { label: "Near Limit", value: MOCK_PARSED.filter(m => m.status === "warn").length, color: "var(--imds-warning)" },
                            { label: "Violations", value: MOCK_PARSED.filter(m => m.status === "fail").length, color: "var(--imds-danger)" },
                        ].map(stat => (
                            <div key={stat.label} className="imds-card" style={{ flex: 1, textAlign: "center", padding: 14 }}>
                                <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: 12, color: "var(--imds-text-secondary)", marginTop: 2 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filter Tabs */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div className="imds-tabs" style={{ marginBottom: 0 }}>
                            {(["all", "ok", "warn", "fail"] as const).map(f => (
                                <button key={f} className={`imds-tab-btn ${filter === f ? "imds-tab-btn--active" : ""}`} onClick={() => setFilter(f)}>
                                    {f === "all" ? "All" : f === "ok" ? "✓ Compliant" : f === "warn" ? "⚠ Near Limit" : "✗ Violations"}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button className="imds-btn imds-btn--outline imds-btn--sm"><Download size={13} /> Export CSV</button>
                            <button className="imds-btn imds-btn--primary imds-btn--sm" onClick={() => setStep(3)}>
                                Finalize & Push to IMDS <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Extracted Materials Table */}
                    <div className="imds-table-wrap">
                        <table className="imds-table">
                            <thead>
                                <tr>
                                    <th>Part Number</th>
                                    <th>Part Name</th>
                                    <th>Substance</th>
                                    <th>CAS Number</th>
                                    <th>Weight %</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m, i) => (
                                    <tr key={i}>
                                        <td><span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--imds-accent)" }}>{m.partNumber}</span></td>
                                        <td style={{ fontWeight: 500 }}>{m.partName}</td>
                                        <td>{m.substance}</td>
                                        <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{m.cas}</span></td>
                                        <td>
                                            <span style={{ fontWeight: 700, color: m.status === "fail" ? "var(--imds-danger)" : m.status === "warn" ? "var(--imds-warning)" : "var(--imds-text-primary)" }}>
                                                {m.weightPct.toFixed(3)}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`imds-badge imds-badge--${m.category === "SVHC" ? "warning" : "neutral"}`}>{m.category}</span>
                                        </td>
                                        <td><StatusPill status={m.status} /></td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                <button className="imds-btn imds-btn--outline imds-btn--icon"><Eye size={13} /></button>
                                                <button className="imds-btn imds-btn--outline imds-btn--icon"><Trash2 size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
                <div className="imds-card imds-card--glow" style={{ textAlign: "center", padding: 48, marginTop: 24 }}>
                    <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--imds-success-bg)", border: "2px solid var(--imds-success)", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={36} color="var(--imds-success)" />
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>BOM Submitted to IMDS Portal</h2>
                    <p style={{ color: "var(--imds-text-secondary)", fontSize: 14, marginBottom: 24 }}>
                        9 material entries successfully normalized and pushed to IMDS. Reference ID: <strong style={{ color: "var(--imds-accent)" }}>IMDS-2024-BOM-0891</strong>
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button className="imds-btn imds-btn--outline" onClick={() => { setStep(0); setFiles([]); setShowResults(false); setFilter("all"); }}>
                            Import Another BOM
                        </button>
                        <a href="/imds/compliance" className="imds-btn imds-btn--primary">
                            Run Compliance Check <ChevronRight size={14} />
                        </a>
                    </div>
                </div>
            )}

            <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
