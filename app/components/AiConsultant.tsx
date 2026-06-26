"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Check, Copy, MessageSquare, AlertCircle, Bot } from "lucide-react";

interface AiResponse {
    design: string;
    engineering: string;
    administrative: string;
    references?: string;
}

interface AiConsultantProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: AiResponse) => void;
    hazardContext: {
        zone: string;
        type: string;
        description: string;
    };
    apiKey?: string; // Passed from parent to avoid re-reading localstorage repeatedly if possible, or read inside
    provider?: string;
}

export default function AiConsultant({ isOpen, onClose, onApply, hazardContext }: AiConsultantProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'system', content: string | AiResponse }[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentProposal, setCurrentProposal] = useState<AiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Trigger
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            generateParams("initial");
        }
    }, [isOpen]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const generateParams = async (mode: "initial" | "revision", revisionPrompt?: string) => {
        setIsLoading(true);
        setError(null);

        // Load keys locally if not passed (simpler integration)
        const apiKey = localStorage.getItem('ai_api_key');
        const provider = localStorage.getItem('ai_provider') || 'openai';
        const customInstruction = localStorage.getItem('ai_custom_instruction') || '';

        // Load Knowledge Context from IndexedDB
        let knowledgeContext = "";
        try {
            const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
                const req = indexedDB.open("SafetyAppDB", 1);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                req.onupgradeneeded = (e) => { (e.target as IDBOpenDBRequest).result.createObjectStore("knowledge_base", { keyPath: "id" }); };
            });

            const db = await dbPromise;
            if (db.objectStoreNames.contains("knowledge_base")) {
                const tx = db.transaction("knowledge_base", "readonly");
                const store = tx.objectStore("knowledge_base");
                const allDocs = await new Promise<any[]>((resolve) => {
                    const r = store.getAll();
                    r.onsuccess = () => resolve(r.result);
                });

                // Concatenate all text with strict metadata headers
                knowledgeContext = allDocs.map(d =>
                    `=== REFERANS DOKÜMAN BAŞLANGICI ===\n` +
                    `AD: ${d.name}\n` +
                    `TİP: ${d.type || 'Standard'}\n` +
                    `AÇIKLAMA: ${d.description || ''}\n` +
                    `İÇERİK:\n${d.text}\n` +
                    `=== REFERANS DOKÜMAN BİTİŞ ===`
                ).join("\n\n");
            }
        } catch (e) {
            console.error("Knowledge load error:", e);
        }

        try {
            // Construct payload
            // For revision, we append the user's feedback to the description context effectively
            // Or we can send a dedicated "revision_instruction" to the API if we update the API.
            // For now, let's append it to the description makes the most sense without changing API contract too much,
            // BUT changing API is better for clarity.

            const payload = {
                hazard_zone: hazardContext.zone,
                hazard_type: hazardContext.type,
                hazard_description: mode === 'initial'
                    ? hazardContext.description
                    : `${hazardContext.description}\n\nKULLANICI GERİ BİLDİRİMİ / REVİZYON İSTEĞİ: ${revisionPrompt}. Lütfen bu isteğe göre önlemleri GÜNCELLE.`,
                test_mode: false,
                custom_instruction: customInstruction, // NEW FIELD
                knowledge_context: knowledgeContext // NEW FIELD
            };

            // Add user message to UI immediately if revision
            if (mode === 'revision' && revisionPrompt) {
                setMessages(prev => [...prev, { role: 'user', content: revisionPrompt }]);
            }

            const res = await fetch('/api/ai-risk-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || '',
                    'x-provider': provider
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || res.statusText);
            }

            const data: AiResponse = await res.json();

            setCurrentProposal(data);
            setMessages(prev => [...prev, { role: 'ai', content: data }]);

        } catch (err: any) {
            setError(err.message);
            setMessages(prev => [...prev, { role: 'system', content: `Hata: ${err.message}` }]);
        } finally {
            setIsLoading(false);
            setInput("");
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        generateParams('revision', input);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot className="size-6" />
                        <div>
                            <h3 className="font-bold">Yapay Zeka Asistanı</h3>
                            <p className="text-xs text-purple-200">ISO 12100 Uzmanı</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* User Bubble */}
                            {msg.role === 'user' && (
                                <div className="bg-purple-600 text-white max-w-[80%] rounded-2xl rounded-tr-sm p-3 shadow-sm">
                                    <p className="text-sm">{msg.content as string}</p>
                                </div>
                            )}

                            {/* AI JSON Card */}
                            {msg.role === 'ai' && (
                                <div className="bg-white border border-gray-200 w-full max-w-[95%] rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                                        <Sparkles className="size-4" />
                                        <span className="text-xs font-bold uppercase">Önerilen Önlemler</span>
                                    </div>

                                    <div className="grid gap-2 text-sm">
                                        <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                            <span className="font-bold text-blue-700 block text-xs mb-1">Tasarım</span>
                                            {(msg.content as AiResponse).design}
                                        </div>
                                        <div className="p-2 bg-orange-50 rounded border border-orange-100">
                                            <span className="font-bold text-orange-700 block text-xs mb-1">Mühendislik</span>
                                            {(msg.content as AiResponse).engineering}
                                        </div>
                                        <div className="p-2 bg-green-50 rounded border border-green-100">
                                            <span className="font-bold text-green-700 block text-xs mb-1">İdari</span>
                                            {(msg.content as AiResponse).administrative}
                                        </div>
                                    </div>

                                    {(msg.content as AiResponse).references && (
                                        <div className="pt-2 mt-1 border-t border-gray-100">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                                                <Bot className="size-3" />
                                                <span className="font-bold">Referans Kaynaklar</span>
                                            </div>
                                            <p className="text-xs text-gray-500 italic">
                                                {(msg.content as AiResponse).references}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* System Error */}
                            {msg.role === 'system' && (
                                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-2 rounded w-full justify-center">
                                    <AlertCircle className="size-4" />
                                    {msg.content as string}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-3">
                                <div className="size-2 bg-purple-400 rounded-full animate-bounce" />
                                <div className="size-2 bg-purple-400 rounded-full animate-bounce delay-100" />
                                <div className="size-2 bg-purple-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100 shrink-0 space-y-3">
                    {/* Action Bar (Apply) */}
                    {currentProposal && !isLoading && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => onApply(currentProposal)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-sm transition hover:-translate-y-0.5"
                            >
                                <Check className="size-4" />
                                Bu Önlemleri Forma Ekle
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Örn: Daha sıkı önlemler öner, ISO 13855'e atıf yap..."
                            className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 transition"
                        >
                            <Send className="size-5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
