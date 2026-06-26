"use client";

import { useAudit } from "@/app/context/AuditContext";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, FileText, Globe, Upload, Check, Search, X, Edit, ArrowRight } from "lucide-react";

export default function SentenceTemplatesPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const { 
        templates, 
        addTemplate, 
        deleteTemplate, 
        bulkImportTemplates,
        groupOrders,
        renameGroup,
        deleteGroup,
        updateGroupOrder,
        updateTemplateGroup,
        importBackupTemplates
    } = useAudit();

    // Tabs & Filters
    const [activeLang, setActiveLang] = useState<'tr' | 'en'>('tr');
    const [activeCategory, setActiveCategory] = useState<'hazard' | 'measure'>('hazard');
    const [searchQuery, setSearchQuery] = useState("");

    // Dynamic Groups / Tabs State
    const [activeGroup, setActiveGroup] = useState<string>('Tümü');
    const [sessionGroups, setSessionGroups] = useState<string[]>([]);
    const [showNewGroupInput, setShowNewGroupInput] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    // Rename Tab State
    const [isRenamingGroup, setIsRenamingGroup] = useState(false);
    const [renameGroupNameInput, setRenameGroupNameInput] = useState("");

    // Add Template State
    const [newContent, setNewContent] = useState("");

    // Bulk Import State
    const [bulkText, setBulkText] = useState("");
    const [bulkCategory, setBulkCategory] = useState<'hazard' | 'measure'>('hazard');
    const [bulkLang, setBulkLang] = useState<'tr' | 'en'>('tr');
    const [bulkGroup, setBulkGroup] = useState("Genel");
    const [importSuccess, setImportSuccess] = useState(false);

    // Backup & Restore State
    const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
    const [backupSuccess, setBackupSuccess] = useState(false);
    const [backupError, setBackupError] = useState("");

    // Get order key
    const orderKey = `${activeLang}_${activeCategory}`;
    const configuredGroups = groupOrders[orderKey] || [];

    // Default groups based on selected category
    const defaultGroupsForCategory = activeCategory === 'hazard' 
        ? ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Genel']
        : ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Eğitim & İdari', 'Genel'];

    const baseGroups = configuredGroups.length > 0 ? configuredGroups : defaultGroupsForCategory;

    // Combine default groups, session groups and actual groups from database templates
    const currentGroups = Array.from(new Set([
        ...baseGroups,
        ...sessionGroups,
        ...templates
            .filter(t => t.lang === activeLang && t.category === activeCategory && t.group)
            .map(t => t.group as string)
    ]));

    // Virtual list including "Tümü" at the beginning
    const displayGroups = ['Tümü', ...currentGroups];

    // Resolve selected group (fallback to "Tümü" if activeGroup is not in list)
    const selectedGroup = displayGroups.includes(activeGroup) ? activeGroup : 'Tümü';

    // Sync bulkGroup and cancel rename state when activeGroup changes
    useEffect(() => {
        setBulkGroup(selectedGroup === 'Tümü' ? 'Genel' : selectedGroup);
        setIsRenamingGroup(false);
    }, [selectedGroup]);

    // Filter templates based on active tabs, selected group & search
    const filteredTemplates = templates.filter(t => 
        t.lang === activeLang && 
        t.category === activeCategory &&
        (selectedGroup === 'Tümü' ? true : (t.group || 'Genel') === selectedGroup) &&
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddGroupTab = (name: string) => {
        if (name === 'Tümü') return;
        const key = `${activeLang}_${activeCategory}`;
        const existing = groupOrders[key] || baseGroups;
        if (!existing.includes(name)) {
            const updated = [...existing, name];
            updateGroupOrder(activeLang, activeCategory, updated);
        }
    };

    const handleAddSingle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        const targetGroup = selectedGroup === 'Tümü' ? 'Genel' : selectedGroup;

        // Ensure current tab is persisted in ordering list
        handleAddGroupTab(targetGroup);

        addTemplate({
            id: Math.random().toString(36).substr(2, 9),
            lang: activeLang,
            category: activeCategory,
            content: newContent.trim(),
            group: targetGroup
        });
        setNewContent("");
    };

    const handleBulkImport = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkText.trim()) return;

        // Split text by newlines and filter out empty lines
        const lines = bulkText.split("\n")
            .map(line => line.trim())
            .filter(Boolean);

        const newTemplates = lines.map(line => {
            let itemGroup = bulkGroup === 'Tümü' ? 'Genel' : bulkGroup;
            let cleanLine = line;

            // If line starts with [Group Name] content, parse it
            const groupMatch = line.match(/^\[(.*?)\]\s*(.*)$/);
            if (groupMatch) {
                itemGroup = groupMatch[1].trim();
                cleanLine = groupMatch[2].trim();
                
                // Add dynamically parsed group to session groups if not existing
                if (!currentGroups.includes(itemGroup)) {
                    setSessionGroups(prev => [...prev, itemGroup]);
                }
            }

            // Ensure group is persisted in order list
            handleAddGroupTab(itemGroup);

            return {
                id: Math.random().toString(36).substr(2, 9),
                lang: bulkLang,
                category: bulkCategory,
                content: cleanLine,
                group: itemGroup
            };
        });

        bulkImportTemplates(newTemplates);
        setBulkText("");
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Bu şablon cümlesini silmek istediğinize emin misiniz?")) {
            deleteTemplate(id);
        }
    };

    const handleRenameGroupSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const name = renameGroupNameInput.trim();
        if (!name || name === selectedGroup || selectedGroup === 'Tümü') {
            setIsRenamingGroup(false);
            return;
        }

        renameGroup(activeLang, activeCategory, selectedGroup, name);
        
        // Update session groups if present
        if (sessionGroups.includes(selectedGroup)) {
            setSessionGroups(prev => prev.map(g => g === selectedGroup ? name : g));
        }

        setActiveGroup(name);
        setIsRenamingGroup(false);
    };

    const handleDeleteGroup = () => {
        if (selectedGroup === 'Tümü') return;
        if (window.confirm(`"${selectedGroup}" sekmesini ve içindeki tüm cümle kalıplarını silmek istediğinize emin misiniz?`)) {
            deleteGroup(activeLang, activeCategory, selectedGroup);
            
            // Remove from session groups
            setSessionGroups(prev => prev.filter(g => g !== selectedGroup));
            
            setActiveGroup('Tümü');
        }
    };

    const handleMoveGroup = (direction: 'left' | 'right') => {
        if (selectedGroup === 'Tümü') return;
        const index = currentGroups.indexOf(selectedGroup);
        if (index === -1) return;

        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentGroups.length) return;

        // Swap items in a new list
        const updated = [...currentGroups];
        const temp = updated[index];
        updated[index] = updated[newIndex];
        updated[newIndex] = temp;

        // Save order in context
        updateGroupOrder(activeLang, activeCategory, updated);
        
        // Keep active group selected
        setActiveGroup(selectedGroup);
    };

    const handleExportJSON = () => {
        try {
            const dataStr = JSON.stringify({ templates, groupOrders }, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', 'safety_templates_backup.json');
            linkElement.click();
        } catch (e) {
            console.error("Backup export failed", e);
            alert("Yedek dışa aktarılamadı.");
        }
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);

                if (!parsed || !Array.isArray(parsed.templates)) {
                    setBackupError("Geçersiz yedek dosyası formatı.");
                    setTimeout(() => setBackupError(""), 4000);
                    return;
                }

                const confirmMsg = importMode === 'overwrite'
                    ? "Mevcut tüm cümle kalıpları silinecek ve yedek dosyasındaki kalıplar yüklenecektir. Onaylıyor musunuz?"
                    : "Yedek dosyasındaki cümle kalıpları mevcut listenin üzerine eklenecektir. Onaylıyor musunuz?";

                if (window.confirm(confirmMsg)) {
                    importBackupTemplates(parsed.templates, parsed.groupOrders || {}, importMode === 'overwrite');
                    setBackupSuccess(true);
                    setBackupError("");
                    setTimeout(() => setBackupSuccess(false), 4000);
                }
            } catch (err) {
                console.error("Backup import failed", err);
                setBackupError("Dosya okunamadı veya JSON formatı hatalı.");
                setTimeout(() => setBackupError(""), 4000);
            }
            // Reset input
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] -mx-4 -my-4 p-8 font-sans text-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push(`/projects/${projectId}`)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <FileText className="size-6 text-[#FFC107]" />
                        Cümle Kalıpları
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">Risk değerlendirmesinde kullanmak üzere hazır cümleleri yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Manage and View Templates */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6">
                    {/* Language & Category Tabs */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        {/* Language Selector */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveLang('tr')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeLang === 'tr' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Türkçe (TR)
                            </button>
                            <button
                                onClick={() => setActiveLang('en')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeLang === 'en' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                English (EN)
                            </button>
                        </div>

                        {/* Category Selector */}
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveCategory('hazard')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeCategory === 'hazard' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Tehlike Tanımları
                            </button>
                            <button
                                onClick={() => setActiveCategory('measure')}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeCategory === 'measure' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Önlem & Çözümler
                            </button>
                        </div>
                    </div>

                    {/* Sub-tabs / Group Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {displayGroups.map(g => (
                            <button
                                key={g}
                                onClick={() => {
                                    setActiveGroup(g);
                                    setShowNewGroupInput(false);
                                }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedGroup === g ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-200'}`}
                            >
                                {g}
                            </button>
                        ))}
                        
                        {showNewGroupInput ? (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const name = newGroupName.trim();
                                if (name) {
                                    if (!currentGroups.includes(name)) {
                                        setSessionGroups(prev => [...prev, name]);
                                        handleAddGroupTab(name);
                                    }
                                    setActiveGroup(name);
                                    setNewGroupName("");
                                    setShowNewGroupInput(false);
                                }
                            }} className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Sekme adı..."
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-[#FFD600] w-28"
                                />
                                <button type="submit" className="bg-green-600 text-white p-1 rounded-md hover:bg-green-700 transition">
                                    <Check className="size-3.5" />
                                </button>
                                <button type="button" onClick={() => setShowNewGroupInput(false)} className="bg-gray-200 text-gray-500 p-1 rounded-md hover:bg-gray-300 transition">
                                    <X className="size-3.5" />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setShowNewGroupInput(true)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FFD600]/10 text-yellow-800 hover:bg-[#FFD600]/20 border border-[#FFD600]/30 flex items-center gap-1 transition-all"
                            >
                                <Plus className="size-3.5" />
                                Yeni Sekme
                            </button>
                        )}
                    </div>

                    {/* Tab Management Controls */}
                    {selectedGroup !== 'Genel' && selectedGroup !== 'Tümü' && (
                        <div className="flex flex-wrap items-center gap-2 mb-6 bg-gray-50/70 border border-gray-100 p-2.5 rounded-2xl text-xs w-fit">
                            <span className="font-bold text-gray-400 uppercase tracking-wider select-none mr-1.5 ml-1">Sekme Ayarı:</span>
                            
                            {isRenamingGroup ? (
                                <form onSubmit={handleRenameGroupSubmit} className="flex items-center gap-1.5">
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        value={renameGroupNameInput}
                                        onChange={e => setRenameGroupNameInput(e.target.value)}
                                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-bold outline-none focus:border-[#FFD600] w-32"
                                    />
                                    <button type="submit" className="bg-green-600 text-white p-1 rounded-md hover:bg-green-700 transition">
                                        <Check className="size-3.5" />
                                    </button>
                                    <button type="button" onClick={() => setIsRenamingGroup(false)} className="bg-gray-200 text-gray-500 p-1 rounded-md hover:bg-gray-300 transition">
                                        <X className="size-3.5" />
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => {
                                        setRenameGroupNameInput(selectedGroup);
                                        setIsRenamingGroup(true);
                                    }}
                                    className="flex items-center gap-1 font-bold text-gray-600 hover:text-black bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-xs hover:border-gray-300 transition-all"
                                >
                                    <Edit className="size-3 text-[#FFC107]" />
                                    Adını Değiştir
                                </button>
                            )}

                            <span className="w-px h-3.5 bg-gray-200 mx-1"></span>

                            <button
                                onClick={() => handleMoveGroup('left')}
                                className="flex items-center gap-1 font-bold text-gray-600 hover:text-black bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-xs hover:border-gray-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                disabled={currentGroups.indexOf(selectedGroup) <= 0}
                            >
                                <ArrowLeft className="size-3" />
                                Sola
                            </button>

                            <button
                                onClick={() => handleMoveGroup('right')}
                                className="flex items-center gap-1 font-bold text-gray-600 hover:text-black bg-white border border-gray-200 px-2 py-1 rounded-lg shadow-xs hover:border-gray-300 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                disabled={currentGroups.indexOf(selectedGroup) >= currentGroups.length - 1}
                            >
                                Sağa
                                <ArrowRight className="size-3" />
                            </button>

                            <span className="w-px h-3.5 bg-gray-200 mx-1"></span>

                            <button
                                onClick={handleDeleteGroup}
                                className="flex items-center gap-1 font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 px-2.5 py-1 rounded-lg transition-all"
                            >
                                <Trash2 className="size-3" />
                                Sekmeyi Sil
                            </button>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                        <input
                            type="text"
                            placeholder="Seçili sekmede ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#FFD600] rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* Templates List */}
                    <div className="flex-1 overflow-y-auto max-h-[400px] space-y-3 pr-2">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <FileText className="size-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Bu sekmede şablon cümle bulunamadı.</p>
                            </div>
                        ) : (
                            filteredTemplates.map(t => (
                                <div
                                    key={t.id}
                                    className="flex justify-between items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 group transition-all"
                                >
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{t.content}</p>
                                        {selectedGroup === 'Tümü' && t.group && (
                                            <span className="text-[9px] font-black text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded uppercase tracking-wider w-fit">
                                                {t.group}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <select
                                            value={t.group || 'Genel'}
                                            onChange={(e) => {
                                                updateTemplateGroup(t.id, e.target.value);
                                            }}
                                            className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-bold text-gray-600 outline-none focus:border-[#FFD600] cursor-pointer"
                                        >
                                            {currentGroups.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => handleDelete(t.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Manual Single Add Form */}
                    <form onSubmit={handleAddSingle} className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                        <input
                            required
                            type="text"
                            placeholder={`${activeLang === 'tr' ? `"${selectedGroup === 'Tümü' ? 'Genel' : selectedGroup}" sekmesine yeni cümle ekle...` : `Add new template to "${selectedGroup === 'Tümü' ? 'Genel' : selectedGroup}"...`}`}
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            className="flex-1 bg-gray-50 border border-transparent focus:bg-white focus:border-[#FFD600] rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                        />
                        <button
                            type="submit"
                            className="bg-[#FFD600] hover:bg-[#FACE15] text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-sm shrink-0 transition-all shadow-sm"
                        >
                            <Plus className="size-4" />
                            Ekle
                        </button>
                    </form>
                </div>

                {/* RIGHT: Easy Import / Bulk Upload */}
                <div className="flex flex-col gap-6">
                    {/* Bulk Import Card */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Upload className="size-5 text-[#FFC107]" />
                            Toplu Cümle Ekle
                        </h2>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                            Excel veya notlarınızdaki cümleleri alt alta yapıştırın. Belirttiğiniz hedef sekmeye aktarılacaktır. 
                            Satır başına <code>[Grup Adı] Cümle...</code> yazarak da grupları otomatik oluşturabilirsiniz.
                        </p>

                        <form onSubmit={handleBulkImport} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Dil</label>
                                    <select
                                        value={bulkLang}
                                        onChange={e => setBulkLang(e.target.value as 'tr' | 'en')}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none"
                                    >
                                        <option value="tr">Türkçe (TR)</option>
                                        <option value="en">English (EN)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Kategori</label>
                                    <select
                                        value={bulkCategory}
                                        onChange={e => setBulkCategory(e.target.value as 'hazard' | 'measure')}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none"
                                    >
                                        <option value="hazard">Tehlike Tanımı</option>
                                        <option value="measure">Önlem / Çözüm</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Hedef Sekme (Grup)</label>
                                <select
                                    value={bulkGroup === 'Tümü' ? 'Genel' : bulkGroup}
                                    onChange={e => setBulkGroup(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-bold outline-none"
                                >
                                    {currentGroups.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Cümle Listesi (Satır Satır)</label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="Örn:&#10;Acil stop butonu konumu uygun değil.&#10;[Yeni Sekme] Kabin kapaklarinda kilit yok."
                                    value={bulkText}
                                    onChange={e => setBulkText(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#FFD600] rounded-xl p-3 text-xs outline-none resize-none transition-all placeholder:text-gray-400 font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gray-900 text-white hover:bg-black font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                                <Upload className="size-4" />
                                Seçici Sekmeye Aktar
                            </button>

                            {importSuccess && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                                    <Check className="size-4" />
                                    Cümleler başarıyla içe aktarıldı!
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Yedekle & Geri Yükle Card */}
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Globe className="size-5 text-[#FFC107]" />
                            Tabletler Arası Aktarım (Yedekle / Yükle)
                        </h2>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                            Cümle kalıplarını ve sekme sıralarınızı yedek dosyası (.json) olarak indirip diğer tabletlere aktarabilirsiniz.
                        </p>

                        <div className="space-y-4">
                            {/* Export button */}
                            <button
                                type="button"
                                onClick={handleExportJSON}
                                className="w-full bg-[#FFD600] hover:bg-[#FACE15] text-black font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                            >
                                <Upload className="size-4 rotate-180" />
                                Kalıpları Yedekle (Dışa Aktar)
                            </button>

                            <div className="h-px bg-gray-100 my-4"></div>

                            {/* Import section */}
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase font-bold text-gray-500 block">Yedekten Yükleme Modu</label>
                                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setImportMode('merge')}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${importMode === 'merge' ? 'bg-white text-black shadow-xs' : 'text-gray-500'}`}
                                    >
                                        Üzerine Ekle (Merge)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImportMode('overwrite')}
                                        className={`py-2 rounded-lg text-xs font-bold transition-all ${importMode === 'overwrite' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-red-600'}`}
                                    >
                                        Tamamen Değiştir
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportJSON}
                                        id="backupFileInput"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="backupFileInput"
                                        className="w-full bg-gray-900 text-white hover:bg-black font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer active:scale-95"
                                    >
                                        <Upload className="size-4" />
                                        Yedek Dosyası Seç (.json)
                                    </label>
                                </div>
                            </div>

                            {backupSuccess && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                                    <Check className="size-4" />
                                    Yedek başarıyla yüklendi!
                                </div>
                            )}

                            {backupError && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-300">
                                    <X className="size-4" />
                                    {backupError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* How to use info */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-[24px] p-5">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Globe className="size-4" />
                            Nasıl Kullanılır?
                        </h4>
                        <ul className="text-xs text-amber-700/80 font-medium list-disc pl-4 space-y-2 leading-relaxed">
                            <li>Oluşturduğunuz sekmeler, sahada risk yazarken karşınıza çıkacak seçim modalında da görünecektir.</li>
                            <li>Böylece benzer önlemleri (örn: sadece elektrik, sadece mekanik koruyucu) gruplayıp hızlıca ekleyebilirsiniz.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
