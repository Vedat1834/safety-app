"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Shield,
    ClipboardCheck,
    FileText,
    LayoutDashboard,
    Users,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import clsx from 'clsx';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { activeProject, activeCustomer, customers, projects, setActiveCustomer, setActiveProject } = useAudit();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('sidebar_collapsed');
        if (stored === 'true') {
            setIsCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const nextState = !isCollapsed;
        setIsCollapsed(nextState);
        localStorage.setItem('sidebar_collapsed', String(nextState));
    };

    return (
        <div className={clsx(
            "flex h-screen flex-col justify-between border-r border-gray-100 bg-white shadow-sm z-50 transition-all duration-300 relative",
            isCollapsed ? "w-20" : "w-72"
        )}>
            {/* Toggle Button */}
            <button
                type="button"
                onClick={toggleCollapse}
                className="absolute top-8 -right-3 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 transition-all z-50"
                title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
            >
                {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
            </button>

            <div className={clsx("py-8 flex-1 overflow-y-auto", isCollapsed ? "px-3" : "px-6")}>
                {/* Logo Section */}
                <div className={clsx("flex items-center mb-8 px-2", isCollapsed ? "justify-center" : "gap-3")}>
                    {isCollapsed ? (
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-md flex-shrink-0 border border-gray-800">
                            <img src="/icon-192x192.png" alt="CoreSafe" className="w-8 h-8 object-contain" />
                        </div>
                    ) : (
                        <>
                            <div className="h-10 px-3 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-md flex-shrink-0 border border-gray-800">
                                <img src="/logo_koru.jpg" alt="CoreSafe" className="h-6 object-contain" />
                            </div>
                            <div>
                                <span className="block text-base font-black text-gray-900 leading-none">CoreSafe</span>
                                <span className="text-[8px] font-bold text-yellow-500 tracking-wider uppercase">Koru Teknoloji</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Access Section */}
                {!isCollapsed && (
                    <div className="mb-6 px-3 py-4 bg-gray-50 rounded-2xl border border-gray-100/50 space-y-3 mx-1">
                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Hızlı Erişim</span>
                        
                        {/* Customer Select */}
                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase">Müşteri</label>
                            <select
                                value={activeCustomer?.id || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setActiveCustomer(null);
                                        setActiveProject(null);
                                        router.push("/");
                                    } else {
                                        const found = customers.find(c => c.id === val);
                                        if (found) {
                                            setActiveCustomer(found);
                                            setActiveProject(null);
                                            router.push("/");
                                        }
                                    }
                                }}
                                className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] outline-none transition-all cursor-pointer"
                            >
                                <option value="">Müşteri Seçin...</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Project Select */}
                        <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-gray-400 uppercase">Proje</label>
                            <select
                                value={activeProject?.id || ""}
                                disabled={!activeCustomer}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                        setActiveProject(null);
                                    } else {
                                        const customerProjects = projects.filter(p => p.customer_id === activeCustomer?.id);
                                        const found = customerProjects.find(p => p.id === val);
                                        if (found) {
                                            setActiveProject(found);
                                            router.push(`/projects/${found.id}`);
                                        }
                                    }
                                }}
                                className="w-full bg-white border border-gray-200 rounded-xl px-2 py-1.5 text-xs font-bold text-gray-700 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] outline-none transition-all cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                <option value="">Proje Seçin...</option>
                                {activeCustomer && projects
                                    .filter(p => p.customer_id === activeCustomer.id)
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.project_no})</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                )}

                <ul className="space-y-2">
                    {/* Main Navigation */}
                    {!isCollapsed && (
                        <li className="px-2 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ana Menü</li>
                    )}
                    <li>
                        <Link
                            href="/"
                            className={clsx(
                                "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                isCollapsed ? "justify-center" : "gap-3",
                                pathname === '/'
                                    ? "bg-[#FFD600] text-black shadow-md shadow-yellow-500/20"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            )}
                            title="Müşteriler"
                        >
                            <Users className="size-5 flex-shrink-0" />
                            {!isCollapsed && <span>Müşteriler</span>}
                        </Link>
                    </li>

                    {activeProject && (
                        <>
                            <li className="mt-8 mb-2 px-2 flex flex-col justify-center">
                                {!isCollapsed ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aktif Proje</span>
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-md">{activeProject.project_no}</span>
                                    </div>
                                ) : (
                                    <div className="w-full border-t border-gray-100 my-2" />
                                )}
                            </li>

                            <li>
                                <Link
                                    href={`/projects/${activeProject.id}`}
                                    className={clsx(
                                        "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                        isCollapsed ? "justify-center" : "gap-3",
                                        pathname === `/projects/${activeProject.id}`
                                            ? "bg-[#FFD600] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                    title="Proje Paneli"
                                >
                                    <LayoutDashboard className="size-5 flex-shrink-0" />
                                    {!isCollapsed && <span>Proje Paneli</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/risk-assessment"
                                    className={clsx(
                                        "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                        isCollapsed ? "justify-center" : "gap-3",
                                        pathname === "/risk-assessment"
                                            ? "bg-[#FFD600] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                    title="Risk Değerlendirmesi"
                                >
                                    <Shield className="size-5 flex-shrink-0" />
                                    {!isCollapsed && <span>Risk Değerlendirmesi</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/functional-test"
                                    className={clsx(
                                        "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                        isCollapsed ? "justify-center" : "gap-3",
                                        pathname === "/functional-test"
                                            ? "bg-[#FFD600] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                    title="Fonksiyonel Test"
                                >
                                    <ClipboardCheck className="size-5 flex-shrink-0" />
                                    {!isCollapsed && <span>Fonksiyonel Test</span>}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/report"
                                    className={clsx(
                                        "flex items-center rounded-xl px-4 py-3 text-sm font-bold transition-all",
                                        isCollapsed ? "justify-center" : "gap-3",
                                        pathname === "/report"
                                            ? "bg-[#FFD600] text-black shadow-md shadow-yellow-500/20"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-black"
                                    )}
                                    title="Rapor"
                                >
                                    <FileText className="size-5 flex-shrink-0" />
                                    {!isCollapsed && <span>Rapor</span>}
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
