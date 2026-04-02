"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Shield,
    Upload,
    AlertTriangle,
    BarChart3,
    FileText,
    Settings,
    Bell,
    ChevronLeft,
    ChevronRight,
    Cpu,
    FlaskConical,
    BookOpen,
    Activity,
    LogOut,
    Users,
    Building2,
} from "lucide-react";
import "../globals.css";
import "./imds.css";

const navItems = [
    {
        section: "Core",
        items: [
            { label: "Dashboard", href: "/imds", icon: LayoutDashboard },
            { label: "BOM Import", href: "/imds/import", icon: Upload },
            { label: "Compliance Check", href: "/imds/compliance", icon: Shield },
        ],
    },
    {
        section: "Intelligence",
        items: [
            { label: "Risk Predictor", href: "/imds/predictor", icon: Activity },
            { label: "Substance Library", href: "/imds/substances", icon: FlaskConical },
            { label: "Reports", href: "/imds/reports", icon: BarChart3 },
        ],
    },
    {
        section: "Management",
        items: [
            { label: "Documents", href: "/imds/documents", icon: FileText },
            { label: "Audit Logs", href: "/imds/audit", icon: BookOpen },
            { label: "Team", href: "/imds/team", icon: Users },
            { label: "Suppliers", href: "/imds/suppliers", icon: Building2 },
        ],
    },
    {
        section: "System",
        items: [
            { label: "Settings", href: "/imds/settings", icon: Settings },
        ],
    },
];

export default function IMDSLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();

    return (
        <div className="imds-body" style={{ minHeight: "100vh" }}>
            <div className="imds-shell">
                {/* Sidebar */}
                <aside className={`imds-sidebar ${collapsed ? "imds-sidebar--collapsed" : ""}`}>
                    {/* Logo */}
                    <div className="imds-logo-area">
                        <div className="imds-logo-icon">
                            <Cpu size={22} className="imds-logo-cpu" />
                        </div>
                        {!collapsed && (
                            <div className="imds-logo-text">
                                <span className="imds-logo-name">IMDSentinel</span>
                                <span className="imds-logo-badge">AI</span>
                            </div>
                        )}
                    </div>

                    {/* Collapse Toggle */}
                    <button
                        className="imds-collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {/* Nav */}
                    <nav className="imds-nav">
                        {navItems.map((section) => (
                            <div key={section.section} className="imds-nav-section">
                                {!collapsed && (
                                    <p className="imds-nav-section-label">{section.section}</p>
                                )}
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`imds-nav-item ${isActive ? "imds-nav-item--active" : ""}`}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <item.icon size={18} className="imds-nav-icon" />
                                            {!collapsed && <span>{item.label}</span>}
                                            {isActive && <span className="imds-nav-indicator" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="imds-sidebar-footer">
                        <div className="imds-user-avatar">JD</div>
                        {!collapsed && (
                            <div className="imds-user-info">
                                <p className="imds-user-name">John Doe</p>
                                <p className="imds-user-role">OEM Compliance Lead</p>
                            </div>
                        )}
                        {!collapsed && (
                            <button className="imds-logout-btn" aria-label="Logout">
                                <LogOut size={15} />
                            </button>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="imds-main">
                    {/* Top Bar */}
                    <header className="imds-topbar">
                        <div className="imds-topbar-left">
                            <div className="imds-status-pill">
                                <span className="imds-status-dot" />
                                <span>System Nominal</span>
                            </div>
                        </div>
                        <div className="imds-topbar-right">
                            <button className="imds-icon-btn" aria-label="Alerts">
                                <Bell size={18} />
                                <span className="imds-notif-badge">3</span>
                            </button>
                            <div className="imds-topbar-version">v2.4.1 MVP</div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="imds-content">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
