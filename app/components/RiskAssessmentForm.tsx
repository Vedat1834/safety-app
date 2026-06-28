"use client";

import { useState, useEffect, useRef } from "react";
import { useAudit } from "../context/AuditContext";
import {
    RISK_S, RISK_F, RISK_A, RISK_O,
    calculateRiskIndex, getRiskIndexStatus
} from "../lib/hrn-constants";
import { SAFETY_STANDARDS } from "../lib/standards";
import ImageAnnotator from "./ImageAnnotator";
import AiConsultant from "./AiConsultant";
import { Camera, Image as ImageIcon, X, Plus, Sparkles, FileText, ArrowLeft, ArrowRight, Upload, ExternalLink } from "lucide-react";
import { RiskAssessment } from "../types";
import SpeechButton from "./SpeechButton";

interface RiskFormProps {
    onSuccess: () => void;
    initialData?: RiskAssessment | null;
}

const translations = {
    tr: {
        titleEdit: "Risk Kaydını Düzenle",
        titleAdd: "Yeni Risk Değerlendirmesi",
        subtitle: "Lütfen tüm alanları eksiksiz doldurunuz.",
        cancel: "İptal",
        save: "Değişiklikleri Kaydet",
        sec1Title: "Tehlike Tanımı ve Görseli",
        hazardZone: "Tehlike Bölgesi",
        hazardZonePlaceholder: "Örn: Konveyör Girişi",
        hazardType: "Tehlike Tipi",
        select: "Seçiniz...",
        hazardDescription: "Tehlike Açıklaması",
        hazardDescPlaceholder: "Tehlikeyi detaylı bir şekilde açıklayın...",
        relatedStandards: "İlgili Standartlar",
        selectFromList: "Listeden Seçiniz...",
        manualStandard: "Diğer Standart (Manuel Ekle)",
        addBtn: "Ekle",
        kbTitle: "Bilgi Bankası (Referans Dokümanlar)",
        kbSubtitle: "* Bu belgeler sadece referans amaçlıdır, rapora eklenmez.",
        hazardPhoto: "Tehlike Fotoğrafı",
        photoAdded: "Çizim / Düzenle",
        addPhoto: "Fotoğraf Ekle veya Çek",
        noPhoto: "Görsel Yok",
        sec2Title: "Mevcut Risk Analizi (Risk Endeksi)",
        sLabel: "S (Şiddet)",
        fLabel: "F (Maruziyet Sıklığı)",
        aLabel: "A (Zarardan Kaçınma)",
        oLabel: "O (Gerçekleşme Olasılığı)",
        sec3Title: "Risk Azaltma Yöntemleri ve Çözüm Görselleri",
        aiSuggest: "Yapay Zeka Önerisi",
        measuresLabel: "Alınan Önlemler / Çözümler",
        measuresPlaceholder: "Tehlikeyi azaltmak veya ortadan kaldırmak için alınan tüm önlemleri giriniz...",
        solutionPhotos: "Önlem / Çözüm Görselleri",
        addSolutionPhoto: "Görsel Ekle",
        sec4Title: "4. Alınan Önlemler Sonrası Risk Endeksi",
        targetIndex: "HEDEF ENDEKS",
        safetyFuncCheck: "EN ISO 13849-1'e göre Emniyet Fonksiyonu gerekli mi?",
        plrTitle: "Gerekli olan performans seviyesi (PLr)",
        plrSLabel: "S - Yaralanma Ciddiyeti",
        plrFLabel: "F - Maruz Kalma Sıklığı (Tablo A.3.2)",
        plrPLabel: "Zarardan kaçınma veya zararı sınırlama olasılığı, P1 ve P2",
        plrPSubtitle: "Her satır için uygun kolon (A, B veya C) seçiniz.",
        plrTableColKriter: "Kriter",
        plrTableColA: "A (Düşük Risk)",
        plrTableColB: "B (Orta Risk)",
        plrTableColC: "C (Yüksek Risk)",
        plrCriteria1: "1. Kullanıcı",
        plrCriteria2: "2. Hız",
        plrCriteria3: "3. Kaçış",
        plrCriteria4: "4. Algılama",
        plrCriteria5: "5. Karmaşıklık",
        speechAlert: "Lütfen önce tehlike tipi ve açıklamasını giriniz."
    },
    en: {
        titleEdit: "Edit Risk Record",
        titleAdd: "New Risk Assessment",
        subtitle: "Please fill in all fields completely.",
        cancel: "Cancel",
        save: "Save Changes",
        sec1Title: "Hazard Definition & Image",
        hazardZone: "Hazard Zone",
        hazardZonePlaceholder: "e.g., Conveyor Inlet",
        hazardType: "Hazard Type",
        select: "Select...",
        hazardDescription: "Hazard Description",
        hazardDescPlaceholder: "Describe the hazard in detail...",
        relatedStandards: "Related Standards",
        selectFromList: "Select from List...",
        manualStandard: "Other Standard (Manual Add)",
        addBtn: "Add",
        kbTitle: "Knowledge Base (Reference Documents)",
        kbSubtitle: "* These documents are for reference only, not included in the report.",
        hazardPhoto: "Hazard Photo",
        photoAdded: "Draw / Edit",
        addPhoto: "Add or Take Photo",
        noPhoto: "No Image",
        sec2Title: "Current Risk Analysis (Risk Index)",
        sLabel: "S (Severity)",
        fLabel: "F (Frequency)",
        aLabel: "A (Avoidance)",
        oLabel: "O (Occurrence Probability)",
        sec3Title: "Risk Reduction Methods & Solution Images",
        aiSuggest: "AI Suggestion",
        measuresLabel: "Measures / Solutions Taken",
        measuresPlaceholder: "Enter all measures taken to reduce or eliminate the hazard...",
        solutionPhotos: "Measure / Solution Images",
        addSolutionPhoto: "Add Image",
        sec4Title: "4. Risk Index After Measures",
        targetIndex: "TARGET INDEX",
        safetyFuncCheck: "Is Safety Function required according to EN ISO 13849-1?",
        plrTitle: "Required Performance Level (PLr)",
        plrSLabel: "S - Severity of Injury",
        plrFLabel: "F - Frequency / Exposure Duration (Table A.3.2)",
        plrPLabel: "Probability of avoiding or limiting harm, P1 and P2",
        plrPSubtitle: "Select the appropriate column (A, B, or C) for each row.",
        plrTableColKriter: "Criterion",
        plrTableColA: "A (Low Risk)",
        plrTableColB: "B (Medium Risk)",
        plrTableColC: "C (High Risk)",
        plrCriteria1: "1. User",
        plrCriteria2: "2. Speed",
        plrCriteria3: "3. Escape",
        plrCriteria4: "4. Recognition",
        plrCriteria5: "5. Complexity",
        speechAlert: "Please enter the hazard type and description first."
    }
};

const getRiskSDescriptions = (lang: 'tr' | 'en') => {
    if (lang === 'en') {
        return [
            { value: 'S1', description: 'S1 - Negligible (First aid level scratch/bruise)' },
            { value: 'S2', description: 'S2 - Minor Injury (Simple cut/bruise requiring medical attention)' },
            { value: 'S3', description: 'S3 - Serious Injury (Irreversible minor limb loss, severe fracture)' },
            { value: 'S4', description: 'S4 - Very Serious (Limb loss, fatal injury)' }
        ];
    }
    return RISK_S;
};

const getRiskFDescriptions = (lang: 'tr' | 'en') => {
    if (lang === 'en') {
        return [
            { value: 'F0', description: 'F0 - Prevented (Access completely closed by design)' },
            { value: 'F1', description: 'F1 - Low (Exposure <= 2 times per shift AND duration < 15 mins)' },
            { value: 'F2', description: 'F2 - High (Exposure > 2 times per shift OR duration > 15 mins)' }
        ];
    }
    return RISK_F;
};

const getRiskADescriptions = (lang: 'tr' | 'en') => {
    if (lang === 'en') {
        return [
            { value: 'A1', description: 'A1 - Avoidable (Trained operator, slow movements, wide area)' },
            { value: 'A2', description: 'A2 - Unavoidable (Fast movements, narrow space, no escape path)' }
        ];
    }
    return RISK_A;
};

const getRiskODescriptions = (lang: 'tr' | 'en') => {
    if (lang === 'en') {
        return [
            { value: 'O1', description: 'O1 - Low (Unsafe condition/failure rarely occurs)' },
            { value: 'O2', description: 'O2 - Medium (Unsafe condition/failure is predictable)' },
            { value: 'O3', description: 'O3 - High (Unsafe condition/failure is almost inevitable)' }
        ];
    }
    return RISK_O;
};

const getRiskStatusLabel = (label: string, lang: 'tr' | 'en') => {
    if (lang === 'en') {
        if (label === 'İhmal Edilebilir') return 'Negligible';
        if (label === 'Çok Düşük Risk') return 'Very Low Risk';
        if (label === 'Düşük Risk') return 'Low Risk';
        if (label === 'Orta Risk') return 'Medium Risk';
        if (label === 'Yüksek Risk') return 'High Risk';
        if (label === 'Çok Yüksek Risk') return 'Very High Risk';
    }
    return label;
};

export default function RiskAssessmentForm({ onSuccess, initialData }: RiskFormProps) {
    const { addRisk, updateRisk, activeProject, templates, groupOrders } = useAudit();
    const [lang, setLang] = useState<'tr' | 'en'>('tr');

    // Form State initialization
    const [formData, setFormData] = useState({
        hazard_zone: "",
        hazard_type: "",
        hazard_description: "",

        // Before
        before_s: "S2" as 'S1' | 'S2' | 'S3' | 'S4',
        before_f: "F1" as 'F0' | 'F1' | 'F2' | 'NA',
        before_a: "A1" as 'A1' | 'A2' | 'NA',
        before_o: "O1" as 'O1' | 'O2' | 'O3' | 'NA',

        // Measures
        measures: "",

        // After
        after_s: "S2" as 'S1' | 'S2' | 'S3' | 'S4',
        after_f: "F1" as 'F0' | 'F1' | 'F2' | 'NA',
        after_a: "A1" as 'A1' | 'A2' | 'NA',
        after_o: "O1" as 'O1' | 'O2' | 'O3' | 'NA',

        // PLr Logic
        safety_function_required: false,
        plr_s: "S1",
        plr_f: "F1",

        standards: [] as string[],
    });

    // P Factors
    const [pFactors, setPFactors] = useState({
        training: 'A', // Skilled (A) / Unskilled (B)
        speed: 'A',    // Low (A) / Medium (B) / High (C)
        escape: 'A',   // Possible (A) / Occasional (B) / Impossible (C)
        recognition: 'A', // Easy (A) / Occasional (B) / Impossible (C)
        complexity: 'A' // Low (A) / High (B)
    });

    const [derivedP, setDerivedP] = useState<'P1' | 'P2'>('P1');
    const [plrResult, setPlrResult] = useState("");

    // Calculate P whenever factors change
    useEffect(() => {
        const { training, speed, escape, recognition, complexity } = pFactors;
        const factors = [training, speed, escape, recognition, complexity];

        const countC = factors.filter(f => f === 'C').length;
        const countB = factors.filter(f => f === 'B').length;

        const newP = (countC > 0 || countB >= 3) ? 'P2' : 'P1';
        setDerivedP(newP);

    }, [pFactors]);

    useEffect(() => {
        if (formData.safety_function_required) {
            calculatePLr();
        } else {
            setPlrResult("");
        }
    }, [formData.safety_function_required, formData.plr_s, formData.plr_f, derivedP]); // Use derivedP

    const calculatePLr = () => {
        const { plr_s, plr_f } = formData;
        const plr_p = derivedP;
        let res = "";

        if (plr_s === "S1") {
            if (plr_f === "F1") {
                if (plr_p === "P1") res = "a";
                else res = "b";
            } else { // F2
                if (plr_p === "P1") res = "b";
                else res = "c";
            }
        } else { // S2
            if (plr_f === "F1") {
                if (plr_p === "P1") res = "c";
                else res = "d";
            } else { // F2
                if (plr_p === "P1") res = "d";
                else res = "e";
            }
        }
        setPlrResult(res);
    };

    const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
    const [measureImages, setMeasureImages] = useState<string[]>([]);

    // Annotator Visibility State
    const [activeAnnotator, setActiveAnnotator] = useState<'hazard' | 'measure' | null>(null);
    const [editingMeasureIndex, setEditingMeasureIndex] = useState<number | null>(null);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [customStandard, setCustomStandard] = useState("");
    const [kbDocs, setKbDocs] = useState<any[]>([]);

    // Template Modal States
    const [templateModal, setTemplateModal] = useState<{ isOpen: boolean; targetField: 'hazard_description' | 'measures' }>({ isOpen: false, targetField: 'hazard_description' });
    const [templateSearch, setTemplateSearch] = useState("");
    const [templateModalLang, setTemplateModalLang] = useState<'tr' | 'en'>('tr');
    const [modalActiveGroup, setModalActiveGroup] = useState<string>('Tümü');

    // Load Knowledge Base Docs
    useEffect(() => {
        const loadKBDocs = async () => {
            try {
                const req = indexedDB.open("SafetyAppDB", 1);
                req.onsuccess = () => {
                    const db = req.result;
                    if (db.objectStoreNames.contains("knowledge_base")) {
                        const tx = db.transaction("knowledge_base", "readonly");
                        const store = tx.objectStore("knowledge_base");
                        const getAll = store.getAll();
                        getAll.onsuccess = () => setKbDocs(getAll.result);
                    }
                };
            } catch (e) {
                console.error("Error loading KB docs:", e);
            }
        };
        loadKBDocs();
    }, []);

    const handleFieldChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Initialize with data if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                hazard_zone: initialData.hazard_zone,
                hazard_type: initialData.hazard_type,
                hazard_description: initialData.hazard_description || "",

                before_s: initialData.before_s || 'S2',
                before_f: (initialData.before_f === 'NA' ? 'F1' : initialData.before_f || 'F1'),
                before_a: (initialData.before_a === 'NA' ? 'A1' : initialData.before_a || 'A1'),
                before_o: (initialData.before_o === 'NA' ? 'O1' : initialData.before_o || 'O1'),

                measures: initialData.measures || [
                    initialData.measures_design,
                    initialData.measures_engineering,
                    initialData.measures_administrative
                ].filter(Boolean).join('\n') || "",

                after_s: initialData.after_s || 'S2',
                after_f: (initialData.after_f === 'NA' ? 'F1' : initialData.after_f || 'F1'),
                after_a: (initialData.after_a === 'NA' ? 'A1' : initialData.after_a || 'A1'),
                after_o: (initialData.after_o === 'NA' ? 'O1' : initialData.after_o || 'O1'),

                safety_function_required: initialData.safety_function_required || false,
                plr_s: initialData.plr_s || "S1",
                plr_f: initialData.plr_f || "F1",

                standards: initialData.standards || [],
            });

            if (initialData.plr_p_factors) {
                setPFactors(initialData.plr_p_factors as any);
            }

            setAnnotatedImage(initialData.annotated_image || null);
            setMeasureImages(initialData.measure_images || []);
        }
    }, [initialData]);

    // Calculated Scores
    const beforeScore = calculateRiskIndex(formData.before_s, formData.before_f, formData.before_a, formData.before_o);
    const afterScore = calculateRiskIndex(formData.after_s, formData.after_f, formData.after_a, formData.after_o);

    const beforeStatus = getRiskIndexStatus(beforeScore);
    const afterStatus = getRiskIndexStatus(afterScore);

    const handleSubmit = (e: React.FormEvent) => {
        if (!activeProject) return;

        e.preventDefault();

        const riskData = {
            project_id: activeProject.id,
            ...formData,
            risk_score: beforeScore,
            after_risk_score: afterScore,
            annotated_image: annotatedImage || undefined,
            measure_images: measureImages.length > 0 ? measureImages : undefined,

            // PLr logic
            safety_function_required: formData.safety_function_required,
            plr_s: formData.safety_function_required ? (formData.plr_s as any) : undefined,
            plr_f: formData.safety_function_required ? (formData.plr_f as any) : undefined,
            plr_p: formData.safety_function_required ? derivedP : undefined,
            plr_p_factors: formData.safety_function_required ? pFactors as any : undefined,
            plr_result: formData.safety_function_required ? plrResult : undefined,

            standards: formData.standards,
        };

        if (initialData) {
            // Update mode
            updateRisk(initialData.id, riskData);
        } else {
            // Create mode
            addRisk({
                ...riskData,
                id: Math.random().toString(36).substr(2, 9),
            } as any);
        }

        onSuccess();
    };

    const handleAISuggest = () => {
        if (!formData.hazard_type || !formData.hazard_description) {
            alert(translations[lang].speechAlert);
            return;
        }
        setIsAiModalOpen(true);
    };

    const handleApplyAi = (data: { design: string; engineering: string; administrative: string }) => {
        const combined = [
            data.design && `[Tasarım Önlemi]: ${data.design}`,
            data.engineering && `[Mühendislik Önlemi]: ${data.engineering}`,
            data.administrative && `[İdari Önlem]: ${data.administrative}`
        ].filter(Boolean).join('\n\n');
        
        setFormData(prev => ({
            ...prev,
            measures: combined
        }));
        setIsAiModalOpen(false);
    };

    // Open KB Document
    const handleOpenKBDoc = (doc: any) => {
        if (doc.file) {
            const url = URL.createObjectURL(doc.file);
            window.open(url, '_blank');
        } else {
            alert("Doküman dosyası bulunamadı. Lütfen tekrar yükleyin.");
        }
    };

    const t = translations[lang];

    return (
        <div className="bg-[#F8F9FA] rounded-[30px] p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {activeAnnotator && (
                <ImageAnnotator
                    initialImage={activeAnnotator === 'hazard' ? (annotatedImage || undefined) : (editingMeasureIndex !== null ? measureImages[editingMeasureIndex] : undefined)}
                    onSave={(img) => {
                        if (activeAnnotator === 'hazard') {
                            setAnnotatedImage(img);
                        } else {
                            if (editingMeasureIndex !== null) {
                                const updated = [...measureImages];
                                updated[editingMeasureIndex] = img;
                                setMeasureImages(updated);
                            } else {
                                setMeasureImages([...measureImages, img]);
                            }
                        }
                        setActiveAnnotator(null);
                        setEditingMeasureIndex(null);
                    }}
                    onCancel={() => {
                        setActiveAnnotator(null);
                        setEditingMeasureIndex(null);
                    }}
                />
            )}

            <AiConsultant
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onApply={handleApplyAi}
                hazardContext={{
                    zone: formData.hazard_zone,
                    type: formData.hazard_type,
                    description: formData.hazard_description
                }}
            />

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* HEADER */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                            {initialData ? t.titleEdit : t.titleAdd}
                        </h3>
                        <p className="text-gray-500 text-sm font-medium mt-1">{t.subtitle}</p>
                    </div>

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
                        <button type="button" onClick={onSuccess} className="bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-xl transition-all">
                            <X className="size-6" />
                        </button>
                    </div>
                </div>

                {/* SECTION 1: HAZARD DEFINITION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD600] text-black text-sm font-black">1</span>
                            {t.sec1Title}
                        </h4>

                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase ml-1">{t.hazardZone}</label>
                                        <SpeechButton onResult={(text) => setFormData(prev => ({ ...prev, hazard_zone: prev.hazard_zone ? prev.hazard_zone + " " + text : text }))} />
                                    </div>
                                    <input required className="input-field" placeholder={t.hazardZonePlaceholder}
                                        value={formData.hazard_zone} onChange={e => setFormData({ ...formData, hazard_zone: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t.hazardType}</label>
                                    <div className="relative">
                                        <select required className="input-field appearance-none" value={formData.hazard_type} onChange={e => setFormData({ ...formData, hazard_type: e.target.value })}>
                                            <option value="">{t.select}</option>
                                            <option value="Mekanik">{lang === 'en' ? 'Mechanical' : 'Mekanik'}</option>
                                            <option value="Elektriksel">{lang === 'en' ? 'Electrical' : 'Elektriksel'}</option>
                                            <option value="Termal">{lang === 'en' ? 'Thermal' : 'Termal'}</option>
                                            <option value="Gürültü">{lang === 'en' ? 'Noise' : 'Gürültü'}</option>
                                            <option value="Titreşim">{lang === 'en' ? 'Vibration' : 'Titreşim'}</option>
                                            <option value="Kimyasal">{lang === 'en' ? 'Chemical' : 'Kimyasal'}</option>
                                            <option value="Ergonomik">{lang === 'en' ? 'Ergonomic' : 'Ergonomik'}</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <ArrowRight className="size-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase ml-1">{t.hazardDescription}</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const targetCategory = 'hazard';
                                                const targetLang = lang;
                                                setTemplateModalLang(targetLang);
                                                if (typeof window !== 'undefined') {
                                                    const savedGroup = localStorage.getItem(`safety_last_modal_group_${targetLang}_${targetCategory}`) || 'Tümü';
                                                    setModalActiveGroup(savedGroup);
                                                }
                                                setTemplateModal({ isOpen: true, targetField: 'hazard_description' });
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold"
                                        >
                                            <FileText className="size-3.5" />
                                            {lang === 'en' ? 'Use Template' : 'Şablon Seç'}
                                        </button>
                                        <SpeechButton onResult={(text) => setFormData(prev => ({ ...prev, hazard_description: prev.hazard_description ? prev.hazard_description + " " + text : text }))} />
                                    </div>
                                </div>
                                <textarea
                                    required
                                    rows={4}
                                    className="input-field resize-none"
                                    placeholder={t.hazardDescPlaceholder}
                                    value={formData.hazard_description}
                                    onChange={e => setFormData({ ...formData, hazard_description: e.target.value })}
                                />
                            </div>

                            {/* Related Standards Selection */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t.relatedStandards}</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <select
                                                className="input-field appearance-none"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val && !formData.standards.includes(val)) {
                                                        setFormData({ ...formData, standards: [...formData.standards, val] });
                                                    }
                                                    e.target.value = ""; // Reset dropdown
                                                }}
                                            >
                                                <option value="">{t.selectFromList}</option>
                                                {SAFETY_STANDARDS.map((std) => (
                                                    <option key={std.code} value={std.code}>
                                                        {std.code} - {std.title.substring(0, 50)}...
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <Plus className="size-4" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Manual Entry */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder={t.manualStandard}
                                            value={customStandard}
                                            onChange={(e) => setCustomStandard(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (customStandard.trim() && !formData.standards.includes(customStandard.trim())) {
                                                        setFormData({ ...formData, standards: [...formData.standards, customStandard.trim()] });
                                                        setCustomStandard("");
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customStandard.trim() && !formData.standards.includes(customStandard.trim())) {
                                                    setFormData({ ...formData, standards: [...formData.standards, customStandard.trim()] });
                                                    setCustomStandard("");
                                                }
                                            }}
                                            className="bg-black text-white px-4 rounded-xl font-bold hover:bg-gray-800 transition"
                                        >
                                            {t.addBtn}
                                        </button>
                                    </div>

                                    {/* Selected Standards Tags */}
                                    {formData.standards.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.standards.map((std) => (
                                                <div key={std} className="flex items-center gap-2 bg-[#FFD600]/10 text-gray-900 border border-[#FFD600]/20 px-3 py-1.5 rounded-lg text-xs font-bold animate-in fade-in zoom-in duration-200">
                                                    <span>{std}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            standards: formData.standards.filter(s => s !== std)
                                                        })}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="size-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Knowledge Base Reference (Helper Section) */}
                            {kbDocs.length > 0 && (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
                                    <h5 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-2">
                                        <FileText className="size-4" />
                                        {t.kbTitle}
                                    </h5>
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {kbDocs.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleOpenKBDoc(doc)}
                                                className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-sm flex items-start gap-3 group hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                                            >
                                                <div className="bg-blue-100 p-1.5 rounded-md text-blue-600">
                                                    <FileText className="size-3.5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-800 leading-tight group-hover:text-blue-700 transition-colors flex items-center gap-2">
                                                        {doc.name}
                                                        <ExternalLink className="size-3 opacity-0 group-hover:opacity-50" />
                                                    </p>
                                                    {doc.description && (
                                                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                                                            {doc.description}
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2 mt-1.5">
                                                        <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">
                                                            {doc.type}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[9px] text-blue-400 mt-2 italic text-center">
                                        {t.kbSubtitle}
                                    </p>
                                </div>
                            )}

                            {/* Hazard Image */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">{t.hazardPhoto}</label>
                                {annotatedImage ? (
                                    <div className="relative group border rounded-2xl overflow-hidden bg-gray-50 aspect-video">
                                        <img 
                                            src={annotatedImage} 
                                            alt="Hazard" 
                                            className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity" 
                                            onClick={() => setActiveAnnotator('hazard')}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setAnnotatedImage(null); }}
                                            className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-xl shadow-lg hover:bg-red-50 transition-all z-10"
                                        >
                                            <X className="size-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveAnnotator('hazard')}
                                            className="absolute bottom-3 right-3 px-4 py-2 bg-gray-900/90 text-white text-xs font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-1.5 z-10"
                                        >
                                            <Camera className="size-3.5" />
                                            {t.photoAdded}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setActiveAnnotator('hazard')}
                                        className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FFD600] hover:text-gray-600 hover:bg-yellow-50/50 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#FFD600] group-hover:text-black transition-colors">
                                            <Camera className="size-6" />
                                        </div>
                                        <span className="text-sm font-bold">{t.addPhoto}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RISK INDEX CALCULATION */}
                    <div className="space-y-6">
                        <h4 className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD600] text-black text-sm font-black">2</span>
                            {t.sec2Title}
                        </h4>

                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.sLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-transparent focus:bg-white"
                                            value={formData.before_s}
                                            onChange={e => handleFieldChange('before_s', e.target.value as any)}
                                        >
                                            {getRiskSDescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.fLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-transparent focus:bg-white disabled:opacity-50"
                                            value={formData.before_f}
                                            onChange={e => handleFieldChange('before_f', e.target.value as any)}
                                        >
                                            {getRiskFDescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.aLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-transparent focus:bg-white disabled:opacity-50"
                                            value={formData.before_a}
                                            onChange={e => handleFieldChange('before_a', e.target.value as any)}
                                        >
                                            {getRiskADescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.oLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-transparent focus:bg-white disabled:opacity-50"
                                            value={formData.before_o}
                                            onChange={e => handleFieldChange('before_o', e.target.value as any)}
                                        >
                                            {getRiskODescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[20px] text-center border-2 border-transparent transition-all ${beforeStatus.color.replace('bg-', 'bg-opacity-10 bg-').replace('border-', 'border-opacity-20 border-')}`}>
                                <div className="text-5xl font-black mb-2 tracking-tighter" style={{ color: beforeScore >= 8 ? '#EF4444' : beforeScore >= 4 ? '#F97316' : beforeScore >= 2 ? '#F59E0B' : beforeScore === 1 ? '#10B981' : '#6B7280' }}>
                                    {beforeScore}
                                </div>
                                <div className="inline-block px-4 py-1 rounded-full bg-white shadow-sm text-xs font-black uppercase tracking-widest text-gray-900 border border-gray-100">
                                    {getRiskStatusLabel(beforeStatus.label, lang)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION: PLr CALCULATION */}
                <div className="bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-[#FFD600]"></div>

                    <div className="flex items-center gap-4 mb-6 relative z-10">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                id="safetyFunc"
                                checked={formData.safety_function_required}
                                onChange={e => setFormData({ ...formData, safety_function_required: e.target.checked })}
                                className="peer size-6 text-black bg-gray-100 border-gray-300 rounded-lg focus:ring-[#FFD600] cursor-pointer"
                            />
                        </div>
                        <label htmlFor="safetyFunc" className="font-bold text-gray-900 text-lg cursor-pointer">
                            {t.safetyFuncCheck}
                        </label>
                    </div>

                    {formData.safety_function_required && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-8 pl-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* S & F Params */}
                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-4">{t.plrSLabel}</span>
                                        <div className="space-y-2">
                                            {(lang === 'en' ? [
                                                { v: 'S1', l: 'Minor Injury', d: 'Scratch, cut (reversible)' },
                                                { v: 'S2', l: 'Serious Injury', d: 'Permanent damage, limb loss, death' }
                                            ] : [
                                                { v: 'S1', l: 'Hafif Yaralanma', d: 'Sıyrık, kesik (iyileşebilir)' },
                                                { v: 'S2', l: 'Ciddi Yaralanma', d: 'Kalıcı hasar, uzuv kaybı, ölüm' }
                                            ]).map((opt) => (
                                                <label key={opt.v} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all ${formData.plr_s === opt.v ? 'border-[#FFD600] bg-white shadow-md' : 'border-transparent hover:bg-white'}`}>
                                                    <input type="radio" name="plr_s" value={opt.v} checked={formData.plr_s === opt.v} onChange={() => setFormData({ ...formData, plr_s: opt.v })} className="hidden" />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.plr_s === opt.v ? 'border-[#FFD600]' : 'border-gray-300'}`}>
                                                        {formData.plr_s === opt.v && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD600]" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{opt.v}: {opt.l}</span>
                                                        <span className="text-xs text-gray-500">{opt.d}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                        <span className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-4">{t.plrFLabel}</span>
                                        <div className="space-y-2">
                                            {(lang === 'en' ? [
                                                { v: 'F1', l: 'Rare Exposure', d: 'Total working time < 1/20 AND less than once in 15 mins' },
                                                { v: 'F2', l: 'Frequent / Continuous Exposure', d: 'Frequent or continuous exposure OR more than once in 15 mins' }
                                            ] : [
                                                { v: 'F1', l: 'Nadir Maruziyet', d: 'Toplam çalışma süresinin < 1/20\'si VE 15 dk\'da bir kereden az' },
                                                { v: 'F2', l: 'Sık / Sürekli Maruziyet', d: 'Sık veya sürekli maruziyet VEYA 15 dk\'da bir kereden fazla' }
                                            ]).map((opt) => (
                                                <label key={opt.v} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer border-2 transition-all ${formData.plr_f === opt.v ? 'border-[#FFD600] bg-white shadow-md' : 'border-transparent hover:bg-white'}`}>
                                                    <input type="radio" name="plr_f" value={opt.v} checked={formData.plr_f === opt.v} onChange={() => setFormData({ ...formData, plr_f: opt.v })} className="hidden" />
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.plr_f === opt.v ? 'border-[#FFD600]' : 'border-gray-300'}`}>
                                                        {formData.plr_f === opt.v && <div className="w-2.5 h-2.5 rounded-full bg-[#FFD600]" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-gray-900 block">{opt.v}: {opt.l}</span>
                                                        <span className="text-xs text-gray-500">{opt.d}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* P Determinant - TABLE A.1 IMPLEMENTATION */}
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <span className="block text-xs font-black text-gray-900 uppercase tracking-wider">{t.plrPLabel}</span>
                                        <p className="text-[10px] text-gray-500 mt-1">{t.plrPSubtitle}</p>
                                    </div>

                                    <div className="p-4 space-y-1 overflow-x-auto">
                                        {/* Header Row */}
                                        <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-black text-center text-gray-400 mb-2">
                                            <div className="col-span-3 text-left pl-2">{t.plrTableColKriter}</div>
                                            <div className="col-span-3 text-green-600">{t.plrTableColA}</div>
                                            <div className="col-span-3 text-yellow-600">{t.plrTableColB}</div>
                                            <div className="col-span-3 text-red-600">{t.plrTableColC}</div>
                                        </div>

                                        {([
                                            {
                                                q: lang === 'en' ? '1. User' : '1. Kullanıcı',
                                                key: 'training',
                                                opts: [
                                                    { v: 'A', l: lang === 'en' ? 'Skilled Staff' : 'Uzman Personel', d: lang === 'en' ? 'Trained, knows instructions' : 'Eğitimli, talimatları bilen' },
                                                    { v: 'B', l: lang === 'en' ? 'Unskilled' : 'Uzman Olmayan', d: lang === 'en' ? 'Untrained or little experience' : 'Eğitimsiz veya az deneyimli' },
                                                    null // C Yok
                                                ]
                                            },
                                            {
                                                q: lang === 'en' ? '2. Speed' : '2. Hız',
                                                key: 'speed',
                                                opts: [
                                                    { v: 'A', l: lang === 'en' ? 'Low Speed' : 'Düşük Hız', d: lang === 'en' ? 'v < 250 mm/s (Escape time ≥ 3s)' : 'v < 250 mm/s (Kaçış zamanı ≥ 3s)' },
                                                    { v: 'B', l: lang === 'en' ? 'Medium Speed' : 'Orta Hız', d: lang === 'en' ? '250 < v ≤ 1000 mm/s (1s ≤ t < 3s)' : '250 < v ≤ 1000 mm/s (1s ≤ t < 3s)' },
                                                    { v: 'C', l: lang === 'en' ? 'High Speed' : 'Yüksek Hız', d: lang === 'en' ? 'v > 1000 mm/s (Escape time < 1s)' : 'v > 1000 mm/s (Kaçış zamanı < 1s)' }
                                                ]
                                            },
                                            {
                                                q: lang === 'en' ? '3. Escape' : '3. Kaçış',
                                                key: 'escape',
                                                opts: [
                                                    { v: 'A', l: lang === 'en' ? 'Possible' : 'Mümkün', d: lang === 'en' ? 'Probability ≥ 50%' : 'Olasılık ≥ %50' },
                                                    { v: 'B', l: lang === 'en' ? 'Rare' : 'Nadir', d: lang === 'en' ? 'Probability < 50%' : 'Olasılık < %50' },
                                                    { v: 'C', l: lang === 'en' ? 'Impossible' : 'İmkansız', d: lang === 'en' ? 'No escape chance' : 'Kaçış şansı yok' }
                                                ]
                                            },
                                            {
                                                q: lang === 'en' ? '4. Recognition' : '4. Algılama',
                                                key: 'recognition',
                                                opts: [
                                                    { v: 'A', l: lang === 'en' ? 'Easy' : 'Kolay', d: lang === 'en' ? 'Noticeable (≥ 50%)' : 'Fark edilir (≥ %50)' },
                                                    { v: 'B', l: lang === 'en' ? 'Rare' : 'Nadir', d: lang === 'en' ? 'Hardly noticeable (< 50%)' : 'Zor fark edilir (< %50)' },
                                                    { v: 'C', l: lang === 'en' ? 'None' : 'Yok', d: lang === 'en' ? 'Hazard not noticeable' : 'Tehlike fark edilemez' }
                                                ]
                                            },
                                            {
                                                q: lang === 'en' ? '5. Complexity' : '5. Karmaşıklık',
                                                key: 'complexity',
                                                opts: [
                                                    { v: 'A', l: lang === 'en' ? 'Low' : 'Düşük', d: lang === 'en' ? 'Simple interaction' : 'Basit etkileşim' },
                                                    { v: 'B', l: lang === 'en' ? 'Medium/High' : 'Orta/Yüksek', d: lang === 'en' ? 'Complex intervention, troubleshooting' : 'Karmaşık müdahale, sorun giderme' },
                                                    null // C Yok
                                                ]
                                            }
                                        ] as any[]).map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-2 items-stretch py-2 border-b border-gray-50 last:border-0">
                                                {/* Question Label */}
                                                <div className="col-span-3 flex items-center pl-2">
                                                    <span className="text-xs font-bold text-gray-700 leading-tight">{item.q}</span>
                                                </div>

                                                {/* Options A, B, C */}
                                                {[0, 1, 2].map((optIdx) => {
                                                    const opt = item.opts[optIdx];
                                                    if (!opt) return <div key={optIdx} className="col-span-3 bg-gray-50 rounded-lg opacity-20 disabled"></div>;

                                                    const isSelected = (pFactors as any)[item.key] === opt.v;
                                                    const colors = [
                                                        'hover:bg-green-50 border-green-200 text-green-700', // A
                                                        'hover:bg-yellow-50 border-yellow-200 text-yellow-700', // B
                                                        'hover:bg-red-50 border-red-200 text-red-700' // C
                                                    ];
                                                    const activeColors = [
                                                        'bg-green-100 border-green-500 ring-1 ring-green-500 text-green-900',
                                                        'bg-yellow-100 border-yellow-500 ring-1 ring-yellow-500 text-yellow-900',
                                                        'bg-red-100 border-red-500 ring-1 ring-red-500 text-red-900'
                                                    ];

                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            type="button"
                                                            onClick={() => setPFactors({ ...pFactors, [item.key]: opt.v as any })}
                                                            className={`col-span-3 p-2 rounded-lg border text-left transition-all relative group flex flex-col justify-center gap-0.5 ${isSelected ? activeColors[optIdx] : `bg-white border-gray-200 text-gray-400 ${colors[optIdx]} hover:border-current`
                                                                }`}
                                                        >
                                                            <span className="text-[10px] font-black uppercase">{opt.l}</span>
                                                            <span className={`text-[9px] leading-tight ${isSelected ? 'opacity-100' : 'opacity-60'}`}>{opt.d}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table A.2 Result - Simplified */}
                                    <div className="mt-auto px-6 py-4 flex justify-end border-t border-gray-100 bg-gray-50/50">
                                        <div className={`px-4 py-1.5 rounded-lg text-lg font-black shadow-sm ${derivedP === 'P1' ? 'bg-[#FFD600] text-black' : 'bg-red-500 text-white'}`}>
                                            {derivedP}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Result Display: Right Aligned & Compact */}
                            <div className="flex justify-end pt-4">
                                <div className="inline-flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl border border-gray-800 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-[#FFD600] rounded-full blur-[50px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>

                                    <div className="text-right">
                                        <span className="block text-xs font-bold text-gray-400 tracking-wider">Gerekli olan performans seviyesi (PLr)</span>
                                        <span className="text-[10px] text-gray-500 font-medium">ISO 13849-1</span>
                                    </div>

                                    <div className="w-px h-8 bg-gray-700"></div>

                                    <div className="text-5xl font-black text-[#FFD600] tracking-tight leading-none">
                                        {plrResult || "-"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* SECTION 3: MEASURES */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm relative">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="flex items-center gap-3 text-lg font-bold text-gray-900">
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFD600] text-black text-sm font-black">3</span>
                            {t.sec3Title}
                        </h4>

                        <button
                            type="button"
                            onClick={handleAISuggest}
                            className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition flex items-center gap-2"
                        >
                            <Sparkles className="size-4 text-[#FFD600]" />
                            {t.aiSuggest}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase ml-1">{t.measuresLabel}</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const targetCategory = 'measure';
                                                const targetLang = lang;
                                                setTemplateModalLang(targetLang);
                                                if (typeof window !== 'undefined') {
                                                    const savedGroup = localStorage.getItem(`safety_last_modal_group_${targetLang}_${targetCategory}`) || 'Tümü';
                                                    setModalActiveGroup(savedGroup);
                                                }
                                                setTemplateModal({ isOpen: true, targetField: 'measures' });
                                            }}
                                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold"
                                        >
                                            <FileText className="size-3.5" />
                                            {lang === 'en' ? 'Use Template' : 'Şablon Seç'}
                                        </button>
                                        <SpeechButton onResult={(text) => setFormData(prev => ({ ...prev, measures: prev.measures ? prev.measures + " " + text : text }))} />
                                    </div>
                                </div>
                                <textarea rows={8} className="input-field" placeholder={t.measuresPlaceholder}
                                    value={formData.measures} onChange={e => setFormData({ ...formData, measures: e.target.value })} />
                            </div>
                        </div>

                        {/* Measure Images Multi-Upload */}
                        <div className="flex flex-col gap-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">{t.solutionPhotos}</label>

                            <div className="grid grid-cols-2 gap-3">
                                {measureImages.map((img, idx) => (
                                    <div key={idx} className="relative group border border-gray-200 rounded-2xl overflow-hidden h-32 bg-gray-50">
                                        <img 
                                            src={img} 
                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity" 
                                            onClick={() => {
                                                setEditingMeasureIndex(idx);
                                                setActiveAnnotator('measure');
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMeasureImages(measureImages.filter((_, i) => i !== idx));
                                            }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg shadow-sm hover:bg-red-50 transition-all z-10"
                                        >
                                            <X className="size-4" />
                                        </button>
                                        <div 
                                            onClick={() => {
                                                setEditingMeasureIndex(idx);
                                                setActiveAnnotator('measure');
                                            }}
                                            className="absolute bottom-2 right-2 bg-gray-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer z-10 hover:scale-105 transition-all"
                                        >
                                            {lang === 'en' ? 'Edit' : 'Düzenle'}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setActiveAnnotator('measure')}
                                    className="h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FFD600] hover:text-black hover:bg-yellow-50/50 transition bg-white"
                                >
                                    <Plus className="size-8 mb-2" />
                                    <span className="text-xs font-bold">{t.addSolutionPhoto}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM: TARGET RISK */}
                <div className="bg-[#FFD600] p-1 rounded-[24px] shadow-lg shadow-yellow-500/10">
                    <div className="bg-white p-6 rounded-[22px]">
                        <h4 className="font-black text-gray-900 mb-6 text-sm uppercase tracking-widest border-b pb-4">{t.sec4Title}</h4>

                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.sLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-gray-200 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600]"
                                            value={formData.after_s}
                                            onChange={e => handleFieldChange('after_s', e.target.value as any)}
                                        >
                                            {getRiskSDescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                 <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.fLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-gray-200 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] disabled:opacity-50"
                                            value={formData.after_f}
                                            onChange={e => handleFieldChange('after_f', e.target.value as any)}
                                        >
                                            {getRiskFDescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.aLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-gray-200 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] disabled:opacity-50"
                                            value={formData.after_a}
                                            onChange={e => handleFieldChange('after_a', e.target.value as any)}
                                        >
                                            {getRiskADescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1 block ml-1">{t.oLabel}</label>
                                    <div className="relative">
                                        <select
                                            className="input-field font-semibold text-gray-900 appearance-none bg-gray-50 border-gray-200 focus:border-[#FFD600] focus:ring-1 focus:ring-[#FFD600] disabled:opacity-50"
                                            value={formData.after_o}
                                            onChange={e => handleFieldChange('after_o', e.target.value as any)}
                                        >
                                            {getRiskODescriptions(lang).map(i => <option key={i.value} value={i.value}>{i.description}</option>)}
                                        </select>
                                        <ArrowRight className="size-3 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className={`p-6 md:p-8 rounded-[20px] text-center border-2 border-transparent transition-all w-full md:w-auto min-w-[200px] flex flex-col items-center justify-center ${afterStatus.color.replace('bg-', 'bg-opacity-10 bg-').replace('border-', 'border-opacity-20 border-')}`}>
                                <span className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: afterScore >= 8 ? '#EF4444' : afterScore >= 4 ? '#F97316' : afterScore >= 2 ? '#F59E0B' : afterScore === 1 ? '#10B981' : '#6B7280' }}>
                                    {t.targetIndex}
                                </span>
                                <div className="text-5xl font-black mb-2 tracking-tighter" style={{ color: afterScore >= 8 ? '#EF4444' : afterScore >= 4 ? '#F97316' : afterScore >= 2 ? '#F59E0B' : afterScore === 1 ? '#10B981' : '#6B7280' }}>
                                    {afterScore}
                                </div>
                                <div className="inline-block px-4 py-1 rounded-full bg-white shadow-sm text-xs font-black uppercase tracking-widest text-gray-900 border border-gray-100">
                                    {getRiskStatusLabel(afterStatus.label, lang)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onSuccess} className="px-8 py-3 text-sm font-bold bg-white text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">{t.cancel}</button>
                    <button type="submit" className="px-10 py-3 text-sm font-bold bg-[#FFD600] text-black rounded-xl hover:bg-[#FACE15] shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:-translate-y-0.5 transition-all">
                        {t.save}
                    </button>
                </div>

                <style jsx>{`
                    .input-field {
                        display: block;
                        width: 100%;
                        border-radius: 12px;
                        border: 1px solid #e5e7eb;
                        padding: 0.75rem 1rem;
                        font-size: 0.875rem;
                        outline: none;
                        transition: all 0.2s;
                        background-color: white;
                    }
                    .input-field:focus {
                        border-color: #FFD600;
                        box-shadow: 0 0 0 2px rgba(255, 214, 0, 0.2);
                    }
                    .scrollbar-hide::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hide {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </form >

            {/* Template Selector Modal */}
            {templateModal.isOpen && (() => {
                const targetCategory = templateModal.targetField === 'hazard_description' ? 'hazard' : 'measure';
                const orderKey = `${templateModalLang}_${targetCategory}`;
                const baseGroups = groupOrders[orderKey] || (targetCategory === 'hazard' 
                    ? ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Genel']
                    : ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Eğitim & İdari', 'Genel']);
                const modalAvailableGroups = Array.from(new Set([
                    ...baseGroups,
                    ...templates
                        .filter(t => t.lang === templateModalLang && t.category === targetCategory && t.group)
                        .map(t => t.group as string)
                ]));
                const displayModalGroups = ['Tümü', ...modalAvailableGroups];
                const resolvedModalGroup = displayModalGroups.includes(modalActiveGroup) ? modalActiveGroup : 'Tümü';
                const modalFilteredTemplates = templates.filter(t => {
                    const matchesLang = t.lang === templateModalLang;
                    const matchesCategory = t.category === targetCategory;
                    const matchesSearch = t.content.toLowerCase().includes(templateSearch.toLowerCase());
                    const matchesGroup = (templateSearch || resolvedModalGroup === 'Tümü') ? true : (t.group || 'Genel') === resolvedModalGroup;
                    return matchesLang && matchesCategory && matchesSearch && matchesGroup;
                });

                return (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[24px] max-w-xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2 text-base md:text-lg">
                                    <FileText className="size-5 text-[#FFC107]" />
                                    {lang === 'en' ? 'Select Template' : 'Şablon Cümle Seç'}
                                </h4>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTemplateModal({ isOpen: false, targetField: 'hazard_description' });
                                        setTemplateSearch("");
                                    }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-black transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Search and Language filters */}
                            <div className="space-y-3 mb-4">
                                <input
                                    type="text"
                                    placeholder={lang === 'en' ? "Search templates..." : "Şablonlarda ara..."}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#FFD600] rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium"
                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                    value={templateSearch}
                                />
                                <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs w-fit">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTemplateModalLang('tr');
                                            if (typeof window !== 'undefined') {
                                                const savedGroup = localStorage.getItem(`safety_last_modal_group_tr_${targetCategory}`) || 'Tümü';
                                                setModalActiveGroup(savedGroup);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-md font-bold transition-all ${templateModalLang === 'tr' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
                                    >
                                        TR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTemplateModalLang('en');
                                            if (typeof window !== 'undefined') {
                                                const savedGroup = localStorage.getItem(`safety_last_modal_group_en_${targetCategory}`) || 'Tümü';
                                                setModalActiveGroup(savedGroup);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-md font-bold transition-all ${templateModalLang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
                                    >
                                        EN
                                    </button>
                                </div>
                            </div>

                            {/* Group Tabs (Only if not searching) */}
                            {!templateSearch && (
                                <div 
                                    className="flex flex-wrap gap-2 mb-4 max-h-40 overflow-y-auto pb-3 border-b border-gray-100 pr-1"
                                >
                                    {displayModalGroups.map(g => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => {
                                                setModalActiveGroup(g);
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem(`safety_last_modal_group_${templateModalLang}_${targetCategory}`, g);
                                                }
                                            }}
                                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${resolvedModalGroup === g ? 'bg-[#FFD600] text-black border-[#FFD600] shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Templates List */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[250px]">
                                {modalFilteredTemplates.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 text-sm font-medium">
                                        {lang === 'en' ? 'No template found.' : 'Şablon bulunamadı.'}
                                    </div>
                                ) : (
                                    modalFilteredTemplates.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                const field = templateModal.targetField;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    [field]: prev[field] 
                                                        ? prev[field] + "\n" + t.content 
                                                        : t.content
                                                }));
                                                setTemplateModal({ isOpen: false, targetField: 'hazard_description' });
                                                setTemplateSearch("");
                                            }}
                                            className="w-full text-left p-3.5 rounded-xl border border-gray-100 hover:border-[#FFD600] hover:bg-yellow-50/20 text-sm font-medium text-gray-700 hover:text-black transition-all flex flex-col gap-1"
                                        >
                                            <span className="leading-relaxed">{t.content}</span>
                                            {(resolvedModalGroup === 'Tümü' || templateSearch) && t.group && (
                                                <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider w-fit">
                                                    {t.group}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div >
    );
}
