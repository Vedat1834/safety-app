"use client";

import { useState } from "react";
import { useAudit } from "../context/AuditContext";
import RiskAssessmentForm from "../components/RiskAssessmentForm";
import { getRiskIndexStatus } from "../lib/hrn-constants";
import { Trash2, Edit, ImageIcon, FileText } from "lucide-react";
import { RiskAssessment } from "../types";
import { generatePDF } from "../lib/report-generator";

const translations = {
    tr: {
        title: "Risk Değerlendirmesi",
        subtitle: "Tehlike tanımlama ve risk puanlama işlemleri.",
        downloadBtn: "Raporu İndir",
        addBtn: "Yeni Risk Ekle",
        loadingText: "Lütfen önce bir proje seçin.",
        colImage: "Görsel",
        colZone: "Bölge / Tehlike",
        colCurrentIndex: "Mevcut Risk Endeksi",
        colMeasure: "Alınan Önlem",
        colTargetIndex: "Hedeflenen Risk Endeksi",
        colActions: "İşlemler",
        noRecords: "Henüz risk kaydı bulunmamaktadır.",
        deleteConfirm: "Bu risk kaydını silmek istediğinize emin misiniz?",
        indexLabel: "Endeks"
    },
    en: {
        title: "Risk Assessment",
        subtitle: "Hazard identification and risk scoring processes.",
        downloadBtn: "Download Report",
        addBtn: "Add New Risk",
        loadingText: "Please select a project first.",
        colImage: "Image",
        colZone: "Zone / Hazard",
        colCurrentIndex: "Current Risk Index",
        colMeasure: "Measure Taken",
        colTargetIndex: "Target Risk Index",
        colActions: "Actions",
        noRecords: "No risk records found yet.",
        deleteConfirm: "Are you sure you want to delete this risk record?",
        indexLabel: "Index"
    }
};

export default function RiskAssessmentPage() {
    const { getProjectRisks, activeProject, activeCustomer, deleteRisk, getProjectFunctionalTests } = useAudit();
    const [showForm, setShowForm] = useState(false);
    const [editingRisk, setEditingRisk] = useState<RiskAssessment | null>(null);
    const [lang, setLang] = useState<'tr' | 'en'>('tr');

    const riskAssessments = activeProject ? getProjectRisks(activeProject.id) : [];

    const handleEdit = (risk: RiskAssessment) => {
        setEditingRisk(risk);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        const t = translations[lang];
        if (confirm(t.deleteConfirm)) {
            deleteRisk(id);
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingRisk(null);
    };

    const handleDownloadFullReport = async () => {
        if (!activeProject || !activeCustomer) return;
        const functionalTests = getProjectFunctionalTests(activeProject.id);
        await generatePDF(activeProject, activeCustomer, riskAssessments, functionalTests, lang);
    };

    const t = translations[lang];

    if (!activeProject) return <div className="p-8 text-center text-gray-500">{t.loadingText}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
                    <p className="text-sm text-gray-500">
                        {t.subtitle}
                    </p>
                </div>
                {!showForm && (
                    <div className="flex items-center gap-3">
                        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setLang('tr')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'tr' ? 'bg-[#FFD600] text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                TR
                            </button>
                            <button
                                type="button"
                                onClick={() => setLang('en')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${lang === 'en' ? 'bg-[#FFD600] text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                EN
                            </button>
                        </div>

                        <button
                            onClick={handleDownloadFullReport}
                            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition font-medium shadow-sm"
                        >
                            <FileText className="size-4" />
                            {t.downloadBtn}
                        </button>
                        <button
                            onClick={() => { setEditingRisk(null); setShowForm(true); }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
                        >
                            + {t.addBtn}
                        </button>
                    </div>
                )}
            </div>

            {showForm ? (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                    <RiskAssessmentForm onSuccess={handleFormSuccess} initialData={editingRisk} />
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 w-16">{t.colImage}</th>
                                <th className="px-6 py-4">{t.colZone}</th>
                                <th className="px-6 py-4">{t.colCurrentIndex}</th>
                                <th className="px-6 py-4">{t.colMeasure}</th>
                                <th className="px-6 py-4">{t.colTargetIndex}</th>
                                <th className="px-6 py-4 text-right">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {riskAssessments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        {t.noRecords}
                                    </td>
                                </tr>
                            ) : (
                                riskAssessments.map((risk) => {
                                    const status = getRiskIndexStatus(risk.risk_score || 0); // Handle potential missing score from old data
                                    return (
                                        <tr key={risk.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                {risk.annotated_image ? (
                                                    <img src={risk.annotated_image} className="w-auto h-16 max-w-[100px] object-contain rounded-lg border bg-white hover:scale-150 transition-transform origin-left z-10 relative shadow-sm" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                        <ImageIcon className="size-5" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-800">{risk.hazard_zone}</p>
                                                    <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                        {lang === 'en' && risk.hazard_type === 'Mekanik' ? 'Mechanical' : lang === 'en' && risk.hazard_type === 'Elektriksel' ? 'Electrical' : lang === 'en' && risk.hazard_type === 'Termal' ? 'Thermal' : lang === 'en' && risk.hazard_type === 'Gürültü' ? 'Noise' : lang === 'en' && risk.hazard_type === 'Titreşim' ? 'Vibration' : lang === 'en' && risk.hazard_type === 'Kimyasal' ? 'Chemical' : lang === 'en' && risk.hazard_type === 'Ergonomik' ? 'Ergonomic' : risk.hazard_type}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`px-2 py-1 rounded text-xs font-black ${status.color}`}>
                                                        {t.indexLabel}: {risk.risk_score}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-bold">
                                                        S: {risk.before_s || '-'} | F: {risk.before_f || '-'} | A: {risk.before_a || '-'} | O: {risk.before_o || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs text-gray-600 text-xs leading-relaxed truncate">
                                                {risk.measures || risk.measures_engineering || risk.measures_design || risk.measures_administrative || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {risk.after_risk_score !== undefined && (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-bold text-gray-700">{t.indexLabel}: {risk.after_risk_score}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            S: {risk.after_s || '-'} | F: {risk.after_f || '-'} | A: {risk.after_a || '-'} | O: {risk.after_o || '-'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleEdit(risk)} className="text-gray-400 hover:text-blue-600 mr-2 transition">
                                                    <Edit className="size-4" />
                                                </button>
                                                <button onClick={() => handleDelete(risk.id)} className="text-gray-400 hover:text-red-600 transition">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
