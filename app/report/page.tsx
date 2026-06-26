"use client";

import { useState } from "react";
import { useAudit } from "../context/AuditContext";
import { generatePDF } from "../lib/report-generator";
import { FileText, Download } from "lucide-react";

const translations = {
    tr: {
        title: "Rapor Oluşturma",
        subtitle: "Girilen tüm veriler derlenerek PDF formatında rapor oluşturulacaktır.",
        summaryTitle: "Rapor Özeti",
        risksCount: "Risk Kayıtları",
        testsCount: "Fonksiyonel Testler",
        customer: "Müşteri",
        downloadBtn: "PDF Raporu İndir",
        loadingText: "Proje seçilmedi.",
        warningText: "Rapor oluşturmak için en az bir veri girişi yapmalısınız.",
        langSelectLabel: "Rapor Dili"
    },
    en: {
        title: "Report Generation",
        subtitle: "All entered data will be compiled and a report will be generated in PDF format.",
        summaryTitle: "Report Summary",
        risksCount: "Risk Records",
        testsCount: "Functional Tests",
        customer: "Customer",
        downloadBtn: "Download PDF Report",
        loadingText: "No project selected.",
        warningText: "You must enter at least one record to generate a report.",
        langSelectLabel: "Report Language"
    }
};

export default function ReportPage() {
    const { activeProject, activeCustomer, getProjectRisks, getProjectFunctionalTests } = useAudit();
    const [reportLang, setReportLang] = useState<'tr' | 'en'>('tr');

    // Derived data for display
    const riskAssessments = activeProject ? getProjectRisks(activeProject.id) : [];
    const functionalTests = activeProject ? getProjectFunctionalTests(activeProject.id) : [];

    const handleDownload = () => {
        if (activeProject && activeCustomer) {
            generatePDF(activeProject, activeCustomer, riskAssessments, functionalTests, reportLang);
        }
    };

    if (!activeProject) return <div className="p-8">{translations[reportLang].loadingText}</div>;

    const t = translations[reportLang];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2 py-8">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
                    <FileText className="size-8" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
                <p className="text-gray-500">
                    {t.subtitle}
                </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 className="font-bold text-gray-800 text-base">{t.summaryTitle}</h3>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mr-1">{t.langSelectLabel}:</span>
                        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setReportLang('tr')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${reportLang === 'tr' ? 'bg-[#FFD600] text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                TR
                            </button>
                            <button
                                type="button"
                                onClick={() => setReportLang('en')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${reportLang === 'en' ? 'bg-[#FFD600] text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                EN
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">{t.risksCount}</span>
                        <span className="font-medium">{riskAssessments.length} {reportLang === 'en' ? 'Items' : 'Adet'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">{t.testsCount}</span>
                        <span className="font-medium">{functionalTests.length} {reportLang === 'en' ? 'Items' : 'Adet'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-500">{t.customer}</span>
                        <span className="font-medium">{activeCustomer?.name || "-"}</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleDownload}
                        disabled={riskAssessments.length === 0 && functionalTests.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-[#FFD600] hover:bg-[#FACE15] text-black font-bold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-yellow-500/10"
                    >
                        <Download className="size-5" />
                        {t.downloadBtn}
                    </button>

                    {(riskAssessments.length === 0 && functionalTests.length === 0) && (
                        <p className="text-xs text-red-500 text-center mt-2">
                            {t.warningText}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
