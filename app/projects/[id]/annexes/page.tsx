"use client";

import { useAudit } from "@/app/context/AuditContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Globe, FileText, CheckCircle } from "lucide-react";
import annexesTr from "@/app/data/annexes_tr.json";
import annexesEn from "@/app/data/annexes_en.json";

export default function AnnexesPage() {
    const params = useParams();
    const router = useRouter();
    const { projects, setActiveProject, activeProject, activeCustomer } = useAudit();
    const projectId = params.id as string;
    const [activeLang, setActiveLang] = useState<'tr' | 'en'>('tr');

    useEffect(() => {
        if (!activeProject && projectId) {
            const found = projects.find(p => p.id === projectId);
            if (found) setActiveProject(found);
        }
    }, [projectId, activeProject, projects, setActiveProject]);

    if (!activeProject) return <div className="p-8 text-center">Proje yükleniyor...</div>;

    const currentAnnexes = activeLang === 'tr' ? annexesTr : annexesEn;

    const renderCell = (cell: any) => {
        if (typeof cell === 'string') {
            return cell.split('\n').map((line, idx) => <div key={idx}>{line}</div>);
        }
        if (cell && typeof cell === 'object') {
            if (Array.isArray(cell)) {
                return cell.map((item, idx) => (
                    <div key={idx} className="my-1 flex items-center gap-1.5">
                        {item.type === 'image' ? (
                            <img src={item.src} className="max-h-8 object-contain" alt="cell icon" />
                        ) : (
                            <span className="text-xs">{item.text}</span>
                        )}
                    </div>
                ));
            }
            if (cell.type === 'image') {
                return <img src={cell.src} className="max-h-8 object-contain" alt="cell icon" />;
            }
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] -mx-4 -my-4 p-8 font-sans text-gray-900">
            {/* Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/projects/${projectId}`)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {activeLang === 'tr' ? 'Rapor Ekleri' : 'Report Annexes'}
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">{activeProject.name}</p>
                    </div>
                </div>

                {/* Language Selectors & Stats */}
                <div className="flex items-center gap-4">
                    <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200">
                        <button
                            onClick={() => setActiveLang('tr')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${activeLang === 'tr' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            <Globe className="size-3.5" />
                            Türkçe (TR)
                        </button>
                        <button
                            onClick={() => setActiveLang('en')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${activeLang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            <Globe className="size-3.5" />
                            English (EN)
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Callout */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8 max-w-5xl flex gap-3.5 items-start">
                <CheckCircle className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-sm font-bold text-blue-900">
                        {activeLang === 'tr' ? 'Sabit Ekler Rapor Çıktısına Hazır' : 'Static Annexes Ready for Export'}
                    </h5>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        {activeLang === 'tr' 
                          ? 'Bu bölümdeki Türkçe ekler ve şekiller, oluşturacağınız PDF raporunda "Sonuç ve Öneriler" sayfasından hemen önce otomatik olarak basılacaktır. Ekler üzerinde herhangi bir düzenleme yapmanıza gerek yoktur.'
                          : 'The English annexes and pictograms listed in this section will be automatically appended to your PDF report right before the Conclusion page. No editing is required.'}
                    </p>
                </div>
            </div>

            {/* Document Sheet Layout */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_35px_-15px_rgba(0,0,0,0.08)] max-w-5xl p-10 md:p-12 min-h-[80vh] overflow-x-auto">
                <div className="space-y-6 max-w-4xl mx-auto">
                    {currentAnnexes.map((item: any, idx: number) => {
                        if (item.type === 'heading') {
                            const levelClass = item.level === 1 
                                ? 'text-xl md:text-2xl font-black text-gray-900 border-b-2 border-[#FFD600] pb-2 mt-8 mb-4 uppercase'
                                : 'text-lg font-bold text-[#2980b9] mt-6 mb-3';
                            return (
                                <h3 key={idx} className={levelClass}>
                                    {item.text}
                                </h3>
                            );
                        }

                        if (item.type === 'paragraph') {
                            return (
                                <p key={idx} className="text-sm text-gray-700 leading-relaxed text-justify mb-4">
                                    {item.runs ? item.runs.map((run: any, rIdx: number) => (
                                        run.bold ? (
                                            <strong key={rIdx} className="font-extrabold text-black">{run.text}</strong>
                                        ) : (
                                            <span key={rIdx}>{run.text}</span>
                                        )
                                    )) : item.text}
                                </p>
                            );
                        }

                        if (item.type === 'image') {
                            return (
                                <div key={idx} className="flex justify-center my-6 p-2 bg-gray-50 rounded-2xl border border-gray-100 max-w-xl mx-auto">
                                    <img 
                                        src={item.src} 
                                        alt="Annex figure" 
                                        className="max-h-72 object-contain rounded-xl"
                                    />
                                </div>
                            );
                        }

                        if (item.type === 'table') {
                            return (
                                <div key={idx} className="my-6 overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700">
                                        <thead className="bg-gray-50 font-bold text-gray-900 uppercase tracking-wider text-[10px]">
                                            <tr>
                                                {item.headers.map((h: string, hIdx: number) => (
                                                    <th key={hIdx} className="px-4 py-3 border-r last:border-r-0 border-gray-200">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {item.rows.map((row: any[], rIdx: number) => (
                                                <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                                                    {row.map((cell: any, cIdx: number) => (
                                                        <td key={cIdx} className="px-4 py-3 border-r last:border-r-0 border-gray-200 align-top">
                                                            {renderCell(cell)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
