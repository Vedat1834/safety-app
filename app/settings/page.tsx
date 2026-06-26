"use client";

import { useState, useEffect } from "react";
import { Save, CheckCircle, AlertCircle, Cpu, Key } from "lucide-react";
import KnowledgeBase from "../components/KnowledgeBase";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [provider, setProvider] = useState("openai"); // 'openai' | 'gemini'
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");
    const [customInstruction, setCustomInstruction] = useState("");

    useEffect(() => {
        // Load saved settings
        const savedKey = localStorage.getItem("ai_api_key");
        const savedProvider = localStorage.getItem("ai_provider");
        const savedInstruction = localStorage.getItem("ai_custom_instruction");

        if (savedKey) setApiKey(savedKey);
        if (savedProvider) setProvider(savedProvider);
        if (savedInstruction) setCustomInstruction(savedInstruction);
    }, []);

    const handleSave = () => {
        localStorage.setItem("ai_api_key", apiKey);
        localStorage.setItem("ai_provider", provider);
        localStorage.setItem("ai_custom_instruction", customInstruction);

        setStatus('success');
        setMessage("Ayarlar başarıyla kaydedildi.");
        setTimeout(() => setStatus('idle'), 3000);
    };

    const handleTest = async () => {
        if (!apiKey) {
            setStatus('error');
            setMessage("Lütfen önce bir API Anahtarı girin.");
            return;
        }

        setStatus('testing');
        setMessage("Bağlantı test ediliyor...");

        try {
            const res = await fetch('/api/ai-risk-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey, // Send raw key for testing
                    'x-provider': provider
                },
                body: JSON.stringify({
                    test_mode: true
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus('success');
                setMessage("Bağlantı Başarılı! Yapay zeka yanıt veriyor.");
                handleSave(); // Auto save on success
            } else {
                throw new Error(data.error || "Bilinmeyen hata");
            }
        } catch (error: any) {
            setStatus('error');
            const msg = error.message || "";

            if (msg.includes("401")) {
                setMessage("API Anahtarı Geçersiz (401). Lütfen anahtarı kontrol edin.");
            } else if (msg.includes("404")) {
                setMessage("Model Bulunamadı (404). Google Cloud üzerinden 'Generative Language API' servisini açtığınızdan veya anahtarın doğru bölgede olduğundan emin olun.");
            } else if (msg.includes("429")) {
                setMessage("Kota Aşıldı (429). Ücretsiz kullanım limitine takıldınız.");
            } else if (msg.includes("403")) {
                setMessage("Erişim Reddedildi (403). Bölge kısıtlaması veya yetki sorunu.");
            } else {
                setMessage(`Bağlantı Hatası: ${msg}`);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Uygulama Ayarları</h1>
                <p className="text-gray-500 mt-2">Sistem yapılandırması ve entegrasyon ayarları.</p>
            </div>

            {/* Knowledge Base Section */}
            <KnowledgeBase />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                    <Cpu className="text-purple-600 size-6" />
                    <h2 className="font-bold text-gray-800 text-lg">Yapay Zeka Entegrasyonu</h2>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">AI Sağlayıcısı</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-200 outline-none"
                            >
                                <option value="openai">OpenAI (GPT-4o / GPT-3.5)</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-2">
                                Önerilen: OpenAI GPT-4o daha tutarlı teknik yanıtlar verebilir.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">API Anahtarı (API Key)</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-400 size-5" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none font-mono text-sm"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Anahtarınız sadece tarayıcınızda (localStorage) saklanır, sunucuya kaydedilmez.
                            </p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Özel Sistem Talimatı (System Prompt)</label>
                            <textarea
                                rows={3}
                                value={customInstruction}
                                onChange={(e) => setCustomInstruction(e.target.value)}
                                placeholder="Örn: Sen katı bir denetçisin. Sadece EN ISO 13849-1 standardına atıf yap. Asla 'mümkünse' kelimesini kullanma, kesin konuş."
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Yapay zekanın kimliğine ve konuşma tarzına yön verin. Bu talimat her sorguda kullanılacaktır.
                            </p>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status !== 'idle' && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${status === 'testing' ? 'bg-blue-50 text-blue-700' :
                            status === 'success' ? 'bg-green-50 text-green-700' :
                                'bg-red-50 text-red-700'
                            }`}>
                            {status === 'testing' && <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                            {status === 'success' && <CheckCircle className="size-5" />}
                            {status === 'error' && <AlertCircle className="size-5" />}
                            <span className="font-medium text-sm">{message}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleTest}
                            disabled={status === 'testing'}
                            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                        >
                            Bağlantıyı Test Et
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 font-bold flex items-center gap-2 transition"
                        >
                            <Save className="size-4" />
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
