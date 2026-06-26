"use client";

import { useAudit } from "@/app/context/AuditContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, ShieldAlert, CheckSquare, Square } from "lucide-react";

export default function MachineInfoPage() {
    const params = useParams();
    const router = useRouter();
    const { projects, setActiveProject, activeProject, updateProject } = useAudit();
    const projectId = params.id as string;

    const [formData, setFormData] = useState({
        machine_limits: "",
        machine_technical_specs: "",
        machine_intended_use: "",
        include_machine_info: false
    });

    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

    useEffect(() => {
        if (!activeProject && projectId) {
            const found = projects.find(p => p.id === projectId);
            if (found) setActiveProject(found);
        }
    }, [projectId, activeProject, projects, setActiveProject]);

    useEffect(() => {
        if (activeProject) {
            setFormData({
                machine_limits: activeProject.machine_limits || "",
                machine_technical_specs: activeProject.machine_technical_specs || "",
                machine_intended_use: activeProject.machine_intended_use || "",
                include_machine_info: !!activeProject.include_machine_info
            });
        }
    }, [activeProject]);

    if (!activeProject) return <div className="p-8 text-center">Proje yükleniyor...</div>;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus("saving");
        
        updateProject(activeProject.id, {
            machine_limits: formData.machine_limits,
            machine_technical_specs: formData.machine_technical_specs,
            machine_intended_use: formData.machine_intended_use,
            include_machine_info: formData.include_machine_info
        });

        setSaveStatus("success");
        setTimeout(() => {
            setSaveStatus("idle");
            router.push(`/projects/${activeProject.id}`);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] -mx-4 -my-4 p-8 font-sans text-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push(`/projects/${activeProject.id}`)}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Makine Bilgileri</h1>
                        <p className="text-sm text-gray-500 font-medium">
                            Proje: <span className="text-gray-900 font-bold">{activeProject.name}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSave} className="max-w-3xl bg-white p-8 rounded-[30px] shadow-sm border border-gray-100 space-y-6">
                
                {/* Rapor Dahil Etme Kutusu */}
                <div 
                    onClick={() => setFormData(prev => ({ ...prev, include_machine_info: !prev.include_machine_info }))}
                    className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer border-2 transition-all select-none ${
                        formData.include_machine_info 
                            ? "border-[#FFD600] bg-yellow-50/20 shadow-xs" 
                            : "border-gray-100 bg-gray-50/50 hover:bg-gray-50"
                    }`}
                >
                    <div className="text-gray-900">
                        {formData.include_machine_info ? (
                            <CheckSquare className="size-6 text-black fill-[#FFD600]" />
                        ) : (
                            <Square className="size-6 text-gray-300" />
                        )}
                    </div>
                    <div className="flex-1">
                        <span className="font-bold text-gray-900 block text-sm sm:text-base">
                            Bu bölümü risk değerlendirme raporuna dahil et
                        </span>
                        <span className="text-xs text-gray-400 font-medium block mt-0.5">
                            İşaretlenirse, girilen makine bilgileri PDF raporuna ayrı bir bölüm olarak eklenir.
                        </span>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Limitler */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Makinenin Limitleri
                        </label>
                        <textarea
                            rows={4}
                            className="input-field"
                            placeholder="Örn: Çalışma hız limitleri, çevre koşulları, personel yetkinlik limitleri, operasyonel zaman sınırları..."
                            value={formData.machine_limits}
                            onChange={e => setFormData({ ...formData, machine_limits: e.target.value })}
                        />
                    </div>

                    {/* Teknik Özellikler */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Teknik Özellikleri
                        </label>
                        <textarea
                            rows={4}
                            className="input-field"
                            placeholder="Örn: Güç değerleri, gerilim, pnömatik/hidrolik basınç seviyeleri, fiziksel boyutlar, ağırlık, gürültü emisyon değerleri..."
                            value={formData.machine_technical_specs}
                            onChange={e => setFormData({ ...formData, machine_technical_specs: e.target.value })}
                        />
                    </div>

                    {/* Kullanım Amacı / Diğer */}
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Kullanım Amacı / Diğer Bilgiler
                        </label>
                        <textarea
                            rows={4}
                            className="input-field"
                            placeholder="Örn: Makinenin tasarlanan çalışma amacı, öngörülen kullanım şekli, yasaklı kullanım senaryoları ve diğer genel açıklamalar..."
                            value={formData.machine_intended_use}
                            onChange={e => setFormData({ ...formData, machine_intended_use: e.target.value })}
                        />
                    </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.push(`/projects/${activeProject.id}`)}
                        className="px-8 py-3 text-sm font-bold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        type="submit"
                        disabled={saveStatus !== "idle"}
                        className="flex items-center gap-2 px-10 py-3 text-sm font-bold bg-[#FFD600] text-black rounded-xl hover:bg-[#FACE15] shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="size-4" />
                        <span>{saveStatus === "saving" ? "Kaydediliyor..." : saveStatus === "success" ? "Kaydedildi!" : "Kaydet"}</span>
                    </button>
                </div>
            </form>

            <style jsx>{`
                .input-field {
                    display: block;
                    width: 100%;
                    border-radius: 14px;
                    border: 1px solid #e5e7eb;
                    padding: 0.85rem 1.15rem;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                    background-color: #FCFDFE;
                    font-weight: 500;
                    resize: vertical;
                }
                .input-field:focus {
                    border-color: #FFD600;
                    box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
                    background-color: white;
                }
            `}</style>
        </div>
    );
}
