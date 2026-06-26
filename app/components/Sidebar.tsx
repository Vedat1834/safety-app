"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Shield,
    ClipboardCheck,
    FileText,
    LayoutDashboard,
    Users,
    Zap,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import clsx from 'clsx';

export default function Sidebar() {
    const pathname = usePathname();
    const { activeProject } = useAudit();
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
                <div className={clsx("flex items-center mb-10 px-2", isCollapsed ? "justify-center" : "gap-3")}>
                    <div className="w-10 h-10 bg-[#FFD600] rounded-xl flex items-center justify-center text-black shadow-lg shadow-yellow-500/20 flex-shrink-0">
                        <Zap className="size-6 fill-black" />
                    </div>
                    {!isCollapsed && (
                        <div>
                            <span className="block text-lg font-black text-gray-900 leading-none">SAFETY</span>
                            <span className="text-xs font-bold text-gray-400 tracking-widest">APP</span>
                        </div>
                    )}
                </div>

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
