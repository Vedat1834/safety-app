"use client";

import { useAudit } from "@/app/context/AuditContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shield, ClipboardCheck, FileText, ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

export default function ProjectDashboard() {
    const params = useParams();
    const router = useRouter();
    const { projects, setActiveProject, activeProject, activeCustomer } = useAudit();
    const projectId = params.id as string;

    useEffect(() => {
        if (!activeProject && projectId) {
            const found = projects.find(p => p.id === projectId);
            if (found) setActiveProject(found);
        }
    }, [projectId, activeProject, projects, setActiveProject]);

    if (!activeProject) return <div className="p-8 text-center">Proje yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#F8F9FA] -mx-4 -my-4 p-8 font-sans text-gray-900">

            {/* Top Navigation Bar Style */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/customers')}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{activeProject.name}</h1>
                        <p className="text-sm text-gray-500 font-medium">Proje No: <span className="text-gray-900">{activeProject.project_no}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden md:block">
                        <span className="text-xs font-bold text-gray-400 block uppercase tracking-wider">Müşteri</span>
                        <span className="text-sm font-bold text-gray-900">{activeCustomer?.name}</span>
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">

                {/* Risk Assessment Card */}
                <Link href="/risk-assessment" className="group bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFC107] group-hover:bg-[#FFD600] group-hover:text-black transition-colors">
                            <Shield className="size-6" />
                        </div>
                        <span className="bg-gray-50 text-gray-400 p-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                            <ArrowLeft className="size-4 rotate-180" />
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Risk Değerlendirmesi</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Tehlike analizi ve risk skorlama modülü.</p>
                </Link>

                {/* Functional Test */}
                <Link href="/functional-test" className="group bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFC107] group-hover:bg-[#FFD600] group-hover:text-black transition-colors">
                            <ClipboardCheck className="size-6" />
                        </div>
                        <span className="bg-gray-50 text-gray-400 p-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                            <ArrowLeft className="size-4 rotate-180" />
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Fonksiyonel Test</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Güvenlik fonksiyon doğrulama.</p>
                </Link>

                {/* Cümle Kalıpları */}
                <Link href={`/projects/${projectId}/templates`} className="group bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFC107] group-hover:bg-[#FFD600] group-hover:text-black transition-colors">
                            <FileText className="size-6" />
                        </div>
                        <span className="bg-gray-50 text-gray-400 p-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                            <ArrowLeft className="size-4 rotate-180" />
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Cümle Kalıpları</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Hazır tehlike ve önlem şablonları.</p>
                </Link>

                {/* Makine Bilgileri */}
                <Link href={`/projects/${projectId}/machine-info`} className="group bg-white p-6 rounded-[24px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-[#FFC107] group-hover:bg-[#FFD600] group-hover:text-black transition-colors">
                            <Settings className="size-6" />
                        </div>
                        <span className="bg-gray-50 text-gray-400 p-2 rounded-full group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors">
                            <ArrowLeft className="size-4 rotate-180" />
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Makine Bilgileri</h3>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Limitler, teknik özellikler ve rapor entegrasyonu.</p>
                </Link>

            </div>
        </div>
    );
}
