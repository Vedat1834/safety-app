"use client";

import { useState, useEffect } from "react";
import { useAudit } from "../context/AuditContext";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ArrowLeft, Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import SpeechButton from "../components/SpeechButton";
import { FunctionalTest } from "../types";

export default function FunctionalTestPage() {
    const router = useRouter();
    const { activeProject, getProjectFunctionalTests, addFunctionalTest, updateFunctionalTest, deleteFunctionalTest } = useAudit();

    // Form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [plrRequired, setPlrRequired] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('a');
    const [plAchieved, setPlAchieved] = useState<'a' | 'b' | 'c' | 'd' | 'e'>('a');
    const [result, setResult] = useState<'Pass' | 'Fail'>('Pass');
    const [notes, setNotes] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);

    // Feedback states
    const [savedFeedback, setSavedFeedback] = useState(false);

    // Redirect to home if no active project
    useEffect(() => {
        if (!activeProject) {
            router.push("/");
        }
    }, [activeProject, router]);

    if (!activeProject) {
        return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
    }

    const projectTests = getProjectFunctionalTests(activeProject.id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert("Lütfen emniyet fonksiyonu adını girin.");
            return;
        }

        if (editingId) {
            // Update
            updateFunctionalTest(editingId, {
                name,
                description,
                plr_required: plrRequired,
                pl_achieved: plAchieved,
                result,
                notes
            });
            setEditingId(null);
        } else {
            // Add new
            addFunctionalTest({
                id: Math.random().toString(36).substr(2, 9),
                project_id: activeProject.id,
                name,
                description,
                plr_required: plrRequired,
                pl_achieved: plAchieved,
                result,
                notes
            });
        }

        // Reset form
        setName("");
        setDescription("");
        setPlrRequired('a');
        setPlAchieved('a');
        setResult('Pass');
        setNotes("");

        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
    };

    const handleEdit = (test: FunctionalTest) => {
        setEditingId(test.id);
        setName(test.name);
        setDescription(test.description || "");
        setPlrRequired(test.plr_required);
        setPlAchieved(test.pl_achieved);
        setResult(test.result);
        setNotes(test.notes || "");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (confirm("Bu testi silmek istediğinize emin misiniz?")) {
            deleteFunctionalTest(id);
            if (editingId === id) {
                setEditingId(null);
                setName("");
                setDescription("");
                setPlrRequired('a');
                setPlAchieved('a');
                setResult('Pass');
                setNotes("");
            }
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setName("");
        setDescription("");
        setPlrRequired('a');
        setPlAchieved('a');
        setResult('Pass');
        setNotes("");
    };

    // Helper to compare PL performance
    const isPlSufficient = (req: string, ach: string) => {
        return ach.charCodeAt(0) >= req.charCodeAt(0);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] -mx-4 -my-4 p-4 md:p-8 font-sans text-gray-900">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push(`/projects/${activeProject.id}`)}
                    className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition-all shadow-sm flex-shrink-0"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FFD600] text-black rounded-lg flex items-center justify-center">
                            <ClipboardCheck className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Fonksiyonel Test Raporlama</h1>
                            <p className="text-sm text-gray-500 font-medium">Emniyet fonksiyonlarının fonksiyonel doğrulaması ve testi.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Column */}
                <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
                        {editingId ? "Testi Düzenle" : "Yeni Emniyet Fonksiyonu Testi"}
                    </h2>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Emniyet Fonksiyonu Adı</label>
                        <input
                            type="text"
                            required
                            className="input-field"
                            placeholder="Örn: Acil Stop Butonu, Çift El Kumanda, Ön Işık Perdesi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">Test Metodu / Açıklama</label>
                            <SpeechButton onResult={(text) => setDescription(prev => prev ? prev + " " + text : text)} />
                        </div>
                        <textarea
                            rows={4}
                            className="input-field resize-none text-sm"
                            placeholder="Testin nasıl gerçekleştirildiğini açıklayın..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Gerekli PL (PLr)</label>
                            <select
                                className="input-field"
                                value={plrRequired}
                                onChange={(e) => setPlrRequired(e.target.value as any)}
                            >
                                <option value="a">PL a</option>
                                <option value="b">PL b</option>
                                <option value="c">PL c</option>
                                <option value="d">PL d</option>
                                <option value="e">PL e</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Ulaşılan PL</label>
                            <select
                                className="input-field"
                                value={plAchieved}
                                onChange={(e) => setPlAchieved(e.target.value as any)}
                            >
                                <option value="a">PL a</option>
                                <option value="b">PL b</option>
                                <option value="c">PL c</option>
                                <option value="d">PL d</option>
                                <option value="e">PL e</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Test Sonucu</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setResult('Pass')}
                                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                                    result === 'Pass'
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                            >
                                <CheckCircle2 className="size-4" />
                                UYGUN (Pass)
                            </button>
                            <button
                                type="button"
                                onClick={() => setResult('Fail')}
                                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                                    result === 'Fail'
                                        ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                }`}
                            >
                                <XCircle className="size-4" />
                                UYGUN DEĞİL (Fail)
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase ml-1">İlave Notlar / Gözlemler</label>
                            <SpeechButton onResult={(text) => setNotes(prev => prev ? prev + " " + text : text)} />
                        </div>
                        <textarea
                            rows={3}
                            className="input-field resize-none text-sm"
                            placeholder="Ekstra gözlem, hata detayı vb. yazın..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition text-sm"
                            >
                                İptal Et
                            </button>
                        )}
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-[#FFD600] hover:bg-[#FACE15] text-black font-bold rounded-xl transition-all shadow-md shadow-yellow-500/10 text-sm flex items-center justify-center gap-2"
                        >
                            {savedFeedback ? (
                                <span>Kaydedildi!</span>
                            ) : (
                                <>
                                    <Plus className="size-4" />
                                    <span>{editingId ? "Güncelle" : "Ekle ve Kaydet"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* List Column */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Uygulanan Testler</h2>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                                {projectTests.length} Test
                            </span>
                        </div>

                        {projectTests.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 space-y-2">
                                <ClipboardCheck className="size-12 mx-auto stroke-1" />
                                <p className="font-medium text-sm">Henüz emniyet fonksiyon testi eklenmemiş.</p>
                                <p className="text-xs text-gray-400">Soldaki formu doldurarak test kaydı yapabilirsiniz.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto pr-1">
                                {projectTests.map((test) => {
                                    const plrCode = test.plr_required;
                                    const achCode = test.pl_achieved;
                                    const isSufficient = isPlSufficient(plrCode, achCode);

                                    return (
                                        <div key={test.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-bold text-gray-900">{test.name}</h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                                        test.result === 'Pass'
                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                            : 'bg-red-50 text-red-700 border border-red-200'
                                                    }`}>
                                                        {test.result === 'Pass' ? 'UYGUN' : 'UYGUN DEĞİL'}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                                    {test.description || <span className="text-gray-400 italic">Metot girilmedi</span>}
                                                </p>

                                                {/* PL Status and Notes */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-gray-400 uppercase">PL Seviyesi:</span>
                                                        <span className="font-bold text-gray-700">PLr {plrCode.toUpperCase()}</span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className={`font-bold ${isSufficient ? 'text-green-600' : 'text-orange-500 flex items-center gap-0.5'}`}>
                                                            PL {achCode.toUpperCase()}
                                                            {!isSufficient && (
                                                                <span title="Ulaşılan PL, Gerekli PLr seviyesinin altında!">
                                                                    <AlertCircle className="size-3.5" />
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                    {test.notes && (
                                                        <div className="text-gray-500 font-medium">
                                                            <span className="font-bold text-gray-400 uppercase">Not: </span>
                                                            {test.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 self-end md:self-start">
                                                <button
                                                    onClick={() => handleEdit(test)}
                                                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(test.id)}
                                                    className="w-8 h-8 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm"
                                                    title="Sil"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
