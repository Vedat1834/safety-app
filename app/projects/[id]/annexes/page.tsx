"use client";

import { useAudit } from "@/app/context/AuditContext";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Globe, Edit3, Save, X, RotateCcw, AlertTriangle } from "lucide-react";
import annexesTr from "@/app/data/annexes_tr.json";
import annexesEn from "@/app/data/annexes_en.json";

export default function AnnexesPage() {
    const params = useParams();
    const router = useRouter();
    const { projects, setActiveProject, activeProject, updateProject } = useAudit();
    const projectId = params.id as string;
    const [activeLang, setActiveLang] = useState<'tr' | 'en'>('tr');
    
    // Editor States
    const [isEditing, setIsEditing] = useState(false);
    const [localAnnexes, setLocalAnnexes] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("");

    useEffect(() => {
        if (!activeProject && projectId) {
            const found = projects.find(p => p.id === projectId);
            if (found) setActiveProject(found);
        }
    }, [projectId, activeProject, projects, setActiveProject]);

    // Determine current active annex list (saved project custom copy OR static JSON default)
    const currentAnnexes = activeProject 
        ? (activeLang === 'tr' 
            ? (activeProject.annexes_tr || annexesTr) 
            : (activeProject.annexes_en || annexesEn))
        : [];

    // Initialize localAnnexes for the editor
    useEffect(() => {
        if (currentAnnexes.length > 0) {
            setLocalAnnexes(JSON.parse(JSON.stringify(currentAnnexes)));
        }
    }, [activeLang, activeProject, isEditing]);

    // Use local copy in editor mode to show real-time keystroke updates, else default to saved data
    const sourceAnnexes = isEditing ? localAnnexes : currentAnnexes;

    // Map each item to include its original index for lookup
    const itemsWithIndex = sourceAnnexes.map((item: any, index: number) => ({
        ...item,
        originalIndex: index
    }));

    // Group items into sections based on Level 1 Headings (e.g., Ek-A, EK-B)
    let currentSection = "";
    const itemsWithSection = itemsWithIndex.map((item: any) => {
        if (item.type === 'heading' && item.level === 1) {
            currentSection = item.text;
        }
        return { ...item, section: currentSection };
    });

    const sections = Array.from(new Set(itemsWithSection.map((i: any) => i.section))).filter(Boolean) as string[];

    // Ensure activeTab is always valid when language or sections change
    useEffect(() => {
        if (sections.length > 0 && (!activeTab || !sections.includes(activeTab))) {
            setActiveTab(sections[0]);
        }
    }, [activeLang, sections, activeTab]);

    if (!activeProject) return <div className="p-8 text-center">Proje yükleniyor...</div>;

    // Filter items to only show the ones belonging to the selected tab
    const visibleItems = itemsWithSection.filter((i: any) => i.section === activeTab);

    // Editing logic handlers
    const updateItemText = (idx: number, text: string) => {
        setLocalAnnexes(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], text };
            if (copy[idx].type === 'paragraph' && copy[idx].runs) {
                delete copy[idx].runs; // clear runs to use fallback raw text edit
            }
            return copy;
        });
    };

    const updateTableHeader = (idx: number, hIdx: number, val: string) => {
        setLocalAnnexes(prev => {
            const copy = [...prev];
            const item = { ...copy[idx] };
            const headers = [...item.headers];
            headers[hIdx] = val;
            item.headers = headers;
            copy[idx] = item;
            return copy;
        });
    };

    const updateTableCell = (idx: number, rIdx: number, cIdx: number, val: string) => {
        setLocalAnnexes(prev => {
            const copy = [...prev];
            const item = { ...copy[idx] };
            const rows = item.rows.map((row: any[]) => [...row]);
            rows[rIdx][cIdx] = val;
            item.rows = rows;
            copy[idx] = item;
            return copy;
        });
    };

    const updateColorCellText = (idx: number, rIdx: number, cIdx: number, val: string) => {
        setLocalAnnexes(prev => {
            const copy = [...prev];
            const item = { ...copy[idx] };
            const rows = item.rows.map((row: any[]) => [...row]);
            rows[rIdx][cIdx] = { ...rows[rIdx][cIdx], text: val };
            item.rows = rows;
            copy[idx] = item;
            return copy;
        });
    };

    const updateTableSubCellText = (idx: number, rIdx: number, cIdx: number, sIdx: number, val: string) => {
        setLocalAnnexes(prev => {
            const copy = [...prev];
            const item = { ...copy[idx] };
            const rows = item.rows.map((row: any[]) => [...row]);
            const cellList = [...rows[rIdx][cIdx]];
            cellList[sIdx] = { ...cellList[sIdx], text: val };
            rows[rIdx][cIdx] = cellList;
            item.rows = rows;
            copy[idx] = item;
            return copy;
        });
    };

    const handleSave = () => {
        if (activeLang === 'tr') {
            updateProject(projectId, { annexes_tr: localAnnexes });
        } else {
            updateProject(projectId, { annexes_en: localAnnexes });
        }
        setIsEditing(false);
        alert(activeLang === 'tr' ? "Değişiklikler başarıyla kaydedildi!" : "Changes saved successfully!");
    };

    const handleCancel = () => {
        if (window.confirm(activeLang === 'tr' ? "Değişiklikleri kaydetmeden çıkmak istediğinizden emin misiniz?" : "Are you sure you want to discard your edits?")) {
            setIsEditing(false);
        }
    };

    const handleReset = () => {
        if (window.confirm(activeLang === 'tr' ? "Bu dili orijinal şablon haline sıfırlamak istediğinizden emin misiniz? Özel düzenlemeleriniz silinecektir." : "Are you sure you want to reset this language to default? Custom edits will be lost.")) {
            if (activeLang === 'tr') {
                updateProject(projectId, { annexes_tr: undefined });
            } else {
                updateProject(projectId, { annexes_en: undefined });
            }
            setIsEditing(false);
            alert(activeLang === 'tr' ? "Ekler orijinal haline sıfırlandı!" : "Annexes reset to default!");
        }
    };

    const isCustomized = activeLang === 'tr' ? !!activeProject.annexes_tr : !!activeProject.annexes_en;

    const renderCellPreview = (cell: any) => {
        if (typeof cell === 'string') {
            return cell.split('\n').map((line, idx) => <div key={idx}>{line}</div>);
        }
        if (cell && typeof cell === 'object') {
            if (cell.type === 'color_block') {
                return (
                    <div className="flex items-center gap-2">
                        <div 
                            className="w-8 h-4 rounded border border-gray-300 shadow-sm shrink-0" 
                            style={{ backgroundColor: cell.color }} 
                        />
                        {cell.text && <span className="text-xs font-semibold">{cell.text}</span>}
                    </div>
                );
            }
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
                        onClick={() => {
                            if (isEditing) {
                                handleCancel();
                            } else {
                                router.push(`/projects/${projectId}`);
                            }
                        }}
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

                {/* Controls & Language */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Reset Button */}
                    {!isEditing && isCustomized && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl border border-gray-200 hover:border-red-200 text-xs font-bold transition-all shadow-sm"
                        >
                            <RotateCcw className="size-4" />
                            {activeLang === 'tr' ? 'Varsayılana Sıfırla' : 'Reset to Default'}
                        </button>
                    )}

                    {/* Edit Trigger / Save Controls */}
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                                <Save className="size-4" />
                                {activeLang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 hover:border-gray-300 text-xs font-bold transition-all shadow-sm"
                            >
                                <X className="size-4" />
                                {activeLang === 'tr' ? 'İptal Et' : 'Cancel'}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#FFD600] hover:bg-[#FFC107] text-black rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                            <Edit3 className="size-4" />
                            {activeLang === 'tr' ? 'Ekleri Düzenle' : 'Edit Annexes'}
                        </button>
                    )}

                    {/* Language Switcher */}
                    <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200">
                        <button
                            disabled={isEditing}
                            onClick={() => setActiveLang('tr')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : ''} ${activeLang === 'tr' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            <Globe className="size-3.5" />
                            TR
                        </button>
                        <button
                            disabled={isEditing}
                            onClick={() => setActiveLang('en')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${isEditing ? 'opacity-50 cursor-not-allowed' : ''} ${activeLang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                        >
                            <Globe className="size-3.5" />
                            EN
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Callout */}
            <div className={`border rounded-2xl p-4 mb-8 max-w-5xl flex gap-3.5 items-start transition-colors ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                {isEditing ? (
                    <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                    <Globe className="size-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div>
                    <h5 className={`text-sm font-bold ${isEditing ? 'text-amber-900' : 'text-blue-900'}`}>
                        {isEditing 
                            ? (activeLang === 'tr' ? 'Düzenleme Modu Aktif' : 'Editing Mode Active')
                            : (activeLang === 'tr' ? 'Ekler Sayfalar Halinde Gruplandı' : 'Annexes Grouped in Tabs')
                        }
                    </h5>
                    <p className={`text-xs mt-1 leading-relaxed ${isEditing ? 'text-amber-700' : 'text-blue-700'}`}>
                        {isEditing 
                          ? (activeLang === 'tr' 
                              ? 'Aşağıdaki tablodan ve metin kutularından istediğiniz değişiklikleri yapabilirsiniz. Değişiklikler sadece bu projeye özel kaydedilir. Kaydetmek için sağ üstteki "Değişiklikleri Kaydet" butonuna basın.'
                              : 'You can modify table cells, headers, and paragraphs below. Edits apply only to this project. Click "Save Changes" at the top right to store your updates.')
                          : (activeLang === 'tr' 
                              ? 'Ekler hiyerarşisi korunarak sekmelere bölünmüştür. PDF rapor çıktısında bu ekler otomatik olarak yeni sayfalarda başlatılacak ve rapor sonuna eklenecektir.'
                              : 'The annexes are organized into tabs. In the exported PDF, each tab represents an annex that will automatically start on a new page.')}
                    </p>
                </div>
            </div>

            {/* Document Sheet Layout */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_10px_35px_-15px_rgba(0,0,0,0.08)] max-w-5xl p-6 md:p-8 min-h-[85vh]">
                
                {/* Dynamic Section Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                    {sections.map((sec) => (
                        <button
                            key={sec}
                            onClick={() => setActiveTab(sec)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${activeTab === sec ? 'bg-[#FFD600] text-black border-[#FFD600] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:text-black hover:border-gray-300'}`}
                        >
                            {sec}
                        </button>
                    ))}
                </div>

                <div className="space-y-6 max-w-4xl mx-auto">
                    {visibleItems.map((item: any, idx: number) => {
                        const globalIdx = item.originalIndex;

                        if (isEditing) {
                            // --- RENDER EDITABLE CONTROLS ---
                            if (item.type === 'heading') {
                                return (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 my-4">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            {item.level === 1 ? 'Ana Başlık (Ek Adı)' : 'Alt Başlık'}
                                        </label>
                                        <input
                                            type="text"
                                            value={item.text}
                                            onChange={(e) => updateItemText(globalIdx, e.target.value)}
                                            className={`w-full bg-white border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:ring-2 focus:ring-[#FFD600] focus:border-transparent outline-none transition-all ${item.level === 1 ? 'font-black text-lg' : 'font-bold text-sm text-[#2980b9]'}`}
                                        />
                                    </div>
                                );
                            }

                            if (item.type === 'paragraph') {
                                return (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 my-4">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Paragraf Metni</label>
                                        <textarea
                                            value={item.text}
                                            onChange={(e) => updateItemText(globalIdx, e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-700 leading-relaxed h-28 focus:ring-2 focus:ring-[#FFD600] focus:border-transparent outline-none transition-all resize-y"
                                        />
                                    </div>
                                );
                            }

                            if (item.type === 'image') {
                                return (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 my-4 flex flex-col items-center">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 self-start">Şekil Görseli (Düzenlenemez)</label>
                                        <img src={item.src} className="max-h-48 object-contain rounded-xl border border-gray-200 bg-white p-2" alt="" />
                                        <span className="text-[10px] text-gray-400 mt-2 font-mono">{item.src}</span>
                                    </div>
                                );
                            }

                            if (item.type === 'table') {
                                return (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 my-4 overflow-x-auto">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tablo Hücreleri</label>
                                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs text-gray-700 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <thead className="bg-gray-100 font-bold text-gray-900 uppercase text-[10px]">
                                                <tr>
                                                    {item.headers.map((h: string, hIdx: number) => (
                                                        <th key={hIdx} className="p-2 border-r border-b last:border-r-0 border-gray-200">
                                                            <input
                                                                type="text"
                                                                value={h}
                                                                onChange={(e) => updateTableHeader(globalIdx, hIdx, e.target.value)}
                                                                className="w-full bg-white border border-gray-200 rounded p-1 text-[10px] font-bold text-gray-800 focus:ring-1 focus:ring-[#FFD600] outline-none"
                                                            />
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {item.rows.map((row: any[], rIdx: number) => (
                                                    <tr key={rIdx} className="hover:bg-gray-50/50">
                                                        {row.map((cell: any, cIdx: number) => (
                                                            <td key={cIdx} className="p-2 border-r last:border-r-0 border-gray-200 align-top min-w-[120px]">
                                                                {typeof cell === 'string' && (
                                                                    <textarea
                                                                        value={cell}
                                                                        onChange={(e) => updateTableCell(globalIdx, rIdx, cIdx, e.target.value)}
                                                                        className="w-full min-h-[48px] bg-white border border-gray-200 rounded p-1 text-xs text-gray-700 focus:ring-1 focus:ring-[#FFD600] outline-none resize-y"
                                                                    />
                                                                )}
                                                                {cell && typeof cell === 'object' && !Array.isArray(cell) && cell.type === 'color_block' && (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <div className="w-8 h-4 rounded border shadow-sm shrink-0" style={{ backgroundColor: cell.color }} />
                                                                            <span className="text-[10px] text-gray-400 font-mono">{cell.color}</span>
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={cell.text || ''}
                                                                            onChange={(e) => updateColorCellText(globalIdx, rIdx, cIdx, e.target.value)}
                                                                            className="w-full bg-white border border-gray-200 rounded p-1 text-xs text-gray-700 focus:ring-1 focus:ring-[#FFD600] outline-none"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {cell && typeof cell === 'object' && !Array.isArray(cell) && cell.type === 'image' && (
                                                                    <div className="flex flex-col items-center gap-1 p-1 bg-gray-50 border border-gray-150 rounded">
                                                                        <img src={cell.src} className="max-h-8 object-contain" alt="" />
                                                                        <span className="text-[9px] text-gray-400 font-mono text-center overflow-hidden w-full text-ellipsis">{cell.src.split('/').pop()}</span>
                                                                    </div>
                                                                )}
                                                                {cell && Array.isArray(cell) && (
                                                                    <div className="space-y-1.5">
                                                                        {cell.map((sub: any, sIdx: number) => (
                                                                            <div key={sIdx} className="flex gap-1 items-center">
                                                                                {sub.type === 'image' ? (
                                                                                    <img src={sub.src} className="max-h-6 shrink-0" alt="" />
                                                                                ) : (
                                                                                    <input
                                                                                        type="text"
                                                                                        value={sub.text || ''}
                                                                                        onChange={(e) => updateTableSubCellText(globalIdx, rIdx, cIdx, sIdx, e.target.value)}
                                                                                        className="w-full bg-white border border-gray-200 rounded p-1 text-xs text-gray-700 focus:ring-1 focus:ring-[#FFD600] outline-none"
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }
                        } else {
                            // --- RENDER PREVIEW MODE ---
                            if (item.type === 'heading') {
                                const levelClass = item.level === 1 
                                    ? 'text-xl md:text-2xl font-black text-gray-900 border-b-2 border-[#FFD600] pb-2 mt-4 mb-4 uppercase'
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
                                                                {renderCellPreview(cell)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }
                        }

                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
